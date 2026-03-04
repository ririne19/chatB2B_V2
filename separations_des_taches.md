# Séparation des tâches — Chat B2B

Document de référence pour répartir et suivre les tâches du projet. Les spécifications détaillées (cas d’usage, maquettes, règles métier) sont dans **Conception_Technique.pdf**.

---

## 1. Répartition par domaine technique

### 1.1 Backend (API + temps réel)

| Tâche | Responsable | Détail / livrable |
|-------|-------------|--------------------|
| Routes d’authentification | Backend | `/api/auth` : register, login, logout, me ; validation (express-validator), JWT, bcrypt |
| Middleware d’auth et typage | Backend | `authenticateToken`, `express.d.ts` (user sur `Request`) |
| Routes organisations | Backend | `GET /api/organizations` (liste selon rôle : admin vs client) |
| Routes conversations | Backend | CRUD conversations (liste, détail, création, suppression) ; règles B2B (initiator/partner) |
| Routes messages | Backend | Liste messages d’une conversation ; création via REST si besoin (sinon uniquement Socket) |
| Socket.IO : auth + handlers | Backend | `socketAuth`, rooms (organisation, conversation), événements (message, typing, etc.) |
| Modèle de données (Prisma) | Backend | Schéma, migrations ; coordination avec la conception technique |
| Health / ping | Backend | `/health` (DB + Redis), `/ping` |

**Fichiers principaux :** `backend/src/routes/*.ts`, `backend/src/socket/handlers.ts`, `backend/src/middleware/*.ts`, `backend/prisma/schema.prisma`.

---

### 1.2 Frontend (UI + appels API + Socket)

| Tâche | Responsable | Détail / livrable |
|-------|-------------|--------------------|
| Auth (login, register) | Frontend | Pages `/login`, `/register` ; formulaires, erreurs, redirections |
| Contexte auth + persistance | Frontend | `AuthContext`, token/user (ex. localStorage), axios avec header `Authorization` |
| Layout / navigation | Frontend | Navbar conditionnelle (connecté / déconnecté), liens conversations, logout |
| Liste des conversations | Frontend | Page `/conversations`, `ConversationList`, appel `GET /api/conversations` |
| Détail conversation + messages | Frontend | Page `/conversations/[id]`, affichage messages, `MessageInput` |
| Nouvelle conversation | Frontend | Modal / flow (ex. `NewConversationModal`), appel `GET /api/organizations` puis POST conversation |
| Contexte conversations | Frontend | État partagé (conversation courante, liste), sync avec API |
| Socket client | Frontend | Connexion Socket.IO, auth (token), hooks `useSocket` / `useMessages`, événements (message, typing) |
| Indicateur de saisie | Frontend | Composant typing (ex. `TypingIndicator`), émission/réception des événements |

**Fichiers principaux :** `frontend/src/app/**/*.tsx`, `frontend/src/components/*.tsx`, `frontend/src/contexts/*.tsx`, `frontend/src/hooks/*.ts`, `frontend/src/lib/socket.ts`.

---

### 1.3 Infrastructure, BDD, DevOps

| Tâche | Responsable | Détail / livrable |
|-------|-------------|--------------------|
| Docker Compose | DevOps / équipe | `docker-compose.yml` : postgres, redis, backend, frontend ; ports, réseaux, healthchecks |
| Dockerfiles + entrypoints | DevOps / équipe | Backend et frontend : build, dépendances, commande de démarrage |
| Variables d’environnement | DevOps / équipe | `.env`, `.env.example` (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.) ; doc dans README |
| Migrations Prisma | Backend | Création / modification des migrations ; exécution via `make migrate` ou `docker compose exec backend pnpm prisma:migrate` |
| Seed (données de démo) | Backend | `prisma/seed.ts` : organisations, utilisateurs, conversations de test |
| Makefile / scripts | DevOps / équipe | `make start`, `stop`, `migrate`, `seed`, `reset`, `logs` |

**Fichiers principaux :** `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`, `Makefile`, `backend/prisma/migrations/`, `backend/prisma/seed.ts`.

---

### 1.4 Documentation et transversal

| Tâche | Responsable | Détail / livrable |
|-------|-------------|--------------------|
| README (installation, commandes) | Équipe | Architecture, prérequis, installation, commandes utiles, troubleshooting |
| DEMARRAGE (démarrage rapide) | Équipe | Qui fait quoi (ports, URLs), vérifications, dépannage courant |
| Conception technique (référence) | — | **Conception_Technique.pdf** : à consulter pour les specs détaillées et la cohérence des tâches |

---

## 2. Répartition par fonctionnalité (lot)

Pour planifier par sprint ou par feature, on peut regrouper ainsi :

| Lot | Backend | Frontend | DevOps / BDD |
|-----|---------|----------|--------------|
| **Auth** | Routes auth, JWT, middleware | Pages login/register, AuthContext, axios | .env JWT_SECRET, doc |
| **Organisations** | GET /api/organizations (règles métier) | — (utilisé dans modal nouvelle conv.) | — |
| **Conversations** | CRUD conversations, règles B2B | Liste, détail, modal nouvelle conversation | Migrations, seed |
| **Messages** | Routes + Socket (envoi/réception) | Affichage, saisie, Socket, typing | — |
| **Temps réel** | Socket auth, handlers, rooms | Connexion Socket, hooks, TypingIndicator | — |
| **Infra / run** | — | — | Docker, Makefile, README, DEMARRAGE |

---

## 3. Règles de coordination

- **API first :** les contrats d’API (routes, payloads) sont définis en amont ; le frontend consomme ces contrats (voir Conception_Technique.pdf si les endpoints y sont décrits).
- **Auth :** toute route protégée (sauf login/register) utilise le JWT ; le frontend envoie le token (header ou Socket).
- **B2B :** une conversation lie deux organisations (initiator / partner) ; les droits (qui peut créer, voir, envoyer) doivent suivre la conception technique.
- **Socket :** les événements (noms, payloads) sont alignés entre `backend/src/types/socket.ts` et le client frontend.

---

## 4. Comment utiliser ce document

- **Assignation :** attribuer chaque tâche du tableau à une personne (nom ou rôle).
- **Suivi :** ajouter une colonne « Statut » (à faire / en cours / fait) ou lier vers des issues / tickets.
- **Mise à jour :** faire évoluer le document quand de nouvelles fonctionnalités ou responsabilités apparaissent (en cohérence avec Conception_Technique.pdf).

---

*Référence projet : Chat B2B — backend Express/Prisma/Redis/Socket.IO, frontend Next.js. Specs détaillées : Conception_Technique.pdf.*
