# Identifiants — Zokko

## Admin

| | |
|---|---|
| URL | `https://zokko.net/admin-login` (ou `/admin-login` sur Railway) |
| Identifiant | `admin` |
| Mot de passe | `300890` (variable `ADMIN_PASSWORD` sur Railway) |

## Utilisateurs (numéro + code à 6 chiffres)

1. `https://zokko.net/login`
2. Entrer le numéro guinéen (+224 uniquement)
3. **Première fois** : choisir **Particulier** ou **Entreprise**, un code à 6 chiffres + confirmation + nom
4. **Ensuite** : même numéro + même code = connexion

Pas de SMS. Le code est choisi par l'utilisateur et stocké de façon sécurisée (hash).

Les numéros admin (`612516488`, `659497111`) → utiliser `/admin-login` uniquement.

Variables prod (Railway / `.env`) :
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=300890
OTP_DEV_MODE=false
MONGO_URL=mongodb+srv://...
STORAGE_BACKEND=local
```
