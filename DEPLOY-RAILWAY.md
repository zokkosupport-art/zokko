# Zokko en ligne sur Railway (remplace Emergent)

**Prérequis :** local OK (localhost:3000) + MongoDB Atlas OK.

---

## Étape 1 — Atlas (2 min)

MongoDB Atlas → **Network Access** → **Add IP** → **Allow Access from Anywhere** (`0.0.0.0/0`).

Sans ça, Railway ne pourra pas joindre la base.

---

## Étape 2 — GitHub (10 min)

1. https://github.com/new → repo **zokko** (privé) → Create.
2. PowerShell :

```powershell
cd C:\Users\mouss\Projects\zokko
git init
git add .
git commit -m "Zokko: migration hors Emergent"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/zokko.git
git push -u origin main
```

*(Installez Git si besoin : https://git-scm.com)*

---

## Étape 3 — Railway (15 min)

1. https://railway.app → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo** → **zokko**.
3. Attendez le 1er build (peut échouer une fois — normal si variables manquent).

### Variables d'environnement

Onglet **Variables** → **RAW Editor** → collez (adaptez les secrets) :

```env
MONGO_URL=mongodb+srv://zokkosupport_db_user:VOTRE_MDP@cluster0.oyfk0ae.mongodb.net/?retryWrites=true&w=majority
DB_NAME=zokko
JWT_SECRET=changez-moi-long-secret-aleatoire
APP_NAME=zokko
OTP_DEV_MODE=false
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=/app/backend/data/uploads
CORS_ORIGINS=https://zokko.net,https://www.zokko.net
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changez-moi
ADMIN_PHONES=612516488,659497111
ORANGE_MONEY_NUMBER=+224612516488
ORANGE_MONEY_HOLDER=Zokko
FRONTEND_BUILD=/app/frontend/build
```

**Ne commitez jamais ce fichier avec les vrais mots de passe sur GitHub.**

4. **Redeploy** (Deployments → trois points → Redeploy).

5. **Settings** → **Networking** → **Generate Domain** → vous obtenez une URL `xxx.up.railway.app`. Testez-la dans le navigateur.

---

## Étape 4 — Domaine zokko.net (10 min)

1. Railway → **Settings** → **Networking** → **Custom Domain** → `zokko.net` (et `www.zokko.net`).
2. Railway affiche un **CNAME** à créer.
3. Chez votre registrar / **Cloudflare** (là où est zokko.net) :
   - Type **CNAME** | Nom `@` ou `www` | Cible = valeur Railway
4. Attendez 5 min à 2 h.
5. Testez **https://zokko.net**

---

## Étape 5 — Couper Emergent

Quand **https://zokko.net** affiche Zokko et login fonctionne :

→ Résiliez Emergent.

---

## Photos en production

Avec `STORAGE_BACKEND=local` sur Railway, les images peuvent être perdues à un redéploiement. Pour du durable : Cloudflare **R2** (voir `MIGRATION.md`).

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Build échoue | Logs Railway → souvent `npm` ; relancer Deploy |
| Site blanc | Vérifier `FRONTEND_BUILD` et logs uvicorn |
| Erreur Mongo | Atlas IP 0.0.0.0/0 + bon `MONGO_URL` |
| Login ne marche pas | `OTP_DEV_MODE=false` en prod |
