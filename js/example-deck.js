/*
 * Deck d'exemple intégré (identique à examples/theme-1.json).
 * Permet au bouton « Exemple » de fonctionner même en ouvrant le fichier
 * directement (file://), sans requête réseau.
 */
window.JCC_EXAMPLE_DECK = {
  format: 'jcc-flashcard',
  version: 1,
  deck: {
    title: 'Thème 1 — Dates clés (Révolution & Républiques)',
    description: "Exemple inspiré du deck « Thème 1 » : l'événement au recto, la date au verso.",
    defaults: {
      borderColor: '#c62828',
      borderWidth: 3,
      backgroundColor: '#ffffff',
      textColor: '#111111',
      fontFamily: 'manuscrite',
    },
  },
  cards: [
    { id: 't1', front: { markdown: "Déclaration des droits de l'homme et du citoyen" }, back: { markdown: '**26 août 1789**' }, tags: ['thème 1'], style: {} },
    { id: 't2', front: { markdown: "Instauration de la monarchie constitutionnelle, partage du pouvoir entre le roi et l'Assemblée" }, back: { markdown: '**3 septembre 1791**' }, tags: ['thème 1'], style: {} },
    { id: 't3', front: { markdown: 'Proclamation de la Première République' }, back: { markdown: '**21 septembre 1792**' }, tags: ['thème 1'], style: {} },
    { id: 't4', front: { markdown: 'Exécution de Louis XVI' }, back: { markdown: '**21 janvier 1793**' }, tags: ['thème 1'], style: {} },
    { id: 't5', front: { markdown: "Coup d'État du 18 Brumaire" }, back: { markdown: '**9 novembre 1799**' }, tags: ['thème 1'], style: {} },
    { id: 't6', front: { markdown: 'Proclamation du Premier Empire' }, back: { markdown: '**18 mai 1804**' }, tags: ['thème 1'], style: {} },
    { id: 't7', front: { markdown: "Défaite de Waterloo et fin de l'Empire" }, back: { markdown: '**18 juin 1815**' }, tags: ['thème 1'], style: {} },
    { id: 't8', front: { markdown: 'Proclamation de la Deuxième République' }, back: { markdown: '**24 février 1848**' }, tags: ['thème 1'], style: {} },
    { id: 't9', front: { markdown: 'Fondation de la Cinquième République' }, back: { markdown: '**4 octobre 1958**' }, tags: ['thème 1'], style: {} },
  ],
  assets: {},
};
