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

// Slugs des deux seules organisations (ENTREPRISE DEMO) — pas de création de société
const ORG_SLUG_SUPPORT = "entreprise-demo-support";
const ORG_SLUG_CLIENT = "entreprise-demo-client";

// POST /api/auth/register
// accountType "agent" = rejoindre ENTREPRISE DEMO SUPPORT, "client" = rejoindre ENTREPRISE DEMO CLIENT
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit faire au moins 8 caractères"),
    body("firstName").trim().notEmpty().withMessage("Prénom requis"),
    body("lastName").trim().notEmpty().withMessage("Nom requis"),
    body("role").optional().isIn(["ADMIN", "MEMBER"]).withMessage("Rôle invalide (ADMIN ou MEMBER)"),
    body("accountType").isIn(["agent", "client"]).withMessage("Choisissez : rejoindre l'équipe support (agent) ou créer un compte client (client)"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, firstName, lastName, role, accountType } =
        req.body as {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          role?: "ADMIN" | "MEMBER";
          accountType: "agent" | "client";
        };

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ error: "Cet email est déjà utilisé" });
        return;
      }

      const orgSlug = accountType === "agent" ? ORG_SLUG_SUPPORT : ORG_SLUG_CLIENT;
      const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      });

      if (!organization) {
        res.status(500).json({
          error: "Configuration serveur : organisation ENTREPRISE DEMO introuvable. Exécutez le seed.",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
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
