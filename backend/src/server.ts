import "dotenv/config";
import http from "http";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./config/database";
import { redis } from "./config/redis";
import { authRoutes } from "./routes/auth";
import { conversationRoutes } from "./routes/conversations";
import { messageRoutes } from "./routes/messages";
import { organizationRoutes } from "./routes/organizations";
import { setIo } from "./config/socket";
import { socketAuth } from "./middleware/socketAuth";
import { registerSocketHandlers } from "./socket/handlers";

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT ?? 3001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002",
  },
});

io.use((socket, next) => {
  socketAuth(socket, next).catch((err) => next(err instanceof Error ? err : new Error(String(err))));
});
registerSocketHandlers(io);
setIo(io);

export { io };

// Vérification rapide : le backend répond (sans DB/Redis)
app.get("/ping", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/health", async (_req, res) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let redisStatus: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    // dbStatus reste disconnected
  }

  try {
    await redis.ping();
    redisStatus = "connected";
  } catch {
    // redisStatus reste disconnected
  }

  const ok = dbStatus === "connected" && redisStatus === "connected";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", messageRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Gestion d'erreurs globale
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Erreur serveur" });
});

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  prisma.$connect().then(
    () => console.log("Database connected"),
    (err) => console.error("Database connection failed:", err)
  );
  redis.ping().then(
    () => console.log("Redis connected"),
    (err) => console.error("Redis connection failed:", err)
  );
});
