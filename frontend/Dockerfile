# Stage 1 : installation des dépendances
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2 : image de run (dev avec hot-reload)
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
