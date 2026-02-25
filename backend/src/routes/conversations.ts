import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../config/database";
import { getIo } from "../config/socket";
import { emitConversationCreated, emitConversationDeleted } from "../socket/handlers";
import { authenticateToken } from "../middleware/auth";

const router = Router();

function jsonSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

function jsonError(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}

/** Une conversation est visible si mon org est initiatrice OU partenaire */
function conversationWhereMyOrg(orgId: string) {
  return {
    OR: [
      { organizationId: orgId },
      { partnerOrganizationId: orgId },
    ],
  };
}

// GET /api/conversations
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.user!.organizationId;
      const conversations = await prisma.conversation.findMany({
        where: conversationWhereMyOrg(orgId),
        orderBy: { updatedAt: "desc" },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          partnerOrganization: {
            select: { id: true, name: true, slug: true },
          },
          messages: {
            take: 20,
            orderBy: { createdAt: "desc" },
            include: {
              sender: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      jsonSuccess(res, conversations);
    } catch (err) {
      console.error("GET /conversations:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

// POST /api/conversations
// body: title (optionnel), partnerOrganizationSlug (optionnel) = slug de l'entreprise avec laquelle ouvrir la conversation B2B
router.post(
  "/",
  authenticateToken,
  [
    body("title").optional().trim().isString(),
    body("partnerOrganizationSlug").optional().trim().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        jsonError(res, errors.array()[0].msg as string, 400);
        return;
      }
      const orgId = req.user!.organizationId;
      const { title, partnerOrganizationSlug } = req.body as {
        title?: string;
        partnerOrganizationSlug?: string;
      };

      let partnerOrganizationId: string | null = null;
      if (partnerOrganizationSlug?.trim()) {
        const partner = await prisma.organization.findUnique({
          where: { slug: partnerOrganizationSlug.trim().toLowerCase() },
        });
        if (!partner) {
          jsonError(res, "Organisation partenaire introuvable", 404);
          return;
        }
        if (partner.id === orgId) {
          jsonError(res, "Vous ne pouvez pas ouvrir une conversation avec votre propre entreprise", 400);
          return;
        }
        partnerOrganizationId = partner.id;
      }

      const conversation = await prisma.conversation.create({
        data: {
          title: title || null,
          organizationId: orgId,
          partnerOrganizationId,
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          partnerOrganization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      try {
        const io = getIo();
        emitConversationCreated(io, {
          id: conversation.id,
          title: conversation.title,
          organizationId: conversation.organizationId,
          partnerOrganizationId: conversation.partnerOrganizationId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        });
      } catch (e) {
        console.error("Socket emit conversation:created:", e);
      }
      jsonSuccess(res, conversation, 201);
    } catch (err) {
      console.error("POST /conversations:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

// GET /api/conversations/:id
router.get(
  "/:id",
  authenticateToken,
  [param("id").notEmpty().withMessage("ID requis")],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        jsonError(res, errors.array()[0].msg as string, 400);
        return;
      }
      const id = req.params.id as string;
      const orgId = req.user!.organizationId;
      const conversation = await prisma.conversation.findFirst({
        where: { id, ...conversationWhereMyOrg(orgId) },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          partnerOrganization: {
            select: { id: true, name: true, slug: true },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });
      if (!conversation) {
        jsonError(res, "Conversation non trouvée", 404);
        return;
      }
      jsonSuccess(res, conversation);
    } catch (err) {
      console.error("GET /conversations/:id:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

// DELETE /api/conversations/:id
router.delete(
  "/:id",
  authenticateToken,
  [param("id").notEmpty().withMessage("ID requis")],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        jsonError(res, errors.array()[0].msg as string, 400);
        return;
      }
      if (req.user!.role !== "ADMIN") {
        jsonError(res, "Accès refusé : droits admin requis", 403);
        return;
      }
      const id = req.params.id as string;
      const orgId = req.user!.organizationId;
      const conversation = await prisma.conversation.findFirst({
        where: { id, ...conversationWhereMyOrg(orgId) },
      });
      if (!conversation) {
        jsonError(res, "Conversation non trouvée", 404);
        return;
      }
      const partnerId = conversation.partnerOrganizationId;
      await prisma.conversation.delete({ where: { id } });
      try {
        const io = getIo();
        emitConversationDeleted(io, conversation.organizationId, id, partnerId);
      } catch (e) {
        console.error("Socket emit conversation:deleted:", e);
      }
      jsonSuccess(res, { message: "Conversation deleted" });
    } catch (err) {
      console.error("DELETE /conversations/:id:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

export const conversationRoutes = router;
