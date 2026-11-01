# Cahier des charges — PokeFlashCard

> **Statut :** v1 — document de travail, à valider et faire évoluer.
> **Dernière mise à jour :** 2026-11-01

Générateur de flashcards à imprimer **au format carte à jouer standard**, pour réviser et mémoriser. Application web open-source, gratuite, pensée pour les parents, les enseignants et toute personne qui veut fabriquer ses propres cartes de révision.

---

## 1. Contexte et objectif

Beaucoup de gens révisent avec des cartes mémoire (flashcards). Les fabriquer à la main est long, et les outils existants sont souvent payants, en ligne uniquement, ou peu adaptés à l'impression physique.

**Idée clé :** produire des cartes **exactement à la taille d'une carte à jouer / carte Pokémon (63 × 88 mm)**. Ce choix n'est pas esthétique, il est *pratique* : il donne accès à tout l'écosystème de rangement et de protection déjà standardisé — pochettes (*sleeves*), classeurs à feuilles perforées, *toploaders*, boîtes de deck, etc. On fabrique des cartes de révision qui se rangent et se protègent comme des cartes de jeu.

**Objectif :** un éditeur web simple pour créer des decks de flashcards (recto / verso), les sauvegarder dans un fichier, et les **exporter en PDF recto-verso prêt à imprimer** à la bonne taille.

> ⚠️ **Note marque / propriété intellectuelle.** Le projet n'utilise **que les dimensions** de la carte, aucune marque, logo ou illustration Pokémon. Aucun contenu Pokémon ne sera embarqué. Le nom public du projet et la communication devront indiquer clairement qu'il n'est **pas affilié à Pokémon / Nintendo**. → voir *Questions ouvertes* pour le choix d'un nom public sûr.

---

## 2. Public cible et cas d'usage

**Utilisateurs :**
- Parents qui fabriquent des cartes pour leurs enfants.
- Enseignants qui préparent du matériel de révision.
- Élèves / étudiants / autodidactes.
- Personnes non techniques : l'outil doit être utilisable **sans rien installer** et sans compte.

**Cas d'usage prioritaires (contenu surtout textuel) :**
- Toute notion à mémoriser : grammaire, conjugaison, orthographe, règles…
- Vocabulaire / langues (mot ↔ traduction / définition).
- Maths / calcul (tables, opérations, formules simples).
- Dates / culture générale (question ↔ réponse factuelle).

**Cas d'usage secondaire :** cartes avec image (image au recto, réponse au dos). L'insertion d'images reste une fonctionnalité de base, mais le contenu typique est du texte.

---

## 3. Principes directeurs

1. **Simple d'abord.** Un parent doit pouvoir créer un deck en quelques minutes.
2. **100 % navigateur.** Aucune donnée n'est envoyée à un serveur. La vie privée est garantie par construction (important pour du contenu scolaire / d'enfants).
3. **Sans installation, sans compte.** On ouvre une page web, on travaille, on télécharge son fichier.
4. **Open-source et contributif.** Code lisible, documenté, facile à forker et à faire évoluer.
5. **Impression de qualité.** Le format physique et l'alignement recto-verso sont traités avec soin.
6. **Portable.** Le travail de l'utilisateur tient dans **un seul fichier JSON** autonome.

---

## 4. Choix techniques (validés)

