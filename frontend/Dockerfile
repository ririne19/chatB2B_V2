# Stage 1 : dépendances
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2 : build Next (dans l’image, pas sur un volume = évite SIGBUS)
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN node node_modules/next/dist/bin/next build

# Stage 3 : run (next start)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0"]
