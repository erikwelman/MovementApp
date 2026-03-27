// App controller — navigation, events, timer management

const App = {
  currentTimer: null,
  currentDay: 1,
  currentPoseIndex: 0,
  bjjCountdownTimer: null,
  bjjDuration: 120,

  _currentGameplan: null,

  init() {
    Progress.load();
    this.currentDay = Progress.getCurrentDay();
    this.bindGlobalEvents();
    GameplanStore.init().then(() => {
      this.render('home');
    }).catch(() => {
      this.render('home');
    });
  },

  render(screen, params) {
    const app = document.getElementById('app');

    // Clean up timer if leaving timer screen
    if (this.currentTimer) {
      this.currentTimer.destroy();
      this.currentTimer = null;
    }
    if (this.bjjCountdownTimer) {
      clearInterval(this.bjjCountdownTimer);
      this.bjjCountdownTimer = null;
    }
    // Clean up gameplan canvas if leaving editor
    if (screen !== 'gp-editor' && GameplanCanvas._svg) {
      GameplanCanvas.destroy();
    }

    switch (screen) {
      case 'home':
        app.innerHTML = UI.renderMainHome();
        break;
      case 'hip-home':
        app.innerHTML = UI.renderHome();
        break;
      case 'day':
        this.currentDay = params.day;
        app.innerHTML = UI.renderDay(params.day);
        break;
      case 'timer':
        this.currentDay = params.day;
        this.currentPoseIndex = params.pose;
        app.innerHTML = UI.renderTimer(params.day, params.pose);
        this.initTimer(params.day, params.pose);
        break;
      case 'bjj-start':
        app.innerHTML = UI.renderBjjStart();
        this.initBjjScrollWheel();
        break;
      case 'bjj-countdown':
        app.innerHTML = UI.renderBjjCountdown();
        this.initBjjCountdown();
        break;
      case 'bjj-circuit':
        const idx = params ? params.exercise : 0;
        app.innerHTML = UI.renderBjjCircuit(idx);
        this.initBjjTimer(idx);
        break;
      case 'bjj-complete':
        app.innerHTML = UI.renderBjjComplete();
        break;

      // ── Gameplan screens ──────────────────────────────────
      case 'gp-list':
        GameplanStore.getAll().then(plans => {
          app.innerHTML = GameplanUI.renderList(plans);
        });
        break;
      case 'gp-editor':
        GameplanStore.get(params.id).then(gp => {
          if (!gp) { this.render('gp-list'); return; }
          this._currentGameplan = gp;
          app.innerHTML = GameplanUI.renderEditor(gp);
          GameplanCanvas.init('gp-svg-container', gp);
        });
        break;
    }
  },

  bindGlobalEvents() {
    // Event delegation on #app
    document.getElementById('app').addEventListener('click', (e) => {
      // Check data-action BEFORE data-nav so buttons inside nav elements work
      const earlyAction = e.target.closest('[data-action]');
      if (earlyAction && earlyAction.dataset.action === 'gp-delete') {
        e.stopPropagation();
        const gpId = earlyAction.dataset.gpId;
        if (confirm('Delete this gameplan?')) {
          GameplanStore.delete(gpId).then(() => {
            this.render('gp-list');
          });
        }
        return;
      }

      const target = e.target.closest('[data-nav]');
      if (target) {
        const nav = target.dataset.nav;
        if (nav === 'home') {
          this.render('home');
        } else if (nav === 'hip-home') {
          this.render('hip-home');
        } else if (nav === 'day') {
          this.render('day', { day: parseInt(target.dataset.day) });
        } else if (nav === 'timer') {
          this.render('timer', {
            day: parseInt(target.dataset.day),
            pose: parseInt(target.dataset.pose)
          });
        } else if (nav === 'bjj-start') {
          this.render('bjj-start');
        } else if (nav === 'bjj-countdown') {
          this.render('bjj-countdown');
        } else if (nav === 'bjj-circuit') {
          this.render('bjj-circuit', { exercise: parseInt(target.dataset.exercise || 0) });
        } else if (nav === 'bjj-complete') {
          this.render('bjj-complete');
        } else if (nav === 'gp-list') {
          this.render('gp-list');
        } else if (nav === 'gp-editor') {
          this.render('gp-editor', { id: target.dataset.gpId });
        }
        return;
      }

      // ── Gameplan actions ──────────────────────────────────
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        const action = actionEl.dataset.action;

        if (action === 'gp-create') {
          const gp = GameplanData.createGameplan();
          GameplanStore.save(gp).then(() => {
            this.render('gp-editor', { id: gp.id });
          });
          return;
        }

        if (action === 'gp-delete') {
          e.stopPropagation();
          const gpId = actionEl.dataset.gpId;
          if (confirm('Delete this gameplan?')) {
            GameplanStore.delete(gpId).then(() => {
              this.render('gp-list');
            });
          }
          return;
        }

        if (action === 'gp-add-node') {
          const type = actionEl.dataset.type;
          const typeNames = { position: 'Position', transition: 'Transition', submission: 'Submission', reaction: 'Reaction' };
          const newLabel = prompt('Name this ' + (typeNames[type] || 'node') + ':');
          if (newLabel !== null && newLabel.trim()) {
            const result = GameplanCanvas.addNode(type, newLabel.trim());
          }
          return;
        }

        if (action === 'gp-connect') {
          GameplanCanvas.setConnectMode(!GameplanCanvas._connectMode);
          return;
        }

        if (action === 'gp-delete-node') {
          const connId = GameplanCanvas._selectedConnId;
          if (connId) {
            GameplanCanvas.deleteConnection(connId);
            GameplanCanvas.selectConnection(null);
            return;
          }
          const nodeId = GameplanCanvas._selectedNodeId;
          if (nodeId) {
            GameplanCanvas.deleteNode(nodeId);
          }
          return;
        }

        if (action === 'gp-open-detail') {
          const node = GameplanCanvas.getSelectedNode();
          if (node) GameplanUI.showNodeDetail(node);
          return;
        }

        if (action === 'gp-close-detail') {
          GameplanUI.closeNodeDetail();
          return;
        }

        if (action === 'gp-add-note') {
          const input = document.getElementById('gp-note-input');
          if (input && input.value.trim()) {
            const resolved = GameplanCanvas.getSelectedNode();
            const raw = GameplanCanvas.getRawSelectedNode();
            if (resolved && raw && raw.libraryId) {
              const entry = GameplanStore.getLibraryEntry(raw.libraryId);
              if (entry) {
                entry.notes.push({ text: input.value.trim(), createdAt: new Date().toISOString() });
                GameplanStore.saveLibraryEntry(entry);
                GameplanUI.showNodeDetail(GameplanStore.resolveNode(raw));
              }
            }
          }
          return;
        }

        if (action === 'gp-delete-note') {
          const idx = parseInt(actionEl.dataset.noteIndex);
          const raw = GameplanCanvas.getRawSelectedNode();
          if (raw && raw.libraryId && !isNaN(idx)) {
            const entry = GameplanStore.getLibraryEntry(raw.libraryId);
            if (entry) {
              entry.notes.splice(idx, 1);
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showNodeDetail(GameplanStore.resolveNode(raw));
            }
          }
          return;
        }

        if (action === 'gp-add-link') {
          const urlInput = document.getElementById('gp-link-url-input');
          const labelInput = document.getElementById('gp-link-label-input');
          if (urlInput && urlInput.value.trim()) {
            const raw = GameplanCanvas.getRawSelectedNode();
            if (raw && raw.libraryId) {
              const entry = GameplanStore.getLibraryEntry(raw.libraryId);
              if (entry) {
                entry.links.push({
                  url: urlInput.value.trim(),
                  label: (labelInput && labelInput.value.trim()) || ''
                });
                GameplanStore.saveLibraryEntry(entry);
                GameplanUI.showNodeDetail(GameplanStore.resolveNode(raw));
              }
            }
          }
          return;
        }

        if (action === 'gp-delete-link') {
          const idx = parseInt(actionEl.dataset.linkIndex);
          const raw = GameplanCanvas.getRawSelectedNode();
          if (raw && raw.libraryId && !isNaN(idx)) {
            const entry = GameplanStore.getLibraryEntry(raw.libraryId);
            if (entry) {
              entry.links.splice(idx, 1);
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showNodeDetail(GameplanStore.resolveNode(raw));
            }
          }
          return;
        }

        if (action === 'gp-open-link') {
          e.preventDefault();
          const url = actionEl.dataset.url;
          if (url) window.open(url, '_blank');
          return;
        }

        if (action === 'gp-rename') {
          const gp = GameplanCanvas.getGameplan();
          if (gp) {
            const newName = prompt('Rename gameplan:', gp.name);
            if (newName !== null && newName.trim()) {
              gp.name = newName.trim();
              actionEl.textContent = gp.name;
              GameplanCanvas._scheduleSave();
            }
          }
          return;
        }

        if (action === 'gp-tap-connection') {
          const connId = actionEl.dataset.connHit;
          if (connId) {
            GameplanCanvas.selectConnection(connId);
          }
          return;
        }

        if (action === 'gp-edit-label') {
          // Handled via input change below
          return;
        }

        if (action === 'gp-open-library') {
          Promise.all([
            GameplanStore.getLibrary(),
            GameplanStore.getAll()
          ]).then(([entries, plans]) => {
            const currentId = GameplanCanvas.getGameplan() ? GameplanCanvas.getGameplan().id : null;
            GameplanUI.showLibrary(entries, plans, currentId, 'pick');
          });
          return;
        }

        if (action === 'gp-open-library-browse') {
          Promise.all([
            GameplanStore.getLibrary(),
            GameplanStore.getAll()
          ]).then(([entries, plans]) => {
            GameplanUI.showLibrary(entries, plans, null, 'browse');
          });
          return;
        }

        if (action === 'gp-library-import-gameplan') {
          const gpId = actionEl.dataset.gpId;
          if (gpId) {
            GameplanStore.get(gpId).then(sourceGp => {
              if (sourceGp) {
                GameplanCanvas.importGameplan(sourceGp);
                GameplanUI.closeLibrary();
              }
            });
          }
          return;
        }

        if (action === 'gp-library-create') {
          const type = actionEl.dataset.type;
          const typeNames = { position: 'Position', transition: 'Transition', submission: 'Submission', reaction: 'Reaction' };
          const name = prompt('Name this ' + (typeNames[type] || 'move') + ':');
          if (name && name.trim()) {
            const entry = GameplanData.createLibraryEntry(type, name.trim());
            GameplanStore.saveLibraryEntry(entry);
            // Refresh library view
            Promise.all([
              GameplanStore.getLibrary(),
              GameplanStore.getAll()
            ]).then(([entries, plans]) => {
              const currentId = GameplanCanvas.getGameplan() ? GameplanCanvas.getGameplan().id : null;
              GameplanUI.closeLibrary();
              setTimeout(() => GameplanUI.showLibrary(entries, plans, currentId), 210);
            });
          }
          return;
        }

        if (action === 'gp-library-view') {
          const libId = actionEl.dataset.libraryId;
          if (libId) {
            const entry = GameplanStore.getLibraryEntry(libId);
            if (entry) GameplanUI.showLibraryEntryDetail(entry);
          }
          return;
        }

        if (action === 'gp-library-quick-add') {
          const libId = actionEl.dataset.libraryId;
          if (libId) {
            GameplanCanvas.addNodeFromLibrary(libId);
            GameplanUI.closeLibrary();
          }
          return;
        }

        if (action === 'gp-library-delete') {
          const libId = actionEl.dataset.libraryId;
          if (libId) {
            const entry = GameplanStore.getLibraryEntry(libId);
            const name = entry ? entry.label : 'this move';
            if (confirm('Remove "' + name + '" from the library? This cannot be undone.')) {
              GameplanStore.deleteLibraryEntry(libId);
              // Remove the item from the DOM
              const item = actionEl.closest('.gp-library-item');
              if (item) item.remove();
            }
          }
          return;
        }

        if (action === 'gp-library-add-to-gameplan') {
          const libId = actionEl.dataset.libraryId;
          if (libId) {
            GameplanCanvas.addNodeFromLibrary(libId);
            GameplanUI.closeLibraryEntryDetail();
            GameplanUI.closeLibrary();
          }
          return;
        }

        if (action === 'gp-lib-detail-back') {
          GameplanUI.closeLibraryEntryDetail();
          return;
        }

        if (action === 'gp-lib-add-note') {
          const input = document.getElementById('gp-lib-note-input');
          const overlay = document.querySelector('.gp-lib-detail-overlay');
          const libId = overlay ? overlay.dataset.libraryId : null;
          if (input && input.value.trim() && libId) {
            const entry = GameplanStore.getLibraryEntry(libId);
            if (entry) {
              entry.notes.push({ text: input.value.trim(), createdAt: new Date().toISOString() });
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showLibraryEntryDetail(entry);
            }
          }
          return;
        }

        if (action === 'gp-lib-delete-note') {
          const idx = parseInt(actionEl.dataset.noteIndex);
          const overlay = document.querySelector('.gp-lib-detail-overlay');
          const libId = overlay ? overlay.dataset.libraryId : null;
          if (libId && !isNaN(idx)) {
            const entry = GameplanStore.getLibraryEntry(libId);
            if (entry) {
              entry.notes.splice(idx, 1);
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showLibraryEntryDetail(entry);
            }
          }
          return;
        }

        if (action === 'gp-lib-add-link') {
          const urlInput = document.getElementById('gp-lib-link-url-input');
          const labelInput = document.getElementById('gp-lib-link-label-input');
          const overlay = document.querySelector('.gp-lib-detail-overlay');
          const libId = overlay ? overlay.dataset.libraryId : null;
          if (urlInput && urlInput.value.trim() && libId) {
            const entry = GameplanStore.getLibraryEntry(libId);
            if (entry) {
              entry.links.push({
                url: urlInput.value.trim(),
                label: (labelInput && labelInput.value.trim()) || ''
              });
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showLibraryEntryDetail(entry);
            }
          }
          return;
        }

        if (action === 'gp-lib-delete-link') {
          const idx = parseInt(actionEl.dataset.linkIndex);
          const overlay = document.querySelector('.gp-lib-detail-overlay');
          const libId = overlay ? overlay.dataset.libraryId : null;
          if (libId && !isNaN(idx)) {
            const entry = GameplanStore.getLibraryEntry(libId);
            if (entry) {
              entry.links.splice(idx, 1);
              GameplanStore.saveLibraryEntry(entry);
              GameplanUI.showLibraryEntryDetail(entry);
            }
          }
          return;
        }

        if (action === 'gp-library-filter') {
          const filter = actionEl.dataset.filter;
          // Update active state on buttons
          document.querySelectorAll('.gp-library-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
          });
          // Apply filter + search together
          this._applyLibraryFilter();
          return;
        }

        if (action === 'gp-close-library') {
          GameplanUI.closeLibrary();
          return;
        }
      }

      // Image lightbox
      if (e.target.closest('[data-action="zoom-image"]')) {
        const lb = document.getElementById('image-lightbox');
        if (lb) {
          lb.classList.add('active');
          lb.focus();
        }
        return;
      }
      if (e.target.closest('[data-action="close-lightbox"]')) {
        this._closeLightbox();
        return;
      }

      // Timer controls (Hip Challenge)
      if (e.target.id === 'btn-timer-toggle') {
        if (this.currentTimer) {
          this.currentTimer.toggle();
          const btn = document.getElementById('btn-timer-toggle');
          if (btn) {
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            btn.textContent = label;
            btn.setAttribute('aria-label', label + ' timer');
          }
        }
        return;
      }
      if (e.target.id === 'btn-timer-skip') {
        if (this.currentTimer) this.currentTimer.skip();
        return;
      }

      // BJJ Timer controls
      if (e.target.id === 'btn-bjj-toggle') {
        if (this.currentTimer) {
          this.currentTimer.toggle();
          const btn = document.getElementById('btn-bjj-toggle');
          if (btn) {
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            btn.textContent = label;
            btn.setAttribute('aria-label', label + ' timer');
          }
        }
        return;
      }
      if (e.target.id === 'btn-bjj-skip') {
        if (this.currentTimer) {
          const skipIdx = parseInt(document.getElementById('btn-bjj-skip').dataset.exercise);
          this.currentTimer.destroy();
          this.currentTimer = null;
          this.onBjjExerciseComplete(skipIdx);
        }
        return;
      }

      // BJJ restart
      if (e.target.closest('[data-action="bjj-restart"]')) {
        this.render('bjj-countdown');
        return;
      }

      // Pose complete — continue button
      if (e.target.closest('[data-action="pose-continue"]')) {
        const btn = e.target.closest('[data-action="pose-continue"]');
        const day = parseInt(btn.dataset.day);
        const pose = parseInt(btn.dataset.pose);
        this.render('timer', { day, pose });
        return;
      }

      // Reset all
      if (e.target.closest('[data-action="reset-all"]')) {
        if (confirm('Reset all progress? This cannot be undone.')) {
          Progress.resetAll();
          this.render('hip-home');
        }
      }
    });

    // Gameplan input handling (label edit + library search)
    document.getElementById('app').addEventListener('input', (e) => {
      if (e.target.id === 'gp-detail-label-input') {
        const node = GameplanCanvas.getSelectedNode();
        if (node) {
          GameplanCanvas.updateNodeLabel(node.id, e.target.value);
        }
      }
      if (e.target.id === 'gp-library-search') {
        this._applyLibraryFilter();
      }
      if (e.target.dataset.action === 'gp-edit-note-inline') {
        const idx = parseInt(e.target.dataset.noteIndex);
        const raw = GameplanCanvas.getRawSelectedNode();
        if (raw && raw.libraryId && !isNaN(idx)) {
          const entry = GameplanStore.getLibraryEntry(raw.libraryId);
          if (entry && entry.notes[idx]) {
            entry.notes[idx].text = e.target.value;
            GameplanStore.saveLibraryEntry(entry);
          }
        }
      }
      // Library entry detail: label editing
      if (e.target.id === 'gp-lib-detail-label') {
        const overlay = document.querySelector('.gp-lib-detail-overlay');
        const libId = overlay ? overlay.dataset.libraryId : null;
        if (libId) {
          const entry = GameplanStore.getLibraryEntry(libId);
          if (entry) {
            entry.label = e.target.value;
            GameplanStore.saveLibraryEntry(entry);
          }
        }
      }
      // Library entry detail: inline note editing
      if (e.target.dataset.action === 'gp-lib-edit-note') {
        const idx = parseInt(e.target.dataset.noteIndex);
        const overlay = document.querySelector('.gp-lib-detail-overlay');
        const libId = overlay ? overlay.dataset.libraryId : null;
        if (libId && !isNaN(idx)) {
          const entry = GameplanStore.getLibraryEntry(libId);
          if (entry && entry.notes[idx]) {
            entry.notes[idx].text = e.target.value;
            GameplanStore.saveLibraryEntry(entry);
          }
        }
      }
    });

    // Global keyboard handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close library entry detail first
        const gpLibDetail = document.querySelector('.gp-lib-detail-overlay');
        if (gpLibDetail) {
          GameplanUI.closeLibraryEntryDetail();
          return;
        }

        // Close library overlay
        const gpLibrary = document.querySelector('.gp-library-overlay');
        if (gpLibrary) {
          GameplanUI.closeLibrary();
          return;
        }

        // Close gameplan node detail overlay
        const gpDetail = document.querySelector('.gp-node-detail-overlay');
        if (gpDetail) {
          GameplanUI.closeNodeDetail();
          return;
        }

        // Close lightbox if open
        const lb = document.getElementById('image-lightbox');
        if (lb && lb.classList.contains('active')) {
          this._closeLightbox();
          return;
        }

        // Close congrats overlay if open
        const congrats = document.getElementById('congrats-overlay');
        if (congrats && congrats.classList.contains('active')) {
          this.render('hip-home');
          return;
        }

        // Close pose-complete overlay if open
        const poseOverlay = document.querySelector('.pose-complete-overlay');
        if (poseOverlay) {
          poseOverlay.remove();
          return;
        }
      }

      // Spacebar to toggle timer when on timer screen or BJJ circuit
      if (e.key === ' ') {
        const timerBtn = document.getElementById('btn-timer-toggle') || document.getElementById('btn-bjj-toggle');
        if (timerBtn && (e.target === document.body || e.target === document.getElementById('app'))) {
          e.preventDefault();
          if (this.currentTimer) {
            this.currentTimer.toggle();
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            timerBtn.textContent = label;
            timerBtn.setAttribute('aria-label', label + ' timer');
          }
        }
      }
    });
  },

  _applyLibraryFilter() {
    const searchInput = document.getElementById('gp-library-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeFilter = document.querySelector('.gp-library-filter.active');
    const typeFilter = activeFilter ? activeFilter.dataset.filter : 'all';

    // Show/hide moves and gameplans based on filter
    const items = document.querySelectorAll('.gp-library-item, .gp-empty-sub');
    items.forEach(item => {
      const label = (item.dataset.label || '').toLowerCase();
      const type = item.dataset.type || '';
      const isMove = item.classList.contains('gp-library-move');
      const isGameplan = item.classList.contains('gp-library-gameplan');

      if (typeFilter === 'gameplan') {
        // Show only gameplans
        if (isMove) { item.style.display = 'none'; return; }
        if (isGameplan) {
          const matchesSearch = !query || label.includes(query);
          item.style.display = matchesSearch ? '' : 'none';
          return;
        }
      } else {
        // Show only moves (hide gameplans)
        if (isGameplan) { item.style.display = 'none'; return; }
        if (isMove) {
          const matchesSearch = !query || label.includes(query);
          const matchesType = typeFilter === 'all' || type === typeFilter;
          item.style.display = (matchesSearch && matchesType) ? '' : 'none';
          return;
        }
      }
      // Empty-state paragraphs
      if (item.tagName === 'P') {
        item.style.display = (typeFilter === 'gameplan' && item.classList.contains('gp-library-gameplan')) ||
                             (typeFilter !== 'gameplan' && item.classList.contains('gp-library-move')) ? '' : 'none';
      }
    });
  },

  _closeLightbox() {
    const lb = document.getElementById('image-lightbox');
    if (lb) {
      lb.classList.remove('active');
      const trigger = document.querySelector('[data-action="zoom-image"]');
      if (trigger) trigger.focus();
    }
  },

  // ── Hip Challenge Timer ──────────────────────────────────────

  initTimer(dayNumber, poseIndex) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    const pose = dayData.poses[poseIndex];

    this.currentTimer = new PoseTimer(
      pose.duration,
      (remaining) => {
        UI.updateTimer(remaining, this.currentTimer.progress, this.currentTimer.isRunning);
      },
      () => {
        this.onPoseComplete(dayNumber, poseIndex);
      }
    );
  },

  onPoseComplete(dayNumber, poseIndex) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    const pose = dayData.poses[poseIndex];

    if (navigator.vibrate) navigator.vibrate(200);
    Progress.markPoseDone(pose.id);

    if (Progress.isDayComplete(dayNumber)) {
      Progress.markDayComplete(dayNumber);
      this.showCongrats(dayNumber);
    } else {
      const nextIndex = dayData.poses.findIndex((p, i) => i > poseIndex && !Progress.isPoseDone(p.id));
      if (nextIndex !== -1) {
        this.showPoseComplete(pose.name, dayNumber, nextIndex);
      } else {
        this.render('day', { day: dayNumber });
      }
    }
  },

  showPoseComplete(poseName, dayNumber, nextPoseIndex) {
    const app = document.getElementById('app');
    const overlay = document.createElement('div');
    overlay.className = 'pose-complete-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', `${poseName} complete`);
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="pose-complete-content">
        <div class="pose-complete-check" aria-hidden="true">&#x2713;</div>
        <p>${UI.esc(poseName)}</p>
        <p class="pose-complete-next">Up next...</p>
        <button class="btn-pose-continue" data-action="pose-continue" data-day="${dayNumber}" data-pose="${nextPoseIndex}">Continue</button>
      </div>`;
    app.appendChild(overlay);

    requestAnimationFrame(() => {
      const btn = overlay.querySelector('.btn-pose-continue');
      if (btn) btn.focus();
    });
  },

  showCongrats(dayNumber) {
    const app = document.getElementById('app');
    app.insertAdjacentHTML('beforeend', UI.renderCongrats(dayNumber));

    requestAnimationFrame(() => {
      const overlay = document.getElementById('congrats-overlay');
      if (overlay) {
        overlay.classList.add('active');
        const firstBtn = overlay.querySelector('.btn-congrats-next');
        if (firstBtn) firstBtn.focus();
      }
    });
  },

  // ── BJJ Circuit ──────────────────────────────────────────────

  initBjjScrollWheel() {
    const wheel = document.getElementById('bjj-scroll-wheel');
    if (!wheel) return;

    const items = wheel.querySelectorAll('.scroll-wheel-item');
    const ITEM_HEIGHT = 48;
    const values = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

    // Find initial index from current bjjDuration
    let currentIndex = values.indexOf(this.bjjDuration);
    if (currentIndex === -1) currentIndex = 3; // default 2min

    // Scroll to selected position
    wheel.scrollTop = currentIndex * ITEM_HEIGHT;
    items[currentIndex].classList.add('selected');

    const updateSelection = () => {
      const scrollPos = wheel.scrollTop;
      const idx = Math.round(scrollPos / ITEM_HEIGHT);
      const clampedIdx = Math.max(0, Math.min(idx, values.length - 1));

      items.forEach(item => item.classList.remove('selected'));
      items[clampedIdx].classList.add('selected');

      this.bjjDuration = values[clampedIdx];

      const info = document.getElementById('bjj-total-info');
      if (info) {
        const totalMin = Math.round((this.bjjDuration * 11) / 60);
        info.textContent = `11 exercises \u00b7 ${UI._formatDurationLabel(this.bjjDuration)} each \u00b7 ${totalMin} min total`;
      }
    };

    let scrollTimeout;
    wheel.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Snap to nearest item
        const idx = Math.round(wheel.scrollTop / ITEM_HEIGHT);
        const clampedIdx = Math.max(0, Math.min(idx, values.length - 1));
        wheel.scrollTo({ top: clampedIdx * ITEM_HEIGHT, behavior: 'smooth' });
        updateSelection();
      }, 80);
    });
  },

  initBjjCountdown() {
    let count = 3;
    const display = document.getElementById('bjj-countdown-number');
    if (display) display.textContent = count;

    this.bjjCountdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        if (display) {
          display.textContent = count;
          display.classList.remove('bjj-countdown-pulse');
          void display.offsetWidth;
          display.classList.add('bjj-countdown-pulse');
        }
      } else if (count === 0) {
        if (display) {
          display.textContent = 'GO!';
          display.classList.remove('bjj-countdown-pulse');
          void display.offsetWidth;
          display.classList.add('bjj-countdown-pulse');
        }
      } else {
        clearInterval(this.bjjCountdownTimer);
        this.bjjCountdownTimer = null;
        this.render('bjj-circuit', { exercise: 0 });
      }
    }, 1000);
  },

  initBjjTimer(exerciseIndex) {
    this.currentTimer = new PoseTimer(
      this.bjjDuration,
      (remaining) => {
        UI.updateBjjTimer(remaining, this.currentTimer.progress, this.currentTimer.isRunning);
      },
      () => {
        this.onBjjExerciseComplete(exerciseIndex);
      }
    );

    // Auto-start
    this.currentTimer.start();
  },

  onBjjExerciseComplete(index) {
    if (navigator.vibrate) navigator.vibrate(200);

    if (index < BJJ_EXERCISES.length - 1) {
      this.render('bjj-circuit', { exercise: index + 1 });
    } else {
      this.render('bjj-complete');
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
