// SVG diagram engine — renders nodes, connections, handles pan/zoom/drag

const GameplanCanvas = {
  _svg: null,
  _viewport: null,
  _nodesGroup: null,
  _connectionsGroup: null,
  _gameplan: null,
  _selectedNodeId: null,
  _selectedConnId: null,
  _connectMode: false,
  _connectSourceId: null,
  _dragging: null,        // { nodeId, startX, startY, origX, origY }
  _panning: null,         // { startX, startY, origVpX, origVpY }
  _pinching: null,        // { startDist, origZoom }
  _saveTimeout: null,
  _TAP_THRESHOLD: 10,

  // Node sizing
  NODE_SIZE: 70,
  TRIANGLE_SIZE: 80,

  init(containerId, gameplan) {
    this._gameplan = gameplan;
    this._selectedNodeId = null;
    this._selectedConnId = null;
    this._connectMode = false;
    this._connectSourceId = null;
    this._dragging = null;
    this._panning = null;
    this._pinching = null;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'gp-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Arrowhead marker
    const defs = document.createElementNS(ns, 'defs');
    const marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'gp-arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const arrow = document.createElementNS(ns, 'polygon');
    arrow.setAttribute('points', '0 0, 10 3.5, 0 7');
    arrow.setAttribute('fill', '#10B981');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Viewport group for pan/zoom
    const vp = document.createElementNS(ns, 'g');
    vp.setAttribute('class', 'gp-viewport');
    this._viewport = vp;

    const connGroup = document.createElementNS(ns, 'g');
    connGroup.setAttribute('class', 'gp-connections');
    this._connectionsGroup = connGroup;

    const nodesGroup = document.createElementNS(ns, 'g');
    nodesGroup.setAttribute('class', 'gp-nodes');
    this._nodesGroup = nodesGroup;

    vp.appendChild(connGroup);
    vp.appendChild(nodesGroup);
    svg.appendChild(vp);

    container.appendChild(svg);
    this._svg = svg;

    // Apply saved viewport
    this._applyViewport();

    // Render existing nodes (resolved through library) and connections.
    // One broken node must never take out the rest of the canvas.
    gameplan.nodes.forEach(n => {
      try {
        this._renderNode(GameplanStore.resolveNode(n));
      } catch (err) {
        console.error('Failed to render node', n.id, err);
      }
    });
    gameplan.connections.forEach(c => {
      try {
        this._renderConnection(c);
      } catch (err) {
        console.error('Failed to render connection', c.id, err);
      }
    });

    // Bind touch/mouse events
    this._bindEvents();
  },

  // Save any pending debounced changes immediately
  flush() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
      if (this._gameplan) GameplanStore.save(this._gameplan);
    }
  },

  destroy() {
    this.flush();
    this._svg = null;
    this._viewport = null;
    this._nodesGroup = null;
    this._connectionsGroup = null;
    this._gameplan = null;
  },

  // ── Public API ──────────────────────────────────────────────

  addNode(type, label) {
    if (!this._gameplan) return null;

    // Reuse an existing library entry with the same name (or alias) instead of
    // creating a duplicate — shared notes/links follow the move across plans.
    let entry = GameplanStore.findLibraryEntry(label, type);
    if (!entry) {
      entry = GameplanData.createLibraryEntry(type, label);
      GameplanStore.saveLibraryEntry(entry);
    }

    const spot = this._findFreeSpot();
    const node = GameplanData.createNode(entry.id, spot.x, spot.y);
    this._gameplan.nodes.push(node);
    this._renderNode(GameplanStore.resolveNode(node));
    this.selectNode(node.id);
    this._scheduleSave();
    return { node: node, entry: entry };
  },

  // Find a spot near the center of the visible area that doesn't overlap
  // an existing node, spiralling outward until one is free.
  _findFreeSpot() {
    const vp = this._gameplan.viewport;
    const svgRect = this._svg.getBoundingClientRect();
    const cx = (svgRect.width / 2 - vp.x) / vp.zoom;
    const cy = (svgRect.height / 2 - vp.y) / vp.zoom;

    const clearance = this.NODE_SIZE + 20;
    const isFree = (x, y) => !this._gameplan.nodes.some(n => {
      return Math.abs(n.x - x) < clearance && Math.abs(n.y - y) < clearance;
    });

    if (isFree(cx, cy)) return { x: cx, y: cy };

    const step = clearance;
    for (let ring = 1; ring <= 10; ring++) {
      const points = 8 * ring;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const x = cx + Math.cos(angle) * ring * step;
        const y = cy + Math.sin(angle) * ring * step;
        if (isFree(x, y)) return { x: x, y: y };
      }
    }
    return { x: cx, y: cy };
  },

  importGameplan(sourceGp) {
    if (!this._gameplan || !sourceGp) return;

    // Calculate offset so imported nodes don't overlap existing ones
    const vp = this._gameplan.viewport;
    const svgRect = this._svg.getBoundingClientRect();
    const centerX = (svgRect.width / 2 - vp.x) / vp.zoom;
    const centerY = (svgRect.height / 2 - vp.y) / vp.zoom;

    // Find bounding box of source nodes to calculate offset
    let srcMinX = Infinity, srcMinY = Infinity;
    sourceGp.nodes.forEach(n => {
      if (n.x < srcMinX) srcMinX = n.x;
      if (n.y < srcMinY) srcMinY = n.y;
    });
    if (!isFinite(srcMinX)) srcMinX = 0;
    if (!isFinite(srcMinY)) srcMinY = 0;

    const offsetX = centerX - srcMinX;
    const offsetY = centerY - srcMinY;

    // Map old node IDs to new node IDs
    const idMap = {};

    sourceGp.nodes.forEach(srcNode => {
      const newNode = GameplanData.createNode(
        srcNode.libraryId,
        srcNode.x + offsetX,
        srcNode.y + offsetY
      );
      idMap[srcNode.id] = newNode.id;
      this._gameplan.nodes.push(newNode);
      this._renderNode(GameplanStore.resolveNode(newNode));
    });

    // Clone connections with remapped node IDs
    sourceGp.connections.forEach(srcConn => {
      const newFromId = idMap[srcConn.fromNodeId];
      const newToId = idMap[srcConn.toNodeId];
      if (newFromId && newToId) {
        const conn = GameplanData.createConnection(newFromId, newToId, srcConn.label);
        this._gameplan.connections.push(conn);
        this._renderConnection(conn);
      }
    });

    this._scheduleSave();
  },

  // connectFromNodeId: optionally draw a connection from an existing node
  // to the new one (used by "from here" library suggestions)
  addNodeFromLibrary(libraryId, connectFromNodeId) {
    if (!this._gameplan) return null;

    const entry = GameplanStore.getLibraryEntry(libraryId);
    if (!entry) return null;

    const spot = this._findFreeSpot();
    const node = GameplanData.createNode(libraryId, spot.x, spot.y);
    this._gameplan.nodes.push(node);
    this._renderNode(GameplanStore.resolveNode(node));
    if (connectFromNodeId && this._gameplan.nodes.some(n => n.id === connectFromNodeId)) {
      this.addConnection(connectFromNodeId, node.id);
    }
    this.selectNode(node.id);
    this._scheduleSave();
    return node;
  },

  deleteNode(nodeId) {
    if (!this._gameplan) return;

    // Remove connections to/from this node
    this._gameplan.connections = this._gameplan.connections.filter(c => {
      if (c.fromNodeId === nodeId || c.toNodeId === nodeId) {
        this._removeConnectionEl(c.id);
        return false;
      }
      return true;
    });

    // Remove node
    this._gameplan.nodes = this._gameplan.nodes.filter(n => n.id !== nodeId);
    const el = this._nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) el.remove();

    if (this._selectedNodeId === nodeId) this._selectedNodeId = null;
    this._scheduleSave();
  },

  addConnection(fromId, toId) {
    if (!this._gameplan || fromId === toId) return null;

    // Don't duplicate
    const exists = this._gameplan.connections.find(
      c => c.fromNodeId === fromId && c.toNodeId === toId
    );
    if (exists) return null;

    const conn = GameplanData.createConnection(fromId, toId);
    this._gameplan.connections.push(conn);
    this._renderConnection(conn);
    this._scheduleSave();
    return conn;
  },

  deleteConnection(connId) {
    if (!this._gameplan) return;
    this._gameplan.connections = this._gameplan.connections.filter(c => c.id !== connId);
    this._removeConnectionEl(connId);
    this._scheduleSave();
  },

  getConnection(connId) {
    if (!this._gameplan) return null;
    return this._gameplan.connections.find(c => c.id === connId) || null;
  },

  updateConnectionLabel(connId, label) {
    const conn = this.getConnection(connId);
    if (!conn) return;
    conn.label = label;
    this._removeConnectionEl(conn.id);
    this._renderConnection(conn);
    // Re-apply selection highlight on the freshly rendered line
    if (this._selectedConnId === connId) {
      const el = this._connectionsGroup.querySelector(`[data-conn-id="${connId}"]`);
      if (el) el.classList.add('selected');
    }
    this._scheduleSave();
  },

  selectNode(nodeId) {
    // Deselect previous node
    if (this._selectedNodeId) {
      const prev = this._nodesGroup.querySelector(`[data-node-id="${this._selectedNodeId}"]`);
      if (prev) prev.classList.remove('selected');
    }
    // Deselect any selected connection
    this.selectConnection(null);

    this._selectedNodeId = nodeId;

    if (nodeId) {
      const el = this._nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
      if (el) el.classList.add('selected');
    }

    // Update toolbar delete button visibility
    const delBtn = document.getElementById('gp-btn-delete');
    if (delBtn) delBtn.style.display = nodeId ? '' : 'none';

    // Update detail button visibility
    const detailBtn = document.getElementById('gp-btn-detail');
    if (detailBtn) detailBtn.style.display = nodeId ? '' : 'none';

    // Connection label button only applies to connections
    const connLabelBtn = document.getElementById('gp-btn-conn-label');
    if (connLabelBtn) connLabelBtn.style.display = 'none';
  },

  selectConnection(connId) {
    // Deselect previous connection
    if (this._selectedConnId) {
      const prev = this._connectionsGroup.querySelector(`[data-conn-id="${this._selectedConnId}"]`);
      if (prev) prev.classList.remove('selected');
    }

    this._selectedConnId = connId;

    if (connId) {
      // Deselect any selected node
      if (this._selectedNodeId) {
        const prev = this._nodesGroup.querySelector(`[data-node-id="${this._selectedNodeId}"]`);
        if (prev) prev.classList.remove('selected');
        this._selectedNodeId = null;
      }

      const el = this._connectionsGroup.querySelector(`[data-conn-id="${connId}"]`);
      if (el) el.classList.add('selected');
    }

    // Show delete button if node OR connection is selected
    const delBtn = document.getElementById('gp-btn-delete');
    if (delBtn) delBtn.style.display = (connId || this._selectedNodeId) ? '' : 'none';

    // Detail button only for nodes
    const detailBtn = document.getElementById('gp-btn-detail');
    if (detailBtn) detailBtn.style.display = this._selectedNodeId ? '' : 'none';

    // Label button only for connections
    const connLabelBtn = document.getElementById('gp-btn-conn-label');
    if (connLabelBtn) connLabelBtn.style.display = connId ? '' : 'none';
  },

  setConnectMode(enabled) {
    this._connectMode = enabled;
    // Clear any half-finished connection highlight
    if (this._connectSourceId && this._nodesGroup) {
      const srcEl = this._nodesGroup.querySelector(`[data-node-id="${this._connectSourceId}"]`);
      if (srcEl) srcEl.classList.remove('connect-source');
    }
    this._connectSourceId = null;

    const btn = document.getElementById('gp-btn-connect');
    if (btn) btn.classList.toggle('active', enabled);

    // Visual feedback on SVG
    if (this._svg) this._svg.classList.toggle('connect-mode', enabled);
  },

  getSelectedNode() {
    if (!this._gameplan || !this._selectedNodeId) return null;
    const node = this._gameplan.nodes.find(n => n.id === this._selectedNodeId);
    if (!node) return null;
    return GameplanStore.resolveNode(node);
  },

  getRawSelectedNode() {
    if (!this._gameplan || !this._selectedNodeId) return null;
    return this._gameplan.nodes.find(n => n.id === this._selectedNodeId) || null;
  },

  getGameplan() {
    return this._gameplan;
  },

  updateNodeLabel(nodeId, label) {
    const node = this._gameplan.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Update library entry if this is a library-backed node
    if (node.libraryId) {
      const entry = GameplanStore.getLibraryEntry(node.libraryId);
      if (entry) {
        entry.label = label;
        GameplanStore.saveLibraryEntry(entry);
      }
    } else {
      node.label = label;
    }

    const el = this._nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
    if (el) this._renderLabel(el, label);
    this._scheduleSave();
  },

  // ── Rendering ───────────────────────────────────────────────

  _renderNode(node) {
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('data-node-id', node.id);
    g.setAttribute('data-action', 'gp-select-node');
    g.setAttribute('class', 'gp-node gp-node-' + node.type + (node.missing ? ' gp-node-missing' : ''));
    g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    const s = this.NODE_SIZE;
    const half = s / 2;

    if (node.type === 'position') {
      // Square
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', -half);
      rect.setAttribute('y', -half);
      rect.setAttribute('width', s);
      rect.setAttribute('height', s);
      rect.setAttribute('rx', '8');
      g.appendChild(rect);
    } else if (node.type === 'transition') {
      // Circle
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', half);
      g.appendChild(circle);
    } else if (node.type === 'submission') {
      // Triangle
      const t = this.TRIANGLE_SIZE;
      const h = (t * Math.sqrt(3)) / 2;
      const points = `0,${-h * 0.6} ${t / 2},${h * 0.4} ${-t / 2},${h * 0.4}`;
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', points);
      g.appendChild(poly);
    } else if (node.type === 'reaction') {
      // Diamond
      const d = this.NODE_SIZE * 0.55;
      const points = `0,${-d} ${d},0 0,${d} ${-d},0`;
      const poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', points);
      g.appendChild(poly);
    }

    // Label (wraps to two lines for longer move names)
    this._renderLabel(g, node.label);

    // Note indicator
    if (node.notes.length > 0) {
      const indicator = document.createElementNS(ns, 'circle');
      indicator.setAttribute('cx', half - 5);
      indicator.setAttribute('cy', -half + 5);
      indicator.setAttribute('r', '6');
      indicator.setAttribute('class', 'gp-note-indicator');
      g.appendChild(indicator);

      const countText = document.createElementNS(ns, 'text');
      countText.setAttribute('x', half - 5);
      countText.setAttribute('y', -half + 5);
      countText.setAttribute('text-anchor', 'middle');
      countText.setAttribute('dominant-baseline', 'middle');
      countText.setAttribute('class', 'gp-note-count');
      countText.textContent = node.notes.length;
      g.appendChild(countText);
    }

    this._nodesGroup.appendChild(g);
  },

  _renderConnection(conn) {
    const fromRaw = this._gameplan.nodes.find(n => n.id === conn.fromNodeId);
    const toRaw = this._gameplan.nodes.find(n => n.id === conn.toNodeId);
    if (!fromRaw || !toRaw) return;
    const from = GameplanStore.resolveNode(fromRaw);
    const to = GameplanStore.resolveNode(toRaw);

    const ns = 'http://www.w3.org/2000/svg';

    // Calculate edge points
    const fromEdge = this._getEdgePoint(from, to.x, to.y);
    const toEdge = this._getEdgePoint(to, from.x, from.y);

    // Wide invisible hit area for easy tapping
    const hitLine = document.createElementNS(ns, 'line');
    hitLine.setAttribute('data-conn-hit', conn.id);
    hitLine.setAttribute('data-action', 'gp-tap-connection');
    hitLine.setAttribute('class', 'gp-connection-hit');
    hitLine.setAttribute('x1', fromEdge.x);
    hitLine.setAttribute('y1', fromEdge.y);
    hitLine.setAttribute('x2', toEdge.x);
    hitLine.setAttribute('y2', toEdge.y);
    this._connectionsGroup.appendChild(hitLine);

    // Visible line
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('data-conn-id', conn.id);
    line.setAttribute('class', 'gp-connection');
    line.setAttribute('x1', fromEdge.x);
    line.setAttribute('y1', fromEdge.y);
    line.setAttribute('x2', toEdge.x);
    line.setAttribute('y2', toEdge.y);
    line.setAttribute('marker-end', 'url(#gp-arrowhead)');

    this._connectionsGroup.appendChild(line);

    // Connection label
    if (conn.label) {
      const midX = (fromEdge.x + toEdge.x) / 2;
      const midY = (fromEdge.y + toEdge.y) / 2;
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('data-conn-label-id', conn.id);
      text.setAttribute('x', midX);
      text.setAttribute('y', midY - 8);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'gp-conn-label');
      text.textContent = conn.label;
      this._connectionsGroup.appendChild(text);
    }
  },

  _updateConnections(nodeId) {
    this._gameplan.connections.forEach(c => {
      if (c.fromNodeId === nodeId || c.toNodeId === nodeId) {
        this._removeConnectionEl(c.id);
        this._renderConnection(c);
      }
    });
  },

  _removeConnectionEl(connId) {
    const hit = this._connectionsGroup.querySelector(`[data-conn-hit="${connId}"]`);
    if (hit) hit.remove();
    const line = this._connectionsGroup.querySelector(`[data-conn-id="${connId}"]`);
    if (line) line.remove();
    const label = this._connectionsGroup.querySelector(`[data-conn-label-id="${connId}"]`);
    if (label) label.remove();
  },

  _getEdgePoint(node, targetX, targetY) {
    const dx = targetX - node.x;
    const dy = targetY - node.y;
    const angle = Math.atan2(dy, dx);
    const half = this.NODE_SIZE / 2;

    if (node.type === 'transition') {
      // Circle edge
      return {
        x: node.x + Math.cos(angle) * half,
        y: node.y + Math.sin(angle) * half
      };
    } else if (node.type === 'position') {
      // Square edge — find intersection with rect boundary
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      let dist;
      if (absCos * half >= absSin * half) {
        dist = half / absCos;
      } else {
        dist = half / absSin;
      }
      return {
        x: node.x + Math.cos(angle) * dist,
        y: node.y + Math.sin(angle) * dist
      };
    } else if (node.type === 'reaction') {
      // Diamond edge — intersection with diamond boundary
      const d = this.NODE_SIZE * 0.55;
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      const dist = d / (absCos + absSin);
      return {
        x: node.x + Math.cos(angle) * dist,
        y: node.y + Math.sin(angle) * dist
      };
    } else {
      // Triangle — approximate with circle
      const r = this.TRIANGLE_SIZE * 0.4;
      return {
        x: node.x + Math.cos(angle) * r,
        y: node.y + Math.sin(angle) * r
      };
    }
  },

  // Word-wrap a label into at most two lines of ~11 characters
  _wrapLabel(text) {
    const MAX = 11;
    if (text.length <= MAX + 2) return [text];
    const words = text.split(' ');
    let line1 = '';
    let i = 0;
    while (i < words.length) {
      const candidate = line1 ? line1 + ' ' + words[i] : words[i];
      if (candidate.length > MAX && line1) break;
      line1 = candidate;
      i++;
    }
    if (line1.length > MAX + 2) line1 = line1.slice(0, MAX) + '…';
    let line2 = words.slice(i).join(' ');
    if (!line2) return [line1];
    if (line2.length > MAX + 2) line2 = line2.slice(0, MAX) + '…';
    return [line1, line2];
  },

  // Render (or re-render) a node's label as one or two centered lines
  _renderLabel(g, label) {
    const ns = 'http://www.w3.org/2000/svg';
    const old = g.querySelector('text.gp-node-label');
    if (old) old.remove();

    const lines = this._wrapLabel(label);
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('class', 'gp-node-label');

    if (lines.length === 1) {
      text.setAttribute('y', '5');
      text.textContent = lines[0];
    } else {
      text.setAttribute('y', '0');
      lines.forEach((ln, idx) => {
        const tspan = document.createElementNS(ns, 'tspan');
        tspan.setAttribute('x', '0');
        tspan.setAttribute('y', idx === 0 ? '-2' : '11');
        tspan.textContent = ln;
        text.appendChild(tspan);
      });
    }
    g.appendChild(text);
  },

  // ── Viewport ────────────────────────────────────────────────

  _applyViewport() {
    if (!this._viewport || !this._gameplan) return;
    const vp = this._gameplan.viewport;
    this._viewport.setAttribute('transform',
      `translate(${vp.x}, ${vp.y}) scale(${vp.zoom})`
    );
  },

  // ── Events ──────────────────────────────────────────────────

  _bindEvents() {
    const svg = this._svg;
    if (!svg) return;

    // Touch events
    svg.addEventListener('touchstart', (e) => this._onPointerDown(e), { passive: false });
    svg.addEventListener('touchmove', (e) => this._onPointerMove(e), { passive: false });
    svg.addEventListener('touchend', (e) => this._onPointerUp(e));
    svg.addEventListener('touchcancel', (e) => this._onPointerUp(e));

    // Mouse events
    svg.addEventListener('mousedown', (e) => this._onPointerDown(e));
    svg.addEventListener('mousemove', (e) => this._onPointerMove(e));
    svg.addEventListener('mouseup', (e) => this._onPointerUp(e));
    svg.addEventListener('mouseleave', (e) => this._onPointerUp(e));

    // Mouse wheel zoom
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const vp = this._gameplan.viewport;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      vp.zoom = Math.max(0.2, Math.min(3, vp.zoom * delta));
      this._applyViewport();
      this._scheduleSave();
    }, { passive: false });
  },

  _getPointerPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  },

  _getTouchDist(e) {
    if (!e.touches || e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  _onPointerDown(e) {
    // Pinch start
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      this._dragging = null;
      this._panning = null;
      this._pinching = {
        startDist: this._getTouchDist(e),
        origZoom: this._gameplan.viewport.zoom
      };
      return;
    }

    const pos = this._getPointerPos(e);
    const nodeEl = e.target.closest('[data-node-id]');
    const connHitEl = e.target.closest('[data-conn-hit]');

    if (nodeEl) {
      e.preventDefault();
      const nodeId = nodeEl.getAttribute('data-node-id');
      const node = this._gameplan.nodes.find(n => n.id === nodeId);
      if (!node) return;

      this._dragging = {
        nodeId: nodeId,
        startX: pos.x,
        startY: pos.y,
        origX: node.x,
        origY: node.y,
        moved: false
      };
    } else if (connHitEl) {
      // Connection tap — handle directly for mobile
      e.preventDefault();
      const connId = connHitEl.getAttribute('data-conn-hit');
      if (connId) {
        this.selectConnection(connId);
      }
    } else {
      // Pan
      e.preventDefault();
      this._panning = {
        startX: pos.x,
        startY: pos.y,
        origVpX: this._gameplan.viewport.x,
        origVpY: this._gameplan.viewport.y,
        moved: false
      };
    }
  },

  _onPointerMove(e) {
    // Pinch zoom
    if (this._pinching && e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dist = this._getTouchDist(e);
      const scale = dist / this._pinching.startDist;
      const vp = this._gameplan.viewport;
      vp.zoom = Math.max(0.2, Math.min(3, this._pinching.origZoom * scale));
      this._applyViewport();
      return;
    }

    const pos = this._getPointerPos(e);

    // Node drag
    if (this._dragging) {
      e.preventDefault();
      const dx = pos.x - this._dragging.startX;
      const dy = pos.y - this._dragging.startY;

      if (Math.abs(dx) > this._TAP_THRESHOLD || Math.abs(dy) > this._TAP_THRESHOLD) {
        this._dragging.moved = true;
      }

      const zoom = this._gameplan.viewport.zoom;
      const node = this._gameplan.nodes.find(n => n.id === this._dragging.nodeId);
      if (!node) return;

      node.x = this._dragging.origX + dx / zoom;
      node.y = this._dragging.origY + dy / zoom;

      const el = this._nodesGroup.querySelector(`[data-node-id="${node.id}"]`);
      if (el) el.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      this._updateConnections(node.id);
      return;
    }

    // Pan
    if (this._panning) {
      e.preventDefault();
      const dx = pos.x - this._panning.startX;
      const dy = pos.y - this._panning.startY;
      if (Math.abs(dx) > this._TAP_THRESHOLD || Math.abs(dy) > this._TAP_THRESHOLD) {
        this._panning.moved = true;
      }
      const vp = this._gameplan.viewport;
      vp.x = this._panning.origVpX + dx;
      vp.y = this._panning.origVpY + dy;
      this._applyViewport();
    }
  },

  _onPointerUp(e) {
    // End pinch
    if (this._pinching) {
      this._pinching = null;
      this._scheduleSave();
      return;
    }

    // End drag — check if it was a tap
    if (this._dragging) {
      const nodeId = this._dragging.nodeId;
      const wasTap = !this._dragging.moved;
      this._dragging = null;

      if (wasTap) {
        // Handle connect mode
        if (this._connectMode) {
          if (!this._connectSourceId) {
            this._connectSourceId = nodeId;
            const el = this._nodesGroup.querySelector(`[data-node-id="${nodeId}"]`);
            if (el) el.classList.add('connect-source');
          } else {
            // Remove source highlight
            const srcEl = this._nodesGroup.querySelector(`[data-node-id="${this._connectSourceId}"]`);
            if (srcEl) srcEl.classList.remove('connect-source');

            this.addConnection(this._connectSourceId, nodeId);
            // Stay in connect mode so several connections can be drawn in a row;
            // tap the Connect button, empty space, or Escape to exit.
            this._connectSourceId = null;
          }
          return;
        }

        // Regular tap — select node
        this.selectNode(nodeId);
      } else {
        this._scheduleSave();
      }
      return;
    }

    // End pan
    if (this._panning) {
      const wasTap = !this._panning.moved;
      this._panning = null;
      if (wasTap) {
        // Tapped empty space — exit connect mode and deselect everything
        if (this._connectMode) this.setConnectMode(false);
        this.selectNode(null);
        this.selectConnection(null);
      } else {
        this._scheduleSave();
      }
    }
  },

  // ── Auto-save ───────────────────────────────────────────────

  _scheduleSave() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      if (this._gameplan) {
        GameplanStore.save(this._gameplan);
      }
    }, 300);
  }
};
