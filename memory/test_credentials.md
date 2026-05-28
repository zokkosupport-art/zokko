# Identifiants — Zokko

## Admin

| | |
|---|---|
| URL | `https://zokko.net/admin-login` |
| Identifiant | `admin` |
| Mot de passe | `Zokko2026!` |

## Utilisateurs (numéro + code à 6 chiffres)

1. `https://zokko.net/login`
2. Entrer le numéro (+224 Guinée ou +33 France)
3. **Première fois** : choisir un code à 6 chiffres + le confirmer + nom
4. **Ensuite** : même numéro + même code = connexion

Pas de SMS. Le code est choisi par l'utilisateur et stocké de façon sécurisée.

Les numéros admin (`612516488`, `659497111`) → utiliser `/admin-login`.

Variables prod (Railway / `.env`) :
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Zokko2026!
OTP_DEV_MODE=false
MONGO_URL=mongodb+srv://...
STORAGE_BACKEND=local
```
