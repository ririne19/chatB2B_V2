# Stage 1 : installation des dépendances
# Debian (slim) au lieu d'Alpine : Prisma a besoin de glibc + OpenSSL compatibles
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json ./
RUN pnpm install

# Stage 2 : image de run (dev avec hot-reload)
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["pnpm", "run", "dev"]
