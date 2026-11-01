/*
 * JCC-FlashCard — éditeur de flashcards au format carte à collectionner (63 × 88 mm).
 * Application 100 % navigateur, sans étape de build.
 *
 * Dépendances (chargées avant ce script dans index.html) :
 *   - marked      : rendu Markdown              -> window.marked
 *   - DOMPurify   : nettoyage du HTML généré    -> window.DOMPurify
 *
 * Tout tient dans une IIFE pour ne rien exposer globalement.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constantes
  // ---------------------------------------------------------------------------
  const FORMAT_ID = 'jcc-flashcard';
  const FORMAT_VERSION = 2;
  const STORAGE_KEY = 'jcc-flashcard:autosave:v1';

  // Dimensions cibles d'une carte à collectionner standard.
  const CARD_MM = { w: 63, h: 88 };

  // Polices proposées (clé -> pile CSS). « manuscrite » rappelle l'exemple fourni.
  const FONT_STACKS = {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    manuscrite: "'Comic Sans MS', 'Marker Felt', 'Segoe Print', 'Bradley Hand', cursive",
    mono: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
  };

  // ---------------------------------------------------------------------------
  // Modèle de données
  // ---------------------------------------------------------------------------
  function uid() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function newDeck() {
    return {
      title: 'Mon deck',
      description: '',
      labels: { front: 'QUESTION', back: 'RÉPONSE' },
      print: { backOffsetX: 0, backOffsetY: 0 }, // calibration recto-verso, en mm
      defaults: {
        borderColor: '#c62828',
        borderWidth: 3, // en mm
        backgroundColor: '#ffffff',
        textColor: '#111111',
        fontFamily: 'manuscrite',
        bodyFontSize: 5, // en mm (texte du corps)
        categoryFontSize: 3, // en mm (pastille catégorie)
      },
    };
  }

  function newCard() {
    return { id: uid(), index: '', category: '', front: { markdown: '' }, back: { markdown: '' }, style: {}, tags: [] };
  }

  // État applicatif (source de vérité unique).
  const state = {
    deck: newDeck(),
    cards: [newCard()],
    assets: {},
    selectedId: null,
  };
  state.selectedId = state.cards[0].id;

  // Style effectif d'une carte = défauts du deck + éventuelles surcharges.
  function effectiveStyle(card) {
    return Object.assign({}, state.deck.defaults, card.style || {});
  }

  function selectedCard() {
    return state.cards.find((c) => c.id === state.selectedId) || null;
  }

  // ---------------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const child of [].concat(children)) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function slugify(s) {
    return (s || 'deck')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'deck';
  }

  // ---------------------------------------------------------------------------
  // Rendu Markdown (sécurisé)
  // ---------------------------------------------------------------------------
  function renderMarkdown(md) {
    // Markdown fusionne les lignes vides multiples. Pour permettre d'espacer
    // verticalement en appuyant plusieurs fois sur Entrée, on convertit chaque
    // ligne vide « en trop » (au-delà du simple saut de paragraphe) en un
    // paragraphe « espace insécable ».
    const prepared = (md || '').replace(/\n{3,}/g, (m) => '\n\n' + '&nbsp;\n\n'.repeat(m.length - 2));
    const raw = window.marked.parse(prepared, { breaks: true, gfm: true });
    return window.DOMPurify.sanitize(raw);
  }

  // ---------------------------------------------------------------------------
  // Construction d'une carte (DOM) — utilisée pour l'aperçu et l'impression
  // ---------------------------------------------------------------------------
  function applyCardStyle(node, card) {
    const st = effectiveStyle(card);
    node.style.setProperty('--border-color', st.borderColor);
    node.style.setProperty('--border-width', st.borderWidth + 'mm');
    node.style.setProperty('--bg', st.backgroundColor);
    node.style.setProperty('--text', st.textColor);
    node.style.setProperty('--font', FONT_STACKS[st.fontFamily] || FONT_STACKS.sans);
    node.style.setProperty('--body-size', (st.bodyFontSize ?? 5) + 'mm');
    node.style.setProperty('--cat-size', (st.categoryFontSize ?? 3) + 'mm');
  }

  function deckLabel(side) {
    const l = state.deck.labels || {};
    return side === 'front' ? (l.front || 'QUESTION') : (l.back || 'RÉPONSE');
  }

  // Construit une carte complète : en-tête (libellé + index) + catégorie + corps.
  // L'index et la catégorie n'apparaissent qu'au recto (comme dans l'exemple pédagogique).
  function buildFullCard(card, side) {
    const card_ = el('div', { class: 'card' });
    applyCardStyle(card_, card);

    const header = el('div', { class: 'card-header' });
    header.appendChild(el('div', { class: 'card-label', text: deckLabel(side) }));
    if (side === 'front' && card.index) header.appendChild(el('div', { class: 'card-index', text: card.index }));
    card_.appendChild(header);

    const inner = el('div', { class: 'card-inner' });
    if (side === 'front' && card.category) inner.appendChild(el('div', { class: 'card-category', text: card.category }));
    const body = el('div', { class: 'card-body' });
    body.innerHTML = renderMarkdown(card[side] && card[side].markdown);
    inner.appendChild(body);
    card_.appendChild(inner);
    return card_;
  }

  // Colonnes d'aperçu (recto / verso), reconstruites à la volée à chaque changement.
  const previewCols = { front: null, back: null };
  function renderPreviews() {
    const card = selectedCard();
    if (!card) return;
    ['front', 'back'].forEach((side) => {
      const col = previewCols[side];
      if (!col) return;
      const fresh = buildFullCard(card, side);
      const old = col.querySelector('.card');
      if (old) col.replaceChild(fresh, old);
      else col.appendChild(fresh);
    });
  }

  // ---------------------------------------------------------------------------
  // Barre d'outils Markdown
  // ---------------------------------------------------------------------------
  const MD_TOOLS = [
    { key: 'bold', label: 'G', title: 'Gras', wrap: ['**', '**', 'gras'] },
    { key: 'italic', label: 'I', title: 'Italique', wrap: ['_', '_', 'italique'] },
    { key: 'h', label: 'T', title: 'Titre', prefix: '# ' },
    { key: 'ul', label: '•', title: 'Liste à puces', prefix: '- ' },
    { key: 'ol', label: '1.', title: 'Liste numérotée', prefix: '1. ' },
    { key: 'link', label: '🔗', title: 'Lien', wrap: ['[', '](https://)', 'texte'] },
    { key: 'img', label: '🖼', title: 'Image (URL)', wrap: ['![', '](https://)', 'alt'] },
  ];

  function buildToolbar(getTextarea) {
    const bar = el('div', { class: 'md-toolbar' });
    for (const tool of MD_TOOLS) {
      bar.appendChild(
        el('button', {
          type: 'button',
          class: 'md-btn',
          title: tool.title,
          text: tool.label,
          onclick: () => applyTool(getTextarea(), tool),
        })
      );
    }
    return bar;
  }

  function applyTool(ta, tool) {
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = ta.value;
    if (tool.wrap) {
      const [before, after, placeholder] = tool.wrap;
      const sel = value.slice(start, end) || placeholder;
      ta.value = value.slice(0, start) + before + sel + after + value.slice(end);
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    } else if (tool.prefix) {
      // Ajoute le préfixe en début de chaque ligne sélectionnée.
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const block = value.slice(lineStart, end);
      const prefixed = block
        .split('\n')
        .map((l) => tool.prefix + l)
        .join('\n');
      ta.value = value.slice(0, lineStart) + prefixed + value.slice(end);
      ta.selectionStart = lineStart;
      ta.selectionEnd = lineStart + prefixed.length;
    }
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ---------------------------------------------------------------------------
  // Rendu : liste des cartes
  // ---------------------------------------------------------------------------
  function cardLabel(card, index) {
    const txt = (card.front.markdown || '').replace(/[#*_>`\-]/g, '').trim();
    const firstLine = txt.split('\n').find((l) => l.trim()) || '';
    const base = firstLine ? firstLine.slice(0, 38) : 'Carte ' + (index + 1);
    return (card.index ? card.index + ' · ' : '') + base;
  }

  function renderCardList() {
    const list = $('#card-list');
    list.innerHTML = '';
    state.cards.forEach((card, i) => {
      const li = el('li', {
        class: 'card-item' + (card.id === state.selectedId ? ' selected' : ''),
        onclick: () => selectCard(card.id),
      });
      li.appendChild(el('span', { class: 'ci-index', text: (i + 1) + '.' }));
      li.appendChild(el('span', { class: 'ci-label', text: cardLabel(card, i) }));
      const tools = el('span', { class: 'ci-tools' });
      tools.appendChild(el('button', { class: 'icon', title: 'Monter', text: '↑', onclick: (e) => { e.stopPropagation(); moveCard(card.id, -1); } }));
      tools.appendChild(el('button', { class: 'icon', title: 'Descendre', text: '↓', onclick: (e) => { e.stopPropagation(); moveCard(card.id, 1); } }));
      tools.appendChild(el('button', { class: 'icon', title: 'Dupliquer', text: '⧉', onclick: (e) => { e.stopPropagation(); duplicateCard(card.id); } }));
      tools.appendChild(el('button', { class: 'icon danger', title: 'Supprimer', text: '✕', onclick: (e) => { e.stopPropagation(); deleteCard(card.id); } }));
      li.appendChild(tools);
      list.appendChild(li);
    });
    $('#card-count').textContent = state.cards.length + (state.cards.length > 1 ? ' cartes' : ' carte');
  }

  // ---------------------------------------------------------------------------
  // Rendu : éditeur de la carte sélectionnée
  // ---------------------------------------------------------------------------
  function renderEditor() {
    const root = $('#editor');
    root.innerHTML = '';
    const card = selectedCard();
    if (!card) {
      root.appendChild(el('p', { class: 'empty', text: 'Aucune carte sélectionnée.' }));
      return;
    }

    // --- Repères de hiérarchie (index + catégorie, affichés au recto) ---
    const idxInput = el('input', { type: 'text', maxlength: '8', placeholder: 'ex. 3, A, B2…' });
    idxInput.value = card.index || '';
    idxInput.addEventListener('input', () => {
      card.index = idxInput.value;
      renderPreviews();
      updateListLabel(card);
      scheduleAutosave();
    });

    const catInput = el('input', { type: 'text', placeholder: 'ex. Histoire — 1ère Guerre Mondiale' });
    catInput.value = card.category || '';
    catInput.addEventListener('input', () => {
      card.category = catInput.value;
      renderPreviews();
      scheduleAutosave();
    });

    root.appendChild(
      el('div', { class: 'card-meta' }, [
        el('label', { class: 'field' }, [el('span', { text: 'Index (recto, en haut à droite)' }), idxInput]),
        el('label', { class: 'field' }, [el('span', { text: 'Catégorie / discipline / chapitre (recto)' }), catInput]),
      ])
    );

    // --- Zones d'édition recto / verso + aperçus ---
    const faces = el('div', { class: 'faces' });
    const previews = el('div', { class: 'previews' });
    previewCols.front = null;
    previewCols.back = null;

    [['front', 'Recto'], ['back', 'Verso']].forEach(([side, titre]) => {
      const ta = el('textarea', {
        class: 'md-input',
        rows: 7,
        placeholder: side === 'front' ? 'Question / recto…' : 'Réponse / verso…',
      });
      ta.value = card[side].markdown || '';
      ta.addEventListener('input', () => {
        card[side].markdown = ta.value;
        renderPreviews();
        if (side === 'front') updateListLabel(card);
        scheduleAutosave();
      });

      faces.appendChild(
        el('div', { class: 'face-edit' }, [
          el('div', { class: 'face-head' }, [el('h3', { text: titre }), buildToolbar(() => ta)]),
          ta,
        ])
      );

      const col = el('div', { class: 'preview-col' }, [
        el('span', { class: 'preview-label', text: 'Aperçu ' + titre.toLowerCase() }),
      ]);
      previewCols[side] = col;
      previews.appendChild(col);
    });

    root.appendChild(el('div', { class: 'faces-wrap' }, [faces, previews]));
    renderPreviews();

    // --- Style de la carte ---
    root.appendChild(renderCardStyle(card));
  }

  function updateListLabel(card) {
    const i = state.cards.indexOf(card);
    const li = $('#card-list').children[i];
    if (li) li.querySelector('.ci-label').textContent = cardLabel(card, i);
  }

  function renderCardStyle(card) {
    const custom = !!(card.style && Object.keys(card.style).length);
    const box = el('details', { class: 'card-style', open: custom });
    box.appendChild(el('summary', { text: 'Style de cette carte' }));

    const toggle = el('label', { class: 'row' }, [
      (() => {
        const cb = el('input', { type: 'checkbox' });
        cb.checked = custom;
        cb.addEventListener('change', () => {
          if (cb.checked) card.style = Object.assign({}, state.deck.defaults);
          else card.style = {};
          refreshPreviews();
          renderEditor();
          scheduleAutosave();
        });
        return cb;
      })(),
      el('span', { text: ' Personnaliser (sinon : style du deck)' }),
    ]);
    box.appendChild(toggle);

    if (custom) {
      box.appendChild(styleControls(card.style, () => { refreshPreviews(); scheduleAutosave(); }));
    }
    return box;
  }

  // Groupe de contrôles de style réutilisé (deck ou carte).
  function styleControls(styleObj, onChange) {
    const wrap = el('div', { class: 'style-grid' });
    const colorRow = (labelTxt, prop) => {
      const input = el('input', { type: 'color', value: styleObj[prop] || '#000000' });
      input.addEventListener('input', () => { styleObj[prop] = input.value; onChange(); });
      return el('label', { class: 'row' }, [el('span', { text: labelTxt }), input]);
    };
    // Curseur générique en millimètres
    const mmRange = (labelTxt, prop, def, min, max) => {
      const range = el('input', { type: 'range', min: String(min), max: String(max), step: '0.5', value: String(styleObj[prop] ?? def) });
      const out = el('span', { class: 'range-val', text: (styleObj[prop] ?? def) + ' mm' });
      range.addEventListener('input', () => {
        styleObj[prop] = parseFloat(range.value);
        out.textContent = styleObj[prop] + ' mm';
        onChange();
      });
      return el('label', { class: 'row' }, [el('span', { text: labelTxt }), range, out]);
    };

    wrap.appendChild(colorRow('Bordure', 'borderColor'));
    wrap.appendChild(colorRow('Fond', 'backgroundColor'));
    wrap.appendChild(colorRow('Texte', 'textColor'));
    wrap.appendChild(mmRange('Épaisseur bordure', 'borderWidth', 3, 0, 6));
    wrap.appendChild(mmRange('Taille du texte', 'bodyFontSize', 5, 3, 10));
    wrap.appendChild(mmRange('Taille catégorie', 'categoryFontSize', 3, 2, 8));

    // Police
    const sel = el('select');
    const names = { sans: 'Sans serif', serif: 'Serif', manuscrite: 'Manuscrite', mono: 'Monospace' };
    Object.keys(FONT_STACKS).forEach((k) => {
      const opt = el('option', { value: k, text: names[k] });
      if ((styleObj.fontFamily || 'manuscrite') === k) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => { styleObj.fontFamily = sel.value; onChange(); });
    wrap.appendChild(el('label', { class: 'row' }, [el('span', { text: 'Police' }), sel]));

    return wrap;
  }

  // Rafraîchit les aperçus (alias de renderPreviews, conservé pour les appels existants).
  function refreshPreviews() {
    renderPreviews();
  }

  // ---------------------------------------------------------------------------
  // Panneau Deck (titre, description, style par défaut)
  // ---------------------------------------------------------------------------
  function renderDeckPanel() {
    $('#deck-title').value = state.deck.title;
    $('#deck-desc').value = state.deck.description;
    $('#deck-label-front').value = (state.deck.labels && state.deck.labels.front) || 'QUESTION';
    $('#deck-label-back').value = (state.deck.labels && state.deck.labels.back) || 'RÉPONSE';
    $('#print-offset-x').value = (state.deck.print && state.deck.print.backOffsetX) || 0;
    $('#print-offset-y').value = (state.deck.print && state.deck.print.backOffsetY) || 0;
    const holder = $('#deck-style');
    holder.innerHTML = '';
    holder.appendChild(
      styleControls(state.deck.defaults, () => { refreshPreviews(); scheduleAutosave(); })
    );
  }

  // ---------------------------------------------------------------------------
  // Actions sur les cartes
  // ---------------------------------------------------------------------------
  function selectCard(id) {
    state.selectedId = id;
    renderCardList();
    renderEditor();
  }

  function addCard() {
    const c = newCard();
    state.cards.push(c);
    state.selectedId = c.id;
    renderCardList();
    renderEditor();
    scheduleAutosave();
  }

  function duplicateCard(id) {
    const i = state.cards.findIndex((c) => c.id === id);
    if (i < 0) return;
    const copy = JSON.parse(JSON.stringify(state.cards[i]));
    copy.id = uid();
    state.cards.splice(i + 1, 0, copy);
    state.selectedId = copy.id;
    renderCardList();
    renderEditor();
    scheduleAutosave();
  }

  function deleteCard(id) {
    const i = state.cards.findIndex((c) => c.id === id);
    if (i < 0) return;
    if (!confirm('Supprimer cette carte ?')) return;
    state.cards.splice(i, 1);
    if (!state.cards.length) state.cards.push(newCard());
    if (state.selectedId === id) state.selectedId = state.cards[Math.min(i, state.cards.length - 1)].id;
    renderCardList();
    renderEditor();
    scheduleAutosave();
  }

  function moveCard(id, dir) {
    const i = state.cards.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= state.cards.length) return;
    const [c] = state.cards.splice(i, 1);
    state.cards.splice(j, 0, c);
    renderCardList();
    scheduleAutosave();
  }

  // ---------------------------------------------------------------------------
  // Import / export JSON
  // ---------------------------------------------------------------------------
  function toDocument() {
    return {
      format: FORMAT_ID,
      version: FORMAT_VERSION,
      deck: state.deck,
      cards: state.cards,
      assets: state.assets,
    };
  }

  function loadDocument(doc) {
    if (!doc || (doc.format !== FORMAT_ID && doc.format !== 'pokeflashcard')) {
      throw new Error('Fichier non reconnu (champ "format" manquant ou invalide).');
    }
    if ((doc.version || 1) > FORMAT_VERSION) {
      throw new Error('Ce fichier a été créé avec une version plus récente de JCC-FlashCard.');
    }
    if (!Array.isArray(doc.cards)) throw new Error('Le fichier ne contient pas de liste de cartes.');
    state.deck = Object.assign(newDeck(), doc.deck || {});
    state.deck.defaults = Object.assign(newDeck().defaults, (doc.deck && doc.deck.defaults) || {});
    state.deck.labels = Object.assign(newDeck().labels, (doc.deck && doc.deck.labels) || {});
    state.deck.print = Object.assign(newDeck().print, (doc.deck && doc.deck.print) || {});
    state.cards = doc.cards.map((c) => ({
      id: c.id || uid(),
      index: c.index || '',
      category: c.category || '',
      front: { markdown: (c.front && c.front.markdown) || '' },
      back: { markdown: (c.back && c.back.markdown) || '' },
      style: c.style || {},
      tags: c.tags || [],
    }));
    if (!state.cards.length) state.cards.push(newCard());
    state.assets = doc.assets || {};
    state.selectedId = state.cards[0].id;
    renderAll();
  }

  function saveJSON() {
    const blob = new Blob([JSON.stringify(toDocument(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: slugify(state.deck.title) + '.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        loadDocument(JSON.parse(reader.result));
      } catch (e) {
        alert('Impossible d’ouvrir le fichier : ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------------
  // Sauvegarde automatique locale (localStorage)
  // ---------------------------------------------------------------------------
  const scheduleAutosave = debounce(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toDocument()));
    } catch (e) {
      /* quota / navigation privée : on ignore silencieusement */
    }
  }, 400);

  function restoreAutosave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      loadDocument(JSON.parse(raw));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Impression / PDF (grille 3 × 3, dos en miroir pour le recto-verso)
  // ---------------------------------------------------------------------------
  function mirrorRows(group) {
    // Inverse l'ordre des colonnes dans chaque rangée (retournement sur le grand côté).
    const out = [];
    for (let r = 0; r < group.length; r += 3) {
      const row = group.slice(r, r + 3);
      while (row.length < 3) row.push(null); // on complète pour aligner les colonnes
      out.push(...row.reverse());
    }
    return out;
  }

  function printPage(cards, side) {
    const grid = el('div', { class: 'print-grid' });
    cards.forEach((card) => {
      if (!card) grid.appendChild(el('div', { class: 'print-empty' }));
      else grid.appendChild(buildFullCard(card, side));
    });
    // Calibration : on décale le verso pour compenser un désalignement d'impression.
    if (side === 'back') {
      const p = state.deck.print || {};
      const dx = p.backOffsetX || 0;
      const dy = p.backOffsetY || 0;
      if (dx || dy) grid.style.transform = 'translate(' + dx + 'mm, ' + dy + 'mm)';
    }
    return el('div', { class: 'print-page' }, [grid]);
  }

  function buildPrint() {
    const root = $('#print-root');
    root.innerHTML = '';
    for (let i = 0; i < state.cards.length; i += 9) {
      const group = state.cards.slice(i, i + 9);
      root.appendChild(printPage(group, 'front'));
      root.appendChild(printPage(mirrorRows(group), 'back'));
    }
  }

  // ---------------------------------------------------------------------------
  // Mire de calibration recto-verso (lecture par transparence)
  // ---------------------------------------------------------------------------
  const CENTER = { x: 105, y: 148.5 }; // centre d'une page A4, en mm

  function calibRulerSVG() {
    // Règle horizontale (graduations vers le haut, chiffres dessous) et règle
    // verticale (graduations vers la droite, chiffres à gauche), de -10 à +10 mm.
    let s =
      '<line x1="' + (CENTER.x - 11) + '" y1="' + CENTER.y + '" x2="' + (CENTER.x + 11) + '" y2="' + CENTER.y + '" stroke="#1565c0" stroke-width="0.15"/>' +
      '<line x1="' + CENTER.x + '" y1="' + (CENTER.y - 11) + '" x2="' + CENTER.x + '" y2="' + (CENTER.y + 11) + '" stroke="#1565c0" stroke-width="0.15"/>';
    for (let h = -20; h <= 20; h++) {
      const mm = h / 2;
      const major = h % 4 === 0; // chiffré tous les 2 mm
      const whole = h % 2 === 0; // millimètres entiers
      const len = h === 0 ? 9 : major ? 5 : whole ? 3 : 1.5;
      const w = h === 0 ? 0.5 : major ? 0.35 : 0.2;
      const x = CENTER.x + mm;
      const y = CENTER.y + mm;
      s += '<line x1="' + x + '" y1="' + (CENTER.y - len) + '" x2="' + x + '" y2="' + CENTER.y + '" stroke="#1565c0" stroke-width="' + w + '"/>';
      s += '<line x1="' + CENTER.x + '" y1="' + y + '" x2="' + (CENTER.x + len) + '" y2="' + y + '" stroke="#1565c0" stroke-width="' + w + '"/>';
      if (major && h !== 0) {
        const lab = Math.abs(mm); // le signe se lit par la position (gauche/droite, haut/bas du 0)
        s += '<text x="' + x + '" y="' + (CENTER.y + 5) + '" font-size="2.4" text-anchor="middle" fill="#1565c0">' + lab + '</text>';
        s += '<text x="' + (CENTER.x - 3) + '" y="' + (y + 0.9) + '" font-size="2.4" text-anchor="end" fill="#1565c0">' + lab + '</text>';
      }
    }
    return s;
  }

  function buildCalibration() {
    const p = state.deck.print || {};
    const dx = p.backOffsetX || 0;
    const dy = p.backOffsetY || 0;
    const open = '<svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">';

    const recto =
      open +
      '<text x="105" y="16" font-size="6" text-anchor="middle" fill="#111">MIRE DE CALIBRATION — RECTO</text>' +
      '<line x1="105" y1="93.5" x2="105" y2="203.5" stroke="#c62828" stroke-width="0.3"/>' +
      '<line x1="20" y1="148.5" x2="190" y2="148.5" stroke="#c62828" stroke-width="0.3"/>' +
      '<circle cx="105" cy="148.5" r="2.4" fill="none" stroke="#c62828" stroke-width="0.4"/>' +
      '<text x="105" y="270" font-size="3.5" text-anchor="middle" fill="#111">1. Imprimez en recto-verso (retournement sur le grand côté).</text>' +
      '<text x="105" y="276" font-size="3.5" text-anchor="middle" fill="#111">2. Regardez la feuille par transparence, devant une source de lumière.</text>' +
      '<text x="105" y="282" font-size="3.5" text-anchor="middle" fill="#111">3. La croix rouge (recto) doit tomber sur le 0 des règles bleues (verso).</text>' +
      '</svg>';

    const verso =
      open +
      '<text x="105" y="16" font-size="6" text-anchor="middle" fill="#111">MIRE DE CALIBRATION — VERSO</text>' +
      '<g transform="translate(' + dx + ' ' + dy + ')">' +
      calibRulerSVG() +
      '</g>' +
      '<text x="105" y="264" font-size="3.5" text-anchor="middle" fill="#111">Réglez « Décalage horizontal / vertical du verso » pour amener la croix sur le 0, puis réimprimez.</text>' +
      '<text x="105" y="270" font-size="3.5" text-anchor="middle" fill="#111">1 graduation = 1 mm · graduation chiffrée = 2 mm.</text>' +
      '<text x="105" y="276" font-size="3.5" text-anchor="middle" fill="#111">Décalage actuel du verso : ' + dx + ' mm (H) · ' + dy + ' mm (V).</text>' +
      '<text x="105" y="282" font-size="3.5" text-anchor="middle" fill="#111">Si l’écart augmente après réglage, inversez le signe.</text>' +
      '</svg>';

    const root = $('#print-root');
    root.innerHTML = '';
    const pr = el('div', { class: 'print-page' });
    pr.innerHTML = recto;
    const pv = el('div', { class: 'print-page' });
    pv.innerHTML = verso;
    root.appendChild(pr);
    root.appendChild(pv);
  }

  // ---------------------------------------------------------------------------
  // Rendu global + initialisation
  // ---------------------------------------------------------------------------
  function renderAll() {
    renderDeckPanel();
    renderCardList();
    renderEditor();
  }

  function wireEvents() {
    $('#btn-add-card').addEventListener('click', addCard);
    $('#btn-save').addEventListener('click', saveJSON);
    $('#btn-open').addEventListener('click', () => $('#file-input').click());
    $('#file-input').addEventListener('change', (e) => {
      if (e.target.files[0]) openJSON(e.target.files[0]);
      e.target.value = '';
    });
    $('#btn-new').addEventListener('click', () => {
      if (!confirm('Repartir d’un deck vide ? Le travail non enregistré sera perdu.')) return;
      state.deck = newDeck();
      state.cards = [newCard()];
      state.selectedId = state.cards[0].id;
      state.assets = {};
      renderAll();
      scheduleAutosave();
    });
    $('#btn-example').addEventListener('click', () => {
      if (!confirm('Charger le deck d’exemple ? Le travail en cours sera remplacé.')) return;
      loadDocument(window.JCC_EXAMPLE_DECK);
      scheduleAutosave();
    });
    $('#btn-print').addEventListener('click', () => {
      buildPrint();
      window.print();
    });
    $('#btn-calib').addEventListener('click', () => {
      buildCalibration();
      window.print();
    });

    $('#deck-title').addEventListener('input', (e) => { state.deck.title = e.target.value; scheduleAutosave(); });
    $('#deck-desc').addEventListener('input', (e) => { state.deck.description = e.target.value; scheduleAutosave(); });
    $('#deck-label-front').addEventListener('input', (e) => { state.deck.labels.front = e.target.value; renderPreviews(); scheduleAutosave(); });
    $('#deck-label-back').addEventListener('input', (e) => { state.deck.labels.back = e.target.value; renderPreviews(); scheduleAutosave(); });
    $('#print-offset-x').addEventListener('input', (e) => { state.deck.print.backOffsetX = parseFloat(e.target.value) || 0; scheduleAutosave(); });
    $('#print-offset-y').addEventListener('input', (e) => { state.deck.print.backOffsetY = parseFloat(e.target.value) || 0; scheduleAutosave(); });
  }

  function init() {
    wireEvents();
    const restored = restoreAutosave();
    if (!restored) renderAll();
    // Affiche les dimensions cibles quelque part d'utile (titre de l'aperçu).
    document.documentElement.style.setProperty('--card-w', CARD_MM.w + 'mm');
    document.documentElement.style.setProperty('--card-h', CARD_MM.h + 'mm');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
