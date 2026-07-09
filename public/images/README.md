# Images publiques

Placez ici les images servies par le site (accessibles via `/images/...`).

## Photo du fondateur (page /confiance)

Déposez votre photo de profil dans ce dossier sous le nom **exact** :

```
ayoub-el-mqarta.jpg
```

- Format conseillé : **portrait** (ex. 800 × 1000 px), recadrée serrée sur le visage/buste.
- Formats acceptés : `.jpg` (recommandé) ou `.png` — si vous utilisez `.png`,
  mettez à jour le champ `founder.photo` dans `content/fr/site.json`.
- Poids conseillé : < 300 Ko (compressez si besoin pour la performance).

Le chemin est configuré dans `content/fr/site.json` → `founder.photo = "/images/ayoub-el-mqarta.jpg"`.
Tant que le fichier n'est pas présent, la page reste fonctionnelle (le texte alternatif s'affiche).
