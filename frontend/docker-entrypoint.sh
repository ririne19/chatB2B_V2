#!/bin/sh
set -e
# Ne lancer npm install qu'au premier démarrage (node_modules vide ou pas de next)
if [ ! -d /app/node_modules/next ]; then
  echo "Synchronisation des dépendances..."
  if [ -d /app/node_modules ]; then
    find /app/node_modules -maxdepth 1 -type d -name '.*' -exec rm -rf {} + 2>/dev/null || true
  fi
  npm install
fi
# Build Next si pas de build de production valide (next build crée .next/BUILD_ID)
if [ ! -f /app/.next/BUILD_ID ]; then
  echo "Build Next.js..."
  node node_modules/next/dist/bin/next build
fi
exec "$@"
