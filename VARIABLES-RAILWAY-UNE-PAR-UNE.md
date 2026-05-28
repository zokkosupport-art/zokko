# Railway — quand /health/env affiche tout à false

Les variables dans l’écran ne servent à rien si elles ne sont **pas sur le service zokko** ou si c’est seulement **Shared** sans lien.

## Méthode qui marche (1 variable test)

1. Projet **ample-enthusiasm** → cliquez la **carte zokko** (au centre, pas le menu engrenage du projet).
2. Onglet **Variables**.
3. **Supprimez** toutes les variables (⋮ → Delete) une par une *ou* videz le Raw Editor.
4. Cliquez **+ New Variable** (PAS « Shared Variable »).
5. Remplissez :
   - **Variable Name** : `MONGO_URL`
   - **Value** : collez l’URL `mongodb+srv://...` (tout le lien, sans `MONGO_URL=` devant).
6. **Add**.
7. Refaites **+ New Variable** pour :
   - `DB_NAME` → `zokko`
   - `JWT_SECRET` → (longue phrase du fichier COLLEZ-DANS-RAILWAY.txt)
   - `ADMIN_PASSWORD` → `300890`
8. **Deployments** → **Redeploy** → attendez **vert**.
9. Test : https://zokko-production.up.railway.app/health/env  
   → `MONGO_URL_set` doit être **true**.

Ensuite ajoutez le reste depuis `COLLEZ-DANS-RAILWAY.txt` avec **+ New Variable** (une par une).
