import { Router, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { prisma } from "../config/database";
import { getIo } from "../config/socket";
import { emitMessageReceived } from "../socket/handlers";
import { authenticateToken } from "../middleware/auth";

const router = Router();

function jsonSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

function jsonError(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}

async function ensureConversationAccess(
  conversationId: string,
  organizationId: string
) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { organizationId },
        { partnerOrganizationId: organizationId },
      ],
    },
  });
}

// POST /api/conversations/:conversationId/messages
router.post(
  "/conversations/:conversationId/messages",
  authenticateToken,
  [
    param("conversationId").notEmpty().withMessage("conversationId requis"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Contenu requis")
      .isLength({ min: 1, max: 5000 })
      .withMessage("Le contenu doit faire entre 1 et 5000 caractères"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        jsonError(res, errors.array()[0].msg as string, 400);
        return;
      }
      const { conversationId } = req.params;
      const { content } = req.body as { content: string };
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;

      const conversation = await ensureConversationAccess(
        conversationId,
        orgId
      );
      if (!conversation) {
        jsonError(res, "Conversation non trouvée", 404);
        return;
      }

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            content,
            conversationId,
            senderId: userId,
          },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      try {
        emitMessageReceived(getIo(), String(conversationId), message);
      } catch (e) {
        console.error("Socket emit message:received:", e);
      }

      jsonSuccess(res, message, 201);
    } catch (err) {
      console.error("POST /conversations/:id/messages:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

// GET /api/conversations/:conversationId/messages
router.get(
  "/conversations/:conversationId/messages",
  authenticateToken,
  [
    param("conversationId").notEmpty().withMessage("conversationId requis"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit doit être entre 1 et 100"),
    query("before").optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        jsonError(res, errors.array()[0].msg as string, 400);
        return;
      }
      const { conversationId } = req.params;
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );
      const before = (req.query.before as string) || undefined;
      const orgId = req.user!.organizationId;

      const conversation = await ensureConversationAccess(
        conversationId,
        orgId
      );
      if (!conversation) {
        jsonError(res, "Conversation non trouvée", 404);
        return;
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(before && { cursor: { id: before }, skip: 1 }),
        include: {
          sender: { select: { firstName: true, lastName: true } },
        },
      });

      jsonSuccess(res, messages);
    } catch (err) {
      console.error("GET /conversations/:id/messages:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

export const messageRoutes = router;
