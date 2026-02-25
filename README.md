# Chat B2B

Plateforme de chat B2B avec Docker : PostgreSQL, Redis, backend Node.js (Express + Prisma), frontend Next.js.

---

## Architecture du projet

```
codeChatB2B_V2/
├── docker-compose.yml    # Orchestration des 4 services
├── .env / .env.example
├── Makefile              # Raccourcis (start, stop, migrate, seed, reset)
├── backend/              # API Express + Prisma + Redis
│   ├── src/
│   │   ├── config/       # database.ts (Prisma), redis.ts (ioredis)
│   │   └── server.ts
│   └── prisma/
├── frontend/             # Next.js + Tailwind
│   └── app/
└── README.md
```

| Service   | Port (host) | Description              |
|-----------|-------------|--------------------------|
| frontend  | 3002        | Next.js (App Router)     |
| backend   | 3001        | API Express              |
| postgres  | 5432        | PostgreSQL 16           |
| redis     | 6379        | Redis 7                  |

Le backend dépend de Postgres et Redis (healthchecks). Le frontend dépend du backend.

---

## Prérequis

- **Docker** et **Docker Compose** (v2)
- Optionnel : **Make** pour les cibles du Makefile

---

## Installation complète

### 1. Cloner / initialiser le repo

```bash
# Si pas encore en git
git init
git add .
git commit -m "Initial commit: Chat B2B stack"
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env si besoin (mots de passe, JWT_SECRET, etc.)
```

### 3. Démarrer les services

```bash
docker compose up -d
# ou
make start
```

### 4. Migrations et seed (première fois)

```bash
# Générer le client Prisma
docker compose exec backend pnpm prisma:generate

# Créer les tables
docker compose exec backend pnpm prisma:migrate -- --name init

# Données de démo (admin, clients, conseillers, 1 conversation)
docker compose exec backend pnpm prisma:seed
```

Ou en une fois après un reset :

```bash
make reset
```

### 5. Vérifier

- **Backend (health)** : [http://localhost:3001/health](http://localhost:3001/health)  
  Réponse attendue : `{"status":"ok","db":"connected","redis":"connected"}`
- **Frontend** : [http://localhost:3002](http://localhost:3002)

---

## Commandes utiles

| Action              | Commande |
|---------------------|----------|
| Démarrer            | `docker compose up -d` ou `make start` |
| Arrêter             | `docker compose down` ou `make stop` |
| Logs (tous)         | `docker compose logs -f` ou `make logs` |
| Logs backend        | `docker compose logs -f backend` |
| Logs frontend       | `docker compose logs -f frontend` |
| Migrations          | `docker compose exec backend pnpm prisma:migrate -- --name <nom>` ou `make migrate` |
| Seed                | `docker compose exec backend pnpm prisma:seed` ou `make seed` |
| Reset complet       | `make reset` (down -v, up, migrate, seed) |
| Vérifier la config  | `docker compose config` |
| Rebuild images      | `docker compose build --no-cache` |

---

## Accès aux services

- **Frontend** : http://localhost:3002  
- **API Backend** : http://localhost:3001  
- **PostgreSQL** : `localhost:5432` (user/password/db dans `.env`)  
- **Redis** : `localhost:6379`  

Connexion Postgres depuis la machine hôte :

```bash
docker compose exec postgres psql -U postgres -d chatb2b
```

---

## Troubleshooting

### Port déjà utilisé (ex. 3000, 3001, 5432)

- Arrêter l’autre processus qui utilise le port, ou  
- Changer le port exposé dans `docker-compose.yml` (ex. `"3002:3000"` pour le frontend).

### Backend : "Cannot find module 'X'"

Les dépendances sont dans un volume. Réinstaller dans le conteneur :

```bash
docker compose exec backend pnpm install
# ou avec npm selon le setup
```

### Backend : health retourne db ou redis "disconnected"

- Vérifier que Postgres et Redis sont bien démarrés : `docker compose ps`
- Vérifier les variables `DATABASE_URL` et `REDIS_URL` dans `.env` (hosts `postgres` et `redis` dans le réseau Docker).
- Consulter les logs : `docker compose logs backend postgres redis`

### Prisma : "schema engine" / OpenSSL

Le backend utilise une image **Debian (slim)** pour Prisma. Si tu vois des erreurs liées au moteur Prisma, vérifier que l’image du backend est bien reconstruite (pas Alpine pour le backend).

### Reset complet (base + volumes)

```bash
docker compose down -v
docker compose up -d
# Puis migrate + seed (voir Installation)
# ou
make reset
```

---

## Commandes Git (initialisation du repo)

```bash
git init
git add .
git commit -m "Initial commit: Chat B2B - Docker, backend Express/Prisma/Redis, frontend Next.js"
# Puis ajouter le remote et push
git remote add origin <url>
git branch -M main
git push -u origin main
```
