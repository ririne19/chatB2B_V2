import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import type { SocketData } from "../types/socket";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment");
  }
  return secret;
}

export async function socketAuth(
  socket: Socket<import("../types/socket").ClientToServerEvents, import("../types/socket").ServerToClientEvents, object, SocketData>,
  next: (err?: Error) => void
): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error("Token manquant"));
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, organizationId: true, firstName: true, lastName: true },
    });
    if (!user) {
      next(new Error("Utilisateur introuvable"));
      return;
    }
    socket.data.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    next();
  } catch {
    next(new Error("Token invalide ou expiré"));
  }
}
