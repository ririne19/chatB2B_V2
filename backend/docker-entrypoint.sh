#!/bin/sh
set -e
# Synchronise node_modules avec package.json (volume monté) à chaque démarrage
echo "Synchronisation des dépendances..."
pnpm install
exec "$@"
