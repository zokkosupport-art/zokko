# Zokko — Copier les variables Railway (2 minutes)

L’erreur `MONGO_URL is not set` = Railway n’a **aucune** variable. Il faut les coller **une fois**.

## Étapes (suivez dans l’ordre)

1. Ouvrez le fichier sur votre PC :  
   **`C:\Users\mouss\Projects\zokko\backend\COLLEZ-DANS-RAILWAY.txt`**
2. **Ctrl+A** puis **Ctrl+C** (tout copier).
3. Allez sur **https://railway.app** → projet **ample-enthusiasm** → service **zokko**.
4. Onglet **Variables** → bouton **{} Raw Editor** (éditeur brut).
5. **Effacez tout** ce qui est dedans → **Ctrl+V** (coller).
6. Cliquez **Update Variables** (violet).
7. Attendez le déploiement **vert** (~3–5 min).

## Test

1. Ouvrez : https://zokko-production.up.railway.app/health/db  
   → doit afficher `"status":"ok"` (pas `MONGO_URL is not set`).
2. Admin : https://zokko-production.up.railway.app/admin-login  
   - Identifiant : **admin**  
   - Mot de passe : **300890**

## Si ça ne marche pas

- Vérifiez qu’il n’y a **pas de guillemets** `"` autour des lignes dans Raw Editor.
- MongoDB Atlas → **Network Access** → **0.0.0.0/0** activé.
