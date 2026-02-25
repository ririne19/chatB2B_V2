import type { Socket } from "socket.io";
import { prisma } from "../config/database";
import type {
  ClientToServerEvents,
  IoServer,
  ServerToClientEvents,
  SocketData,
  MessageWithSender,
  ConversationPayload,
  UserTypingPayload,
} from "../types/socket";

type SocketWithData = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

function emitError(socket: SocketWithData, message: string) {
  socket.emit("error", { message });
}

async function ensureConversationAccess(
  conversationId: string,
  organizationId: string
): Promise<{ id: string; organizationId: string; partnerOrganizationId: string | null } | null> {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { organizationId },
        { partnerOrganizationId: organizationId },
      ],
    },
    select: { id: true, organizationId: true, partnerOrganizationId: true },
  });
}

export function registerSocketHandlers(io: IoServer): void {
  io.on("connection", (socket: SocketWithData) => {
    const user = socket.data.user;
    if (!user) return;
    const userId = user.userId;
    const organizationId = user.organizationId;

    console.log(`User ${userId} connected`);

    socket.join(`organization-${organizationId}`);

    prisma.conversation
      .findMany({
        where: {
          OR: [
            { organizationId },
            { partnerOrganizationId: organizationId },
          ],
        },
        select: { id: true },
      })
      .then((conversations) => {
        for (const c of conversations) {
          socket.join(`conversation-${c.id}`);
        }
      })
      .catch((err) => {
        console.error("Socket connection: failed to join conversation rooms", err);
      });

    socket.on("message:send", async (payload) => {
      try {
        const { conversationId, content } = payload ?? {};
        if (!content || typeof content !== "string" || content.trim() === "") {
          emitError(socket, "Contenu du message requis");
          return;
        }
        if (!conversationId) {
          emitError(socket, "conversationId requis");
          return;
        }
        const conversation = await ensureConversationAccess(conversationId, organizationId);
        if (!conversation) {
          emitError(socket, "Conversation non trouvée ou accès refusé");
          return;
        }
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            conversationId,
            senderId: userId,
          },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
          },
        });
        const room = `conversation-${conversationId}`;
        io.to(room).emit("message:received", message as MessageWithSender);
      } catch (err) {
        console.error("message:send error", err);
        emitError(socket, "Erreur lors de l'envoi du message");
      }
    });

    socket.on("conversation:join", async (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) {
          emitError(socket, "conversationId requis");
          return;
        }
        const conversation = await ensureConversationAccess(conversationId, organizationId);
        if (!conversation) {
          emitError(socket, "Conversation non trouvée ou accès refusé");
          return;
        }
        socket.join(`conversation-${conversationId}`);
        socket.emit("conversation:joined", { conversationId });
      } catch (err) {
        console.error("conversation:join error", err);
        emitError(socket, "Erreur lors de la jointure à la conversation");
      }
    });

    socket.on("conversation:leave", (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (conversationId) {
          socket.leave(`conversation-${conversationId}`);
        }
      } catch (err) {
        console.error("conversation:leave error", err);
        emitError(socket, "Erreur lors du leave");
      }
    });

    socket.on("typing:start", async (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) return;
        const conversation = await ensureConversationAccess(conversationId, organizationId);
        if (!conversation) return;
        const typingPayload: UserTypingPayload = {
          userId,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          active: true,
        };
        socket.to(`conversation-${conversationId}`).emit("user:typing", typingPayload);
      } catch (err) {
        console.error("typing:start error", err);
        emitError(socket, "Erreur typing");
      }
    });

    socket.on("typing:stop", async (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId) return;
        const conversation = await ensureConversationAccess(conversationId, organizationId);
        if (!conversation) return;
        const typingPayload: UserTypingPayload = {
          userId,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          active: false,
        };
        socket.to(`conversation-${conversationId}`).emit("user:typing", typingPayload);
      } catch (err) {
        console.error("typing:stop error", err);
        emitError(socket, "Erreur typing");
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
}

/** Emettre conversation:created aux organisations concernées (initiatrice + partenaire si B2B) */
export function emitConversationCreated(
  io: IoServer,
  conversation: ConversationPayload
): void {
  io.to(`organization-${conversation.organizationId}`).emit("conversation:created", conversation);
  if (conversation.partnerOrganizationId) {
    io.to(`organization-${conversation.partnerOrganizationId}`).emit("conversation:created", conversation);
  }
}

/** Emettre conversation:deleted aux organisations concernées */
export function emitConversationDeleted(
  io: IoServer,
  organizationId: string,
  conversationId: string,
  partnerOrganizationId?: string | null
): void {
  io.to(`organization-${organizationId}`).emit("conversation:deleted", { conversationId });
  if (partnerOrganizationId) {
    io.to(`organization-${partnerOrganizationId}`).emit("conversation:deleted", { conversationId });
  }
}

/** Emettre message:received à une conversation (à appeler depuis les routes) */
export function emitMessageReceived(
  io: IoServer,
  conversationId: string,
  message: MessageWithSender
): void {
  io.to(`conversation-${conversationId}`).emit("message:received", message);
}
