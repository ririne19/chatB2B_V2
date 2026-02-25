import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment");
  }
  return secret;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    };
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as "ADMIN" | "MEMBER",
      organizationId: payload.organizationId,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
