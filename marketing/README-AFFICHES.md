# Zokko — identité visuelle (à ne pas confondre)

## 1. LOGO OFFICIEL (icône seule)

**C’est l’éléphant tricolore sur fond blanc carré** — comme sur la Page Facebook « Zokko Guinée ».

| Fichier | Usage |
|---------|--------|
| **`logo-icon-officiel.png`** | **Source unique du logo** |
| `frontend/public/branding/logo-elephant-officiel.png` | Header du site |
| `icon-192.png`, `icon-512.png`, favicons | PWA / onglet navigateur |

Regénérer après remplacement du PNG :

```bash
python scripts/export_official_branding.py
```

**Couleurs :** oreille gauche **rouge** · tête/trompe **jaune** · oreille droite **verte** · fond **blanc**.

---

## 2. AFFICHE marketing (optionnel, pas le logo)

**Affiche complète** « Vendez gratuitement sur Zokko » + skyline = **`logo-officiel.png`** / `zokko-affiche-facebook.png`

→ Pour **posts groupes** et **stories**, pas pour remplacer l’icône carrée.

| Fichier HTML | Usage |
|--------------|--------|
| `affiche-officielle.html` | Affiche poster complète |
| `affiche-trafic-officielle.html` | Même style · texte *Parcourez* |
| `reel-zokko.html` | Reel 15 s |
| `facebook-cover.html` | Bannière page |

---

## Règle simple

| Besoin | Fichier |
|--------|---------|
| Favicon, app, header, petit rond FB | **`logo-icon-officiel.png`** |
| Grande pub « Vendez gratuitement » | `logo-officiel.png` (affiche) |
| Trafic « Parcourez les annonces » | `affiche-trafic-officielle.html` |

Ne pas recadrer l’affiche poster pour faire le logo.
