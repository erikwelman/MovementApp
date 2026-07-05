// Gameplan data model — factories for gameplans, nodes, and connections

const GameplanData = {

  _uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  },

  createGameplan(name) {
    const now = new Date().toISOString();
    return {
      id: this._uid(),
      name: name || 'New Gameplan',
      createdAt: now,
      updatedAt: now,
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [],
      connections: []
    };
  },

  createLibraryEntry(type, label) {
    const defaults = {
      position: 'New Position',
      transition: 'New Transition',
      submission: 'New Submission',
      reaction: 'New Reaction'
    };
    return {
      id: this._uid(),
      type: type,           // 'position' | 'transition' | 'submission' | 'reaction'
      label: label || defaults[type] || 'Node',
      notes: [],            // [{ text, createdAt }]
      links: [],            // [{ url, label }]
      tags: [],             // ['gi', 'no-gi', 'top', 'bottom', 'sweep', ...]
      aliases: [],          // alternative names for search ('SLX', 'Ashi Garami', ...)
      variantOf: null,      // library entry id this is a variation of (e.g. Knee Shield -> Half Guard)
      category: null,       // grouping label for the library list ('Guards', 'Sweeps', ...)
      fromPositionId: null, // for transitions/submissions: position this starts from
      toPositionId: null    // for transitions: position this ends in
    };
  },

  createNode(libraryId, x, y) {
    return {
      id: this._uid(),
      libraryId: libraryId,
      x: x || 0,
      y: y || 0
    };
  },

  // Legacy support: create a node with embedded data (for migration)
  createLegacyNode(type, x, y, label) {
    const defaults = {
      position: 'New Position',
      transition: 'New Transition',
      submission: 'New Submission'
    };
    return {
      id: this._uid(),
      type: type,
      label: label || defaults[type] || 'Node',
      x: x || 0,
      y: y || 0,
      notes: [],
      links: []
    };
  },

  createConnection(fromNodeId, toNodeId, label) {
    return {
      id: this._uid(),
      fromNodeId: fromNodeId,
      toNodeId: toNodeId,
      label: label || ''
    };
  },

  // ── Starter library ─────────────────────────────────────────
  // Fixed ids ('seed-*') so variantOf references stay valid and
  // re-adding the starter set never creates duplicates.

  seedLibrary() {
    // Data lives in gameplan-seed-data.js; deep-copy so cached library
    // entries never share objects with the seed template.
    if (typeof GAMEPLAN_SEED === 'undefined') return [];
    return JSON.parse(JSON.stringify(GAMEPLAN_SEED));
  }
};
