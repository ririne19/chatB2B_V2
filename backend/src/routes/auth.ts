import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not defined");
  return s;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function signToken(payload: {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

function userToJson(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organization: { id: string; name: string; slug: string };
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organization: user.organization,
  };
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit faire au moins 8 caractères"),
    body("firstName").trim().notEmpty().withMessage("Prénom requis"),
    body("lastName").trim().notEmpty().withMessage("Nom requis"),
    body("organizationName").optional().trim(),
    body("organizationSlug").optional().trim().withMessage("Slug d'organisation invalide"),
    body("role").optional().isIn(["ADMIN", "MEMBER"]).withMessage("Rôle invalide (ADMIN ou MEMBER)"),
    body("isAdminCompany").optional().isBoolean().withMessage("isAdminCompany doit être un booléen"),
    body("accountType").optional().isIn(["agent", "client"]).withMessage("accountType invalide (agent ou client)"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, firstName, lastName, organizationName, organizationSlug, role, isAdminCompany, accountType } =
        req.body as {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          organizationName?: string;
          organizationSlug?: string;
          role?: "ADMIN" | "MEMBER";
          isAdminCompany?: boolean;
          accountType?: "agent" | "client";
        };

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ error: "Cet email est déjà utilisé" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      let organization: { id: string; name: string; slug: string };

      if (organizationSlug?.trim()) {
        const existingOrg = await prisma.organization.findUnique({
          where: { slug: organizationSlug.trim().toLowerCase() },
        });
        if (!existingOrg) {
          res.status(400).json({
            error: "Organisation introuvable. Vérifiez le nom d'organisation (ex: acme).",
          });
          return;
        }
        organization = existingOrg;
      } else {
        const orgName = organizationName?.trim() || "Personal";
        const baseSlug = slugify(orgName) || "personal";
        let slug = baseSlug;
        let count = 0;
        while (await prisma.organization.findUnique({ where: { slug } })) {
          count++;
          slug = `${baseSlug}-${count}`;
        }
        // B2B après-vente : agent = entreprise vendeur (isAdminCompany), client = entreprise cliente
        const isVendorCompany = accountType === "agent" ? true : accountType === "client" ? false : Boolean(isAdminCompany);
        organization = await prisma.organization.create({
          data: {
            name: orgName,
            slug,
            isAdminCompany: isVendorCompany,
          },
        });
      }

      const userRole = role === "ADMIN" ? "ADMIN" : "MEMBER";

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: userRole,
          organizationId: organization.id,
        },
        include: { organization: true },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      res.status(201).json({
        token,
        user: userToJson(user),
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email invalide"),
    body("password").notEmpty().withMessage("Mot de passe requis"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body as { email: string; password: string };

      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      });

      res.json({
        token,
        user: userToJson(user),
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// GET /api/auth/me
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Non authentifié" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
      });

      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      res.json(userToJson(user));
    } catch (err) {
      console.error("Me error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  res.json({ message: "Logged out" });
});

export const authRoutes = router;
