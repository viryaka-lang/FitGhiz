# FitGhiz

Coach de musculation en français, installable sur iPhone et iPad (PWA) :
**perte de poids, force et renforcement du bas du dos**, pour une salle bien équipée.

## Fonctionnalités

- **Programme scientifique** : full body 3 jours ou haut/bas 4 jours, cycles de 6 semaines
  (RIR 3 → 1 puis semaine de décharge), double progression automatique des charges.
- **Priorité au bas du dos** : Big 3 de McGill (curl-up, bird dog, planche latérale) à chaque séance,
  charnière de hanche, extensions lombaires, portages et anti-rotation. Douleur notée avant chaque
  séance, avec des variantes plus douces proposées dès 4/10.
- **31 exercices illustrés** : silhouettes animées (muscles sollicités en couleur), consignes,
  erreurs fréquentes, conseils pour le dos et alternatives.
- **Séance guidée** : charges suggérées, échauffement calculé, minuteur de repos avec signal sonore,
  chrono de gainage, remplacement d’exercice, écran maintenu allumé.
- **Suivi** : poids avec moyenne sur 7 jours et rythme hebdomadaire, tour de taille, 1RM estimé,
  tonnage, records, douleur lombaire, historique, calendrier de régularité.
- **Nutrition** : dépense (Mifflin-St Jeor), cible calorique selon le rythme choisi (0,5–1 %/sem.),
  protéines, glucides, lipides.
- Système métrique, mode sombre, hors ligne, données stockées sur l’appareil (export/import JSON).

La page « Méthode » de l’application détaille les principes et les références scientifiques.

## Installation sur iPhone / iPad

1. Ouvrir l’URL de l’application dans **Safari**.
2. Toucher **Partager** puis **« Sur l’écran d’accueil »**.

## Déploiement

Application 100 % statique (HTML/CSS/JS, sans étape de build).

- **GitHub Pages** : dans *Settings → Pages*, choisir la source **GitHub Actions**.
  Le workflow `.github/workflows/pages.yml` publie le site à chaque push sur `main`.
- Tout autre hébergement statique en HTTPS convient (Netlify, Vercel, Cloudflare Pages…).

Après une modification, incrémenter `VERSION` dans `sw.js` pour que les appareils installés
proposent la mise à jour.

## Développement local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Structure

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js          routeur et délégation d’événements
js/views.js        écrans (Aujourd’hui, Programme, Exercices, Progrès, Profil, Méthode)
js/workout.js      séance en cours, minuteurs
js/detail.js       fiche exercice
js/figure.js       moteur d’illustration (silhouette articulée animée)
js/charts.js       graphiques SVG
js/logic.js        progression, nutrition, tendances
js/store.js        stockage local
js/data/           exercices et programme
```

> FitGhiz ne remplace pas un avis médical. En cas de douleur lombaire aiguë, irradiant dans la
> jambe, ou de pathologie connue, consulter un professionnel de santé.
