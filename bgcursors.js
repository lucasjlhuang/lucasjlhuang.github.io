(() => {
    'use strict';

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.innerWidth <= 768) return;

    /* ── Config ─────────────────────────────────────────────────────────────── */
    const PLAYERS     = ['P2', 'P3', 'P4'];
    const IMG_COUNT   = 59;
    const BLOCK_SZ    = 40;
    const STEP        = BLOCK_SZ + 3;
    const RADIUS      = 4;
    const CURSOR_SZ   = 64;
    const DOCK_H      = 72;
    const SCATTER_N   = 9;
    const SPEED       = 260;
    const OPEN_RADIUS = 36;
    const HOLD_OX     = 14;
    const HOLD_OY     = Math.round(CURSOR_SZ * 0.55);

    /* ── Shapes — [col, row], row 0 = bottom, builds in array order ─────────── */
    const SHAPES = {

        smiley: [
            [1,0],[2,0],[3,0],
            [0,1],[4,1],
            [1,2],[3,2],
            [0,4],[4,4],
            [1,5],[3,5],
            [1,6],[2,6],[3,6],
        ],

        // "hi!" — H, i, and exclamation mark
        hi: [
            // H left leg (bottom → top)
            [0,0],[0,1],[0,2],[0,3],[0,4],
            // H crossbar
            [1,2],
            // H right leg
            [2,0],[2,1],[2,2],[2,3],[2,4],
            // i stem
            [4,0],[4,1],[4,2],
            // i dot
            [4,4],
            // ! stem
            [6,1],[6,2],[6,3],[6,4],
            // ! dot
            [6,0],
        ],

        // Star — top point, wide band, lower center, two bottom points
        star: [
            [0,0],[4,0],          // bottom points
            [1,1],[2,1],[3,1],    // lower center
            [0,2],[1,2],[2,2],[3,2],[4,2],  // widest row
            [2,3],                // top point
        ],

        // House — floor, two walls, ^ roof with peak
        house: [
            [0,0],[1,0],[2,0],[3,0],[4,0],   // floor
            [0,1],[4,1],                      // walls
            [0,2],[4,2],
            [1,3],[3,3],                      // roof slants
            [2,4],                            // peak
        ],

        // Triangle — filled pyramid, builds bottom → peak
        triangle: [
            [0,0],[1,0],[2,0],[3,0],[4,0],   // base
            [1,1],[2,1],[3,1],               // middle
            [2,2],                           // peak
        ],

        // Square — hollow outline
        square: [
            [0,0],[1,0],[2,0],[3,0],         // bottom edge
            [0,1],[3,1],                     // sides
            [0,2],[3,2],
            [0,3],[1,3],[2,3],[3,3],         // top edge
        ],

        // Circle — block approximation of a circle outline
        circle: [
            [1,0],[2,0],[3,0],               // bottom arc
            [0,1],[4,1],                     // sides
            [0,2],[4,2],
            [0,3],[4,3],
            [1,4],[2,4],[3,4],               // top arc
        ],
    };

    /* ── Shared state ────────────────────────────────────────────────────────── */
    let scene, pileZone;
    const scattered   = [];
    const pileBlocks  = [];
    let shapePlan     = [];
    let fillIndex     = 0;
    let running       = false;

    /* ── Utils ───────────────────────────────────────────────────────────────── */
    function rand(a, b)        { return Math.random() * (b - a) + a; }
    function randInt(a, b)     { return Math.floor(rand(a, b + 1)); }
    function lerp(a, b, t)     { return a + (b - a) * t; }
    function ease(t)           { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function dist(ax,ay,bx,by) { return Math.hypot(bx-ax, by-ay); }

    /* ── Shape plan ──────────────────────────────────────────────────────────── */
    function planOverlaps(plan) {
        // A proposed position overlaps if it's within one block-width of any existing pile block
        const pad = BLOCK_SZ + 6;
        return plan.some(pos =>
            pileBlocks.some(pb =>
                Math.abs(pb.x - pos.x) < pad && Math.abs(pb.y - pos.y) < pad
            )
        );
    }

    function pickNewShape() {
        const keys  = Object.keys(SHAPES);
        const key   = keys[randInt(0, keys.length - 1)];
        const cells = SHAPES[key];

        const maxCol = Math.max(...cells.map(([c]) => c));
        const maxRow = Math.max(...cells.map(([,r]) => r));
        const shapeW = (maxCol + 1) * STEP;
        const shapeH = (maxRow + 1) * STEP;

        const margin  = 80;
        const topSafe = margin + shapeH;
        const botSafe = window.innerHeight - DOCK_H - margin;
        const lftSafe = margin;
        const rgtSafe = window.innerWidth - shapeW - margin;

        // Try up to 12 random positions, keep the one with fewest overlaps
        let bestPlan   = null;
        let bestCount  = Infinity;

        for (let i = 0; i < 12; i++) {
            const anchorX = lftSafe < rgtSafe ? rand(lftSafe, rgtSafe) : window.innerWidth  / 2 - shapeW / 2;
            const anchorY = topSafe < botSafe ? rand(topSafe, botSafe) : window.innerHeight / 2;

            const plan = cells.map(([col, row]) => ({
                x: anchorX + col * STEP,
                y: anchorY - row * STEP,
            }));

            const overlapCount = plan.filter(pos =>
                pileBlocks.some(pb =>
                    Math.abs(pb.x - pos.x) < BLOCK_SZ + 6 &&
                    Math.abs(pb.y - pos.y) < BLOCK_SZ + 6
                )
            ).length;

            if (overlapCount === 0) { bestPlan = plan; break; }
            if (overlapCount < bestCount) { bestCount = overlapCount; bestPlan = plan; }
        }

        shapePlan = bestPlan;
        fillIndex = 0;
    }

    function nextShapePos() {
        return fillIndex < shapePlan.length ? shapePlan[fillIndex] : null;
    }

    /* ── Block factory ───────────────────────────────────────────────────────── */
    function makeBlockEl(idx) {
        idx = idx ?? randInt(1, IMG_COUNT);
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;width:${BLOCK_SZ}px;height:${BLOCK_SZ}px;
            background:#fff;overflow:hidden;pointer-events:none;will-change:transform;
            border-radius:${RADIUS}px;transform-origin:center;
            box-shadow:0 2px 8px rgba(0,0,0,.13),0 0 0 .5px rgba(0,0,0,.07);`;
        const img = document.createElement('img');
        img.src = `/images/prescreen-small/${idx}.png`;
        img.draggable = false;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;';
        el.appendChild(img);
        return { el, idx };
    }

    /* ── Scatter blocks ──────────────────────────────────────────────────────── */
    function spawnBlock() {
        if (!running) return;
        const { el, idx } = makeBlockEl();
        const margin = 80;
        const x = rand(margin, window.innerWidth  - margin - BLOCK_SZ);
        const y = rand(margin, window.innerHeight - DOCK_H - margin - BLOCK_SZ);
        el.style.transform  = `translate(${x}px,${y}px)`;
        el.style.opacity    = '0';
        el.style.transition = 'opacity .4s ease';
        scene.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; });
        scattered.push({ el, x, y, idx, claimed: false });
    }

    /* ── Pile / shape ────────────────────────────────────────────────────────── */
    function addToPile(carriedEl) {
        const pos = shapePlan[fillIndex - 1];
        if (!pos) { carriedEl.remove(); return; }

        // Snap the carried element to exact target — no element swap = no teleport
        carriedEl.style.transition = 'none';
        carriedEl.style.transform  = `translate(${pos.x}px,${pos.y}px)`;
        carriedEl.style.opacity    = '1';
        carriedEl.style.pointerEvents = 'auto';
        carriedEl.addEventListener('click', collapsePile);

        pileBlocks.push({ el: carriedEl, x: pos.x, y: pos.y });
    }

    /* ── Collapse (click-only) ───────────────────────────────────────────────── */
    function collapsePile() {
        if (pileBlocks.length === 0) { pickNewShape(); return; }

        const toFall = pileBlocks.splice(0);
        fillIndex = 0;

        toFall.forEach(({ el, x, y }, i) => {
            el.style.pointerEvents = 'none';
            const dx    = rand(-200, 200);
            const rot   = rand(-130, 130);
            const delay = i * 28;

            el.animate([
                { transform: `translate(${x}px,${y}px) rotate(0deg)`,                  opacity: 1,    offset: 0    },
                { transform: `translate(${x}px,${y}px) rotate(-7deg)`,                 opacity: 1,    offset: 0.08 },
                { transform: `translate(${x}px,${y}px) rotate(9deg)`,                  opacity: 1,    offset: 0.16 },
                { transform: `translate(${x}px,${y}px) rotate(-6deg)`,                 opacity: 1,    offset: 0.24 },
                { transform: `translate(${x}px,${y}px) rotate(4deg)`,                  opacity: 1,    offset: 0.32 },
                { transform: `translate(${x}px,${y}px) rotate(0deg)`,                  opacity: 1,    offset: 0.38 },
                { transform: `translate(${x+dx*.3}px,${y+50}px) rotate(${rot*.5}deg)`, opacity: 0.8,  offset: 0.58 },
                { transform: `translate(${x+dx}px,${y+240}px)   rotate(${rot}deg)`,    opacity: 0,    offset: 1    },
            ], { duration: 1100, delay, easing: 'ease-in', fill: 'forwards' });

            setTimeout(() => el.remove(), 1100 + delay + 250);
        });

        setTimeout(pickNewShape, 1500);
    }

    /* ── Fade-out clear (for toggle off) ─────────────────────────────────────── */
    function clearAllFade() {
        const fadeDur = 500;

        [...scattered].forEach(b => {
            b.el.style.transition = `opacity ${fadeDur}ms ease`;
            b.el.style.opacity    = '0';
            setTimeout(() => b.el.remove(), fadeDur + 100);
        });
        scattered.length = 0;

        [...pileBlocks].forEach(({ el }) => {
            el.style.pointerEvents = 'none';
            el.style.transition    = `opacity ${fadeDur}ms ease`;
            el.style.opacity       = '0';
            setTimeout(() => el.remove(), fadeDur + 100);
        });
        pileBlocks.length = 0;
        fillIndex = 0;
    }

    /* ── NPC cursor ──────────────────────────────────────────────────────────── */
    class NPC {
        constructor(player, index) {
            this.player = player;
            this.x = -300; this.y = -300;
            this.sx = 0; this.sy = 0;
            this.tx = 0; this.ty = 0;
            this.t0 = 0; this.dur = 0;
            this.nextState = '';
            this.state     = 'resting';
            this.restUntil = performance.now() + rand(3000 + index * 400, 6000 + index * 400);
            this.held       = null;
            this.claimed    = null;
            this.visitCount = 0;
            this.visitGoal  = 0;
            this.timer      = 0;

            this.el = document.createElement('img');
            this.el.src = `/images/${player}/pointer.png`;
            this.el.draggable = false;
            this.el.style.cssText = `position:absolute;width:${CURSOR_SZ}px;height:${CURSOR_SZ}px;
                pointer-events:none;will-change:transform;opacity:0;transition:opacity .35s ease;z-index:6;`;
            scene.appendChild(this.el);
        }

        img(s) { this.el.src = `/images/${this.player}/${s}.png`; }

        journey(tx, ty, next) {
            this.sx = this.x; this.sy = this.y;
            this.tx = tx;     this.ty = ty;
            this.t0  = performance.now();
            this.dur = Math.max(300, (dist(this.x, this.y, tx, ty) / SPEED) * 1000);
            this.nextState = next;
            this.state = 'moving';
        }

        resetToRest(extraDelay = 0) {
            this.el.style.opacity = '0';
            if (this.held)    { this.held.el.remove();        this.held    = null; }
            if (this.claimed) { this.claimed.claimed = false; this.claimed = null; }
            this.state     = 'resting';
            this.restUntil = performance.now() + extraDelay + rand(3000, 8000);
        }

        appear() {
            const side = randInt(0, 3);
            if      (side === 0) { this.x = rand(100, window.innerWidth - 100); this.y = -CURSOR_SZ; }
            else if (side === 1) { this.x = window.innerWidth + CURSOR_SZ;      this.y = rand(80, window.innerHeight * .65); }
            else if (side === 2) { this.x = rand(150, window.innerWidth - 150); this.y = window.innerHeight + CURSOR_SZ; }
            else                 { this.x = -CURSOR_SZ;                         this.y = rand(80, window.innerHeight * .65); }

            this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
            this.el.style.opacity   = '1';
            this.visitCount = 0;
            this.visitGoal  = randInt(2, 5);
            this.img('pointer');
            this.pickBlock();
        }

        pickBlock() {
            if (this.visitCount >= this.visitGoal) { this.retreat(); return; }
            if (!nextShapePos()) { pickNewShape(); }

            const avail = scattered.filter(b => !b.claimed);
            if (!avail.length) { this.retreat(); return; }

            const block = avail.reduce((best, b) =>
                dist(this.x, this.y, b.x, b.y) < dist(this.x, this.y, best.x, best.y) ? b : best
            );
            block.claimed = true;
            this.claimed  = block;
            this.journey(block.x + BLOCK_SZ / 2, block.y + BLOCK_SZ / 2, 'atBlock');
        }

        doGrab() {
            this.img('closed');
            this.held    = this.claimed;
            this.claimed = null;
            const i = scattered.indexOf(this.held);
            if (i !== -1) scattered.splice(i, 1);
            setTimeout(spawnBlock, rand(1200, 3200));

            const pos = nextShapePos();
            if (!pos) { this.img('pointer'); this.retreat(); return; }
            this.journey(pos.x - HOLD_OX, pos.y - HOLD_OY, 'atPile');
        }

        drop() {
            fillIndex++;
            this.img('open');
            addToPile(this.held.el);
            this.held = null;
            this.visitCount++;
            this.state = 'pausing';
            this.timer = performance.now() + rand(200, 500);
        }

        retreat() {
            this.img('pointer');
            this.journey(rand(50, window.innerWidth - 50), window.innerHeight + CURSOR_SZ + 30, 'offscreen');
        }

        update(now) {
            switch (this.state) {
                case 'resting':
                    if (running && now >= this.restUntil) this.appear();
                    break;
                case 'hovering':
                    if (now >= this.timer) this.doGrab();
                    break;
                case 'pausing':
                    if (now >= this.timer) this.pickBlock();
                    break;
                case 'moving': {
                    const t  = Math.min(1, (now - this.t0) / this.dur);
                    const et = ease(t);
                    this.x = lerp(this.sx, this.tx, et);
                    this.y = lerp(this.sy, this.ty, et);
                    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

                    if (this.held) {
                        this.held.el.style.transition = 'none';
                        this.held.el.style.transform  = `translate(${this.x + HOLD_OX}px,${this.y + HOLD_OY}px)`;
                    }
                    if (this.nextState === 'atBlock' && dist(this.x, this.y, this.tx, this.ty) < OPEN_RADIUS) {
                        this.img('open');
                    }
                    if (t >= 1) {
                        if      (this.nextState === 'atBlock')   { this.img('open'); this.state = 'hovering'; this.timer = now + rand(120, 350); }
                        else if (this.nextState === 'atPile')    { this.drop(); }
                        else if (this.nextState === 'offscreen') { this.el.style.opacity = '0'; this.state = 'resting'; this.restUntil = now + rand(800, 2500); }
                    }
                    break;
                }
            }
        }
    }

    /* ── Toggle button ───────────────────────────────────────────────────────── */
    function buildToggleBtn() {
        const btn = document.createElement('button');
        btn.id = 'bgcursor-toggle';
        btn.textContent = 'add players';
        btn.style.cssText = `
            position: fixed; top: 18px; right: 18px; z-index: 9998;
            background: rgba(255,255,255,0.6);
            backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(0,0,0,0.12); border-radius: 20px;
            padding: 4px 10px;
            font-family: 'SFMedium', sans-serif; font-size: 11px;
            color: rgba(0,0,0,0.35); letter-spacing: 0.3px;
            cursor: pointer; user-select: none; white-space: nowrap;
            transition: opacity 0.2s ease; opacity: 0.5;
        `;

        btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = running ? '0.7' : '0.5'; });

        btn.addEventListener('click', () => {
            running = !running;
            if (running) {
                scene.style.display = '';
                pickNewShape();
                for (let i = 0; i < SCATTER_N; i++) setTimeout(spawnBlock, i * 300);
                NPCS.forEach((c, i) => c.resetToRest(i * 400));
                btn.style.opacity = '0.7';
                btn.style.color   = 'rgba(0,0,0,0.55)';
            } else {
                NPCS.forEach(c => c.resetToRest());
                clearAllFade();
                setTimeout(() => { scene.style.display = 'none'; }, 650);
                btn.style.opacity = '0.5';
                btn.style.color   = 'rgba(0,0,0,0.35)';
            }
        });

        document.body.appendChild(btn);
    }

    /* ── RAF loop ────────────────────────────────────────────────────────────── */
    function loop(now) {
        NPCS.forEach(c => c.update(now));
        requestAnimationFrame(loop);
    }

    const NPCS = [];

    /* ── Init ────────────────────────────────────────────────────────────────── */
    function init() {
        scene = document.createElement('div');
        scene.id = 'bg-cursor-scene';
        scene.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;display:none;';
        document.body.appendChild(scene);

        PLAYERS.forEach(p => ['pointer','open','closed'].forEach(s => { new Image().src = `/images/${p}/${s}.png`; }));

        pileZone = document.createElement('div');
        pileZone.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;pointer-events:none;';
        document.body.appendChild(pileZone);

        pickNewShape();
        PLAYERS.forEach((p, i) => NPCS.push(new NPC(p, i)));
        buildToggleBtn();
        requestAnimationFrame(loop);
    }

    if (document.body.classList.contains('system-ready')) {
        init();
    } else {
        document.addEventListener('system:ready', init, { once: true });
    }
})();
