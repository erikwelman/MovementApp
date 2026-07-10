// IBJJF Rules progress — persisted in localStorage (same pattern as Progress)

const RulesProgress = {
  STORAGE_KEY: 'ibjjfRules',

  // A lesson counts as complete once the best score reaches this fraction
  PASS_FRACTION: 0.8,

  _state: null,

  _defaultState() {
    return {
      version: 1,
      cardsRead: {},      // cardId -> ISO timestamp of first read
      lessons: {},        // lessonId -> { attempts, bestCorrect, total, perfect, lastCompletedAt }
      checkerLookups: 0
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this._state = raw ? JSON.parse(raw) : this._defaultState();
    } catch {
      this._state = this._defaultState();
    }
    return this._state;
  },

  _save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
  },

  markCardRead(cardId) {
    if (!this._state.cardsRead[cardId]) {
      this._state.cardsRead[cardId] = new Date().toISOString();
      this._save();
    }
  },

  isCardRead(cardId) {
    return !!this._state.cardsRead[cardId];
  },

  recordLessonResult(lessonId, correct, total) {
    const prev = this._state.lessons[lessonId] || { attempts: 0, bestCorrect: 0, total, perfect: false };
    const isBest = correct > prev.bestCorrect;
    this._state.lessons[lessonId] = {
      attempts: prev.attempts + 1,
      bestCorrect: Math.max(prev.bestCorrect, correct),
      total,
      perfect: prev.perfect || correct === total,
      lastCompletedAt: new Date().toISOString()
    };
    this._save();
    return { isBest, best: this._state.lessons[lessonId].bestCorrect };
  },

  getLesson(lessonId) {
    return this._state.lessons[lessonId] || null;
  },

  isLessonComplete(lessonId) {
    const l = this._state.lessons[lessonId];
    return !!l && l.total > 0 && (l.bestCorrect / l.total) >= this.PASS_FRACTION;
  },

  addCheckerLookup() {
    this._state.checkerLookups += 1;
    this._save();
  },

  // Fraction complete (0..1) and completion flag for a unit's home ring
  unitProgress(unitId) {
    const unit = RULES_UNITS.find(u => u.id === unitId);
    if (!unit) return { pct: 0, complete: false };

    const parts = [];
    if (unit.cards) {
      const cards = RULES_CARDS[unit.cards] || [];
      const read = cards.filter(c => this.isCardRead(c.id)).length;
      parts.push(cards.length ? read / cards.length : 0);
    }
    if (unit.lessons && unit.lessons.length) {
      const done = unit.lessons.filter(id => this.isLessonComplete(id)).length;
      parts.push(done / unit.lessons.length);
    }
    if (!parts.length) return { pct: 0, complete: false };

    const pct = parts.reduce((a, b) => a + b, 0) / parts.length;
    return { pct, complete: pct >= 0.999 };
  },

  resetAll() {
    this._state = this._defaultState();
    this._save();
  }
};
