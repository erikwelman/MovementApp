// Gameplan UI — list, editor, and node detail screens

const GameplanUI = {

  // ── Gameplan List Screen ────────────────────────────────────

  renderList(gameplans) {
    const cards = gameplans.map(gp => {
      const nodeCount = gp.nodes.length;
      const updated = new Date(gp.updatedAt);
      const dateStr = updated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `
        <div class="gp-plan-card" data-nav="gp-editor" data-gp-id="${gp.id}">
          <div class="gp-plan-card-info">
            <h3 class="gp-plan-card-name">${UI.esc(gp.name)}</h3>
            <p class="gp-plan-card-meta">${nodeCount} node${nodeCount !== 1 ? 's' : ''} &middot; ${dateStr}</p>
          </div>
          <button class="gp-plan-card-delete" data-action="gp-delete" data-gp-id="${gp.id}" aria-label="Delete ${UI.esc(gp.name)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>`;
    }).join('');

    const empty = gameplans.length === 0
      ? '<p class="gp-empty">No gameplans yet. Create one to start mapping your BJJ game.</p>'
      : '';

    return `
      <div class="screen gp-list-screen" role="main" aria-label="BJJ Gameplans">
        <header class="screen-header">
          <button class="btn-back" data-nav="home" aria-label="Back">&#x2190;</button>
          <h1>BJJ Gameplans</h1>
        </header>
        <button class="gp-create-btn" data-action="gp-create">
          <span class="gp-create-btn-icon">+</span>
          New Gameplan
        </button>
        ${empty}
        <div class="gp-plan-list">
          ${cards}
        </div>
      </div>`;
  },

  // ── Gameplan Editor Screen ──────────────────────────────────

  renderEditor(gameplan) {
    return `
      <div class="screen gp-editor-screen" role="main" aria-label="Gameplan Editor">
        <header class="gp-editor-header">
          <button class="btn-back" data-nav="gp-list" aria-label="Back">&#x2190;</button>
          <span class="gp-editor-title" data-action="gp-rename" title="Tap to rename">${UI.esc(gameplan.name)}</span>
        </header>
        <div class="gp-svg-container" id="gp-svg-container"></div>
        <div class="gp-toolbar">
          <button class="gp-toolbar-btn gp-toolbar-btn-labeled" data-action="gp-add-node" data-type="position" aria-label="Add Position">
            <svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            <span class="gp-toolbar-label">Position</span>
          </button>
          <button class="gp-toolbar-btn gp-toolbar-btn-labeled" data-action="gp-add-node" data-type="transition" aria-label="Add Transition">
            <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            <span class="gp-toolbar-label">Transition</span>
          </button>
          <button class="gp-toolbar-btn gp-toolbar-btn-labeled" data-action="gp-add-node" data-type="submission" aria-label="Add Submission">
            <svg width="20" height="20" viewBox="0 0 24 24"><polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            <span class="gp-toolbar-label">Submission</span>
          </button>
          <div class="gp-toolbar-divider"></div>
          <button class="gp-toolbar-btn gp-toolbar-btn-labeled" id="gp-btn-connect" data-action="gp-connect" aria-label="Connect nodes">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            <span class="gp-toolbar-label">Connect</span>
          </button>
          <button class="gp-toolbar-btn gp-toolbar-btn-labeled" data-action="gp-open-library" aria-label="Move Library">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            <span class="gp-toolbar-label">Library</span>
          </button>
          <button class="gp-toolbar-btn gp-toolbar-btn-detail" id="gp-btn-detail" data-action="gp-open-detail" aria-label="Node details" title="Details" style="display:none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </button>
          <button class="gp-toolbar-btn gp-toolbar-btn-danger" id="gp-btn-delete" data-action="gp-delete-node" aria-label="Delete node" title="Delete" style="display:none">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>`;
  },

  // ── Node Detail Overlay ─────────────────────────────────────

  showNodeDetail(node) {
    // Remove existing overlay if present
    const existing = document.querySelector('.gp-node-detail-overlay');
    if (existing) existing.remove();

    const typeLabels = {
      position: 'Position',
      transition: 'Transition / Sweep',
      submission: 'Submission'
    };
    const typeIcons = {
      position: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>',
      transition: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>',
      submission: '<polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" stroke-width="2"/>'
    };

    const notesHtml = node.notes.map((n, i) => {
      const date = new Date(n.createdAt);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="gp-note-item">
          <textarea class="gp-note-text-edit" data-action="gp-edit-note-inline" data-note-index="${i}" rows="2">${UI.esc(n.text)}</textarea>
          <div class="gp-note-actions">
            <span class="gp-note-date">${dateStr}</span>
            <button class="gp-note-delete" data-action="gp-delete-note" data-note-index="${i}" aria-label="Delete note">&times;</button>
          </div>
        </div>`;
    }).join('');

    const linksHtml = node.links.map((l, i) => {
      return `
        <div class="gp-link-item">
          <a href="${UI.esc(l.url)}" class="gp-link-url" data-action="gp-open-link" data-url="${UI.esc(l.url)}">${UI.esc(l.label || l.url)}</a>
          <button class="gp-link-delete" data-action="gp-delete-link" data-link-index="${i}" aria-label="Delete link">&times;</button>
        </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'gp-node-detail-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Node details');
    overlay.innerHTML = `
      <div class="gp-node-detail-content">
        <div class="gp-detail-header">
          <button class="gp-detail-close" data-action="gp-close-detail" aria-label="Close">&times;</button>
          <div class="gp-detail-type">
            <svg width="24" height="24" viewBox="0 0 24 24">${typeIcons[node.type]}</svg>
            <span>${typeLabels[node.type]}</span>
          </div>
        </div>

        <div class="gp-detail-section">
          <label class="gp-detail-label">Name</label>
          <input class="gp-detail-input" id="gp-detail-label-input" type="text" value="${UI.esc(node.label)}" data-action="gp-edit-label" placeholder="Node name">
        </div>

        <div class="gp-detail-section">
          <label class="gp-detail-label">Notes <span class="gp-detail-count">${node.notes.length}</span></label>
          <div class="gp-notes-list" id="gp-notes-list">
            ${notesHtml || '<p class="gp-empty-sub">No notes yet</p>'}
          </div>
          <div class="gp-note-add-row">
            <input class="gp-detail-input" id="gp-note-input" type="text" placeholder="Add a note...">
            <button class="gp-detail-add-btn" data-action="gp-add-note">+</button>
          </div>
        </div>

        <div class="gp-detail-section">
          <label class="gp-detail-label">Links <span class="gp-detail-count">${node.links.length}</span></label>
          <div class="gp-links-list" id="gp-links-list">
            ${linksHtml || '<p class="gp-empty-sub">No links yet</p>'}
          </div>
          <div class="gp-detail-add-row gp-link-add-row">
            <input class="gp-detail-input" id="gp-link-url-input" type="url" placeholder="https://...">
            <input class="gp-detail-input gp-link-label-input" id="gp-link-label-input" type="text" placeholder="Label (optional)">
            <button class="gp-detail-add-btn" data-action="gp-add-link">Add</button>
          </div>
        </div>
      </div>`;

    document.getElementById('app').appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));
  },

  closeNodeDetail() {
    const overlay = document.querySelector('.gp-node-detail-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }
  },

  // ── Move Library Overlay ──────────────────────────────────

  showLibrary(entries, gameplans, currentGameplanId) {
    const existing = document.querySelector('.gp-library-overlay');
    if (existing) existing.remove();

    const typeIcons = {
      position: '<rect x="4" y="4" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>',
      transition: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>',
      submission: '<polygon points="11,3 20,18 2,18" fill="none" stroke="currentColor" stroke-width="2"/>'
    };
    const typeLabels = {
      position: 'Position',
      transition: 'Transition',
      submission: 'Submission'
    };

    // Sort moves alphabetically
    const sorted = entries.slice().sort((a, b) => a.label.localeCompare(b.label));

    const movesHtml = sorted.length > 0 ? sorted.map(entry => {
      const noteCount = entry.notes ? entry.notes.length : 0;
      const linkCount = entry.links ? entry.links.length : 0;
      const meta = [];
      if (noteCount > 0) meta.push(noteCount + ' note' + (noteCount !== 1 ? 's' : ''));
      if (linkCount > 0) meta.push(linkCount + ' link' + (linkCount !== 1 ? 's' : ''));
      const metaStr = meta.length > 0 ? ' &middot; ' + meta.join(', ') : '';

      return `
        <button class="gp-library-item gp-library-move" data-action="gp-library-select" data-library-id="${entry.id}" data-label="${UI.esc(entry.label)}" data-type="${entry.type}">
          <svg class="gp-library-item-icon gp-library-icon-${entry.type}" width="22" height="22" viewBox="0 0 22 22">${typeIcons[entry.type]}</svg>
          <div class="gp-library-item-info">
            <span class="gp-library-item-name">${UI.esc(entry.label)}</span>
            <span class="gp-library-item-meta">${typeLabels[entry.type]}${metaStr}</span>
          </div>
        </button>`;
    }).join('') : '<p class="gp-empty-sub gp-library-move">No moves in library yet.</p>';

    // Gameplans (exclude current)
    const otherPlans = (gameplans || []).filter(gp => gp.id !== currentGameplanId);
    const gameplansHtml = otherPlans.length > 0 ? otherPlans.map(gp => {
      const nodeCount = gp.nodes.length;
      const connCount = gp.connections.length;
      const meta = [];
      meta.push(nodeCount + ' node' + (nodeCount !== 1 ? 's' : ''));
      meta.push(connCount + ' connection' + (connCount !== 1 ? 's' : ''));
      return `
        <button class="gp-library-item gp-library-gameplan" data-action="gp-library-import-gameplan" data-gp-id="${gp.id}" data-label="${UI.esc(gp.name)}" data-type="gameplan">
          <svg class="gp-library-item-icon gp-library-icon-gameplan" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="2"/><circle cx="14" cy="14" r="2"/><path d="M9.5 9.5L12.5 12.5"/>
          </svg>
          <div class="gp-library-item-info">
            <span class="gp-library-item-name">${UI.esc(gp.name)}</span>
            <span class="gp-library-item-meta">${meta.join(' &middot; ')}</span>
          </div>
        </button>`;
    }).join('') : '<p class="gp-empty-sub gp-library-gameplan">No other gameplans to import.</p>';

    const overlay = document.createElement('div');
    overlay.className = 'gp-library-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Move Library');
    overlay.innerHTML = `
      <div class="gp-library-content">
        <div class="gp-library-header">
          <h2>Library</h2>
          <button class="gp-detail-close" data-action="gp-close-library" aria-label="Close">&times;</button>
        </div>
        <input class="gp-detail-input gp-library-search" id="gp-library-search" type="text" placeholder="Search..." autocomplete="off">
        <div class="gp-library-filters">
          <button class="gp-library-filter active" data-action="gp-library-filter" data-filter="all">All</button>
          <button class="gp-library-filter" data-action="gp-library-filter" data-filter="position">
            <svg width="14" height="14" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            Position
          </button>
          <button class="gp-library-filter" data-action="gp-library-filter" data-filter="transition">
            <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            Transition
          </button>
          <button class="gp-library-filter" data-action="gp-library-filter" data-filter="submission">
            <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,3 22,20 2,20" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            Submission
          </button>
          <button class="gp-library-filter" data-action="gp-library-filter" data-filter="gameplan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="15" r="2"/><path d="M10.5 10.5L13.5 13.5"/></svg>
            Gameplans
          </button>
        </div>
        <div class="gp-library-list">
          ${movesHtml}
          ${gameplansHtml}
        </div>
      </div>`;

    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const searchInput = document.getElementById('gp-library-search');
    if (searchInput) searchInput.focus();
  },

  closeLibrary() {
    const overlay = document.querySelector('.gp-library-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }
  }
};
