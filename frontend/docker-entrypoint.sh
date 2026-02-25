#!/bin/sh
set -e
echo "Synchronisation des dépendances..."
npm install
exec "$@"
