(() => {
    'use strict';

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.innerWidth <= 768) return;

    /* ── Supabase ───────────────────────────────────────────────────────────── */
    const SB_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SB_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';

    async function fetchRandomStamps(n) {
        try {
            let userStampNumber = null;
            try {
                const saved = localStorage.getItem('lh_id_card_v1');
                if (saved) userStampNumber = JSON.parse(saved)?.stampNumber ?? null;
            } catch {}

            const res = await fetch(
                `${SB_URL}/rest/v1/guest_cards?select=name,stamp_number,character_svg,border_color,card_color`,
                { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
            );
            if (!res.ok) return [];
            const all = await res.json();
            const pool = userStampNumber
                ? all.filter(c => c.stamp_number !== userStampNumber)
                : all;
            return pool.sort(() => Math.random() - 0.5).slice(0, n);
        } catch { return []; }
    }

    /* ── Config ─────────────────────────────────────────────────────────────── */
    const PLAYERS     = ['P2', 'P3', 'P4'];
    const BLOCK_SZ    = 40;
    const STEP        = BLOCK_SZ + 2;
    const RADIUS      = 3;
    const CURSOR_SZ   = 64;
    const DOCK_H      = 72;
    const SCATTER_N   = 9;
    const SPEED       = 260;
    const OPEN_RADIUS = 36;
    const HOLD_OX     = 14;
    const HOLD_OY     = Math.round(CURSOR_SZ * 0.55);

    /* ── Shapes — [col, row], row 0 = bottom, builds in array order ─────────── */
    // groundAnchor: true → row 0 always sits on the floor (above dock)
    const SHAPES = {

        // Jenga tower — 3 wide × 5 tall, floor-anchored
        jenga: {
            cells: [
                [0,0],[1,0],[2,0],
                [0,1],[1,1],[2,1],
                [0,2],[1,2],[2,2],
                [0,3],[1,3],[2,3],
                [0,4],[1,4],[2,4],
            ],
            groundAnchor: true,
        },

        // Smiley — curved mouth + eyes, no top arc
        smiley: [
            [1,0],[2,0],[3,0],           // bottom arc of mouth
            [0,1],[4,1],                 // mouth sides
            [1,2],[3,2],                 // mouth corners
            [1,4],[3,4],                 // eyes
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
            // ! stem (rows 4,3,2 filled — row 1 is the gap)
            [6,2],[6,3],[6,4],
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

        // Heart — two top bumps, filled middle, bottom point
        heart: [
            [2,0],                           // bottom point
            [1,1],[2,1],[3,1],               // lower
            [0,2],[1,2],[2,2],[3,2],[4,2],   // wide middle
            [0,3],[1,3],[2,3],[3,3],[4,3],   // upper fill
            [1,4],[3,4],                     // two bumps
        ],

        // Crown — three peaks over two solid band rows
        crown: [
            [0,0],[1,0],[2,0],[3,0],[4,0],   // base
            [0,1],[1,1],[2,1],[3,1],[4,1],   // band
            [0,2],[2,2],[4,2],               // three peaks
        ],
    };

    /* ── Shared state ────────────────────────────────────────────────────────── */
    let scene, pileZone;
    const scattered   = [];
    const pileBlocks  = [];
    let shapePlan     = [];
    let fillIndex     = 0;
    let running       = false;

    /* ── Physics (Matter.js) ─────────────────────────────────────────────────── */
    let physEngine   = null;
    let physWorld    = null;
    const physBodies = []; // { el, body, removeAt }
    let lastPhysTime = 0;
    let userDrag     = null; // { body, el, offsetX, offsetY, velX, velY }

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
        const keys    = Object.keys(SHAPES);
        const key     = keys[randInt(0, keys.length - 1)];
        const shapeDef = SHAPES[key];

        // Support both plain array and { cells, groundAnchor } object formats
        const cells       = Array.isArray(shapeDef) ? shapeDef : shapeDef.cells;
        const groundAnchor = !Array.isArray(shapeDef) && shapeDef.groundAnchor;

        const maxCol = Math.max(...cells.map(([c]) => c));
        const maxRow = Math.max(...cells.map(([,r]) => r));
        const shapeW = (maxCol + 1) * STEP;
        const shapeH = (maxRow + 1) * STEP;

        const margin  = 80;
        const lftSafe = margin;
        const rgtSafe = window.innerWidth - shapeW - margin;

        // Ground-anchored shapes always sit on the floor; others float anywhere safe
        const floorY  = window.innerHeight - DOCK_H - 10;
        const topSafe = margin + shapeH;
        const botSafe = window.innerHeight - DOCK_H - margin;

        let bestPlan  = null;
        let bestCount = Infinity;

        for (let i = 0; i < 12; i++) {
            const anchorX = lftSafe < rgtSafe ? rand(lftSafe, rgtSafe) : window.innerWidth  / 2 - shapeW / 2;
            const anchorY = groundAnchor
                ? floorY
                : (topSafe < botSafe ? rand(topSafe, botSafe) : window.innerHeight / 2);

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

    /* ── Tetris colours ──────────────────────────────────────────────────────── */
    const TETRIS_COLORS = [
        '#FF5A5A', // red
        '#FF9F1C', // orange
        '#FFD60A', // yellow
        '#4CC9F0', // cyan
        '#4361EE', // blue
        '#7B2FBE', // purple
        '#2DC653', // green
        '#F72585', // pink
    ];

    /* ── Block factory ───────────────────────────────────────────────────────── */
    function makeBlockEl(color) {
        color = color ?? TETRIS_COLORS[randInt(0, TETRIS_COLORS.length - 1)];
        const el = document.createElement('div');
        el.dataset.blockColor = color;
        el.style.cssText = `
            position:absolute; width:${BLOCK_SZ}px; height:${BLOCK_SZ}px;
            background:${color};
            box-sizing:border-box;
            border-top:3px solid rgba(255,255,255,0.55);
            border-left:3px solid rgba(255,255,255,0.55);
            border-bottom:3px solid rgba(0,0,0,0.28);
            border-right:3px solid rgba(0,0,0,0.28);
            border-radius:${RADIUS}px;
            pointer-events:auto; will-change:transform; transform-origin:center;
        `;
        return { el, color };
    }

    /* ── Scatter blocks ──────────────────────────────────────────────────────── */
    function spawnBlock() {
        if (!running) return;
        const { el, color } = makeBlockEl();
        const margin = 80;
        const x = rand(margin, window.innerWidth  - margin - BLOCK_SZ);
        const y = rand(margin, window.innerHeight - DOCK_H - margin - BLOCK_SZ);
        el.style.transform  = `translate(${x}px,${y}px)`;
        el.style.opacity    = '0';
        el.style.transition = 'opacity .4s ease';
        scene.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; });
        scattered.push({ el, x, y, color, claimed: false });
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

        if (physEngine && physWorld && typeof Matter !== 'undefined') {
            const { Bodies, Body, Composite } = Matter;
            const lifetime = 4000;

            toFall.forEach(({ el, x, y }) => {
                el.style.pointerEvents = 'none';
                el.removeEventListener('click', collapsePile);
                el.style.transition = 'none';

                const cx   = x + BLOCK_SZ / 2;
                const cy   = y + BLOCK_SZ / 2;
                const body = Bodies.rectangle(cx, cy, BLOCK_SZ - 1, BLOCK_SZ - 1, {
                    restitution:  0.3,
                    friction:     0.55,
                    frictionAir:  0.008,
                    density:      0.003,
                });
                Body.setVelocity(body,        { x: rand(-5, 5), y: rand(-14, -5) });
                Body.setAngularVelocity(body, rand(-0.25, 0.25));
                Composite.add(physWorld, body);
                physBodies.push({ el, body, removeAt: performance.now() + lifetime });
            });
        } else {
            // Fallback when Matter.js isn't loaded
            toFall.forEach(({ el, x, y }, i) => {
                el.style.pointerEvents = 'none';
                const dx    = rand(-200, 200);
                const rot   = rand(-130, 130);
                const delay = i * 28;
                el.animate([
                    { transform: `translate(${x}px,${y}px) rotate(0deg)`,                  opacity: 1,   offset: 0    },
                    { transform: `translate(${x+dx*.3}px,${y+50}px) rotate(${rot*.5}deg)`, opacity: 0.8, offset: 0.55 },
                    { transform: `translate(${x+dx}px,${y+240}px) rotate(${rot}deg)`,      opacity: 0,   offset: 1    },
                ], { duration: 1100, delay, easing: 'ease-in', fill: 'forwards' });
                setTimeout(() => el.remove(), 1100 + delay + 250);
            });
        }

        setTimeout(pickNewShape, 2200);
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

        // Clean up active TTT game
        if (ttt.active) {
            ttt.lines.forEach(el => el.remove());
            ttt.blocks.forEach(el => el.remove());
            ttt.lines  = [];
            ttt.blocks = [];
            ttt.active = false;
            ttt.npcIdx = -1;
        }

        // Drop any user-dragged block
        if (userDrag && physEngine) {
            Matter.Body.setStatic(userDrag.body, false);
            Matter.Composite.remove(physWorld, userDrag.body);
            userDrag.el.remove();
            userDrag = null;
        }

        // Clean up any in-flight physics bodies
        if (physEngine && physWorld && typeof Matter !== 'undefined') {
            physBodies.forEach(pb => {
                Matter.Composite.remove(physWorld, pb.body);
                pb.el.style.transition = `opacity ${fadeDur}ms ease`;
                pb.el.style.opacity    = '0';
                setTimeout(() => pb.el.remove(), fadeDur + 100);
            });
            physBodies.length = 0;
        }
    }

    /* ── Physics init ────────────────────────────────────────────────────────── */
    function initPhysics() {
        if (typeof Matter === 'undefined') return;
        const { Engine, Bodies, Composite } = Matter;

        physEngine = Engine.create({ gravity: { x: 0, y: 2.2 } });
        physWorld  = physEngine.world;

        const W = window.innerWidth;
        const H = window.innerHeight;

        // Ground sits just above the dock, walls on each side
        Composite.add(physWorld, [
            Bodies.rectangle(W / 2,   H - DOCK_H + 30, W + 200, 60, { isStatic: true, label: 'ground' }),
            Bodies.rectangle(-25,     H / 2,            50,  H * 2,  { isStatic: true, label: 'wallL'  }),
            Bodies.rectangle(W + 25,  H / 2,            50,  H * 2,  { isStatic: true, label: 'wallR'  }),
        ]);
    }

    /* ── Tic-Tac-Toe ────────────────────────────────────────────────────────── */
    const TTT_CELL       = STEP + 10;   // spacing between cell top-lefts
    const TTT_USER_COLOR = '#DEDEDE';
    const TTT_NPC_COLORS = ['#FF3838', '#10BD0D', '#FF9C00'];

    const ttt = {
        active: false, npcIdx: -1,
        board: Array(9).fill(null), // null | 'user' | 'npc'
        cells: [],                  // { x, y } × 9
        blocks: [],                 // placed block elements
        lines: [],                  // grid line elements
        waitingForUser: false,
        gameOver: false,
        npcColor: '',
    };

    function startTicTacToe(npcIdx) {
        if (ttt.active) return;
        const W = window.innerWidth, H = window.innerHeight;
        const gridSpan = 2 * TTT_CELL + BLOCK_SZ;
        const ax = rand(W * 0.2, W * 0.72 - gridSpan);
        const ay = rand(H * 0.18, H * 0.55 - gridSpan);

        ttt.active         = true;
        ttt.npcIdx         = npcIdx;
        ttt.board          = Array(9).fill(null);
        ttt.blocks         = [];
        ttt.lines          = [];
        ttt.waitingForUser = true;
        ttt.gameOver       = false;
        ttt.npcColor       = TTT_NPC_COLORS[npcIdx % TTT_NPC_COLORS.length];

        ttt.cells = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                ttt.cells.push({ x: ax + c * TTT_CELL, y: ay + r * TTT_CELL });
            }
        }
        drawTTTGrid(ax, ay, gridSpan);
    }

    function drawTTTGrid(ax, ay, span) {
        const lineH = span + 12;
        const thick = 3;
        // gap centre between cells: ax + BLOCK_SZ + (TTT_CELL - BLOCK_SZ) / 2 = ax + TTT_CELL - TTT_CELL/2 + BLOCK_SZ/2
        const gap1 = ax + BLOCK_SZ + (TTT_CELL - BLOCK_SZ) / 2 - thick / 2;
        const gap2 = gap1 + TTT_CELL;
        const gapR1 = ay + BLOCK_SZ + (TTT_CELL - BLOCK_SZ) / 2 - thick / 2;
        const gapR2 = gapR1 + TTT_CELL;

        [[gap1, ay - 6, thick, lineH], [gap2, ay - 6, thick, lineH],
         [ax - 6, gapR1, lineH, thick], [ax - 6, gapR2, lineH, thick]
        ].forEach(([x, y, w, h]) => {
            const el = document.createElement('div');
            el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;
                background:rgba(0,0,0,0.13);border-radius:2px;pointer-events:none;z-index:3;
                opacity:0;transition:opacity 0.35s ease;`;
            scene.appendChild(el);
            ttt.lines.push(el);
            requestAnimationFrame(() => { el.style.opacity = '1'; });
        });
    }

    function tttCheckWin(board, player) {
        return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
            .some(([a,b,c]) => board[a] === player && board[b] === player && board[c] === player);
    }

    function tttNPCPick() {
        // Win → block user → center → corner → any
        for (const player of ['npc', 'user']) {
            for (let i = 0; i < 9; i++) {
                if (ttt.board[i] !== null) continue;
                const t = [...ttt.board]; t[i] = player;
                if (tttCheckWin(t, player)) return i;
            }
        }
        if (ttt.board[4] === null) return 4;
        const corners = [0,2,6,8].filter(i => ttt.board[i] === null);
        if (corners.length) return corners[randInt(0, corners.length - 1)];
        const empty = ttt.board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
        return empty.length ? empty[randInt(0, empty.length - 1)] : -1;
    }

    function placeTTTBlock(cellIdx, player) {
        if (cellIdx < 0 || ttt.board[cellIdx] !== null) return false;
        const { x, y } = ttt.cells[cellIdx];
        const color = player === 'user' ? TTT_USER_COLOR : ttt.npcColor;
        const { el } = makeBlockEl(color);
        el.style.transform     = `translate(${x}px,${y}px)`;
        el.style.opacity       = '0';
        el.style.transition    = 'opacity 0.2s ease, transform 0.2s ease';
        el.style.pointerEvents = 'none';
        el.style.zIndex        = '4';
        scene.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; });
        ttt.board[cellIdx] = player;
        ttt.blocks.push(el);
        return true;
    }

    function endTicTacToe(result) {
        ttt.gameOver = true;
        ttt.waitingForUser = false;
        const delay = result === 'draw' ? 900 : 1400;
        setTimeout(() => {
            ttt.lines.forEach(el => {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 400);
            });
            if (physEngine && physWorld) {
                ttt.blocks.forEach(el => {
                    const r  = el.getBoundingClientRect();
                    const cx = r.left + r.width  / 2;
                    const cy = r.top  + r.height / 2;
                    const body = Matter.Bodies.rectangle(cx, cy, BLOCK_SZ - 1, BLOCK_SZ - 1,
                        { restitution: 0.35, friction: 0.5, frictionAir: 0.008, density: 0.003 });
                    Matter.Body.setVelocity(body,        { x: rand(-7, 7), y: rand(-14, -5) });
                    Matter.Body.setAngularVelocity(body, rand(-0.3, 0.3));
                    Matter.Composite.add(physWorld, body);
                    el.style.transition = 'none';
                    physBodies.push({ el, body, removeAt: performance.now() + 4500 });
                });
            } else {
                ttt.blocks.forEach(el => el.remove());
            }
            ttt.blocks = [];
            ttt.lines  = [];
            ttt.active = false;
            ttt.npcIdx = -1;
        }, delay);
    }

    function onTTTCellClick(mx, my) {
        if (!ttt.active || !ttt.waitingForUser || ttt.gameOver) return false;
        const cellIdx = ttt.cells.findIndex(({ x, y }) =>
            mx >= x && mx <= x + BLOCK_SZ && my >= y && my <= y + BLOCK_SZ
        );
        if (cellIdx < 0 || ttt.board[cellIdx] !== null) return false;

        placeTTTBlock(cellIdx, 'user');
        ttt.waitingForUser = false;

        if (tttCheckWin(ttt.board, 'user'))         { setTimeout(() => endTicTacToe('user-wins'), 350); return true; }
        if (ttt.board.every(v => v !== null))        { setTimeout(() => endTicTacToe('draw'),      350); return true; }

        // Send the NPC to its chosen cell
        const npc = NPCS[ttt.npcIdx];
        if (!npc) { endTicTacToe('draw'); return true; }
        const pick = tttNPCPick();
        if (pick < 0) { endTicTacToe('draw'); return true; }
        npc.tttPick = pick;
        const { x, y } = ttt.cells[pick];
        npc.state = 'moving';
        npc.journey(x + BLOCK_SZ / 2, y + BLOCK_SZ / 2, 'ttt-place');
        return true;
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
            this.tttPick    = -1;

            this.el = document.createElement('img');
            this.el.src = `/images/${player}/Pointer.png`;
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
            this.img('Pointer');

            // 30% chance to start a tic-tac-toe game if none is active
            const myIdx = PLAYERS.indexOf(this.player);
            if (!ttt.active && Math.random() < 0.30) {
                startTicTacToe(myIdx);
                this.state = 'ttt-waiting';
                // Walk to a spot near the grid to watch
                const { x, y } = ttt.cells[0];
                this.journey(x - 60, y - 40, 'ttt-watching');
            } else {
                this.pickBlock();
            }
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
            this.img('Closed');
            this.held    = this.claimed;
            this.claimed = null;
            const i = scattered.indexOf(this.held);
            if (i !== -1) scattered.splice(i, 1);
            setTimeout(spawnBlock, rand(1200, 3200));

            const pos = nextShapePos();
            if (!pos) { this.img('Pointer'); this.retreat(); return; }
            this.journey(pos.x - HOLD_OX, pos.y - HOLD_OY, 'atPile');
        }

        drop() {
            fillIndex++;
            this.img('Open');
            addToPile(this.held.el);
            this.held = null;
            this.visitCount++;
            this.state = 'pausing';
            this.timer = performance.now() + rand(200, 500);
        }

        retreat() {
            this.img('Pointer');
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
                        this.img('Open');
                    }
                    if (t >= 1) {
                        if      (this.nextState === 'atBlock')     { this.img('Open'); this.state = 'hovering'; this.timer = now + rand(120, 350); }
                        else if (this.nextState === 'atPile')      { this.drop(); }
                        else if (this.nextState === 'offscreen')   { this.el.style.opacity = '0'; this.state = 'resting'; this.restUntil = now + rand(800, 2500); }
                        else if (this.nextState === 'ttt-watching') { this.state = 'ttt-waiting'; }
                        else if (this.nextState === 'ttt-place')   {
                            // Arrived at chosen TTT cell — pause then place
                            this.img('Open');
                            this.state = 'ttt-placing';
                            this.timer = now + rand(350, 700);
                        }
                    }
                    break;
                }

                case 'ttt-waiting':
                    // Stay put; onTTTCellClick will assign next move via journey()
                    if (!ttt.active) { this.resetToRest(500); }
                    break;

                case 'ttt-placing':
                    if (now >= this.timer) {
                        this.img('Closed');
                        setTimeout(() => { if (this.state !== 'resting') this.img('Open'); }, 250);
                        placeTTTBlock(this.tttPick, 'npc');
                        this.tttPick = -1;

                        if (tttCheckWin(ttt.board, 'npc')) {
                            setTimeout(() => endTicTacToe('npc-wins'), 400);
                            this.state = 'ttt-waiting';
                        } else if (ttt.board.every(v => v !== null)) {
                            setTimeout(() => endTicTacToe('draw'), 400);
                            this.state = 'ttt-waiting';
                        } else {
                            ttt.waitingForUser = true;
                            this.state = 'ttt-waiting';
                        }
                    }
                    break;
            }
        }
    }

    /* ── Player stamps ───────────────────────────────────────────────────────── */
    let playerStampsEl = null;

    function showPlayerStamps(stamps) {
        if (playerStampsEl) { playerStampsEl.remove(); playerStampsEl = null; }
        if (!stamps.length) return;

        const container = document.createElement('div');
        container.id = 'bg-player-stamps';
        container.style.cssText = `
            position: fixed; top: 52px; right: 18px; z-index: 9998;
            display: flex; flex-direction: column; gap: 5px;
            align-items: flex-end; pointer-events: none;
        `;

        const PLAYER_COLORS = ['#FF3838', '#10BD0D', '#FF9C00'];

        const rows = stamps.map((stamp, i) => {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex; align-items: center; gap: 6px;
                opacity: 0; transform: translateY(-10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
            `;

            const textCol = document.createElement('div');
            textCol.style.cssText = `
                display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
            `;

            const nameEl = document.createElement('span');
            nameEl.textContent = stamp.name || ':(';
            nameEl.style.cssText = `
                font-family: 'SFMedium', sans-serif; font-size: 10px;
                color: rgba(0,0,0,0.35); white-space: nowrap;
            `;

            const numEl = document.createElement('span');
            numEl.textContent = stamp.stamp_number || '?';
            numEl.style.cssText = `
                font-family: 'SFMedium', sans-serif; font-size: 7px;
                color: rgba(0,0,0,0.25); white-space: nowrap; line-height: 1;
            `;

            textCol.appendChild(nameEl);
            textCol.appendChild(numEl);

            const avatarWrap = document.createElement('div');
            avatarWrap.style.cssText = `width: 28px; height: 28px; flex-shrink: 0;`;

            const avatar = document.createElement('div');
            avatar.style.cssText = `
                width: 28px; height: 28px; border-radius: 50%;
                border: 2px solid ${PLAYER_COLORS[i]};
                background: ${stamp.card_color || '#f5f5f5'};
                ${stamp.character_svg ? `background-image: url('${stamp.character_svg}'); background-size: cover; background-position: center;` : ''}
            `;

            avatarWrap.appendChild(avatar);
            row.appendChild(textCol);
            row.appendChild(avatarWrap);
            container.appendChild(row);
            return row;
        });

        document.body.appendChild(container);
        playerStampsEl = container;

        // Staggered slide-down + fade in
        rows.forEach((row, i) => {
            setTimeout(() => {
                row.style.opacity   = '1';
                row.style.transform = 'translateY(0)';
            }, i * 80);
        });
    }

    function hidePlayerStamps() {
        if (!playerStampsEl) return;
        const el = playerStampsEl;
        playerStampsEl = null;

        // Staggered slide-up + fade out
        const rows = [...el.children];
        rows.forEach((row, i) => {
            setTimeout(() => {
                row.style.opacity   = '0';
                row.style.transform = 'translateY(-10px)';
            }, i * 60);
        });
        setTimeout(() => el.remove(), rows.length * 60 + 320);
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
            transition: opacity 0.6s ease; opacity: 0;
        `;

        // Fade in after the system UI boot animation fully settles
        setTimeout(() => { btn.style.opacity = '0.5'; }, 1400);

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
                fetchRandomStamps(3).then(showPlayerStamps);
            } else {
                NPCS.forEach(c => c.resetToRest());
                clearAllFade();
                hidePlayerStamps();
                setTimeout(() => { scene.style.display = 'none'; }, 650);
                btn.style.opacity = '0.5';
                btn.style.color   = 'rgba(0,0,0,0.35)';
            }
        });

        document.body.appendChild(btn);
    }

    /* ── User block drag ────────────────────────────────────────────────────── */
    function onAnyMouseDown(e) {
        // TTT cell click — intercept before block drag
        if (running && ttt.active) {
            if (onTTTCellClick(e.clientX, e.clientY)) { e.stopPropagation(); return; }
        }
    }

    function onSceneMouseDown(e) {
        const el = e.target.closest('[data-block-color]');
        if (!el || !running || !physEngine) return;

        // Don't steal blocks an NPC is carrying or en route to
        if (NPCS.some(n => n.held?.el === el || n.claimed?.el === el)) return;

        e.preventDefault();
        e.stopPropagation();

        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;

        // Evict from pile (keep the click→collapsePile listener; it fires after mouseup
        // and collapses whatever pile blocks remain)
        const pi = pileBlocks.findIndex(pb => pb.el === el);
        if (pi !== -1) pileBlocks.splice(pi, 1);
        // Evict from scattered
        const si = scattered.findIndex(b => b.el === el);
        if (si !== -1) scattered.splice(si, 1);

        // Evict from active physics list (we'll re-add on release)
        const xi = physBodies.findIndex(pb => pb.el === el);
        if (xi !== -1) {
            Matter.Composite.remove(physWorld, physBodies[xi].body);
            physBodies.splice(xi, 1);
        }

        // Static body while dragging — acts as a solid pusher for other bodies
        const body = Matter.Bodies.rectangle(cx, cy, BLOCK_SZ - 1, BLOCK_SZ - 1, {
            isStatic: true, restitution: 0.5, friction: 0.3, label: 'user-drag',
        });
        Matter.Composite.add(physWorld, body);

        el.style.transition = 'none';
        el.style.opacity    = '0.85';
        el.style.zIndex     = '8';

        userDrag = {
            body, el,
            offsetX: cx - e.clientX,
            offsetY: cy - e.clientY,
            velX: 0, velY: 0,
            prevX: cx, prevY: cy,
        };
    }

    function onDocMouseMove(e) {
        if (!userDrag) return;
        const { body, el, offsetX, offsetY } = userDrag;
        const cx = e.clientX + offsetX;
        const cy = e.clientY + offsetY;
        userDrag.velX = cx - userDrag.prevX;
        userDrag.velY = cy - userDrag.prevY;
        userDrag.prevX = cx;
        userDrag.prevY = cy;
        Matter.Body.setPosition(body, { x: cx, y: cy });
        el.style.transform = `translate(${cx - BLOCK_SZ / 2}px,${cy - BLOCK_SZ / 2}px)`;
    }

    function onDocMouseUp() {
        if (!userDrag) return;
        const { body, el, velX, velY } = userDrag;
        userDrag = null;
        Matter.Body.setStatic(body, false);
        Matter.Body.setVelocity(body, { x: velX * 0.9, y: velY * 0.9 });
        Matter.Body.setAngularVelocity(body, (velX - velY) * 0.012);
        el.style.opacity = '1';
        el.style.zIndex  = '';
        physBodies.push({ el, body, removeAt: performance.now() + 5000 });
    }

    /* ── RAF loop ────────────────────────────────────────────────────────────── */
    function loop(now) {
        // Step physics engine and sync block DOM elements
        if (physEngine && physBodies.length) {
            const delta = lastPhysTime ? Math.min(now - lastPhysTime, 50) : 16.67;
            Matter.Engine.update(physEngine, delta);
            lastPhysTime = now;

            for (let i = physBodies.length - 1; i >= 0; i--) {
                const pb = physBodies[i];
                const { x, y } = pb.body.position;
                const a = pb.body.angle;
                pb.el.style.transform = `translate(${x - BLOCK_SZ / 2}px,${y - BLOCK_SZ / 2}px) rotate(${a}rad)`;

                // Fade out in last 700ms of lifetime
                const timeLeft = pb.removeAt - now;
                if (timeLeft < 700 && pb.el.style.opacity !== '0') {
                    pb.el.style.transition = 'opacity 0.7s ease';
                    pb.el.style.opacity    = '0';
                }
                if (timeLeft <= 0) {
                    Matter.Composite.remove(physWorld, pb.body);
                    pb.el.remove();
                    physBodies.splice(i, 1);
                }
            }
        } else {
            lastPhysTime = 0;
        }

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

        PLAYERS.forEach(p => ['Pointer','Open','Closed'].forEach(s => { new Image().src = `/images/${p}/${s}.png`; }));

        pileZone = document.createElement('div');
        pileZone.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;pointer-events:none;';
        document.body.appendChild(pileZone);

        initPhysics();
        pickNewShape();
        PLAYERS.forEach((p, i) => NPCS.push(new NPC(p, i)));
        buildToggleBtn();

        document.addEventListener('mousedown', onAnyMouseDown,  { capture: true });
        scene.addEventListener('mousedown',    onSceneMouseDown);
        document.addEventListener('mousemove', onDocMouseMove,  { passive: true });
        document.addEventListener('mouseup',   onDocMouseUp);

        requestAnimationFrame(loop);
    }

    if (document.body.classList.contains('system-ready')) {
        init();
    } else {
        document.addEventListener('system:ready', init, { once: true });
    }
})();
