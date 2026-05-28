# Zokko - PRD

## Original Problem Statement
Marketplace locale Guinée (mobile + web) pour acheter, vendre et proposer des services.
Optimisée pour faible connexion, téléphones bas de gamme. OTP téléphone, Orange Money, WhatsApp, admin panel.

User feedback (Phase 2):
- Renommer en **Zokko** (logo à créer)
- Ultra simple: voir / publier / contacter
- Confiance: profil vérifié, signalement, étoiles
- WhatsApp en priorité + partage
- Orange Money 1 clic
- Légèreté
- Viralité: parrainage avec boost gratuit

## Personas
- Acheteurs (mobile, faible data)
- Vendeurs (particuliers)
- Prestataires de services (coiffure, mécanique, livraison)
- Professionnels (compte Pro)
- Admin (modération, signalements, fraude)

## Architecture
- Backend: FastAPI + MongoDB + JWT auth + Emergent object storage
- Frontend: React + shadcn + Tailwind + Phosphor icons
- Fonts: Outfit (heading) + Work Sans (body)
- Couleurs: Earthy (#FAF8F5 bg, #D84315 brand, #2E7D32 secondary, #FBC02D accent, #FF6600 Orange Money)
- Mobile-first avec bottom-nav

## What's Implemented (2026-02)
### Phase 1
- Auth phone+OTP (simulé, OTP retourné + universel 123456) + JWT 7j
- Catégories (7) + villes Guinée (10)
- Listings CRUD + filtres (cat, ville, type, search) + pagination
- Upload images via Emergent storage + soft-delete
- Messagerie interne + bouton WhatsApp
- Orange Money simulé (premium 2€, boost 7j 1€, abo pro 5€/mois)
- Historique paiements
- Admin panel: stats, validation annonces, blocage utilisateurs, paiements
- Seed admin + 8 annonces démo

### Phase 2 (rebranding Zokko + confiance + viralité)
- Logo Zokko (éléphant orange minimaliste — symbole de la Guinée — généré via Nano Banana, fichiers PNG dans `/app/frontend/public/branding/`, PWA icons + favicon mis à jour 2026-02)
- Compte **vérifié** automatique après OTP (badge ✓ vert)
- **Code parrain** (ZOK-XXXXX) généré pour chaque user
- Bonus parrainage: +1 boost 7j gratuit (parrain + filleul)
- **Bouton Signaler** sur chaque annonce (modal raison + description)
- **Avis ⭐** 1-5 + commentaire sur vendeur, calcul moyenne automatique
- **Partage WhatsApp** d'une annonce (deep link wa.me)
- **Partage code parrain** WhatsApp
- Onglet **Signalements** dans admin panel
- Badge "Vérifié" sur cartes listing
- **Boost gratuit** depuis credits sur annonces

## Test Credentials
Voir `/app/memory/test_credentials.md`

### Phase 3 (viralité + perf + Pro stats)
- **Open Graph share** : route `/api/s/{id}` génère HTML avec OG tags (titre, prix, photo, image, twitter card, product price) + redirect → aperçus riches sur WhatsApp/Facebook/Twitter
- **Compression photos client** : canvas resize max 1200px, JPEG 75% avant upload (économie data, toast affiche Ko sauvés)
- **PWA installable** : `manifest.json` (logo SVG inline, theme #D84315, standalone), méta Apple
- **Stats Pro** : compteur `whatsapp_clicks` par annonce + endpoint `/listings/:id/stats` (vues, clics WA, messages)
- **MyAds page** affiche stats Pro overlay sur chaque carte (Pro users) + CTA upgrade (Pro 5€) pour utilisateurs gratuits
- Tracking auto `POST /listings/:id/click-whatsapp` au clic du bouton WhatsApp

### Phase 4 (CinetPay - paiement réel)
- **Module `cinetpay.py`** : `initiate_payment()`, `verify_payment()`, `verify_webhook_signature()` (HMAC SHA-256)
- **Endpoints** :
  - `POST /api/payments/cinetpay/initiate` → init session CinetPay, génère transaction_id unique, retourne `payment_url`
  - `POST /api/payments/cinetpay/webhook` → reçoit notification + vérifie signature + appelle `/payment/check` pour confirmation server-side + active service (idempotent)
  - `POST /api/payments/cinetpay/check/:tx` → vérification manuelle (return page) + activation
  - `GET /api/payments/cinetpay/config` → catalogue prix GNF + statut configuration
- **Prix en GNF** : Boost 10 000 / Premium 20 000 / Pro 50 000 GNF/mois
- **Canaux supportés** : ALL / MOBILE_MONEY / CREDIT_CARD / WALLET
- **Idempotence** : status check avant activation, unique transaction_ref
- **Page `PaymentReturn`** : polling status (jusqu'à 6 retries), affichage succès/pending/échec, infos paiement (méthode, opérateur ID)
- **Mode mock fallback** : si `CINETPAY_API_KEY` reste placeholder, le flow simule succès + bannière "Mode démo" affichée
- **Admin** : payments view montre provider (CP/OM), méthode CinetPay, badge démo, montants en GNF
- **Sécurité** : HMAC webhook secret (`CINETPAY_WEBHOOK_SECRET`), validation server-side via `/payment/check` après notification

## ⚠️ Setup Production Required
Pour activer les paiements réels :
1. Créer compte marchand sur https://www.cinetpay.com (Guinée)
2. KYC : fournir documents entreprise
3. Récupérer `CINETPAY_API_KEY` + `CINETPAY_SITE_ID` dans le menu Intégration
4. Configurer webhook URL dans dashboard CinetPay : `https://<domaine>/api/payments/cinetpay/webhook`
5. Mettre à jour `/app/backend/.env` avec les vraies valeurs + redémarrer backend
