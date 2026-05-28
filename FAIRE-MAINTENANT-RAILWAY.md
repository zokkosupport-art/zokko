# Zokko sur Railway — checklist (si le déploiement reste rouge)

**Symptôme :** Build OK, mais **Healthcheck FAILED** après 2–3 minutes.

---

## Checklist Railway (dans l’ordre)

### 1. Builder = Dockerfile (pas Railpack)

1. Railway → service **zokko** → **Settings** → **Build**
2. **Builder** = **Dockerfile** (ou « Dockerfile » / « DOCKERFILE »)
3. **Dockerfile path** = `Dockerfile` (à la racine du repo)
4. **Root Directory** = **vide** ou `.` (racine du repo — **pas** `frontend/`)

Si Railway détecte Railpack ou Node seul, le healthcheck échouera.

---

### 2. Start Command = VIDE

1. **Settings** → **Deploy**
2. Champ **Custom Start Command** / **Start Command** : **totalement vide**
3. Supprimez tout `uvicorn …`, `npm start`, `sh start.sh`, etc.

Le conteneur doit utiliser uniquement le `CMD` du **Dockerfile** :
`uvicorn server:app --host 0.0.0.0 --port $PORT`

Un start command dans l’UI **remplace** le Dockerfile et casse souvent le déploiement (mauvais dossier, mauvais port).

---

### 3. Health Check Path = `/health`

1. **Settings** → **Health Check**
2. **Path** = `/health` (pas `/api`, pas `/`)
3. Si un chemin est déjà dans l’interface, il **remplace** `railway.toml` — corrigez ici puis **Redeploy**

Test navigateur : `https://VOTRE-URL.up.railway.app/health`  
→ doit afficher `{"status":"ok","service":"zokko"}`

---

### 4. Variables obligatoires (noms exacts)

Onglet **Variables** — ces 3 noms doivent exister **exactement** (copier-coller) :

| Variable | Rôle |
|----------|------|
| `MONGO_URL` | URL MongoDB Atlas (`mongodb+srv://…`) |
| `DB_NAME` | Nom de la base (ex. `zokko`) |
| `JWT_SECRET` | Chaîne secrète longue et aléatoire |

**Ne pas définir `PORT`** — Railway l’injecte automatiquement.

Copiez le reste depuis `railway.env.example` (OTP, CORS, storage, admin…).

MongoDB Atlas → **Network Access** → autoriser `0.0.0.0/0`.

---

### 5. Deploy Logs — à quoi ressemble le SUCCÈS

1. **Deployments** → déploiement en cours ou échoué
2. Onglet **Deploy Logs** (⚠️ pas **Build Logs**)
3. Cherchez (Ctrl+F) :

```text
ZOKKO_BOOT: importing server.py
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

- **`ZOKKO_BOOT`** = Python a chargé `server.py` (même si Mongo échoue plus tard)
- **`Uvicorn running`** = le serveur écoute — le healthcheck peut répondre sur `/health`

Si vous ne voyez **jamais** `ZOKKO_BOOT` → crash à l’import (variable manquante, module absent).  
Si `ZOKKO_BOOT` mais **pas** `Uvicorn running` → crash au démarrage uvicorn (port, commande UI).

Erreurs fréquentes dans les logs : `KeyError: 'MONGO_URL'`, `ModuleNotFoundError`, `Address already in use`.

---

### 6. Redeploy

1. **Deployments** → ⋮ → **Redeploy**
2. Attendez le vert (5–10 min)
3. Testez `/health` puis votre domaine

---

## Toujours bloqué ?

Écrivez **« Railway échoue encore »** et collez les **15 dernières lignes des Deploy Logs** (pas Build Logs), plus :

1. **Settings → Health Check** — chemin affiché
2. **Settings → Deploy** — Start Command (vide ou pas)
3. **Settings → Build** — Builder + Root Directory
4. **Variables** — liste des **noms** seulement (sans mots de passe)

---

## Résumé rapide

| Où | Quoi |
|----|------|
| Build | Builder **Dockerfile**, Root Directory **vide** |
| Deploy | Start Command **vide** |
| Health | Path **`/health`** |
| Variables | `MONGO_URL`, `JWT_SECRET`, `DB_NAME` |
| Deploy Logs | `ZOKKO_BOOT` puis `Uvicorn running on` |
