# Photos disparues après déploiement Railway

## Cause (pas un bug du dernier code)

Sur Railway, avec `STORAGE_BACKEND=local`, les images sont enregistrées sur le **disque du conteneur**.

À chaque **Redeploy** ou nouveau déploiement, ce disque est **effacé**.

- MongoDB garde les chemins (`zokko/uploads/...`)
- Les fichiers JPG **ne sont plus sur le serveur** → erreur **404**
- Les annonces **démo** avec liens `https://pexels.com/...` continuent d’afficher une image

## Solution durable (choisir une)

### Option A — Volume Railway (rapide, ~gratuit avec le plan)

1. Railway → projet **incredible-hope** → vue avec les blocs (canvas), **pas** seulement l’onglet Deployments
2. **Ctrl+K** (Windows) → tape **Create Volume** ou **Volume** → valide
   - *Ou* clic droit sur le fond du canvas → menu **Volume**
3. Choisis le service **zokko** → **Mount path** : `/app/backend/data/uploads`
4. **Variables** (onglet du service zokko) → `STORAGE_LOCAL_PATH=/app/backend/data/uploads`
5. **Redeploy** le service zokko

Les **nouvelles** photos survivront aux redeploys. Les anciennes sont perdues : **republier les photos** sur chaque annonce (Modifier).

### Option B — Cloudflare R2 (recommandé long terme)

Voir `MIGRATION.md` section « Photos en production ».

`STORAGE_BACKEND=s3` + clés R2 → photos stockées dans le cloud, jamais effacées au redeploy.

## Reprendre les photos maintenant

Pour chaque annonce sans image :

1. **Mes annonces** → **Modifier**
2. Re-ajouter les photos → Enregistrer

Ou supprimer et recréer l’annonce.

## Vérification

URL test (doit être 200, pas 404) :

`https://www.zokko.net/api/files/zokko/uploads/.../xxx.jpg`

Si **404** → fichier absent sur le serveur (normal après redeploy sans volume/R2).
