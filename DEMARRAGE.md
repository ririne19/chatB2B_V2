# Démarrer et accéder au projet Chat B2B

## Qui fait quoi ?

| Port   | Service  | Rôle | Ce que tu ouvres dans le navigateur |
|--------|----------|------|-------------------------------------|
| **3002** | Frontend | Interface web (pages) | **http://localhost:3002** → page d'accueil, login, register |
| **3001** | Backend  | API uniquement (JSON) | Pas de page d'inscription ici. Utiliser **http://localhost:3001/health** pour tester |

- **/register** et **/login** = **uniquement sur le frontend** → donc **http://localhost:3002/register** et **http://localhost:3002/login**
- Sur **3001** il n’y a pas de page « register », seulement des routes API comme **http://localhost:3001/api/auth/register**

**Si http://localhost:3001/health ne répond pas :** tester d’abord **http://localhost:3001/ping** : si tu vois `{"ok":true}`, le backend tourne (le blocage vient alors de la base ou de Redis → voir `docker compose logs backend`). Si **/ping** ne répond pas, vérifier que le fichier **.env** à la racine existe avec `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (voir `.env.example`) et que les conteneurs sont Up (`docker compose ps`). En Docker, utiliser les noms de services : `postgres` et `redis` (ex. `postgresql://postgres:postgres@postgres:5432/chatb2b`, `redis://redis:6379`).

---

## Démarrer les services

À la **racine du projet** (là où se trouve `docker-compose.yml`) :

```bash
docker compose up -d
```

Attendre **1 à 2 minutes** (premier démarrage : installation des dépendances).

---

## Vérifier que tout tourne

```bash
docker compose ps
```

Tu dois voir les 4 services **Up** (postgres, redis, backend, frontend).

Puis tester :

- **Frontend (interface)** : ouvrir **http://localhost:3002**
- **Backend (API)** : ouvrir **http://localhost:3001/health** (tu dois voir du JSON)

---

## Si rien ne s’ouvre (localhost 3001 ou 3002)

1. **Les conteneurs sont-ils bien démarrés ?**
   ```bash
   docker compose ps
   ```
   Si un service est "Exit" ou "Restarting", regarder les logs :
   ```bash
   docker compose logs backend --tail 30
   docker compose logs frontend --tail 30
   ```

2. **Redémarrer proprement**
   ```bash
   docker compose down
   docker compose up -d
   ```
   Attendre 2 minutes puis réessayer **http://localhost:3002** et **http://localhost:3001/health**.

3. **Un autre logiciel utilise peut-être le port**
   - Sur Mac : Réglages Système → Réseau → (ou en terminal : `lsof -i :3002` et `lsof -i :3001`)
   - Si 3002 ou 3001 est pris, tu peux changer le port dans `docker-compose.yml` (ex. `"3003:3000"` pour le frontend).

4. **Docker Desktop**
   - Vérifier que Docker Desktop est lancé et que les conteneurs apparaissent bien.

---

## Récap des URLs utiles

- **Page d’accueil** : http://localhost:3002  
- **Inscription** : http://localhost:3002/register  
- **Connexion** : http://localhost:3002/login  
- **Conversations (après login)** : http://localhost:3002/conversations  
- **API health** : http://localhost:3001/health  
- **API ping** (vérifier que le backend répond) : http://localhost:3001/ping  
