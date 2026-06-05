/* playground.js — carousel window for the desktop */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Constants ─────────────────────────────────────────────────────────── */
  const ALBUMS = [
    { label: 'web design',   color: ['#667eea','#764ba2'] },
    { label: 'motion',       color: ['#f093fb','#f5576c'] },
    { label: '3d',           color: ['#4facfe','#00f2fe'] },
    { label: 'illustration', color: ['#43e97b','#38f9d7'] },
    { label: 'photography',  color: ['#fa709a','#fee140'] },
    { label: 'code',         color: ['#a18cd1','#fbc2eb'] },
    { label: 'branding',     color: ['#ffecd2','#fcb69f'] },
    { label: 'ux research',  color: ['#96fbc4','#f9f586'] },
    { label: 'typography',   color: ['#f7971e','#ffd200'] },
    { label: 'animation',    color: ['#fd746c','#ff9068'] },
    { label: 'print',        color: ['#2193b0','#6dd5ed'] },
    { label: 'product',      color: ['#cc2b5e','#753a88'] },
    { label: 'video',        color: ['#11998e','#38ef7d'] },
    { label: 'identity',     color: ['#f46b45','#eea849'] },
    { label: 'data viz',     color: ['#4776e6','#8e54e9'] },
    { label: 'spatial',      color: ['#434343','#000000'] },
    { label: 'editorial',    color: ['#e96443','#904e95'] },
  ];
  const RADIUS         = 300;
  const ACTIVE_Z_BOOST = 70;        // px — active album pops toward camera
  const N              = ALBUMS.length;
  const STEP           = 360 / N;   // degrees per album slot
  const SNAP_DUR       = 0.45;      // seconds — ring snap per step
  const FACE_DUR       = 0.38;      // seconds — album face-forward flip
  const STEP_THROTTLE  = 200;       // ms — min time between steps
  const DRAG_THRESHOLD = 6;         // px — folder drag guard

  const GENIE_EASE  = 'cubic-bezier(0.7, -0.01, 0.4, 1)';
  const GENIE_DUR   = '0.5s';
  const GENIE_TRANS = `left ${GENIE_DUR} ${GENIE_EASE}, top ${GENIE_DUR} ${GENIE_EASE}, width ${GENIE_DUR} ${GENIE_EASE}, height ${GENIE_DUR} ${GENIE_EASE}, opacity ${GENIE_DUR} ease-out, transform ${GENIE_DUR} ease-out`;

  /* ── State ─────────────────────────────────────────────────────────────── */
  let ringAngle    = 0;
  let activeIdx    = 0;
  let snapTween    = null;
  let isOpen       = false;
  let selectedEl   = null;
  let pendingOpen  = false;
  let lastStepTime = 0;
  let keyHandler   = null;

  // Per-album facing angle (0 = face-forward toward viewer, 90 = sideways in crate)
  const facingAngles = new Array(N).fill(90);
  const facingTweens = new Array(N).fill(null);
  // Per-album z-offset: active album pushes forward by ACTIVE_Z_BOOST
  const zOffsets     = new Array(N).fill(0);

  /* ── Elements ───────────────────────────────────────────────────────────── */
  const win      = document.getElementById('playground-window');
  const ring     = document.getElementById('carouselRing');
  const closeBtn = document.getElementById('playground-close-btn');
  const hint     = document.getElementById('dragHint');
  const folderEl = document.getElementById('playground-folder');
  const stageEl  = win ? win.querySelector('.carousel-stage')       : null;
  const anchorEl = win ? win.querySelector('.carousel-ring-anchor') : null;

  if (!win || !ring || !folderEl) return;

  /* ── Build ring ─────────────────────────────────────────────────────────── */
  const albumEls = [];
  ALBUMS.forEach((album, i) => {
    const el = document.createElement('div');
    el.className  = 'album';
    el.dataset.index = i;
    el.style.transform = albumTransform(i, 90);
    el.innerHTML = `
      <div class="album-face">
        <div class="album-placeholder"
             style="background:linear-gradient(135deg,${album.color[0]},${album.color[1]})">
          <span class="album-placeholder-label">${album.label}</span>
        </div>
      </div>`;
    el.addEventListener('click', () => onAlbumClick(el, album, i));
    ring.appendChild(el);
    albumEls.push(el);
  });
  ring.style.transform = 'rotateX(-18deg) rotateY(0deg)';

  /* ── Build overlays ─────────────────────────────────────────────────────── */
  const topLeft = document.createElement('div');
  topLeft.id = 'pg-top-left';
  topLeft.innerHTML = '<div class="pg-title">Artifacts</div><div class="pg-subtitle">and explorations</div>';
  topLeft.style.opacity = '0';
  win.appendChild(topLeft);

  const bottomLeft = document.createElement('div');
  bottomLeft.id = 'pg-bottom-left';
  const activeThumbEl = document.createElement('div');
  activeThumbEl.id = 'pg-active-thumb';
  const activeLabelEl = document.createElement('div');
  activeLabelEl.id = 'pg-active-label';
  bottomLeft.appendChild(activeThumbEl);
  bottomLeft.appendChild(activeLabelEl);

  const countEl = document.createElement('div');
  countEl.id = 'pg-count';

  const stripEl = document.createElement('div');
  stripEl.id = 'pg-strip';
  const stripThumbs = [];
  ALBUMS.forEach((album, i) => {
    const t = document.createElement('button');
    t.className = 'pg-strip-thumb';
    t.style.background = `linear-gradient(135deg, ${album.color[0]}, ${album.color[1]})`;
    t.addEventListener('click', () => { if (!selectedEl) snapToAlbum(i); });
    stripEl.appendChild(t);
    stripThumbs.push(t);
  });

  // Counter + strip in a right group — count is always 400px left of the strip
  const rightGroup = document.createElement('div');
  rightGroup.id = 'pg-right-group';
  rightGroup.appendChild(countEl);
  rightGroup.appendChild(stripEl);

  const bottomBarEl = document.createElement('div');
  bottomBarEl.id = 'pg-bottom-bar';
  bottomBarEl.style.opacity = '0';
  bottomBarEl.appendChild(bottomLeft);
  bottomBarEl.appendChild(rightGroup);
  win.appendChild(bottomBarEl);

  /* ── Transform helpers ──────────────────────────────────────────────────── */
  function albumTransform(i, facing, zOff = 0) {
    return `rotateY(${i * STEP}deg) translateZ(${RADIUS + zOff}px) rotateY(${facing}deg)`;
  }

  function applyRingAngle() {
    ring.style.transform = `rotateX(-18deg) rotateY(${ringAngle}deg)`;
  }

  /* ── Active index ───────────────────────────────────────────────────────── */
  // The album closest to world-front (combined world angle nearest 0°)
  function getActiveIndex() {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      let w = ((i * STEP + ringAngle) % 360 + 360) % 360;
      if (w > 180) w = 360 - w;
      if (w < bestDist) { bestDist = w; best = i; }
    }
    return best;
  }

  /* ── Album facing + z animation ─────────────────────────────────────────── */
  // Active album: faces viewer (0°) and pops forward (ACTIVE_Z_BOOST).
  // Others: sideways (90°), at base radius.
  function updateAlbumFacing(targetActive) {
    albumEls.forEach((el, i) => {
      const targetFacing = (i === targetActive) ? 0          : 90;
      const targetZ      = (i === targetActive) ? ACTIVE_Z_BOOST : 0;
      const facingDone   = Math.abs(facingAngles[i] - targetFacing) < 0.5;
      const zDone        = Math.abs(zOffsets[i]     - targetZ)      < 0.5;
      if (facingDone && zDone) return;
      if (facingTweens[i]) { facingTweens[i].kill(); }
      const proxy = { f: facingAngles[i], z: zOffsets[i] };
      facingTweens[i] = gsap.to(proxy, {
        f: targetFacing, z: targetZ,
        duration: FACE_DUR, ease: 'power2.inOut',
        onUpdate() {
          facingAngles[i] = proxy.f;
          zOffsets[i]     = proxy.z;
          el.style.transform = albumTransform(i, proxy.f, proxy.z);
        },
        onComplete() {
          facingAngles[i] = targetFacing;
          zOffsets[i]     = targetZ;
          facingTweens[i] = null;
        },
      });
    });
  }

  /* ── Update overlay UI for active album ────────────────────────────────── */
  function updateActiveUI(idx) {
    stripThumbs.forEach((t, i) => t.classList.toggle('pg-strip-active', i === idx));
    countEl.textContent = String(idx + 1).padStart(2, '0');
    const album = ALBUMS[idx];
    activeThumbEl.style.background = `linear-gradient(135deg, ${album.color[0]}, ${album.color[1]})`;
    activeLabelEl.textContent = album.label;
  }

  /* ── Snap ring to album index ───────────────────────────────────────────── */
  function snapToAlbum(idx) {
    if (snapTween) { snapTween.kill(); snapTween = null; }

    activeIdx = idx;
    updateAlbumFacing(idx);
    updateActiveUI(idx);

    // Shortest-path delta to target angle
    const target = -idx * STEP;
    let delta = target - ringAngle;
    delta = ((delta + 180) % 360 + 360) % 360 - 180;
    const endAngle = ringAngle + delta;

    if (Math.abs(delta) < 0.1) { applyRingAngle(); return; }

    const proxy = { v: ringAngle };
    snapTween = gsap.to(proxy, {
      v: endAngle, duration: SNAP_DUR, ease: 'power3.out',
      onUpdate()  { ringAngle = proxy.v;   applyRingAngle(); },
      onComplete(){ ringAngle = endAngle;  applyRingAngle(); snapTween = null; },
    });
  }

  /* ── Step ring by one album ─────────────────────────────────────────────── */
  function stepRing(dir) {
    const now = performance.now();
    if (now - lastStepTime < STEP_THROTTLE) return;
    lastStepTime = now;
    const next = ((activeIdx + dir) % N + N) % N;
    snapToAlbum(next);
  }

  /* ── Input: scroll wheel ────────────────────────────────────────────────── */
  win.addEventListener('wheel', e => {
    if (!isOpen || selectedEl) return;
    e.preventDefault();
    stepRing(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  /* ── Input: arrow keys ──────────────────────────────────────────────────── */
  function setupKeyHandler() {
    keyHandler = e => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        const panel = document.querySelector('.pg-detail');
        if (panel) closeDetail(panel);
        else closePlayground();
        return;
      }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stepRing(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepRing(1);  }
    };
    document.addEventListener('keydown', keyHandler);
  }

  function teardownKeyHandler() {
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
  }

  /* ── Folder click with drag guard ──────────────────────────────────────── */
  let folderMouseDownX = 0, folderMouseDownY = 0, folderMoved = false;

  folderEl.addEventListener('mousedown', e => {
    folderMouseDownX = e.clientX;
    folderMouseDownY = e.clientY;
    folderMoved = false;
  });
  document.addEventListener('mousemove', e => {
    if (Math.abs(e.clientX - folderMouseDownX) > DRAG_THRESHOLD ||
        Math.abs(e.clientY - folderMouseDownY) > DRAG_THRESHOLD) {
      folderMoved = true;
    }
  });
  folderEl.addEventListener('click', () => {
    if (!folderMoved) openPlayground();
  });

  /* ── Genie open ─────────────────────────────────────────────────────────── */
  function openPlayground() {
    if (isOpen) return;
    isOpen = true;

    const rect = folderEl.getBoundingClientRect();

    // Reset state
    ringAngle = 0;
    activeIdx = 0;
    facingAngles.fill(90);
    facingTweens.fill(null);
    zOffsets.fill(0);
    if (snapTween) { snapTween.kill(); snapTween = null; }

    applyRingAngle();
    albumEls.forEach((a, i) => {
      a.style.transform = albumTransform(i, 90);
      gsap.set(a, { opacity: 0, scale: 0.7 });
    });
    [topLeft, bottomBarEl].forEach(el => { el.style.opacity = '0'; });
    updateActiveUI(0);

    win.style.display    = 'flex';
    win.style.overflow   = 'hidden';
    win.style.transition = 'none';
    win.style.left       = rect.left   + 'px';
    win.style.top        = rect.top    + 'px';
    win.style.width      = rect.width  + 'px';
    win.style.height     = rect.height + 'px';
    win.style.opacity    = '0';
    win.style.transform  = 'scale(0.1)';
    win.getBoundingClientRect(); // force reflow

    win.style.transition = GENIE_TRANS;
    win.style.left       = '0px';
    win.style.top        = '0px';
    win.style.width      = '100vw';
    win.style.height     = '100vh';
    win.style.opacity    = '1';
    win.style.transform  = 'scale(1)';

    win.addEventListener('transitionend', function onOpen(e) {
      if (e.propertyName !== 'width') return;
      win.removeEventListener('transitionend', onOpen);
      win.style.transition = 'none';
      win.style.overflow   = '';
      if (window.__refreshFolderCoverage) window.__refreshFolderCoverage();

      // Stagger albums in; restore explicit transform after GSAP scale completes
      albumEls.forEach((a, i) => {
        gsap.to(a, {
          opacity: 1, scale: 1,
          duration: 0.5, delay: i * 0.06, ease: 'back.out(1.3)',
          onComplete() {
            // Hand transform back to direct management so facingAngles/zOffsets stay authoritative
            gsap.set(a, { clearProps: 'transform' });
            a.style.transform = albumTransform(i, facingAngles[i], zOffsets[i]);
          },
        });
      });

      // After all albums have appeared, flip album 0 to face the viewer
      gsap.delayedCall((N - 1) * 0.06 + 0.55, () => updateAlbumFacing(0));

      gsap.to([topLeft, bottomBarEl], { opacity: 1, duration: 0.4, delay: 0.8 });
      setupKeyHandler();
    });
  }

  /* ── Genie close ────────────────────────────────────────────────────────── */
  function closePlayground() {
    if (!isOpen) return;
    isOpen = false;

    teardownKeyHandler();
    if (snapTween) { snapTween.kill(); snapTween = null; }
    facingTweens.forEach((t, i) => { if (t) { t.kill(); facingTweens[i] = null; } });

    document.querySelectorAll('.pg-detail').forEach(el => el.remove());
    if (selectedEl) { selectedEl = null; }
    pendingOpen = false;
    if (anchorEl) { gsap.killTweensOf(anchorEl); gsap.set(anchorEl, { clearProps: 'left' }); }

    const rect = folderEl.getBoundingClientRect();
    gsap.to([topLeft, bottomBarEl], { opacity: 0, duration: 0.15 });

    win.style.overflow = 'hidden';
    win.getBoundingClientRect();
    win.style.transition = GENIE_TRANS;
    win.style.left       = rect.left   + 'px';
    win.style.top        = rect.top    + 'px';
    win.style.width      = rect.width  + 'px';
    win.style.height     = rect.height + 'px';
    win.style.opacity    = '0';
    win.style.transform  = 'scale(0.1)';

    win.addEventListener('transitionend', function onClose(e) {
      if (e.propertyName !== 'opacity') return;
      win.removeEventListener('transitionend', onClose);
      win.style.display = 'none';
      if (window.__refreshFolderCoverage) window.__refreshFolderCoverage();
    });
  }

  /* ── Album click ────────────────────────────────────────────────────────── */
  function onAlbumClick(el, album, i) {
    if (selectedEl || pendingOpen) return;

    // If this album isn't front-and-center yet, snap to it first
    if (i !== activeIdx) {
      pendingOpen = true;
      snapToAlbum(i);
      gsap.delayedCall(SNAP_DUR + 0.05, () => {
        pendingOpen = false;
        openAlbumDetail(el, album, i);
      });
      return;
    }

    openAlbumDetail(el, album, i);
  }

  function openAlbumDetail(el, album, i) {
    selectedEl = el;

    // Shift carousel right — visual centre lands 250px from the right edge
    if (anchorEl && stageEl) {
      gsap.to(anchorEl, { left: stageEl.offsetWidth - 250, duration: 0.55, ease: 'power3.inOut' });
    }

    // Dim non-active albums
    albumEls.forEach((a, j) => {
      if (j !== i) gsap.to(a, { opacity: 0.6, duration: 0.4 });
    });

    showDetail(album);
  }

  function showDetail(album) {
    const panel = document.createElement('div');
    panel.className = 'pg-detail';
    panel.innerHTML = `
      <div class="pg-detail-box">
        <div class="pg-detail-title">${album.label}</div>
        <div class="pg-detail-sub">playground</div>
        <div class="pg-detail-body">A collection of work and experiments.</div>
        <button class="pg-detail-back">← back</button>
      </div>
    `;
    document.body.appendChild(panel);

    gsap.fromTo(panel, { x: '-100%' }, { x: '0%', duration: 0.55, ease: 'power3.out' });

    panel.querySelector('.pg-detail-back').addEventListener('click', () => closeDetail(panel));
  }

  function closeDetail(panel) {
    // Slide panel out to the left
    gsap.to(panel, {
      x: '-100%', duration: 0.45, ease: 'power3.in',
      onComplete: () => panel.remove(),
    });

    // Shift carousel back to centre
    if (anchorEl && stageEl) {
      gsap.to(anchorEl, {
        left: stageEl.offsetWidth * 0.5, duration: 0.55, ease: 'power3.inOut',
        onComplete() { gsap.set(anchorEl, { clearProps: 'left' }); },
      });
    }

    // Restore albums
    albumEls.forEach(a => gsap.to(a, { opacity: 1, duration: 0.35 }));

    selectedEl = null;
    updateAlbumFacing(activeIdx);
  }

  /* ── Wire close button ──────────────────────────────────────────────────── */
  closeBtn.addEventListener('click', closePlayground);

});
