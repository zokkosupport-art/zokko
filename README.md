# Zokko — Marketplace Guinée

Site + PWA : React · FastAPI · MongoDB.

**Migration hors Emergent :** voir [MIGRATION.md](./MIGRATION.md)

## Démarrage rapide

```powershell
cd backend
copy .env.example .env
# Renseigner MONGO_URL (Atlas)
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

```powershell
cd frontend
# .env : REACT_APP_BACKEND_URL=http://localhost:8000
npm install && npm start
```

## Déploiement

- **Docker** : `docker build -t zokko .` puis run avec variables `backend/.env.example`
- **Railway** : connecter le repo GitHub, variables d’environnement, domaine `zokko.net`

## Scripts

| Script | Rôle |
|--------|------|
| `scripts/cleanup_test_data.ps1` | Supprimer annonces TEST en prod |
| `scripts/verify_launch.ps1` | Checklist go-live |
| `scripts/create_deploy_zip.ps1` | Ancien déploiement Emergent (obsolète) |