| Sujet | Choix | Raison |
|---|---|---|
| Architecture | **Application statique, 100 % côté navigateur** | Simplicité, confidentialité, gratuité, facile à forker |
| Hébergement | **GitHub Pages** | Gratuit, intégré à GitHub, déploiement automatique |
| Socle technique | **HTML / CSS / JavaScript, sans étape de build** | Accessible aux contributeurs débutants, proche d'un hébergement statique simple |
| Stockage du travail | **Fichier JSON** (téléchargé par l'utilisateur) + sauvegarde auto locale (`localStorage`) | Portable, éditable à la main, générable par IA |
| Dépendances | Quelques petites librairies ciblées, chargées via CDN ou intégrées au dépôt (*vendored*) | Pas de `npm install` obligatoire pour faire tourner le projet |

**Librairies pressenties (à confirmer à l'implémentation) :**
- Rendu Markdown : [`marked`](https://marked.js.org/).
- Nettoyage de sécurité du HTML généré : [`DOMPurify`](https://github.com/cure53/DOMPurify) (obligatoire, voir §10 Sécurité).
- Export PDF : voir §8 (deux approches possibles).

**Navigateurs cibles :** versions récentes de Chrome, Firefox, Edge, Safari (desktop en priorité ; tablette appréciée).

---

## 5. Spécifications du format de carte

- **Dimensions carte :** 63 × 88 mm (standard TCG / carte à jouer). *(Référence : 2,5 × 3,5 pouces.)*
- **Coins arrondis :** rayon ≈ 3 mm (affichage à l'écran ; à l'impression, l'arrondi se fait au massicot ou à l'emporte-pièce).
- **Zone de sécurité :** garder le texte important à ≥ 4 mm des bords.
- **Fond perdu (*bleed*) :** optionnel. 3 mm par côté pour une impression pro (→ 69 × 94 mm). Pour l'impression maison, non requis.
- **Résolution cible impression :** 300 DPI. À 300 DPI, 63 × 88 mm ≈ 744 × 1039 px.
- **Bordure :** couleur et épaisseur réglables (c'est le « cadre » coloré de la carte).

**Mise en page d'impression :**
- Format papier par défaut : **A4** (210 × 297 mm). Support de **Letter** (US) prévu.
- Grille par défaut : **3 × 3 = 9 cartes par page** (189 × 264 mm, tient sur A4 avec des marges confortables).
- Espace inter-cartes (gouttière) réglable (0–5 mm) selon la méthode de découpe.
- **Repères de découpe** (traits de coupe) autour des cartes.

---

## 6. Impression recto-verso (point sensible)

C'est le vrai défi : le **dos doit tomber pile derrière le recto**.

**Approche retenue :**
- Génération de **pages de recto** puis de **pages de dos** correspondantes.
- La grille des dos est **inversée horizontalement** (effet miroir) pour que chaque dos se place derrière son recto après retournement de la feuille.
- Choix du **bord de retournement** (grand côté / petit côté), car il change le sens du miroir. L'option par défaut suivra le réglage le plus courant des imprimantes.
- **Page de calibration / test** fournie : imprimer une feuille test pour vérifier l'alignement avant de lancer un gros tirage.

> ✅ **Validé par ton exemple :** le deck « Thème 1 » applique déjà ce miroir horizontal (retournement sur le grand côté — les colonnes s'inversent à chaque rangée). Le générateur l'automatisera. Voir §15.

**Deux modes d'impression supportés :**
1. **Recto-verso automatique** (imprimante duplex) : pages recto et dos alternées, dos en miroir.
2. **Recto-verso manuel** : on imprime d'abord les rectos, on remet le papier, on imprime les dos.

---

## 7. L'éditeur (fonctionnalités)

### MVP (version 0.1)
- **Gestion du deck :** créer un deck, titre, description.
- **Gestion des cartes :** ajouter, dupliquer, supprimer, réordonner.
- **Édition recto / verso en Markdown** avec une petite barre d'outils (gras, italique, listes, titres, lien, image).
- **Aperçu en direct** au format carte : recto et verso affichés côte à côte, à l'échelle.
- **Réglages de style :**
  - au niveau du deck (valeurs par défaut) : couleur et épaisseur de bordure, couleur de fond, couleur du texte ;
  - surchargeables **carte par carte**.
- **Insertion d'images :** depuis le disque de l'utilisateur, intégrées au fichier (base64), avec redimensionnement simple.
- **Charger / Enregistrer** un fichier JSON (import / export).
- **Sauvegarde automatique locale** (`localStorage`) pour ne pas perdre le travail en cas de fermeture d'onglet.
- **Export PDF** recto-verso, A4, grille 3 × 3, repères de découpe.

### Versions ultérieures (hors MVP)
- Thèmes / gabarits de cartes prédéfinis (couleurs, polices).
- Choix de police par deck / carte.
- Formats supplémentaires (Letter, fond perdu pro, autres grilles).
- Alignement / mise en forme avancés (recto image + dos texte en un clic).
- Import de listes (CSV / coller un tableau « terme ; définition ») pour générer un deck d'un coup.
- Mode « étude » à l'écran (révision sans impression) — *à discuter*.

---

## 8. Export PDF

L'utilisateur veut « extraire les cartes au format PDF pour une impression recto-verso ». Deux approches techniques, sans étape de build :

**Option A — Impression navigateur + « Enregistrer en PDF » (recommandée pour le MVP).**
- Une mise en page d'impression dédiée (CSS `@page`, grille 3 × 3) + `window.print()`.
- L'utilisateur choisit « Enregistrer au format PDF » dans la boîte d'impression.
- ✅ Zéro dépendance, alignement très fiable, qualité native. ❌ Passe par la boîte d'impression du navigateur (une étape de plus pour l'utilisateur).

**Option B — Génération directe d'un fichier PDF téléchargeable.**
- Rendu de chaque carte puis assemblage dans un PDF (ex. `jsPDF`, éventuellement avec `html2canvas`).
- ✅ Téléchargement direct d'un `.pdf`. ❌ Plus de dépendances, fidélité visuelle à surveiller (rendu rasterisé).

**Proposition :** livrer l'**option A** au MVP (fiabilité), puis ajouter l'**option B** si le besoin d'un téléchargement direct se confirme. *À trancher ensemble.*

---

## 9. Format de données (fichier JSON)

Objectifs : **autonome** (images incluses), **lisible / éditable à la main**, **générable par une IA**, **versionné** (champ `version` pour la compatibilité future).

Schéma indicatif (v1, à affiner) :

```json
{
  "format": "jcc-flashcard",
  "version": 2,
  "deck": {
    "title": "Tables de multiplication",
    "description": "Révisions CE2",
    "labels": { "front": "QUESTION", "back": "RÉPONSE" },
    "defaults": {
      "borderColor": "#2e7d32",
      "borderWidth": 3,
      "backgroundColor": "#ffffff",
      "textColor": "#111111",
      "fontFamily": "manuscrite"
    }
  },
  "cards": [
    {
      "id": "c1",
      "index": "A1",
      "category": "Table de 7",
      "front": { "markdown": "7 × 8 = ?" },
      "back": { "markdown": "**56**" },
      "tags": ["tables", "x7"],
      "style": { "borderColor": "#c62828" }
    }
  ],
  "assets": {
    "img1": "data:image/png;base64,...."
  }
}
```

**Décisions de conception :**
- **Images intégrées en base64** dans `assets`, référencées depuis le Markdown. → fichier unique et portable (contrepartie : taille du fichier ; on documentera des conseils de poids d'image).
- `style` par carte surcharge `deck.defaults`.
- **Format v2** : `deck.labels` (libellés recto/verso, défaut QUESTION/RÉPONSE) ; `card.index` (texte court, recto) et `card.category` (texte libre, recto). Les fichiers v1 (sans ces champs) restent lisibles : les champs manquants prennent leurs valeurs par défaut.
- À l'import : **validation** du fichier (format, version) avec messages d'erreur clairs.

---

## 10. Contraintes transverses

**Sécurité**
- Le Markdown peut produire du HTML : le HTML rendu sera **systématiquement nettoyé** (DOMPurify) avant affichage, pour éviter l'injection de scripts via un fichier JSON malveillant.
- Validation stricte des fichiers JSON importés.

**Vie privée**
- Aucune donnée ne quitte le navigateur (sauf, plus tard, un appel IA **explicitement déclenché** par l'utilisateur, §12).

**Accessibilité & langue**
- Interface en **français** pour la v1, structurée pour permettre une traduction (i18n) ultérieure.
- Contrastes et tailles de police lisibles ; navigation clavier de base.

**Performance**
- Doit rester fluide pour des decks de quelques centaines de cartes.

---

## 11. Organisation du projet (GitHub)

- **Licence :** MIT (permissive, encourage les forks et contributions).
- **Structure prévisionnelle du dépôt :**
  ```
  /                 → index.html (l'appli)
  /css, /js         → code source
  /vendor           → librairies tierces (si non chargées par CDN)
  /examples         → decks d'exemple (.json)
  /docs             → documentation, dont ce cahier des charges
  README.md         → présentation + lien vers l'appli en ligne
  LICENSE
  CONTRIBUTING.md   → comment contribuer
  ```
- **Déploiement :** GitHub Pages (branche `main` ou `gh-pages`), mise en ligne automatique à chaque *push*.
- **Contribution :** README clair, `CONTRIBUTING.md`, quelques *issues* « bonne première contribution » pour accueillir d'autres développeurs.

---

## 12. Fonctionnalités IA (futures, hors MVP)

Objectif : faciliter la **génération de cartes**. Exemples envisagés :
- Générer un deck à partir d'un texte / d'une leçon collée.
- Proposer le verso à partir du recto (ou l'inverse).
- Reformuler, simplifier, traduire en masse.

**Contraintes (cohérentes avec l'architecture 100 % navigateur) :**
- IA **externe** (API d'un fournisseur). Deux pistes :
  - **Clé API fournie par l'utilisateur**, stockée localement (pas de serveur à maintenir) ;
  - ou **petite fonction serverless** optionnelle si l'on veut éviter que l'utilisateur gère une clé.
- Fonctionnalité **toujours optionnelle et explicite** : par défaut, rien n'est envoyé à l'extérieur.
- À spécifier dans un cahier des charges dédié le moment venu.

---

## 13. Feuille de route (jalons)

- **v0.1 — MVP :** éditeur (cartes recto/verso Markdown, bordures, aperçu), sauvegarde/chargement JSON, export impression recto-verso A4, mise en ligne GitHub Pages.
- **v0.2 :** images, sauvegarde auto locale, repères de découpe, page de calibration, decks d'exemple.
- **v0.3 :** thèmes/gabarits, polices, formats supplémentaires, import de listes.
- **v0.4 :** fonctionnalités IA (génération assistée).
- **Continu :** documentation, accueil des contributeurs, corrections.

---

## 14. Questions ouvertes (à trancher ensemble)

1. **Nom public du projet.** « PokeFlashCard » est pratique en interne, mais pour une diffusion publique sûre côté marque, un nom neutre est préférable (ex. *CartoMémo*, *FlashDeck*, *RéviCartes*…). Mon choix se porte sur JCC-FlashCard, pour le lien avec les "Jeux de Cartes à Collectionner".
2. **Export PDF :** Choix pour l'option B
3. **Licence :** MIT confirmée !
4. **Barre d'outils Markdown** complète dès le MVP.
5. **Mode étude à l'écran** (réviser sans imprimer) : dans la feuille de route.
6. **L'exemple de carte** → **reçu et analysé** (deck « Thème 1 », voir §15). Constat principal : les cartes sont un peu trop étroites (**57,8 mm** au lieu de **63 mm** de large), à corriger dans le générateur. Il n'a servi que d'inspiration, surtout pour le contenu. On garde le format cible de 63 × 88 mm.

---

## 15. Référence visuelle — exemple « Thème 1 »

Tu as fourni un deck d'exemple : dates clés de la Révolution / histoire de France, avec l'événement au **recto** (QUESTION) et la date au **verso** (RÉPONSE), en grille 3 × 3 sur A4.

**Mesures relevées (exemple vs cible)**

| | Exemple « Thème 1 » | Cible standard |
|---|---|---|
| Largeur carte | **57,8 mm** | **63 mm** |
| Hauteur carte | **86,7 mm** | **88 mm** |
| Ratio h/l | 1,46 | 1,40 |

→ L'exemple est **un peu trop étroit** (≈ 5 mm de moins en largeur ; hauteur presque bonne), donc légèrement trop élancé. Concrètement, ces cartes « flotteraient » dans une pochette standard et ne s'aligneraient pas parfaitement avec les classeurs 9 cases. **Le générateur produira du vrai 63 × 88 mm.** C'était ton doute de départ : il était justifié.

**Recto-verso :** la page de dos est bien **inversée horizontalement** par rapport au recto (méthode du §6). L'exemple valide donc l'approche ; le générateur l'automatisera.

**Anatomie de carte à réutiliser (futurs gabarits, §7).** L'exemple montre une structure simple et efficace, qui inspirera les gabarits au-delà du simple recto/verso du MVP :
- un **bandeau d'en-tête** coloré avec un **libellé** (« QUESTION » / « RÉPONSE ») et un **numéro** (« 1/9 ») ;
- un **badge / étiquette** optionnel (« Thème 1 ») ;
- un **corps** avec le texte, dans une **police lisible** (ici manuscrite) ;
- une **signature / mention** discrète en pied (« PH-2022 »).

**Statut : anatomie implémentée (v0.2).** L'éditeur produit désormais, par carte : bandeau **QUESTION/RÉPONSE**, **index** (haut droite) et **catégorie** (recto), en plus du corps Markdown ; le verso reste épuré. Une seconde planche pédagogique fournie (« Mrs Favell Lee Mortimer ») détaille l'usage prévu des zones :
- **couleur** = discipline / difficulté / priorité / période… (à harmoniser entre enseignants) ;
- **index** = difficulté, importance, n° de paquet ;
- **catégorie** = discipline, chapitre, thème.

---

*Document évolutif — il vivra dans le dépôt (`/docs`) et sera mis à jour au fil du projet.*
