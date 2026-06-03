# Affiches Zokko — logo officiel (éléphant tricolore 🇬🇳)

## Logo officiel

**Fichier source unique :** `marketing/logo-officiel.png`  
(Affiche : éléphant rouge / jaune / vert · « Vendez gratuitement sur Zokko » · www.zokko.net)

**Ne pas utiliser** l’ancien logo orange généré par IA ni l’ancien `icon-guinea.svg` simplifié seul — toujours partir de cette affiche.

| Export | Fichier |
|--------|---------|
| Facebook / groupes (carré) | `zokko-affiche-facebook.png` (= copie officielle) |
| Story | `zokko-story-reseaux.png` (= copie officielle) |
| Icônes site / PWA | `frontend/public/branding/icon-*.png` (générées depuis l’éléphant) |

Regénérer les icônes app après changement d’affiche :

```bash
python scripts/export_official_branding.py
```

---

## Affiches HTML (capture écran)

| Fichier | Usage |
|---------|--------|
| **`affiche-officielle.html`** | Affiche complète telle quelle (recommandé groupes) |
| **`affiche-trafic-officielle.html`** | Même éléphant · texte **Parcourez** (phase trafic) |
| `reel-zokko.html` | Reel 15 s · logo officiel |
| `facebook-cover.html` | Bannière Page Facebook |

Double-clic dans Chrome → capture PNG.

---

## Facebook / trafic

- **Marque :** toujours l’éléphant tricolore (`logo-officiel.png` ou icône recadrée).
- **Phase trafic :** `FACEBOOK-TRAFIC-ONLY.md` + affiche `affiche-trafic-officielle.html`.
- **Messages groupes :** `PUBLICATION-GROUPES-FACEBOOK.md` → joindre `zokko-affiche-facebook.png`.

---

## Site (header / favicon)

Le header utilise `frontend/public/branding/icon-192.png` (extrait de l’éléphant officiel).
