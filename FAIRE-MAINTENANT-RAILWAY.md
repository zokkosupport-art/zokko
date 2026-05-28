# Zokko sur Railway — 5 étapes (si le déploiement reste rouge)

**Symptôme :** Build OK, mais **Healthcheck FAILED** après 2–3 minutes.

---

## Étape 1 — Ouvrir les bons logs

1. Railway → votre service **zokko**
2. Onglet **Deployments** → cliquez le déploiement en échec
3. Ouvrez **Deploy Logs** (pas Build Logs)
4. Cherchez (Ctrl+F) : `FATAL`, `Error`, `bad interpreter`, `ModuleNotFoundError`

**Vous devez voir :**
```text
[start.sh] uvicorn server:app on 0.0.0.0:XXXX
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

Si vous ne voyez **jamais** cette ligne → le conteneur ne démarre pas (variables manquantes ou script cassé).

---

## Étape 2 — Start Command (important)

1. Railway → **Settings** → **Deploy**
2. Champ **Custom Start Command** : **vide** (supprimez tout)
3. Railway doit utiliser le **Dockerfile** → `sh start.sh`

Si un `uvicorn server:app …` est écrit ici, ça casse le déploiement (mauvais dossier).

---

## Étape 3 — Health Check Path

1. Railway → **Settings** → **Health Check**
2. **Path** = `/health` (pas `/api`)
3. Si un chemin est déjà dans l’interface, il **remplace** `railway.toml` — corrigez ici puis **Redeploy**

Test dans le navigateur :
`https://VOTRE-URL.up.railway.app/health`  
→ doit afficher `{"status":"ok","service":"zokko"}`

---

## Étape 4 — Variables obligatoires

Onglet **Variables** → vérifiez que ces 3 existent (sans faute de frappe) :

| Variable | Exemple |
|----------|---------|
| `MONGO_URL` | `mongodb+srv://user:MDP@cluster….mongodb.net/…` |
| `DB_NAME` | `zokko` |
| `JWT_SECRET` | longue chaîne aléatoire |

Copiez aussi le reste depuis `railway.env.example` (OTP, CORS, storage, admin…).

**Ne définissez pas `PORT`** — Railway l’injecte tout seul.

MongoDB Atlas → **Network Access** → `0.0.0.0/0` obligatoire.

---

## Étape 5 — Redeploy et test

1. **Deployments** → ⋮ → **Redeploy**
2. Attendez le vert (5–10 min)
3. Testez `/health` puis `https://zokko.net`

---

## Toujours bloqué ? Envoyez une capture

Dans Cursor, écrivez : **« Railway échoue encore »** et joignez une capture avec :

1. **Deploy Logs** — les 30 dernières lignes (autour de `FATAL` ou `Error`)
2. **Settings → Health Check** — le chemin affiché
3. **Settings → Deploy** — Start Command (vide ou pas)
4. **Variables** — liste des **noms** seulement (pas les mots de passe)

---

## Résumé

| Où | Quoi |
|----|------|
| Deploy Logs | `[start.sh] uvicorn …` doit apparaître |
| Start Command | **Vide** |
| Health path | **`/health`** |
| Variables | `MONGO_URL`, `JWT_SECRET`, `DB_NAME` |
