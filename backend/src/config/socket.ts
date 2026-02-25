import type { IoServer } from "../types/socket";

let _io: IoServer | null = null;

export function setIo(instance: IoServer): void {
  _io = instance;
}

export function getIo(): IoServer {
  if (!_io) throw new Error("Socket.IO non initialisé");
  return _io;
}
