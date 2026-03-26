// Gameplan persistence — IndexedDB with localStorage fallback

const GameplanStore = {
  _db: null,
  _useLocalStorage: false,
  _LS_KEY: 'gameplans',
  _LS_LIB_KEY: 'gameplanLibrary',
  count: 0,
  _libraryCache: null, // in-memory cache for fast lookups

  init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        this._useLocalStorage = true;
        this._loadLibraryCache().then(() => {
          this._updateCount();
          resolve();
        });
        return;
      }

      const request = indexedDB.open('movementApp', 2);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('gameplans')) {
          db.createObjectStore('gameplans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('library')) {
          db.createObjectStore('library', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this._db = e.target.result;
        this._migrateAndLoadLibrary().then(() => {
          this._updateCount();
          resolve();
        });
      };

      request.onerror = () => {
        this._useLocalStorage = true;
        this._loadLibraryCache().then(() => {
          this._updateCount();
          resolve();
        });
      };
    });
  },

  // ── Gameplan CRUD ─────────────────────────────────────────

  getAll() {
    if (this._useLocalStorage) {
      const plans = this._lsRead(this._LS_KEY);
      plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return Promise.resolve(plans);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('gameplans', 'readonly');
      const store = tx.objectStore('gameplans');
      const request = store.getAll();
      request.onsuccess = () => {
        const plans = request.result;
        plans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        resolve(plans);
      };
      request.onerror = () => reject(request.error);
    });
  },

  get(id) {
    if (this._useLocalStorage) {
      const plans = this._lsRead(this._LS_KEY);
      return Promise.resolve(plans.find(p => p.id === id) || null);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('gameplans', 'readonly');
      const store = tx.objectStore('gameplans');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  save(gameplan) {
    gameplan.updatedAt = new Date().toISOString();

    if (this._useLocalStorage) {
      const plans = this._lsRead(this._LS_KEY);
      const idx = plans.findIndex(p => p.id === gameplan.id);
      if (idx >= 0) {
        plans[idx] = gameplan;
      } else {
        plans.push(gameplan);
      }
      this._lsWrite(this._LS_KEY, plans);
      this._updateCount();
      return Promise.resolve(gameplan);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('gameplans', 'readwrite');
      const store = tx.objectStore('gameplans');
      const request = store.put(gameplan);
      request.onsuccess = () => {
        this._updateCount();
        resolve(gameplan);
      };
      request.onerror = () => reject(request.error);
    });
  },

  delete(id) {
    if (this._useLocalStorage) {
      const plans = this._lsRead(this._LS_KEY).filter(p => p.id !== id);
      this._lsWrite(this._LS_KEY, plans);
      this._updateCount();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('gameplans', 'readwrite');
      const store = tx.objectStore('gameplans');
      const request = store.delete(id);
      request.onsuccess = () => {
        this._updateCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  // ── Library CRUD ──────────────────────────────────────────

  getLibrary() {
    return Promise.resolve(Object.values(this._libraryCache || {}));
  },

  getLibraryEntry(id) {
    return this._libraryCache ? this._libraryCache[id] || null : null;
  },

  saveLibraryEntry(entry) {
    this._libraryCache[entry.id] = entry;

    if (this._useLocalStorage) {
      this._lsWrite(this._LS_LIB_KEY, Object.values(this._libraryCache));
      return Promise.resolve(entry);
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('library', 'readwrite');
      const store = tx.objectStore('library');
      const request = store.put(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  },

  deleteLibraryEntry(id) {
    delete this._libraryCache[id];

    if (this._useLocalStorage) {
      this._lsWrite(this._LS_LIB_KEY, Object.values(this._libraryCache));
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tx = this._db.transaction('library', 'readwrite');
      const store = tx.objectStore('library');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // ── Resolve node data from library ────────────────────────

  resolveNode(node) {
    // If node has libraryId, merge library data in
    if (node.libraryId && this._libraryCache) {
      const entry = this._libraryCache[node.libraryId];
      if (entry) {
        return {
          id: node.id,
          libraryId: node.libraryId,
          x: node.x,
          y: node.y,
          type: entry.type,
          label: entry.label,
          notes: entry.notes,
          links: entry.links
        };
      }
    }
    // Legacy node with embedded data — return as-is
    return node;
  },

  // ── Migration & init helpers ──────────────────────────────

  _loadLibraryCache() {
    if (this._useLocalStorage) {
      const entries = this._lsRead(this._LS_LIB_KEY);
      this._libraryCache = {};
      entries.forEach(e => { this._libraryCache[e.id] = e; });
      // Migrate any legacy nodes
      return this._migrateLegacyNodes();
    }
    return Promise.resolve();
  },

  _migrateAndLoadLibrary() {
    // Load library entries into cache
    return new Promise((resolve) => {
      const tx = this._db.transaction('library', 'readonly');
      const store = tx.objectStore('library');
      const request = store.getAll();
      request.onsuccess = () => {
        this._libraryCache = {};
        (request.result || []).forEach(e => { this._libraryCache[e.id] = e; });
        // Migrate legacy nodes
        this._migrateLegacyNodes().then(resolve);
      };
      request.onerror = () => {
        this._libraryCache = {};
        resolve();
      };
    });
  },

  _migrateLegacyNodes() {
    // Find gameplans with old-style embedded nodes (have 'type' but no 'libraryId')
    return this.getAll().then(plans => {
      const saves = [];
      plans.forEach(gp => {
        let changed = false;
        gp.nodes.forEach((node, i) => {
          if (node.type && !node.libraryId) {
            // Create library entry from embedded data
            const entry = GameplanData.createLibraryEntry(node.type, node.label);
            entry.notes = node.notes || [];
            entry.links = node.links || [];
            this._libraryCache[entry.id] = entry;
            saves.push(this.saveLibraryEntry(entry));

            // Convert node to reference
            gp.nodes[i] = {
              id: node.id,
              libraryId: entry.id,
              x: node.x,
              y: node.y
            };
            changed = true;
          }
        });
        if (changed) {
          saves.push(this.save(gp));
        }
      });
      return Promise.all(saves);
    });
  },

  // ── Internal helpers ──────────────────────────────────────

  _updateCount() {
    if (this._useLocalStorage) {
      this.count = this._lsRead(this._LS_KEY).length;
      return;
    }
    if (!this._db) { this.count = 0; return; }

    const tx = this._db.transaction('gameplans', 'readonly');
    const store = tx.objectStore('gameplans');
    const request = store.count();
    request.onsuccess = () => { this.count = request.result; };
  },

  _lsRead(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  },

  _lsWrite(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
};
