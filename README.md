# Pétition — Un boulevard Dahdah propre

Site statique (GitHub Pages) + Google Sheet comme base de données (via Google Apps Script).

```
index.html, style.css, app.js   → page de la pétition
config.js                       → URL du backend + objectif de signatures
apps-script/Code.gs             → backend (à coller dans la Google Sheet)
tract/index.html                → tract A4 avec QR code (à imprimer)
tract/signatures.html           → feuille de signatures papier (20 lignes)
scripts/qr.py                   → régénère tract/qr.svg
img/boulevard.jpg               → photo du hero (facultative)
```

## 1. Brancher la Google Sheet

1. Créer une Google Sheet (ex. « Pétition Dahdah »).
2. **Extensions → Apps Script**, coller le contenu de `apps-script/Code.gs`, enregistrer.
3. **Déployer → Nouveau déploiement** → type *Application Web*
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
4. Autoriser l'accès, copier l'URL qui finit par `/exec`.
5. La coller dans `config.js` → `scriptUrl`.

L'onglet `Signatures` est créé automatiquement à la première signature.
Les signatures papier peuvent être saisies à la main dans la feuille (colonne Source = `papier`) : elles sont comptées dans le compteur du site.

⚠️ Après toute modification de `Code.gs` : *Déployer → Gérer les déploiements → Modifier → Nouvelle version* (sinon l'ancienne version reste en ligne).

## 2. Photo

Déposer une photo `img/boulevard.jpg` (paysage, ~1600px de large). Sans photo, un dégradé est affiché.
Éviter les captures Street View (droits Google) : une vraie photo de la rue est plus forte et libre de droits. Floutez visages et plaques.

## 3. Tract & QR code

```bash
pip install segno
python3 scripts/qr.py https://dahdah.saunier.me/
```

Ouvrir `tract/index.html` dans Chrome → Imprimer → A4, marges *Aucune*, *Graphiques d'arrière-plan* coché.
Penser à mettre à jour l'URL affichée sous le QR code dans `tract/index.html` si le domaine change.

## 4. Publier

Settings → Pages → Deploy from branch → `main` / root.

## Développement local

```bash
python3 -m http.server 8000   # http://localhost:8000
```
