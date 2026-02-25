import { Router, Request, Response } from "express";
import { prisma } from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = Router();

function jsonSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

function jsonError(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}

/**
 * GET /api/organizations
 * Liste les organisations avec lesquelles mon entreprise peut ouvrir une conversation B2B :
 * - Si mon entreprise est "admin" (centrale) : toutes les autres organisations (clients potentiels).
 * - Sinon (mon entreprise est cliente) : uniquement les entreprises "admin" (pour leur parler).
 */
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const myOrgId = req.user!.organizationId;

      const myOrg = await prisma.organization.findUnique({
        where: { id: myOrgId },
      });
      if (!myOrg) {
        jsonError(res, "Organisation introuvable", 404);
        return;
      }

      if (myOrg.isAdminCompany) {
        const others = await prisma.organization.findMany({
          where: { id: { not: myOrgId } },
          select: { id: true, name: true, slug: true, isAdminCompany: true },
          orderBy: { name: "asc" },
        });
        jsonSuccess(res, others);
      } else {
        const adminOrgs = await prisma.organization.findMany({
          where: { isAdminCompany: true },
          select: { id: true, name: true, slug: true, isAdminCompany: true },
          orderBy: { name: "asc" },
        });
        jsonSuccess(res, adminOrgs);
      }
    } catch (err) {
      console.error("GET /organizations:", err);
      jsonError(res, "Erreur serveur", 500);
    }
  }
);

export const organizationRoutes = router;
