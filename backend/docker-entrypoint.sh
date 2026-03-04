#!/bin/sh
set -e
# Synchronise node_modules avec package.json (volume monté) à chaque démarrage
echo "Synchronisation des dépendances..."
pnpm install
# Génération du client Prisma (pnpm ignore les scripts postinstall par défaut)
echo "Génération du client Prisma..."
pnpm exec prisma generate
# Application des migrations (création des tables)
echo "Application des migrations..."
pnpm exec prisma migrate deploy
# Seed : création des organisations ENTREPRISE DEMO SUPPORT / CLIENT et utilisateurs démo
echo "Exécution du seed (ENTREPRISE DEMO)..."
pnpm exec prisma db seed
exec "$@"
