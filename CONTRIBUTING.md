# Contribuer à JCC-FlashCard

Merci de votre intérêt ! Ce projet veut rester **simple et accessible**, y compris pour des développeurs débutants.

## Principes

- **Pas d'étape de build.** Pas de `npm install`, pas de bundler. Du HTML / CSS / JavaScript lisible.
- **100 % navigateur.** Aucune donnée utilisateur ne doit être envoyée à un serveur.
- **Format cible des cartes : 63 × 88 mm** (carte à collectionner standard).
- Commentaires et interface **en français** (le projet pourra être traduit plus tard).

## Lancer le projet en local

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`. (Un serveur est nécessaire : certains chargements sont bloqués en `file://`.)

## Organisation du code

```
index.html            Page et structure de l'interface
css/styles.css        Styles (dont le rendu de carte et l'impression)
js/app.js             Toute la logique de l'application
js/example-deck.js    Deck d'exemple intégré
vendor/               Librairies tierces (marked, DOMPurify)
examples/             Decks d'exemple (.json)
docs/                 Documentation
CAHIER-DES-CHARGES.md Spécifications et feuille de route
```

## Proposer une modification

1. *Forkez* le dépôt et créez une branche.
2. Faites vos modifications, testez dans le navigateur (édition, aperçu, **impression recto-verso**).
3. Ouvrez une *Pull Request* en décrivant le changement.

## Idées de contributions

La [feuille de route du cahier des charges](CAHIER-DES-CHARGES.md#13-feuille-de-route-jalons) liste les prochaines étapes : export PDF téléchargeable, insertion d'images, repères de découpe, gabarits, fonctionnalités IA… Les retours et signalements de bugs via les *issues* sont également très utiles.
