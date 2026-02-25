import type { Message, User } from "@prisma/client";
import type { Server } from "socket.io";

/** Données attachées au socket (après auth) */
export interface SocketData {
  user: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
    firstName?: string;
    lastName?: string;
  };
}

/** Message avec sender (pour message:received) */
export interface MessageWithSender extends Message {
  sender: Pick<User, "id" | "firstName" | "lastName">;
}

/** Conversation pour conversation:created */
export interface ConversationPayload {
  id: string;
  title: string | null;
  organizationId: string;
  partnerOrganizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Payload user:typing (active: true = typing:start, false = typing:stop) */
export interface UserTypingPayload {
  userId: string;
  firstName: string;
  lastName: string;
  active: boolean;
}

/** Événements émis par le serveur vers le client */
export interface ServerToClientEvents {
  "message:received": (message: MessageWithSender) => void;
  "conversation:joined": (payload: { conversationId: string }) => void;
  "conversation:created": (conversation: ConversationPayload) => void;
  "conversation:deleted": (payload: { conversationId: string }) => void;
  "user:typing": (payload: UserTypingPayload) => void;
  error: (payload: { message: string }) => void;
}

/** Événements reçus du client */
export interface ClientToServerEvents {
  "message:send": (payload: { conversationId: string; content: string }) => void;
  "conversation:join": (payload: { conversationId: string }) => void;
  "conversation:leave": (payload: { conversationId: string }) => void;
  "typing:start": (payload: { conversationId: string }) => void;
  "typing:stop": (payload: { conversationId: string }) => void;
}

/** Type du serveur Socket.IO (pour injection dans les routes) */
export type IoServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
