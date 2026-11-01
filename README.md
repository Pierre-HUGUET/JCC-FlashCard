# 🃏 JCC-FlashCard

**Créez des flashcards à imprimer au format carte à collectionner (63 × 88 mm), recto-verso.**
Gratuit, open-source, 100 % dans le navigateur — aucune donnée n'est envoyée sur un serveur.

> **Pourquoi ce format ?** Une carte à collectionner standard mesure **63 × 88 mm**. En produisant vos flashcards à cette taille exacte, vous profitez de tout le matériel déjà existant : pochettes (*sleeves*), classeurs à feuilles perforées, *toploaders*, boîtes de rangement… Vos cartes de révision se rangent et se protègent comme des cartes de jeu.

> ⚠️ **Projet indépendant**, **non affilié à Pokémon / Nintendo / The Pokémon Company**. « JCC » signifie *Jeu de Cartes à Collectionner*. Seules les **dimensions** du format sont utilisées ; aucune marque ni illustration tierce n'est fournie.

---

## ✨ Fonctionnalités (v0.1)

- Éditeur **recto / verso** avec **Markdown** (gras, italique, titres, listes, liens, images) et **aperçu en direct**.
- Cartes au **vrai format 63 × 88 mm**.
- Réglages de **couleurs** (bordure, fond, texte), **épaisseur de bordure** et **police**, au niveau du deck ou par carte.
- **Impression recto-verso** : grille 3 × 3 sur A4, **dos automatiquement inversés en miroir** pour un alignement correct.
- Sauvegarde dans un **fichier JSON** autonome (portable, éditable à la main, générable par IA) + **sauvegarde automatique locale**.

Suite prévue (voir le [cahier des charges](CAHIER-DES-CHARGES.md)) : export **PDF téléchargeable**, insertion d'images depuis le disque, repères de découpe, gabarits, et assistance **IA**.

## 🚀 Utiliser l'application

- **En ligne :** https://VOTRE-UTILISATEUR.github.io/JCC-FlashCard/ *(à activer, voir ci-dessous)*
- **En local :** cette application a besoin d'être servie par un petit serveur (les navigateurs bloquent certains chargements en `file://`). Depuis le dossier du projet :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

## 🖨️ Imprimer en recto-verso

1. Cliquez sur **Imprimer / PDF**.
2. Dans la boîte d'impression, choisissez **Recto-verso** et, pour le retournement, **sur le grand côté** (*flip on long edge*).
3. Pour obtenir un fichier PDF, choisissez **« Enregistrer au format PDF »** comme destination.

L'application génère une page de **rectos** puis une page de **dos en miroir** : chaque réponse tombe ainsi derrière sa question. Faites d'abord un test sur une feuille avant un gros tirage.

## 💾 Format de fichier

Un deck est un simple fichier `.json` autonome. Exemple minimal :

```json
{
  "format": "jcc-flashcard",
  "version": 1,
  "deck": { "title": "Mon deck", "defaults": { "borderColor": "#c62828", "borderWidth": 3 } },
  "cards": [
    { "front": { "markdown": "7 × 8 = ?" }, "back": { "markdown": "**56**" } }
  ]
}
```

Un deck d'exemple complet est fourni : [`examples/theme-1.json`](examples/theme-1.json).

## 🌐 Déploiement (GitHub Pages)

Le dépôt inclut un *workflow* ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)) qui publie le site à chaque *push* sur `main`.
Pour l'activer : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md). Pas d'étape de *build*, pas de `npm install` : du HTML / CSS / JavaScript simple.

## 📄 Licence

[MIT](LICENSE). Librairies tierces embarquées : [marked](https://marked.js.org/) (MIT) et [DOMPurify](https://github.com/cure53/DOMPurify) (Apache-2.0 / MPL-2.0).
