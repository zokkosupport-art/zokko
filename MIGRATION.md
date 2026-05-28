# Zokko — Migration hors Emergent

Vous avez ouvert **MongoDB Atlas** : suivez ces étapes dans l’ordre.

## Étape 1 — MongoDB Atlas (15 min)

1. [cloud.mongodb.com](https://cloud.mongodb.com) → votre cluster **M0 Free**.
2. **Database Access** → Add user (login + mot de passe fort) → rôle **Atlas admin** ou **readWrite** sur la base.
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) pour Railway/Render.  
   *(Plus tard : restreindre aux IP de l’hébergeur.)*
4. **Database** → **Connect** → **Drivers** → Python → copier l’URI :
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Dans `backend/.env` (copiez depuis `.env.example`) :
   ```env
   MONGO_URL="mongodb+srv://..."
   DB_NAME="zokko"
   JWT_SECRET="une-longue-chaine-aleatoire"
   OTP_DEV_MODE="false"
   STORAGE_BACKEND="local"
   ```

### Importer les données depuis Emergent (important)

Avant de couper Emergent :

1. Sur le dashboard **Emergent**, récupérez l’ancienne `MONGO_URL` de prod (si visible).
2. Sur votre PC (avec [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/installation/installation/)) :
   ```powershell
   # Export depuis l’ancienne base Emergent (remplacez OLD_URI)
   mongodump --uri="OLD_URI" --db=guinee_market --out=C:\Users\mouss\Desktop\zokko-dump

   # Import vers Atlas (remplacez NEW_URI et le nom de DB)
   mongorestore --uri="NEW_URI" --db=zokko C:\Users\mouss\Desktop\zokko-dump\guinee_market
   ```
   Le nom de base (`guinee_market`, `zokko`, etc.) peut varier — vérifiez dans Emergent.

Sans dump : vous repartez avec une base vide (admin recréé au démarrage).

---

## Étape 2 — Tester en local (20 min)

```powershell
cd c:\Users\mouss\Projects\zokko\backend
copy .env.example .env
# Éditez .env avec votre MONGO_URL Atlas

pip install -r requirements.txt
cd ..\frontend
npm install
# frontend\.env :
# REACT_APP_BACKEND_URL=http://localhost:8000
npm start
```

Autre terminal :

```powershell
cd c:\Users\mouss\Projects\zokko\backend
uvicorn server:app --reload --port 8000
```

Ouvrez http://localhost:3000 — inscription, publication, photo (stockage local dans `backend/data/uploads`).

---

## Étape 3 — Héberger sans Emergent (Railway recommandé)

### Option A — Railway (~5–10 €/mois)

1. [railway.app](https://railway.app) → compte → **New Project** → **Deploy from GitHub**.
2. Poussez le code sur GitHub (repo privé `zokko`).
3. Railway détecte le `Dockerfile` à la racine.
4. **Variables** (Settings → Variables) — reprenez tout `backend/.env.example` :
   - `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `OTP_DEV_MODE=false`
   - `STORAGE_BACKEND=local` (ou `s3` + R2, voir ci-dessous)
   - `CORS_ORIGINS=https://zokko.net`
   - Admin, Orange Money, etc.
5. **Domaine** : Settings → Networking → Custom Domain → `zokko.net`.
6. Chez votre registrar / **Cloudflare DNS** :
   - CNAME `zokko.net` → l’URL fournie par Railway.

### Option B — VPS (Hetzner ~4 €/mois)

`docker compose up -d` avec le `docker-compose.yml` fourni (à adapter).

---

## Étape 4 — Photos en production (Cloudflare R2, optionnel)

Tant que `STORAGE_BACKEND=local`, les images sont sur le disque du serveur (OK pour démarrer).

Pour du durable :

1. Cloudflare → **R2** → Create bucket `zokko`.
2. **Manage R2 API Tokens** → token S3.
3. Variables :
   ```env
   STORAGE_BACKEND=s3
   S3_ENDPOINT_URL=https://ACCOUNT_ID.r2.cloudflarestorage.com
   S3_BUCKET=zokko
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   S3_REGION=auto
   ```

Les anciennes photos **Emergent** ne migrent pas automatiquement — les vendeurs peuvent re-publier les images, ou vous refaites un dump des fichiers si Emergent vous les exporte.

---

## Étape 5 — Couper Emergent

1. Site OK sur Railway + DNS `zokko.net` actif.
2. `scripts\verify_launch.ps1` contre https://zokko.net
3. `scripts\cleanup_test_data.ps1` si annonces TEST encore en base.
4. Résilier l’abonnement **Emergent**.

---

## App mobile (PWA)

Rien à publier sur le Play Store pour l’instant : les utilisateurs installent depuis Chrome → **Ajouter à l’écran d’accueil** (`manifest.json` déjà en place).

---

## Aide

Dans Cursor, dossier ouvert : `c:\Users\mouss\Projects\zokko`.  
Demandez : *« déploie sur Railway »* ou *« configure R2 »* une fois le `.env` Atlas rempli.
