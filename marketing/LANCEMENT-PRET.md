# Zokko — Prêt pour lancer ? (hors domaine apex)

## Verdict : **OUI — beta publique avec www**

Utilisez **https://www.zokko.net** (pas `https://zokko.net` sans www tant que SSL apex IONOS pose problème).

---

## Checklist rapide

| Point | Statut |
|-------|--------|
| Site en ligne (Railway / www) | ✅ |
| Inscription +224 / PIN | ✅ |
| Publication gratuite | ✅ |
| Images annonces démo | ✅ Corrigées au prochain redeploy |
| Paiement | Orange Money manuel uniquement |
| Email support | support@zokko.net |
| CORS / API | ✅ |
| Modération admin | À faire par vous (&lt; 2 h) |
| Photos uploadées vendeurs | Risque perte au redeploy tant que pas R2 (plus tard) |

---

## Avant de poster sur Facebook

1. Redeploy Railway après dernier push (images démo).
2. Ouvrir **www.zokko.net** → vérifier Toyota = voiture, iPhone = téléphone, etc.
3. Changer mot de passe **admin** sur Railway si encore défaut.
4. Affiches : ouvrir `marketing/affiche-*.html` → capture → publier.
5. Messages : copier depuis `marketing/MESSAGES-WHATSAPP-FACEBOOK.md`.

---

## Optionnel plus tard (pas bloquant)

- Stockage R2 pour photos persistantes
- `AUTO_APPROVE_LISTINGS=true` si vous ne pouvez pas modérer à la main
- Corriger SSL `https://zokko.net` (IONOS SSL ou domaine apex sur Railway)
