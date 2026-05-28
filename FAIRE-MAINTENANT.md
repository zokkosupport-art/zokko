# Zokko — À faire maintenant (simple)

**Objectif :** ne plus payer Emergent. Votre site tourne sur **MongoDB Atlas** + **Railway** (ou test sur votre PC).

---

## PARTIE A — Vous seul (impossible à faire par l’IA) · ~15 minutes

### Étape 1 — MongoDB (vous avez déjà un compte)

1. Allez sur **https://cloud.mongodb.com** et connectez-vous.
2. Cliquez sur votre cluster (gratuit M0).
3. Menu gauche **「Database Access」** → **Add New Database User**  
   - Nom : `zokko`  
   - Mot de passe : inventez-en un **et notez-le**  
   - Rôle : **Atlas admin** (ou Read and write to any database)  
   - **Add User**
4. Menu **「Network Access」** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm  
   *(obligatoire pour Railway)*
5. Menu **「Database」** → bouton **Connect** sur le cluster → **Drivers** → **Python**  
6. Copiez la ligne qui ressemble à :
   ```text
   mongodb+srv://zokko:<password>@cluster0.xxxxx.mongodb.net/...
   ```
7. Remplacez `<password>` par **votre vrai mot de passe** (sans les chevrons).

### Étape 2 — Coller le mot de passe dans un seul fichier

1. Ouvrez le dossier : `C:\Users\mouss\Projects\zokko\backend`
2. S’il n’y a pas de fichier `.env`, copiez `.env.example` et renommez la copie en **`.env`**
3. Ouvrez **`.env`** avec le Bloc-notes.
4. Ligne `MONGO_URL=` → collez **votre** URI complète entre guillemets.
5. Enregistrez. Fermez.

**C’est tout ce que vous devez faire à la main pour la base de données.**

---

## PARTIE B — Sur votre PC (double-clic ou 1 commande)

### Étape 3 — Installer et lancer en local

1. Ouvrez **PowerShell**.
2. Collez ceci **une seule fois** :

```powershell
cd C:\Users\mouss\Projects\zokko
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
```

3. Quand le script demande l’URI MongoDB : **Entrée** si vous avez déjà rempli `.env`, sinon collez l’URI.
4. À la fin, deux fenêtres s’ouvrent (API + site). Sinon :
   - Site : **http://localhost:3000**
   - API : **http://localhost:8000/api**

5. Test : allez sur **http://localhost:3000/login** → numéro + code 6 chiffres → publiez une annonce.

Si ça marche en local → la base Atlas est OK.

---

## PARTIE C — Mettre en ligne (quand le local marche)

### Étape 4 — GitHub (une fois)

1. **https://github.com/new** → repo privé `zokko` → Create.
2. PowerShell :

```powershell
cd C:\Users\mouss\Projects\zokko
git init
git add .
git commit -m "Migration hors Emergent"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/zokko.git
git push -u origin main
```

*(Remplacez `VOTRE_COMPTE` par votre login GitHub.)*

### Étape 5 — Railway (hébergement ~5 €/mois)

1. **https://railway.app** → Login with GitHub.
2. **New Project** → **Deploy from GitHub repo** → choisissez `zokko`.
3. Onglet **Variables** → **Raw Editor** → copiez-collez **tout** le contenu de votre `backend\.env` (sans publier ailleurs).
4. Ajoutez aussi :
   ```env
   OTP_DEV_MODE=false
   CORS_ORIGINS=https://zokko.net
   ```
5. **Settings** → **Networking** → **Generate Domain** (test) puis **Custom Domain** → `zokko.net`.
6. Attendez que le déploiement soit vert (5–10 min).

### Étape 6 — DNS (domaine zokko.net)

1. Là où vous gérez **zokko.net** (Cloudflare, OVH, etc.).
2. Railway vous donne une cible (CNAME).
3. Créez un enregistrement **CNAME** : `@` ou `www` → la cible Railway.
4. Attendez 5 min à 2 h → ouvrez **https://zokko.net**

### Étape 7 — Couper Emergent

**Seulement quand** https://zokko.net fonctionne (login + annonces).

→ Résiliez l’abonnement Emergent.

---

## Résumé en 3 lignes

| Qui | Quoi |
|-----|------|
| **Vous** | Atlas : user + IP + URI dans `backend\.env` |
| **Script** | Test local (`setup-local.ps1`) |
| **Vous** | GitHub + Railway + DNS → puis stop Emergent |

---

## Bloqué ?

Écrivez dans Cursor (dossier `zokko` ouvert) :

- « Étape 1 faite, voici l’erreur : … » *(sans envoyer votre mot de passe)*
