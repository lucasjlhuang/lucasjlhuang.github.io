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
            try { const s = localStorage.getItem('lh_id_card_v1'); if (s) userStampNumber = JSON.parse(s)?.stampNumber ?? null; } catch {}
            const res = await fetch(
                `${SB_URL}/rest/v1/guest_cards?select=name,stamp_number,character_svg,border_color,card_color`,
                { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
            );
            if (!res.ok) return [];
            const all  = await res.json();
            const pool = userStampNumber ? all.filter(c => c.stamp_number !== userStampNumber) : all;
            return pool.sort(() => Math.random() - 0.5).slice(0, n);
        } catch { return []; }
    }

    /* ── Config ─────────────────────────────────────────────────────────────── */
    const PLAYERS      = ['P2', 'P3', 'P4'];
    const NPC_JENGA    = 0;   // Jenga builder
    const NPC_BUILDER_A = 1;  // Shape builder
    const NPC_EXPLORER  = 2;  // Portfolio explorer + TTT player
    const NPC_BUILDER_B = NPC_EXPLORER; // alias kept for older references

    // Physics collision categories
    const CAT_DEFAULT = 0x0001;  // hose / scattered blocks
    const CAT_TTT     = 0x0002;  // placed TTT blocks (hose blocks pass through)

    const CHAT_COLORS  = { P2: '#FF3838', P3: '#10BD0D', P4: '#FF9C00' };

    const BLOCK_SZ    = 40;
    const STEP        = BLOCK_SZ + 2;
    const RADIUS      = 3;
    const CURSOR_SZ   = 64;
    const DOCK_H      = 72;
    const SCATTER_N   = 15;
    const SPEED       = 260;
    const OPEN_RADIUS = 36;
    const HOLD_OX     = 14;
    const HOLD_OY     = Math.round(CURSOR_SZ * 0.55);

    // Jenga tower — bottom-left
    const JENGA_CX        = 110;
    const JENGA_MAX_H     = 14;
    const JENGA_KNOCK_SPD = 4;   // min speed of thrown block to collapse tower

    // Block spawn — bottom-right hose
    const SPAWN_X_MIN = () => window.innerWidth - 230;
    const SPAWN_X_MAX = () => window.innerWidth - 60;

    const MAX_PHYS_BODIES   = 20;
    const TTT_IMPATIENCE_MS = 9000;  // ms before builder abandons waiting and goes back to building

    const TTT_NAG_MSGS      = ['your turn!', 'hellooooooo', '...', 'still there?', 'psst'];
    const TTT_ABANDON_MSGS  = ['brb lol', "i'll be back"];
    const TTT_WIN_USER_MSGS = ['you got me!', 'good game :)'];
    const TTT_WIN_NPC_MSGS  = ['chicken dinner', 'you almost had me!'];
    const TTT_DRAW_MSGS     = ['stalemate!'];
    const JENGA_COLLAPSE_MSGS = ['womp womp', 'nooooooooo', ':('];
    const NPC_INTRO_MSGS    = ['Hi!!!', 'Hey there ;)', "What's up", "Let's goooo", 'This is awesome'];
    const NPC_REACT_MSGS    = ['ohhh yea', 'agreed', 'nice', 'totally', 'fr fr', 'same', 'yep', '100%', 'lmaooo'];
    const TTT_USER_PLACE_MSGS = ['oh good move', 'i was going to go there', 'drat', 'oooooo', 'okay i see you'];
    const TTT_NPC_PLACE_MSGS  = ['i think i got the win', "i'm not sure about that one", 'hmmmm'];
    const JENGA_PLACE_MSGS    = ['how tall can I get this', 'higher! higher!', 'i need more blocks', 'up up up', "please don't fall"];
    const BUILDER_BUILD_MSGS  = ['build build build', 'need another block!', 'this goes here'];
    const HOVER_REACT_MAP = {
        'Instagram':   ['omg yes', 'lol'],
        'LinkedIn':    ["let's go", 'networking!'],
        'Resume':      ['hire him!', 'agreed!!'],
        'Spotify':     ['link the playlist'],
        'Hobbies':     ['fr tho'],
        'Trash':       ['interesting...'],
        'NSL':         ['tickets????'],
        'pmc':         ['mail!!'],
        'VoGro':       ['so good!', 'impressed'],
        'Gilbert':     ["that's what i'm saying"],
        'Bank of Taiwan': ['so cool!'],
        'CHC':         ['agreed'],
        'HESS':        ['fr fr', 'facts', 'bars'],
    };
    const NPC_GENERAL_MSGS = [
        "i'd hire him tbh",
        "my stamp's so cool!!",
        "did you check out his hobbies?",
        "the stamp gallery is so creative",
        "you can drag the desktop icons???!",
        "i didn't notice the playground at first",
        "wait is that a Wii pointer???",
        "how long did this take to make",
        "i love all the little details",
        "has anyone played tic tac toe yet?",
    ];
    const JENGA_ONLY_MSGS = [
        "someone play jenga with me",
    ];

    /* ── NPC hover chat & dock effects ─────────────────────────────────────── */
    const HOVER_CHAT_MAP = {
        // Dock items — matched by li[data-label]
        'Instagram':   ["i'm definitely following you", 'you were in Taiwan???!?', 'love your pictures'],
        'LinkedIn':    ['love the linkedin', "let's connect!", 'shot you a message ;)'],
        'Photoshop':   ['magic wand go brrr', "where's the eraser", 'ctrl+z everything'],
        'Illustrator': ['bezier curves!', 'vector life', 'anchor points!'],
        'Figma':       ['auto layout!', 'who needs pixels', 'components!'],
        'VS Code':     ['tab vs spaces?', 'git blame...', '404: coffee not found'],
        'E-mail':      ['check your inbox!', 'unread: 999', "you've got mail!"],
        'Resume':      ['hire this person!', "you've got great experiences"],
        'Spotify':     ['playlist approved', 'bangers'],
        'Hobbies':     ["let's play MTG", 'your hobbies are sick', 'a person of culture'],
        'Trash':       ["what's this?"],
        // Project folders — matched by .projectimage src keyword
        'NSL':              ["go women's soccer!", 'can you get me tickets?', 'soccer!!'],
        'pmc':              ['mail gang', 'i signed up', 'looking forward to the mail club'],
        'VoGro':            ['love VoGro!', 'this was your first app???', 'so cool'],
        'About me':         ['hmmmm...', 'you look just like your siblings', 'love your adventures'],
        'Gilbert':          ["who's gilbert?", 'gilbert? the dude?', 'sick concept!'],
        'Bank of Taiwan':   ['So that\'s what you were doing in Taiwan', 'love the translation work', 'awesome designs!'],
        'CHC':              ['cool project', 'impressive!', 'i love trains'],
        'HESS':             ['we love an educator', 'this is amazing', "i'd hire him"],
    };

    function npcHoverKey(el) {
        const li = el.closest?.('li[data-label]');
        if (li?.dataset?.label && HOVER_CHAT_MAP[li.dataset.label]) return li.dataset.label;
        const folder = el.closest?.('.projectfolder');
        if (folder) {
            const img = folder.querySelector('.projectimage');
            const src = img?.src || img?.getAttribute('src') || '';
            for (const key of Object.keys(HOVER_CHAT_MAP)) {
                if (src.includes(key)) return key;
            }
            const alt = img?.alt || '';
            for (const key of Object.keys(HOVER_CHAT_MAP)) {
                if (alt.includes(key)) return key;
            }
        }
        return null;
    }

    function npcMagnifyDock(npcX) {
        const dockEl = document.querySelector('.dock');
        if (!dockEl || typeof gsap === 'undefined') return;
        const MAX_SCALE = 1.3, RADIUS = 110, EXPAND = 17.5;
        const dr = dockEl.getBoundingClientRect();
        if (npcX < dr.left - EXPAND || npcX > dr.right + EXPAND) return;
        dockEl.querySelectorAll('li:not(.divider)').forEach(item => {
            const r    = item.getBoundingClientRect();
            const cx   = r.left + r.width / 2;
            const t    = Math.max(0, 1 - Math.abs(npcX - cx) / RADIUS);
            gsap.to(item, { scale: 1 + (MAX_SCALE - 1) * t, duration: 0.15, ease: 'power2.out', overwrite: 'auto' });
        });
    }

    function npcResetDock() {
        const dockEl = document.querySelector('.dock');
        if (!dockEl || typeof gsap === 'undefined') return;
        dockEl.querySelectorAll('li:not(.divider)').forEach(item => {
            gsap.to(item, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
        });
    }

    /* ── Builder shapes ─────────────────────────────────────────────────────── */
    const SHAPES = {
        smiley: [
            [1,0],[2,0],[3,0],
            [0,1],[4,1],
            [1,2],[3,2],
            [1,4],[3,4],
        ],
        hi: [
            [0,0],[0,1],[0,2],[0,3],[0,4],
            [1,2],
            [2,0],[2,1],[2,2],[2,3],[2,4],
            [4,0],[4,1],[4,2],
            [4,4],
            [6,2],[6,3],[6,4],
            [6,0],
        ],
        star: [
            [0,0],[4,0],
            [1,1],[2,1],[3,1],
            [0,2],[1,2],[2,2],[3,2],[4,2],
            [2,3],
        ],
        house: [
            [0,0],[1,0],[2,0],[3,0],[4,0],
            [0,1],[4,1],
            [0,2],[4,2],
            [1,3],[3,3],
            [2,4],
        ],
        heart: [
            [2,0],
            [1,1],[2,1],[3,1],
            [0,2],[1,2],[2,2],[3,2],[4,2],
            [0,3],[1,3],[2,3],[3,3],[4,3],
            [1,4],[3,4],
        ],
        crown: [
            [0,0],[1,0],[2,0],[3,0],[4,0],
            [0,1],[1,1],[2,1],[3,1],[4,1],
            [0,2],[2,2],[4,2],
        ],
    };

    const SHAPE_CHAT = {
        smiley: [':)', 'smile!', 'happy happy happy'],
        hi:     ['hi!!', 'hello world', 'voila'],
        star:   ['★ star', '★★★'],
        house:  ['dream home', 'finally finished'],
        heart:  ['♥'],
        crown:  ['all hail', 'my masterpiece'],
    };

    /* ── Shared state ────────────────────────────────────────────────────────── */
    let scene, pileZone;

    // Pile blocks available for NPCs: { el, body, color, claimed }
    const scattered = [];

    // Shape being built: { plan:[{x,y}], blocks:[{el,body,x,y}], key } | null
    let currentBuild = null;

    // Completed shapes on screen: [{ blocks, key }]  — max 2
    const completedShapes = [];

    let running = false;

    /* ── Physics ─────────────────────────────────────────────────────────────── */
    let physEngine = null;
    let physWorld  = null;
    let userMouseY = -999;  // tracks user cursor Y to avoid interfering with dock
    // Free-flying / debris blocks: { el, body }  — no time-based removal
    const physBodies = [];
    let lastPhysTime  = 0;
    let lastCapCheck  = 0;
    let userDrag        = null;
    const userDragSway  = { rot: 0 };  // GSAP animates this while user carries a block
    let dragLayer       = null;        // high-z-index container for the block being dragged

    /* ── Utils ───────────────────────────────────────────────────────────────── */
    function rand(a, b)        { return Math.random() * (b - a) + a; }
    function randInt(a, b)     { return Math.floor(rand(a, b + 1)); }
    function lerp(a, b, t)     { return a + (b - a) * t; }
    function ease(t)           { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function dist(ax,ay,bx,by) { return Math.hypot(bx-ax, by-ay); }
    function floorY()          { return window.innerHeight; }

    /* ── Chat system ─────────────────────────────────────────────────────────── */
    let chatEl = null;

    function buildChat() {
        chatEl = document.createElement('div');
        chatEl.id = 'bg-chat';
        chatEl.style.cssText = `
            position: fixed;
            bottom: ${DOCK_H + 12}px;
            left: 18px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            pointer-events: none;
            max-width: 220px;
        `;
        document.body.appendChild(chatEl);
    }

    function chat(player, message) {
        if (!chatEl) return;
        const color  = CHAT_COLORS[player] || '#aaa';
        const bubble = document.createElement('div');
        bubble.style.cssText = `
            padding: 8px 11px;
            font-family: 'SFRegular', sans-serif;
            font-size: 10.5px;
            line-height: 1.55;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            background: ${color};
            color: #FFFFFF;
            border: 1.5px solid ${color};
            box-shadow: 0 2px 12px rgba(0,0,0,0.18);
            white-space: nowrap;
        `;
        bubble.textContent = message;
        chatEl.appendChild(bubble);

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(bubble,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }
            );
            gsap.to(bubble, {
                opacity: 0, y: -6, duration: 0.18, ease: 'power2.in',
                delay: 4.5,
                onComplete: () => bubble.remove(),
            });
        } else {
            bubble.style.opacity = '0';
            requestAnimationFrame(() => {
                bubble.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
                bubble.style.opacity    = '1';
                bubble.style.transform  = 'translateY(0)';
            });
            setTimeout(() => {
                bubble.style.opacity = '0';
                setTimeout(() => bubble.remove(), 220);
            }, 4500);
        }

        // Keep at most 4 visible
        while (chatEl.children.length > 4) {
            const old = chatEl.firstChild;
            if (!old) break;
            if (typeof gsap !== 'undefined') gsap.killTweensOf(old);
            old.remove();
        }
    }

    // npcChat — activity chats (TTT, Jenga, shape, hover) fire unconditionally
    function npcChat(player, message) { chat(player, message); }

    // Global pool for general idle chatter — each message used once before reshuffling
    let generalMsgPool = null; // null = not yet initialized; empty array = all used up
    function nextGeneralMsg() {
        if (generalMsgPool === null)
            generalMsgPool = [...NPC_GENERAL_MSGS].sort(() => Math.random() - 0.5);
        return generalMsgPool.length ? generalMsgPool.pop() : null;
    }

    /* ── Physics init ────────────────────────────────────────────────────────── */
    function initPhysics() {
        if (typeof Matter === 'undefined') return;
        const { Engine, Bodies, Composite, Events } = Matter;
        physEngine = Engine.create({ gravity: { x: 0, y: 2.2 } });
        physWorld  = physEngine.world;
        const W = window.innerWidth, H = window.innerHeight;
        Composite.add(physWorld, [
            Bodies.rectangle(W / 2,  H + 30,   W + 200, 60, { isStatic: true, label: 'ground' }),
            Bodies.rectangle(-25,    H / 2,     50, H * 2,   { isStatic: true, label: 'wallL'  }),
            Bodies.rectangle(W + 25, H / 2,     50, H * 2,   { isStatic: true, label: 'wallR'  }),
        ]);

        // Jenga tower blocks stay static, but a fast-enough thrown block collapses them
        Events.on(physEngine, 'collisionStart', event => {
            if (jengaTower.falling || !jengaTower.blocks.length) return;
            for (const pair of event.pairs) {
                const { bodyA, bodyB } = pair;
                const isJenga = jengaTower.blocks.some(b => b.body === bodyA || b.body === bodyB);
                if (!isJenga) continue;
                const other = jengaTower.blocks.some(b => b.body === bodyA) ? bodyB : bodyA;
                const spd   = Math.hypot(other.velocity.x, other.velocity.y);
                if (spd > JENGA_KNOCK_SPD) { jengaCollapse(); break; }
            }
        });
    }

    /* ── Tetris colours ──────────────────────────────────────────────────────── */
    const TETRIS_COLORS = [
        '#FF5A5A','#FF9F1C','#FFD60A','#4CC9F0',
        '#4361EE','#7B2FBE','#2DC653','#F72585',
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

    function recolorBlock(el, color) {
        el.style.background    = color;
        el.dataset.blockColor  = color;
        el.style.borderTop     = '3px solid rgba(255,255,255,0.55)';
        el.style.borderLeft    = '3px solid rgba(255,255,255,0.55)';
        el.style.borderBottom  = '3px solid rgba(0,0,0,0.28)';
        el.style.borderRight   = '3px solid rgba(0,0,0,0.28)';
    }

    /* ── Spawn blocks — hose from top into bottom-right ─────────────────────── */
    function spawnBlock() {
        if (!running) return;

        const { el, color } = makeBlockEl();
        el.style.opacity = '1';
        scene.appendChild(el);

        const x      = rand(SPAWN_X_MIN(), SPAWN_X_MAX() - BLOCK_SZ);
        const spawnY = -BLOCK_SZ - rand(0, 40);

        el.style.transform = `translate(${x}px,${spawnY}px)`;

        if (physEngine && physWorld && typeof Matter !== 'undefined') {
            const body = Matter.Bodies.rectangle(
                x + BLOCK_SZ / 2, spawnY + BLOCK_SZ / 2,
                BLOCK_SZ - 2, BLOCK_SZ - 2,
                { restitution: 0.25, friction: 0.6, frictionAir: 0.04, density: 0.003 }
            );
            Matter.Body.setVelocity(body, { x: rand(-1.5, 1.5), y: rand(1, 3) });
            Matter.Composite.add(physWorld, body);
            scattered.push({ el, body, color, claimed: false });
        } else {
            scattered.push({ el, body: null, color, claimed: false, x, y: spawnY });
        }
    }

    /* ── Physics body cap ────────────────────────────────────────────────────── */
    function enforcePhysCap() {
        if (physBodies.length <= MAX_PHYS_BODIES) return;
        const excess   = physBodies.length - MAX_PHYS_BODIES;
        const sleeping = physBodies.filter(pb =>
            pb.body && Math.abs(pb.body.velocity.x) < 0.3 && Math.abs(pb.body.velocity.y) < 0.3
        );
        sleeping.slice(0, excess).forEach(pb => {
            const i = physBodies.indexOf(pb);
            if (i !== -1) physBodies.splice(i, 1);
            if (pb.body && physEngine) Matter.Composite.remove(physWorld, pb.body);
            pb.el.style.transition = 'opacity 0.3s ease';
            pb.el.style.opacity    = '0';
            setTimeout(() => pb.el.remove(), 350);
        });
    }

    /* ── Exclusion zones ────────────────────────────────────────────────────── */
    function inExclusionZone(x, y) {
        const { ax, ay, gridSpan } = tttGridOrigin();
        const tP = 40;
        if (x + BLOCK_SZ > ax - tP && x < ax + gridSpan + tP &&
            y + BLOCK_SZ > ay - tP && y < ay + gridSpan + tP) return true;

        const jP = 70;
        if (x < JENGA_CX + BLOCK_SZ + jP &&
            y + BLOCK_SZ > floorY() - JENGA_MAX_H * (BLOCK_SZ + 3) - jP) return true;

        return false;
    }

    /* ── Multi-shape system ──────────────────────────────────────────────────── */
    function allShapeBlocks() {
        const blocks = [];
        if (currentBuild) currentBuild.blocks.forEach(b => blocks.push(b));
        completedShapes.forEach(s => s.blocks.forEach(b => blocks.push(b)));
        return blocks;
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
        const lftSafe = margin;
        const rgtSafe = window.innerWidth - shapeW - margin;
        const topSafe = margin + shapeH;
        const botSafe = window.innerHeight - DOCK_H - margin;

        const existing = allShapeBlocks();
        const pad = BLOCK_SZ + 6;

        let plan = null;
        for (let attempt = 0; attempt < 20; attempt++) {
            const ax = lftSafe < rgtSafe ? rand(lftSafe, rgtSafe) : window.innerWidth / 2 - shapeW / 2;
            const ay = topSafe < botSafe ? rand(topSafe, botSafe) : window.innerHeight / 2;

            const candidate = cells.map(([col, row]) => ({
                x: ax + col * STEP,
                y: ay - row * STEP,
            }));

            const hasOverlap    = candidate.some(pos =>
                existing.some(pb => Math.abs(pb.x - pos.x) < pad && Math.abs(pb.y - pos.y) < pad)
            );
            const hasExclusion  = candidate.some(({ x, y }) => inExclusionZone(x, y));

            if (!hasOverlap && !hasExclusion) { plan = candidate; break; }
            if (!plan) plan = candidate;
        }

        currentBuild = { plan, blocks: [], key };
    }

    function currentShapePos() {
        if (!currentBuild) return null;
        return currentBuild.blocks.length < currentBuild.plan.length
            ? currentBuild.plan[currentBuild.blocks.length]
            : null;
    }

    function addToCurrentShape(carriedEl, body) {
        if (!currentBuild) return;
        const idx = currentBuild.blocks.length;
        const pos = currentBuild.plan[idx];
        if (!pos) { carriedEl.remove(); if (body && physEngine) Matter.Composite.remove(physWorld, body); return; }

        carriedEl.style.transition    = 'none';
        carriedEl.style.transformOrigin = '';
        carriedEl.style.transform     = `translate(${pos.x}px,${pos.y}px)`;
        carriedEl.style.opacity       = '1';
        carriedEl.style.pointerEvents = 'auto';

        if (body && physEngine && typeof Matter !== 'undefined') {
            Matter.Body.setStatic(body, true);
            Matter.Body.setVelocity(body,        { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setAngle(body, 0);
            Matter.Body.setPosition(body, { x: pos.x + BLOCK_SZ / 2, y: pos.y + BLOCK_SZ / 2 });
        }

        const entry = { el: carriedEl, body: body || null, x: pos.x, y: pos.y };
        carriedEl.addEventListener('click', () => collapseShapeOf(entry));
        currentBuild.blocks.push(entry);

        if (currentBuild.blocks.length >= currentBuild.plan.length) {
            const finished = currentBuild;
            completedShapes.push(finished);
            const shapeMsgs = SHAPE_CHAT[finished.key] || ['done!'];
            npcChat(NPCS[NPC_BUILDER_A]?.player || 'P3', shapeMsgs[randInt(0, shapeMsgs.length - 1)]);
            currentBuild = null;

            // Start building the next shape right away
            pickNewShape();

            // Deconstruct this shape after 4–6 seconds
            setTimeout(() => {
                if (!running) return;
                if (!completedShapes.includes(finished)) return; // already gone
                const builderA = NPCS[NPC_BUILDER_A];
                const busy = s => ['ttt-picking','ttt-placing','ttt-waiting','ttt-watching',
                                   'decon-fetch','decon-grab','decon-drop'].includes(s);
                const builder = (builderA && !busy(builderA.state)) ? builderA : null;
                if (!builder) return;
                builder._releaseHeld();
                builder._releaseClaimed();
                builder.deconTarget = finished;
                builder.state = 'decon-fetch';
            }, rand(4000, 6000));
        }
    }

    function collapseShapeOf(entry) {
        let target = null;
        if (currentBuild && currentBuild.blocks.includes(entry)) target = currentBuild;
        else target = completedShapes.find(s => s.blocks.includes(entry));
        if (!target) return;

        const blocks = target.blocks.splice(0);
        if (target === currentBuild) currentBuild = null;
        else { const i = completedShapes.indexOf(target); if (i !== -1) completedShapes.splice(i, 1); }

        releaseBlocks(blocks);
        setTimeout(maybeStartNewShape, 2200);
    }

    function releaseBlocks(blocks) {
        if (physEngine && physWorld && typeof Matter !== 'undefined') {
            blocks.forEach(({ el, body, x, y }) => {
                el.style.pointerEvents = 'auto';
                el.style.transition    = 'none';
                if (body) {
                    // Reset collision filter — TTT blocks had CAT_TTT; restore default so they collide normally
                    Matter.Body.set(body, 'collisionFilter', { category: CAT_DEFAULT, mask: 0xFFFFFFFF });
                    Matter.Body.setStatic(body, false);
                    Matter.Body.setVelocity(body,        { x: rand(-5, 5),   y: rand(-14, -5)   });
                    Matter.Body.setAngularVelocity(body, rand(-0.25, 0.25));
                    physBodies.push({ el, body });
                } else {
                    const cx = (x || 0) + BLOCK_SZ / 2, cy = (y || 0) + BLOCK_SZ / 2;
                    const nb = Matter.Bodies.rectangle(cx, cy, BLOCK_SZ - 1, BLOCK_SZ - 1,
                        { restitution: 0.3, friction: 0.55, frictionAir: 0.008, density: 0.003 });
                    Matter.Body.setVelocity(nb,        { x: rand(-5, 5), y: rand(-14, -5) });
                    Matter.Body.setAngularVelocity(nb, rand(-0.25, 0.25));
                    Matter.Composite.add(physWorld, nb);
                    physBodies.push({ el, body: nb });
                }
            });
        } else {
            blocks.forEach(({ el, x, y }, i) => {
                el.style.pointerEvents = 'none';
                const dx = rand(-200, 200), rot = rand(-130, 130), delay = i * 28;
                el.animate([
                    { transform: `translate(${x}px,${y}px) rotate(0deg)`,                  opacity: 1,   offset: 0    },
                    { transform: `translate(${x+dx*.3}px,${y+50}px) rotate(${rot*.5}deg)`, opacity: 0.8, offset: 0.55 },
                    { transform: `translate(${x+dx}px,${y+240}px) rotate(${rot}deg)`,       opacity: 0,   offset: 1    },
                ], { duration: 1100, delay, easing: 'ease-in', fill: 'forwards' });
                setTimeout(() => el.remove(), 1100 + delay + 250);
            });
        }
    }

    function maybeStartNewShape() {
        if (!running) return;
        pickNewShape();
    }

    /* ── Fade-out clear ──────────────────────────────────────────────────────── */
    function clearAllFade() {
        const fadeDur = 500;

        [...scattered].forEach(b => {
            b.el.style.transition = `opacity ${fadeDur}ms ease`;
            b.el.style.opacity    = '0';
            if (b.body && physEngine) Matter.Composite.remove(physWorld, b.body);
            setTimeout(() => b.el.remove(), fadeDur + 100);
        });
        scattered.length = 0;

        allShapeBlocks().forEach(({ el, body }) => {
            el.style.transition = `opacity ${fadeDur}ms ease`;
            el.style.opacity    = '0';
            if (body && physEngine) Matter.Composite.remove(physWorld, body);
            setTimeout(() => el.remove(), fadeDur + 100);
        });
        if (currentBuild) { currentBuild.blocks = []; currentBuild = null; }
        completedShapes.length = 0;

        if (ttt.active) {
            ttt.blocks.forEach(({ el, body }) => {
                if (body && physEngine) Matter.Composite.remove(physWorld, body);
                el.remove();
            });
            ttt.blocks = [];
            ttt.active = false;
            ttt.npcIdx = -1;
            ttt.board  = Array(9).fill(null);
        }

        ttt.lines.forEach(el => el.remove());
        ttt.lines     = [];
        ttt.gridDrawn = false;

        jengaTower.blocks.forEach(({ el, body }) => {
            el.style.transition = `opacity ${fadeDur}ms ease`;
            el.style.opacity    = '0';
            if (body && physEngine) Matter.Composite.remove(physWorld, body);
            setTimeout(() => el.remove(), fadeDur + 100);
        });
        jengaTower.blocks.length = 0;
        jengaTower.placing       = false;
        jengaTower.falling       = false;

        if (userDrag && physEngine) {
            Matter.Composite.remove(physWorld, userDrag.body);
            userDrag.el.remove();
            userDrag = null;
        }
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

    /* ── Jenga tower ─────────────────────────────────────────────────────────── */
    const jengaTower = {
        blocks:  [],   // [{ el, body, cx, x, y }]  — static while in tower
        placing: false,
        falling: false,
    };

    function jengaNextPos() {
        const h      = jengaTower.blocks.length;
        const lastCX = h > 0 ? jengaTower.blocks[h - 1].cx : JENGA_CX;
        const maxOff = BLOCK_SZ * 0.38;
        const offset = rand(-maxOff, maxOff);
        const cx     = Math.max(JENGA_CX - BLOCK_SZ * 0.8,
                        Math.min(JENGA_CX + BLOCK_SZ * 0.8, lastCX + offset));
        const y      = floorY() - (h + 1) * (BLOCK_SZ + 2);
        return { cx, x: cx - BLOCK_SZ / 2, y };
    }

    function jengaCollapse() {
        if (jengaTower.falling) return;
        jengaTower.falling = true;
        jengaTower.placing = false;
        const blocks = jengaTower.blocks.splice(0);

        // Release tower blocks as dynamic debris
        if (physEngine && physWorld && typeof Matter !== 'undefined') {
            blocks.forEach(({ el, body }) => {
                el.style.pointerEvents = 'none';
                if (body) {
                    Matter.Body.setStatic(body, false);
                    Matter.Body.setVelocity(body,        { x: rand(-6, 6), y: rand(-10, -2) });
                    Matter.Body.setAngularVelocity(body, rand(-0.3, 0.3));
                    physBodies.push({ el, body });
                }
            });
        } else {
            releaseBlocks(blocks);
        }

        npcChat(NPCS[NPC_JENGA]?.player || 'P2', JENGA_COLLAPSE_MSGS[randInt(0, JENGA_COLLAPSE_MSGS.length - 1)]);
        setTimeout(() => {
            jengaTower.falling = false;
            NPCS[NPC_JENGA].resetToRest(rand(800, 1600));
        }, 2800);
    }

    function jengaPlaceBlock(el, body, pos) {
        el.style.transition     = 'none';
        el.style.transformOrigin = '';
        el.style.transform      = `translate(${pos.x}px,${pos.y}px)`;
        el.style.pointerEvents  = 'auto';
        el.style.zIndex         = '3';

        if (body && physEngine && typeof Matter !== 'undefined') {
            Matter.Body.setStatic(body, true);
            Matter.Body.setVelocity(body,        { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setAngle(body, 0);
            Matter.Body.setPosition(body, { x: pos.cx, y: pos.y + BLOCK_SZ / 2 });
        }

        jengaTower.blocks.push({ el, body: body || null, cx: pos.cx, x: pos.x, y: pos.y });
        jengaTower.placing = false;
    }

    /* ── Tic-Tac-Toe ─────────────────────────────────────────────────────────── */
    const TTT_CELL       = STEP + 10;
    const TTT_USER_COLOR = '#008CFF';
    const TTT_NPC_COLORS = ['#FF3838', '#10BD0D', '#FF9C00'];

    const ttt = {
        active: false, npcIdx: -1,
        board:  Array(9).fill(null),
        cells:  [],
        blocks: [],
        lines:  [],
        gridDrawn:     false,
        waitingForUser: false,
        gameOver:       false,
        npcColor:       '',
    };

    function tttGridOrigin() {
        const gridSpan = 2 * TTT_CELL + BLOCK_SZ;
        return {
            ax: window.innerWidth - gridSpan - 80,
            ay: (window.innerHeight - gridSpan) / 2,
            gridSpan,
        };
    }

    function ensureTTTGrid() {
        if (ttt.gridDrawn) return;
        const { ax, ay, gridSpan } = tttGridOrigin();
        ttt.cells = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
            ttt.cells.push({ x: ax + c * TTT_CELL, y: ay + r * TTT_CELL });

        const lineH = gridSpan + 12;
        const thick = 3;
        const gap1  = ax + BLOCK_SZ + (TTT_CELL - BLOCK_SZ) / 2 - thick / 2;
        const gap2  = gap1 + TTT_CELL;
        const gR1   = ay + BLOCK_SZ + (TTT_CELL - BLOCK_SZ) / 2 - thick / 2;
        const gR2   = gR1 + TTT_CELL;

        [[gap1, ay - 6, thick, lineH],[gap2, ay - 6, thick, lineH],
         [ax - 6, gR1, lineH, thick],[ax - 6, gR2, lineH, thick]
        ].forEach(([x, y, w, h]) => {
            const el = document.createElement('div');
            el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;
                background:rgba(0,0,0,0.1);border-radius:2px;pointer-events:none;z-index:3;
                opacity:0;transition:opacity 0.4s ease;`;
            scene.appendChild(el);
            ttt.lines.push(el);
            requestAnimationFrame(() => { el.style.opacity = '1'; });
        });
        ttt.gridDrawn = true;
    }

    function startTicTacToe(npcIdx) {
        if (ttt.active) return;
        ttt.active         = true;
        ttt.npcIdx         = npcIdx;
        ttt.board          = Array(9).fill(null);
        ttt.blocks         = [];
        ttt.waitingForUser = true;
        ttt.gameOver       = false;
        ttt.npcColor       = CHAT_COLORS[NPCS[npcIdx]?.player] || TTT_NPC_COLORS[npcIdx % TTT_NPC_COLORS.length];
    }

    function tttCheckWin(board, player) {
        return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
            .some(([a,b,c]) => board[a] === player && board[b] === player && board[c] === player);
    }

    function tttNPCPick() {
        for (const p of ['npc','user']) for (let i = 0; i < 9; i++) {
            if (ttt.board[i] !== null) continue;
            const t = [...ttt.board]; t[i] = p;
            if (tttCheckWin(t, p)) return i;
        }
        if (ttt.board[4] === null) return 4;
        const corners = [0,2,6,8].filter(i => ttt.board[i] === null);
        if (corners.length) return corners[randInt(0, corners.length - 1)];
        const empty = ttt.board.map((v,i) => v===null?i:-1).filter(i=>i!==-1);
        return empty.length ? empty[randInt(0, empty.length-1)] : -1;
    }

    function placeTTTBlock(cellIdx, player, existingEl, existingBody) {
        if (cellIdx < 0 || ttt.board[cellIdx] !== null) return false;
        const { x, y } = ttt.cells[cellIdx];
        const color = player === 'user' ? TTT_USER_COLOR : ttt.npcColor;

        let el, body;
        if (existingEl) {
            el   = existingEl;
            body = existingBody || null;
            recolorBlock(el, color);
            el.style.transition      = 'none';
            el.style.transformOrigin = '';
            el.style.pointerEvents   = 'none';
            el.style.zIndex          = '4';
            el.style.transform       = `translate(${x}px,${y}px)`;
            if (body && physEngine && typeof Matter !== 'undefined') {
                Matter.Body.setStatic(body, true);
                Matter.Body.setVelocity(body,        { x:0, y:0 });
                Matter.Body.setAngularVelocity(body, 0);
                Matter.Body.setAngle(body, 0);
                Matter.Body.setPosition(body, { x: x + BLOCK_SZ/2, y: y + BLOCK_SZ/2 });
                // Hose blocks (CAT_DEFAULT) pass through TTT placed blocks
                Matter.Body.set(body, 'collisionFilter', { category: CAT_TTT, mask: 0xFFFFFFFE });
            }
        } else {
            const made = makeBlockEl(color);
            el = made.el; body = null;
            el.style.cssText += `transform:translate(${x}px,${y}px);opacity:0;transition:opacity 0.2s ease;pointer-events:none;z-index:4;`;
            scene.appendChild(el);
            requestAnimationFrame(() => { el.style.opacity = '1'; });
        }

        ttt.board[cellIdx] = player;
        ttt.blocks.push({ el, body });
        return true;
    }

    function endTicTacToe(result) {
        ttt.gameOver       = true;
        ttt.waitingForUser = false;
        const tttEndPool = result === 'user-wins' ? TTT_WIN_USER_MSGS :
                           result === 'npc-wins'  ? TTT_WIN_NPC_MSGS  : TTT_DRAW_MSGS;
        npcChat(NPCS[ttt.npcIdx]?.player || NPCS[NPC_EXPLORER]?.player || 'P4',
                tttEndPool[randInt(0, tttEndPool.length - 1)]);

        const delay = result === 'draw' ? 900 : 1400;
        setTimeout(() => {
            ttt.lines.forEach(el => { el.style.opacity = '0'; });
            setTimeout(() => {
                ttt.lines.forEach(el => el.remove());
                ttt.lines     = [];
                ttt.gridDrawn = false;
                if (running) setTimeout(ensureTTTGrid, 500);
            }, 400);

            releaseBlocks(ttt.blocks.map(b => ({
                ...b,
                x: b.el ? parseFloat(b.el.style.transform.match(/translate\(([^,]+)/)?.[1] ?? '0') : 0,
                y: b.el ? parseFloat(b.el.style.transform.match(/,\s*([^p]+)/)?.[1] ?? '0') : 0,
            })));
            ttt.blocks  = [];
            ttt.board   = Array(9).fill(null);
            ttt.active  = false;
            ttt.npcIdx  = -1;
        }, delay);
    }

    /* ── NPC class ───────────────────────────────────────────────────────────── */
    class NPC {
        constructor(player, index, role, canPlayTTT) {
            this.player     = player;
            this.index      = index;
            this.role       = role;        // 'jenga' | 'builder' | 'explorer'
            this.canPlayTTT = !!canPlayTTT;
            this.x = -300; this.y = -300;
            this.sx = 0; this.sy = 0;
            this.tx = 0; this.ty = 0;
            this.t0 = 0; this.dur = 0;
            this.nextState = '';
            this.state      = 'resting';
            this.restUntil  = performance.now() + rand(400 + index * 300, 900 + index * 300);
            this.hasAppeared = false;
            this.held       = null;
            this.claimed    = null;
            this.visitCount = 0;
            this.visitGoal  = 0;
            this.timer      = 0;
            this.tttPick    = -1;
            this.deconTarget = null;
            this.heldSwayRot  = 0;   // degrees, animated by GSAP while carrying
            // TTT impatience tracking
            this.tttAbandonAt  = 0;
            this.tttNagAt      = 0;
            this.tttWanderAt   = 0;
            this.generalChatAt   = Infinity;

            this.el = document.createElement('img');
            this.el.src = `/images/${player}/Pointer.png`;
            this.el.draggable = false;
            this.hoveredEl = null;
            this.el.style.cssText = `position:fixed;top:0;left:0;width:${CURSOR_SZ}px;height:${CURSOR_SZ}px;
                pointer-events:none;will-change:transform;opacity:0;transition:opacity .35s ease;z-index:1000;`;
            document.body.appendChild(this.el);
        }

        img(s) { this.el.src = `/images/${this.player}/${s}.png`; }

        reassign(player) {
            this.player = player;
        }

        stop() {
            this._releaseHeld();
            this._releaseClaimed();
            this.tttPick = -1; this.deconTarget = null;
            this.hasAppeared = false;
            this.lastChatAt    = 0;
            this.generalChatAt = Infinity;
            this.el.style.opacity = '0';
            this.state = 'resting';
            this.restUntil = performance.now() + rand(400, 900);
        }

        journey(tx, ty, next) {
            this.sx = this.x; this.sy = this.y;
            this.tx = tx; this.ty = ty;
            this.t0  = performance.now();
            this.dur = Math.max(300, (dist(this.x, this.y, tx, ty) / SPEED) * 1000);
            this.nextState = next;
            this.state = 'moving';
        }

        resetToRest(extraDelay = 0) {
            this._releaseHeld();
            this._releaseClaimed();
            this.tttPick     = -1;
            this.deconTarget = null;
            // If this is the Jenga NPC, clear any stuck placing flag
            if (this.role === 'jenga') jengaTower.placing = false;
            if (!this.hasAppeared) {
                this.el.style.opacity = '0';
                this.state     = 'resting';
                this.restUntil = performance.now() + extraDelay + rand(400, 900);
            } else {
                // Already on-screen: just idle briefly then resume
                this.state = 'idle-waiting';
                this.timer = performance.now() + extraDelay + rand(600, 2000);
            }
        }

        _releaseHeld() {
            if (!this.held) return;
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            this.held.el.style.transformOrigin = '';
            this.held.el.style.pointerEvents = 'auto';
            if (this.held.body && physEngine && typeof Matter !== 'undefined')
                Matter.Body.setStatic(this.held.body, false);
            scattered.push(this.held);
            this.held = null;
        }

        _releaseClaimed() {
            if (!this.claimed) return;
            this.claimed.claimed = false;
            if (this.claimed.body && physEngine && typeof Matter !== 'undefined')
                Matter.Body.setStatic(this.claimed.body, false);
            this.claimed = null;
        }

        appear() {
            this.hasAppeared = true;
            // Greeting chat on entrance
            const introDelay = rand(300, 900);
            setTimeout(() => { if (running) npcChat(this.player, NPC_INTRO_MSGS[randInt(0, NPC_INTRO_MSGS.length - 1)]); }, introDelay);
            // Stagger general idle chatter across the three NPCs
            this.generalChatAt = performance.now() + rand(20000 + this.index * 5000, 40000 + this.index * 5000);
            const side = randInt(0, 3);
            if      (side === 0) { this.x = rand(100, window.innerWidth - 100); this.y = -CURSOR_SZ; }
            else if (side === 1) { this.x = window.innerWidth + CURSOR_SZ;      this.y = rand(80, window.innerHeight * .65); }
            else if (side === 2) { this.x = rand(150, window.innerWidth - 150); this.y = window.innerHeight + CURSOR_SZ; }
            else                 { this.x = -CURSOR_SZ;                         this.y = rand(80, window.innerHeight * .65); }

            this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
            this.el.style.opacity   = '1';
            this.img('Pointer');

            if (this.role === 'jenga') {
                this.visitCount = 0;
                this.visitGoal  = randInt(3, 8);
                this.journey(JENGA_CX + 80, floorY() - 50, 'jenga-ready');
            } else if (this.role === 'explorer') {
                this.state = 'idle-waiting';
                this.timer = performance.now() + rand(300, 1000);
            } else {
                this.visitCount = 0;
                this.visitGoal  = randInt(2, 5);
                this.builderPickBlock();
            }
        }

        blockCenter(b) {
            if (b.body) return { x: b.body.position.x, y: b.body.position.y };
            return { x: (b.x || 0) + BLOCK_SZ / 2, y: (b.y || 0) + BLOCK_SZ / 2 };
        }

        claimNearest() {
            // Only claim blocks that have settled (low velocity)
            const avail = scattered.filter(b => !b.claimed && (!b.body ||
                (Math.abs(b.body.velocity.x) < 3 && Math.abs(b.body.velocity.y) < 3)));
            if (!avail.length) return false;
            const block = avail.reduce((best, b) => {
                const { x: bx, y: by } = this.blockCenter(b);
                const { x: wx, y: wy } = this.blockCenter(best);
                return dist(this.x, this.y, bx, by) < dist(this.x, this.y, wx, wy) ? b : best;
            });
            block.claimed = true;
            this.claimed  = block;
            if (block.body && physEngine && typeof Matter !== 'undefined') {
                Matter.Body.setStatic(block.body, true);
                Matter.Body.setVelocity(block.body, { x: 0, y: 0 });
            }
            return block;
        }

        grab(nextStateName) {
            this.img('Closed');
            this.held    = this.claimed;
            this.claimed = null;
            const i = scattered.indexOf(this.held);
            if (i !== -1) scattered.splice(i, 1);
            setTimeout(spawnBlock, rand(1200, 3200));

            // Recolor block to this NPC's color
            recolorBlock(this.held.el, CHAT_COLORS[this.player]);
            this.held.color = CHAT_COLORS[this.player];

            // Pendulum sway while carrying
            if (typeof gsap !== 'undefined') {
                this.heldSwayRot = 0;
                this.held.el.style.transformOrigin = 'center top';
                gsap.to(this, {
                    heldSwayRot: 8,
                    duration: 0.45,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: -1,
                });
            }

            this.state = nextStateName;
        }

        /* ── Builder logic ────────────────────────────────────────────────────── */

        builderPickBlock() {
            if (this.visitCount >= this.visitGoal) { this.wander(); return; }
            if (!currentBuild) maybeStartNewShape();
            if (!currentBuild) { this.state = 'idle-waiting'; this.timer = performance.now() + 1200; return; }

            const block = this.claimNearest();
            if (!block) { this.state = 'idle-waiting'; this.timer = performance.now() + rand(800, 1800); return; }

            const { x, y } = this.blockCenter(block);
            this.journey(x, y, 'atBlock');
        }

        builderDrop() {
            if (!currentBuild) {
                this._releaseHeld();
                this.visitCount++;
                this.state = 'pausing';
                this.timer = performance.now() + rand(300, 600);
                return;
            }
            this.img('Open');
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            this.held.el.style.transformOrigin = '';
            addToCurrentShape(this.held.el, this.held.body);
            this.held = null;
            this.visitCount++;
            this.state = 'pausing';
            this.timer = performance.now() + rand(200, 500);
            if (Math.random() < 0.20) {
                const pool = [...BUILDER_BUILD_MSGS, `i'm building a ${currentBuild?.key || 'shape'}!`];
                npcChat(this.player, pool[randInt(0, pool.length - 1)]);
            }
        }

        startDeconstruct() {
            if (!completedShapes.length) { this.builderPickBlock(); return; }
            this.deconTarget = completedShapes[0];
            this.state = 'decon-fetch';
        }

        deconFetch() {
            if (!this.deconTarget || !this.deconTarget.blocks.length) {
                const idx = completedShapes.indexOf(this.deconTarget);
                if (idx !== -1) completedShapes.splice(idx, 1);
                this.deconTarget = null;
                this.visitCount = 0;
                this.visitGoal  = randInt(2, 5);
                this.state = 'pausing';
                this.timer = performance.now() + rand(400, 900);
                return;
            }
            // Pick one random block from the shape to grab
            const pickIdx   = randInt(0, this.deconTarget.blocks.length - 1);
            const entry     = this.deconTarget.blocks[pickIdx];
            this.deconEntry = entry;
            entry.el.style.pointerEvents = 'none';
            this.journey(entry.x + BLOCK_SZ / 2, entry.y + BLOCK_SZ / 2, 'decon-hover');
        }

        deconGrab() {
            this.img('Closed');
            const entry = this.deconEntry;
            this.deconEntry = null;

            // Remove grabbed block from shape
            if (this.deconTarget) {
                const bi = this.deconTarget.blocks.indexOf(entry);
                if (bi !== -1) this.deconTarget.blocks.splice(bi, 1);

                // Collapse all remaining blocks — they fall with physics
                if (this.deconTarget.blocks.length > 0)
                    releaseBlocks(this.deconTarget.blocks.splice(0));

                // Remove shape from completedShapes
                const idx = completedShapes.indexOf(this.deconTarget);
                if (idx !== -1) completedShapes.splice(idx, 1);
                this.deconTarget = null;
            }

            // Hold the grabbed block
            this.held = { el: entry.el, body: entry.body, color: CHAT_COLORS[this.player] };
            recolorBlock(this.held.el, CHAT_COLORS[this.player]);
            if (this.held.body && physEngine && typeof Matter !== 'undefined')
                Matter.Body.setStatic(this.held.body, true);

            if (typeof gsap !== 'undefined') {
                this.heldSwayRot = 0;
                this.held.el.style.transformOrigin = 'center top';
                gsap.to(this, { heldSwayRot: 8, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1 });
            }

            // Journey sideways to throw spot
            const throwLeft = Math.random() < 0.5;
            const tx = Math.max(60, Math.min(window.innerWidth - 60,
                                    this.x + rand(100, 220) * (throwLeft ? -1 : 1)));
            this.journey(tx, this.y + rand(-20, 20), 'decon-drop');
        }

        deconDrop() {
            this.img('Open');
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            if (!this.held) { this.visitCount = 0; this.visitGoal = randInt(2, 5); this.state = 'pausing'; this.timer = performance.now() + 500; return; }
            const { el, body } = this.held;
            el.style.transformOrigin = '';
            el.style.pointerEvents   = 'auto';
            this.held = null;
            if (body && physEngine && typeof Matter !== 'undefined') {
                const dir = this.tx > this.sx ? 1 : -1;
                Matter.Body.setStatic(body, false);
                Matter.Body.setVelocity(body, { x: rand(7, 13) * dir, y: rand(-9, -4) });
                Matter.Body.setAngularVelocity(body, rand(-0.3, 0.3));
                physBodies.push({ el, body });
            } else {
                el.remove();
            }
            this.visitCount = 0;
            this.visitGoal  = randInt(2, 5);
            this.state = 'pausing';
            this.timer = performance.now() + rand(500, 1200);
        }

        /* ── TTT: NPC picks up block and carries it to cell ──────────────────── */
        tttPickBlock() {
            if (this.claimed) this._releaseClaimed();
            if (this.held)    this._releaseHeld();

            const avail = scattered.filter(b => !b.claimed && (!b.body ||
                (Math.abs(b.body.velocity.x) < 3 && Math.abs(b.body.velocity.y) < 3)));
            if (!avail.length) {
                placeTTTBlock(this.tttPick, 'npc', null, null);
                this._afterNPCTTTPlace();
                return;
            }
            const block = avail.reduce((best, b) => {
                const { x: bx, y: by } = this.blockCenter(b);
                const { x: wx, y: wy } = this.blockCenter(best);
                return dist(this.x, this.y, bx, by) < dist(this.x, this.y, wx, wy) ? b : best;
            });
            block.claimed = true;
            this.claimed  = block;
            if (block.body && physEngine && typeof Matter !== 'undefined') {
                Matter.Body.setStatic(block.body, true);
                Matter.Body.setVelocity(block.body, { x: 0, y: 0 });
            }
            const { x, y } = this.blockCenter(block);
            this.journey(x, y, 'atBlock-ttt');
        }

        _afterNPCTTTPlace() {
            this.tttPick = -1;
            if      (tttCheckWin(ttt.board, 'npc'))   { setTimeout(() => endTicTacToe('npc-wins'), 400); this.state = 'ttt-waiting'; }
            else if (ttt.board.every(v => v !== null)) { setTimeout(() => endTicTacToe('draw'),     400); this.state = 'ttt-waiting'; }
            else {
                ttt.waitingForUser  = true;
                this.tttAbandonAt   = performance.now() + TTT_IMPATIENCE_MS;
                this.tttNagAt       = performance.now() + rand(4000, 6000);
                this.tttWanderAt    = performance.now() + rand(800, 1800);
                this.state          = 'ttt-waiting';
            }
        }

        /* ── Jenga logic ──────────────────────────────────────────────────────── */

        jengaFetch() {
            if (jengaTower.falling) { this.state = 'jenga-waiting'; this.timer = performance.now() + 2000; return; }
            // Guard: if placing flag is orphaned (no held or claimed block), clear it
            if (jengaTower.placing && !this.held && !this.claimed) jengaTower.placing = false;
            if (jengaTower.placing) { this.state = 'jenga-waiting'; this.timer = performance.now() + rand(400, 1000); return; }
            if (this.visitCount >= this.visitGoal) { this.wander(); return; }

            // Clear any blocks piled up in the tower base area before building
            const obstruction = scattered.find(b => !b.claimed && b.body &&
                Math.abs(b.body.position.x - JENGA_CX) < BLOCK_SZ * 2.5 &&
                b.body.position.y > floorY() - BLOCK_SZ * 4 &&
                (Math.abs(b.body.velocity.x) < 1 && Math.abs(b.body.velocity.y) < 1));
            if (obstruction) {
                obstruction.claimed = true;
                this.claimed = obstruction;
                if (physEngine && typeof Matter !== 'undefined') {
                    Matter.Body.setStatic(obstruction.body, true);
                    Matter.Body.setVelocity(obstruction.body, { x: 0, y: 0 });
                }
                const { x, y } = this.blockCenter(obstruction);
                this.journey(x, y, 'jenga-clear-hover');
                return;
            }

            const block = this.claimNearest();
            if (!block) { this.state = 'jenga-waiting'; this.timer = performance.now() + rand(600, 1400); return; }

            const { x, y } = this.blockCenter(block);
            this.journey(x, y, 'jenga-hover');
        }

        jengaClearDrop() {
            this.img('Open');
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            if (this.held) {
                const { el, body } = this.held;
                el.style.transformOrigin = '';
                this.held = null;
                if (body && physEngine && typeof Matter !== 'undefined') {
                    Matter.Body.setStatic(body, false);
                    Matter.Body.setVelocity(body, { x: rand(1, 3), y: -1 });
                    physBodies.push({ el, body });
                } else {
                    scattered.push({ el, body: null, color: el.dataset?.blockColor || '#aaa', claimed: false });
                }
            }
            // Return to Jenga area so the NPC isn't stranded at the drop zone
            this.journey(JENGA_CX + rand(40, 100), floorY() - 50, 'jenga-ready');
        }

        jengaGrab() {
            if (jengaTower.blocks.length >= JENGA_MAX_H) {
                // Auto-collapse at height limit
                jengaCollapse();
                return;
            }
            jengaTower.placing = true;
            const pos  = jengaNextPos();
            this.jengaDropPos = pos;
            this.grab('moving-temp');
            this.journey(pos.x - HOLD_OX + BLOCK_SZ / 2, pos.y - HOLD_OY, 'jenga-place');
        }

        jengaPlace() {
            // Recalculate in case user stacked a block while NPC was in flight
            const correctPos = jengaNextPos();
            // If tower grew, re-journey to the new correct height (block kept in hand)
            if (this.jengaDropPos && Math.abs(correctPos.y - this.jengaDropPos.y) > BLOCK_SZ * 0.6) {
                this.jengaDropPos = correctPos;
                this.journey(
                    correctPos.x - HOLD_OX + BLOCK_SZ / 2,
                    correctPos.y - HOLD_OY,
                    'jenga-place'
                );
                return;
            }

            this.img('Open');
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            const { el, body } = this.held;
            el.style.transformOrigin = '';
            this.held = null;
            jengaPlaceBlock(el, body, correctPos);
            this.jengaDropPos = null;
            this.visitCount++;

            if (Math.random() < 0.30)
                npcChat(this.player, JENGA_PLACE_MSGS[randInt(0, JENGA_PLACE_MSGS.length - 1)]);

            this.state = 'jenga-waiting';
            this.timer = performance.now() + rand(600, 1400);
        }

        wander() {
            this.img('Pointer');
            this.visitCount = 0;
            this.visitGoal  = randInt(2, 5);
            // Pick a destination that feels human: dock strip, top nav, or random mid-page
            const zone = randInt(0, 2);
            let tx, ty;
            if (zone === 0) {
                // Hover around the dock
                tx = rand(60, window.innerWidth - 120);
                ty = window.innerHeight - DOCK_H * 0.55;
            } else if (zone === 1) {
                // Upper area — navigation / project folders
                tx = rand(80, window.innerWidth - 80);
                ty = rand(36, window.innerHeight * 0.28);
            } else {
                // Mid-page — anywhere in the content area
                tx = rand(80, window.innerWidth - 80);
                ty = rand(window.innerHeight * 0.25, window.innerHeight - DOCK_H - 80);
            }
            this.journey(tx, ty, 'idle-pause');
        }

        explorerWander() {
            this.img('Pointer');

            // ~10% chance to grab a scattered block and relocate it instead of visiting a folder
            if (Math.random() < 0.10) {
                const avail = scattered.filter(b => !b.claimed && (!b.body ||
                    (Math.abs(b.body.velocity.x) < 3 && Math.abs(b.body.velocity.y) < 3)));
                if (avail.length) {
                    const block = avail[randInt(0, avail.length - 1)];
                    block.claimed = true;
                    this.claimed = block;
                    if (block.body && physEngine && typeof Matter !== 'undefined') {
                        Matter.Body.setStatic(block.body, true);
                        Matter.Body.setVelocity(block.body, { x: 0, y: 0 });
                    }
                    const { x, y } = this.blockCenter(block);
                    this.journey(x, y, 'explorer-block-hover');
                    return;
                }
            }

            // Place cursor top-left in the bottom half of the image element
            const imgBottomTarget = imgEl => {
                const r = imgEl.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return null;
                const px = rand(r.left, r.right);
                const py = rand(r.top + r.height * 0.5, r.bottom);
                return { x: px, y: py };
            };

            // Use HOVER_CHAT_MAP key matching (same as npcHoverKey) to classify folders reliably
            const SECONDARY_KEYS = new Set(['pmc', 'NSL']);

            const mainTargets   = [];
            const secondaryTargets = [];
            const dockTargets   = [];

            document.querySelectorAll('.projectfolder').forEach(folder => {
                const img = folder.querySelector('.projectimage');
                if (!img) return;
                const t = imgBottomTarget(img);
                if (!t) return;
                const src = img.src || img.getAttribute('src') || '';
                const alt = img.alt || '';
                let key = null;
                for (const k of Object.keys(HOVER_CHAT_MAP)) {
                    if (src.includes(k) || alt.includes(k)) { key = k; break; }
                }
                // Tag each target with its key so we can filter the last-visited one
                t._key = key || src;
                if (key && SECONDARY_KEYS.has(key)) secondaryTargets.push(t);
                else                                 mainTargets.push(t);
            });

            document.querySelectorAll('.dock li:not(.divider)').forEach(li => {
                const img = li.querySelector('img');
                if (!img) return;
                const t = imgBottomTarget(img);
                if (t) {
                    t._key = li.dataset?.label || null;
                    dockTargets.push(t);
                }
            });

            // Weighted pick: 65% main, 20% dock, 15% secondary
            const roll = Math.random();
            let pool;
            if (roll < 0.65 && mainTargets.length)           pool = mainTargets;
            else if (roll < 0.85 && dockTargets.length)      pool = dockTargets;
            else if (secondaryTargets.length)                 pool = secondaryTargets;
            else                                              pool = mainTargets.length ? mainTargets : dockTargets;

            if (!pool || !pool.length) {
                this.state = 'idle-waiting';
                this.timer = performance.now() + rand(1500, 3000);
                return;
            }

            // Filter out the last-visited target to avoid visiting the same folder twice in a row
            const filtered = pool.filter(t => t._key !== this._lastVisitedKey);
            const chosen   = (filtered.length ? filtered : pool)[randInt(0, (filtered.length ? filtered : pool).length - 1)];
            this._lastVisitedKey = chosen._key || null;

            this.journey(chosen.x, chosen.y, 'idle-pause');
        }

        explorerBlockDrop() {
            this.img('Open');
            if (typeof gsap !== 'undefined') gsap.killTweensOf(this);
            this.heldSwayRot = 0;
            if (this.held) {
                const { el, body } = this.held;
                el.style.transformOrigin = '';
                this.held = null;
                if (body && physEngine && typeof Matter !== 'undefined') {
                    Matter.Body.setStatic(body, false);
                    Matter.Body.setVelocity(body, { x: rand(-1, 1), y: -0.5 });
                    physBodies.push({ el, body });
                } else {
                    scattered.push({ el, body: null, color: el.dataset?.blockColor || '#aaa', claimed: false });
                }
            }
            // Resume exploring immediately
            this.state = 'idle-waiting';
            this.timer = performance.now();
        }

        /* ── Update ───────────────────────────────────────────────────────────── */

        update(now) {
            // General idle chatter — any visible NPC, every 20–40 s staggered
            if (this.role !== 'explorer' && this.hasAppeared && this.el.style.opacity !== '0' && now >= this.generalChatAt) {
                if (this.role === 'jenga' && Math.random() < 0.3) {
                    this.generalChatAt = now + rand(20000, 40000);
                    chat(this.player, JENGA_ONLY_MSGS[randInt(0, JENGA_ONLY_MSGS.length - 1)]);
                } else {
                    const msg = nextGeneralMsg();
                    if (msg) {
                        this.generalChatAt = now + rand(20000, 40000);
                        chat(this.player, msg);
                    } else {
                        this.generalChatAt = Infinity; // pool exhausted — stop scheduling
                    }
                }
            }

            // TTT interrupt — only fire when not already somewhere in the TTT action sequence
            if (this.canPlayTTT && this.tttPick >= 0) {
                const inTTTFlow = this.state === 'ttt-picking'  ||
                                  this.state === 'ttt-placing'  ||
                                  this.state === 'ttt-waiting'  ||
                                  this.state === 'ttt-watching' ||
                                  this.state === 'hovering-ttt' ||
                                  this.state === 'moving';
                if (!inTTTFlow) this.state = 'ttt-picking';
            }

            if (this.state === 'moving') { this._updateMoving(now); return; }
            if (this.role === 'jenga')       this._updateJenga(now);
            else if (this.role === 'explorer') this._updateExplorer(now);
            else                             this._updateBuilder(now);
        }

        _updateMoving(now) {
            const t  = Math.min(1, (now - this.t0) / this.dur);
            const et = ease(t);
            this.x = lerp(this.sx, this.tx, et);
            this.y = lerp(this.sy, this.ty, et);
            this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

            if (this.held) {
                const hx      = this.x + HOLD_OX;
                const hy      = this.y + HOLD_OY;
                const swayRad = (this.heldSwayRot || 0) * Math.PI / 180;
                this.held.el.style.transition = 'none';
                this.held.el.style.transform  = `translate(${hx}px,${hy}px) rotate(${swayRad}rad)`;
                if (this.held.body && physEngine && typeof Matter !== 'undefined') {
                    Matter.Body.setPosition(this.held.body, { x: hx + BLOCK_SZ / 2, y: hy + BLOCK_SZ / 2 });
                    Matter.Body.setAngle(this.held.body, swayRad);
                }
            }
            if ((this.nextState === 'atBlock' || this.nextState === 'atBlock-ttt' || this.nextState === 'jenga-hover' || this.nextState === 'jenga-clear-hover') &&
                dist(this.x, this.y, this.tx, this.ty) < OPEN_RADIUS) {
                this.img('Open');
            }
            if (t >= 1) this._onArrival(now);
        }

        _onArrival(now) {
            switch (this.nextState) {
                case 'atBlock':
                    this.img('Open'); this.state = 'hovering'; this.timer = now + rand(120, 350);
                    break;
                case 'atBlock-ttt':
                    this.img('Open'); this.state = 'hovering-ttt'; this.timer = now + rand(120, 350);
                    break;
                case 'atPile':
                    this.builderDrop();
                    break;
                case 'atPile-ttt':
                    this.state = 'ttt-placing'; this.timer = now + rand(350, 700);
                    break;
                case 'decon-hover':
                    this.img('Open'); this.state = 'decon-grab'; this.timer = now + rand(120, 320);
                    break;
                case 'decon-drop':
                    this.deconDrop();
                    break;
                case 'explorer-block-hover':
                    this.img('Open'); this.state = 'explorer-block-grab'; this.timer = now + rand(150, 350);
                    break;
                case 'explorer-block-drop':
                    this.explorerBlockDrop();
                    break;
                case 'jenga-hover':
                    this.img('Open'); this.state = 'jenga-grabbing'; this.timer = now + rand(120, 350);
                    break;
                case 'jenga-clear-hover':
                    this.img('Open'); this.state = 'jenga-clearing'; this.timer = now + rand(120, 300);
                    break;
                case 'jenga-clear-drop':
                    this.jengaClearDrop();
                    break;
                case 'jenga-place':
                    this.jengaPlace();
                    break;
                case 'jenga-ready':
                    this.state = 'jenga-fetch';
                    break;
                case 'ttt-watching':
                    this.state = 'ttt-waiting';
                    break;
                case 'idle-pause':
                    this.img('Pointer');
                    this.state = 'idle-waiting';
                    if (this.role === 'explorer') {
                        const stack = document.elementsFromPoint(this.x + 12, this.y + 6);
                        const arrived = stack.find(e => e && e !== document.documentElement && e !== document.body &&
                            !e.dataset?.blockColor && !e.closest?.('#bg-cursor-scene') && !e.closest?.('#bg-chat') &&
                            !NPCS.some(n => n.el === e));
                        const key = arrived ? npcHoverKey(arrived) : null;
                        if (key && HOVER_CHAT_MAP[key]) {
                            // Landed on something interesting — brief pause then move on
                            this.timer = now + rand(800, 1400);
                            if (Math.random() < 0.50) {
                            const msgs = HOVER_CHAT_MAP[key];
                            npcChat(this.player, msgs[randInt(0, msgs.length - 1)]);
                            }
                            const reactPool = HOVER_REACT_MAP[key];
                            if (reactPool?.length && Math.random() < 0.30) {
                                const others = NPCS.filter(n => n !== this && n.el.style.opacity !== '0');
                                if (others.length) {
                                    const reactor = others[randInt(0, others.length - 1)];
                                    setTimeout(() => {
                                        if (running) npcChat(reactor.player, reactPool[randInt(0, reactPool.length - 1)]);
                                    }, rand(600, 1800));
                                }
                            }
                        } else {
                            // Nothing interesting here — move on immediately
                            this.timer = now;
                        }
                    } else {
                        this.timer = now + rand(700, 2800);
                    }
                    break;
            }
        }

        _updateBuilder(now) {
            switch (this.state) {
                case 'resting':
                    if (running && now >= this.restUntil) this.appear();
                    break;
                case 'hovering':
                    if (now >= this.timer) {
                        const pos = currentShapePos();
                        if (!pos) { this._releaseClaimed(); this.state = 'pausing'; this.timer = now + 400; break; }
                        this.grab('moving-temp');
                        this.journey(pos.x - HOLD_OX, pos.y - HOLD_OY, 'atPile');
                    }
                    break;
                case 'hovering-ttt':
                    if (now >= this.timer) {
                        const cell = ttt.cells[this.tttPick];
                        if (!cell) { this._releaseClaimed(); this.state = 'pausing'; this.timer = now + 400; break; }
                        this.grab('moving-temp');
                        this.journey(cell.x - HOLD_OX, cell.y - HOLD_OY, 'atPile-ttt');
                    }
                    break;
                case 'pausing':
                    if (now >= this.timer) this.builderPickBlock();
                    break;
                case 'decon-fetch':
                    this.deconFetch();
                    break;
                case 'decon-grab':
                    if (now >= this.timer) this.deconGrab();
                    break;
                case 'ttt-picking': {
                    if (this.el.style.opacity === '0') {
                        const { ax, ay } = tttGridOrigin();
                        this.x = ax - 80; this.y = -CURSOR_SZ;
                        this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
                        this.el.style.opacity   = '1';
                        this.img('Pointer');
                    }
                    this.tttPickBlock();
                    break;
                }
                case 'idle-waiting':
                    if (now >= this.timer) {
                        this.visitCount = 0;
                        this.visitGoal  = randInt(2, 5);
                        this.builderPickBlock();
                    }
                    break;
                case 'ttt-waiting':
                    if (!ttt.active) { this.resetToRest(500); break; }
                    // User just placed — NPC needs to respond
                    if (this.tttPick >= 0 && !ttt.waitingForUser) { this.state = 'ttt-picking'; break; }

                    if (ttt.waitingForUser) {
                        // Abandon to building after impatience threshold
                        if (now >= this.tttAbandonAt) {
                            npcChat(this.player, TTT_ABANDON_MSGS[randInt(0, TTT_ABANDON_MSGS.length - 1)]);
                            this.tttAbandonAt = now + TTT_IMPATIENCE_MS * 3;
                            this.state = 'pausing';
                            this.timer = now + rand(400, 800);
                            break;
                        }
                        // Nag periodically
                        if (now >= this.tttNagAt) {
                            npcChat(this.player, TTT_NAG_MSGS[randInt(0, TTT_NAG_MSGS.length - 1)]);
                            this.tttNagAt    = now + rand(3500, 6000);
                            this.tttWanderAt = now + rand(400, 900);
                        }
                        // Wander around the board while waiting
                        if (now >= this.tttWanderAt) {
                            this.tttWanderAt = now + rand(1200, 2800);
                            const { ax, ay, gridSpan } = tttGridOrigin();
                            const wx = ax + rand(-120, gridSpan + 20);
                            const wy = ay + rand(-60,  gridSpan + 60);
                            this.journey(wx, wy, 'ttt-watching');
                        }
                    }
                    break;
                case 'ttt-placing':
                    if (now >= this.timer) {
                        this.img('Closed');
                        setTimeout(() => { if (this.state !== 'resting') this.img('Open'); }, 250);
                        if (this.held) {
                            placeTTTBlock(this.tttPick, 'npc', this.held.el, this.held.body);
                            this.held = null;
                        } else {
                            placeTTTBlock(this.tttPick, 'npc', null, null);
                        }
                        if (Math.random() < 0.5) npcChat(this.player, TTT_NPC_PLACE_MSGS[randInt(0, TTT_NPC_PLACE_MSGS.length - 1)]);
                        this._afterNPCTTTPlace();
                    }
                    break;
            }
        }

        _updateJenga(now) {
            switch (this.state) {
                case 'resting':
                    if (running && now >= this.restUntil) this.appear();
                    break;
                case 'idle-waiting':
                    if (now >= this.timer) {
                        this.visitCount = 0;
                        this.visitGoal  = randInt(3, 8);
                        this.journey(JENGA_CX + rand(40, 100), floorY() - 50, 'jenga-ready');
                    }
                    break;
                case 'jenga-fetch':
                    this.jengaFetch();
                    break;
                case 'jenga-grabbing':
                    if (now >= this.timer) this.jengaGrab();
                    break;
                case 'jenga-clearing':
                    if (now >= this.timer) {
                        if (!this.claimed) { this.state = 'jenga-fetch'; break; }
                        this.img('Closed');
                        this.held    = this.claimed;
                        this.claimed = null;
                        const ci = scattered.indexOf(this.held);
                        if (ci !== -1) scattered.splice(ci, 1);
                        if (typeof gsap !== 'undefined') {
                            this.heldSwayRot = 0;
                            this.held.el.style.transformOrigin = 'center top';
                            gsap.to(this, { heldSwayRot: 8, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                        }
                        const dropX = rand(window.innerWidth * 0.45, window.innerWidth - 120);
                        this.journey(dropX, floorY() - 60, 'jenga-clear-drop');
                    }
                    break;
                case 'jenga-waiting':
                    if (now >= this.timer) {
                        if (jengaTower.falling) { this.timer = now + 1000; }
                        else                    { this.state = 'jenga-fetch'; }
                    }
                    break;
            }
        }

        _updateExplorer(now) {
            // TTT action states handled by builder logic
            if (['ttt-picking','hovering-ttt','ttt-placing','ttt-waiting'].includes(this.state)) {
                this._updateBuilder(now);
                return;
            }
            // Builder action states — forwarded while helping with shape building or returning from TTT
            if (['hovering', 'pausing'].includes(this.state)) {
                this._updateBuilder(now);
                return;
            }
            switch (this.state) {
                case 'resting':
                    if (running && now >= this.restUntil) this.appear();
                    break;
                case 'idle-waiting':
                    if (now >= this.timer) {
                        // ~35% chance to pitch in on shape building when blocks & a plan are available
                        if (Math.random() < 0.15 && currentBuild &&
                                scattered.some(b => !b.claimed)) {
                            this.visitCount = 0;
                            this.visitGoal  = randInt(1, 3); // place 1–3 blocks then go back to exploring
                            this.builderPickBlock();
                        } else {
                            this.explorerWander();
                        }
                    }
                    break;
                case 'idle-pause':
                    // _onArrival transitions to idle-waiting with timer; nothing extra needed
                    break;
                case 'explorer-block-grab':
                    if (now >= this.timer) {
                        if (!this.claimed) { this.state = 'idle-waiting'; this.timer = now; break; }
                        this.img('Closed');
                        this.held    = this.claimed;
                        this.claimed = null;
                        const ci = scattered.indexOf(this.held);
                        if (ci !== -1) scattered.splice(ci, 1);
                        if (typeof gsap !== 'undefined') {
                            this.heldSwayRot = 0;
                            this.held.el.style.transformOrigin = 'center top';
                            gsap.to(this, { heldSwayRot: 6, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
                        }
                        // Drop somewhere on the page away from dock
                        const dropX = rand(80, window.innerWidth - 80);
                        const dropY = rand(window.innerHeight * 0.15, window.innerHeight - 160);
                        this.journey(dropX, dropY, 'explorer-block-drop');
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
        container.style.cssText = `position:fixed;top:52px;right:18px;z-index:1000;
            display:flex;flex-direction:column;gap:5px;align-items:flex-end;pointer-events:none;`;
        const PC = ['#FF3838','#10BD0D','#FF9C00'];
        const rows = stamps.map((stamp, i) => {
            const row = document.createElement('div');
            row.style.cssText = `display:flex;align-items:center;gap:6px;
                opacity:0;transform:translateY(-10px);transition:opacity 0.3s ease,transform 0.3s ease;`;
            const textCol = document.createElement('div');
            textCol.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:1px;';
            const nameEl = document.createElement('span');
            nameEl.textContent = stamp.name || ':(';
            nameEl.style.cssText = `font-family:'SFMedium',sans-serif;font-size:10px;color:rgba(0,0,0,0.35);white-space:nowrap;`;
            const numEl = document.createElement('span');
            numEl.textContent = stamp.stamp_number || '?';
            numEl.style.cssText = `font-family:'SFMedium',sans-serif;font-size:7px;color:rgba(0,0,0,0.25);white-space:nowrap;line-height:1;`;
            textCol.appendChild(nameEl); textCol.appendChild(numEl);
            const avatarWrap = document.createElement('div');
            avatarWrap.style.cssText = 'width:28px;height:28px;flex-shrink:0;';
            const avatar = document.createElement('div');
            avatar.style.cssText = `width:28px;height:28px;border-radius:50%;border:2px solid ${PC[i]};
                background:${stamp.card_color||'#f5f5f5'};
                ${stamp.character_svg?`background-image:url('${stamp.character_svg}');background-size:cover;background-position:center;`:''}`;
            avatarWrap.appendChild(avatar);
            row.appendChild(textCol); row.appendChild(avatarWrap);
            container.appendChild(row);
            return row;
        });
        document.body.appendChild(container);
        playerStampsEl = container;
        rows.forEach((row, i) => setTimeout(() => {
            row.style.opacity = '1'; row.style.transform = 'translateY(0)';
        }, i * 80));
    }

    function hidePlayerStamps() {
        if (!playerStampsEl) return;
        const el = playerStampsEl; playerStampsEl = null;
        const rows = [...el.children];
        rows.forEach((row, i) => setTimeout(() => {
            row.style.opacity = '0'; row.style.transform = 'translateY(-10px)';
        }, i * 60));
        setTimeout(() => el.remove(), rows.length * 60 + 320);
    }

    /* ── Toggle button ───────────────────────────────────────────────────────── */
    function buildToggleBtn() {
        const btn = document.createElement('button');
        btn.id = 'bgcursor-toggle';
        btn.textContent = 'add players';
        btn.style.cssText = `position:fixed;top:18px;right:18px;z-index:1000;
            background:rgba(255,255,255,0.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
            border:1px solid rgba(0,0,0,0.12);border-radius:20px;padding:4px 10px;
            font-family:'SFMedium',sans-serif;font-size:11px;color:rgba(0,0,0,0.35);letter-spacing:0.3px;
            cursor:pointer;user-select:none;white-space:nowrap;transition:opacity 0.6s ease;opacity:0;`;
        setTimeout(() => { btn.style.opacity = '0.5'; }, 1400);
        btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', () => { btn.style.opacity = running ? '0.7' : '0.5'; });
        btn.addEventListener('click', () => {
            running = !running;
            if (running) {
                document.dispatchEvent(new CustomEvent('bgcursors:start'));
                scene.style.display = '';
                // Randomize which player (P2/P3/P4) does each role this session
                const players = ['P2', 'P3', 'P4'].sort(() => Math.random() - 0.5);
                NPCS.forEach((npc, i) => npc.reassign(players[i]));
                pickNewShape();
                for (let i = 0; i < SCATTER_N; i++) setTimeout(spawnBlock, i * 220);
                NPCS.forEach((c, i) => c.resetToRest(i * 500));
                btn.style.opacity = '0.7';
                btn.style.color   = 'rgba(0,0,0,0.55)';
                fetchRandomStamps(3).then(showPlayerStamps);
                setTimeout(ensureTTTGrid, 600);
            } else {
                NPCS.forEach(c => c.stop());
                clearAllFade();
                hidePlayerStamps();
                setTimeout(() => { scene.style.display = 'none'; }, 650);
                btn.style.opacity = '0.5';
                btn.style.color   = 'rgba(0,0,0,0.35)';
            }
        });
        document.body.appendChild(btn);
    }

    /* ── User block drag ─────────────────────────────────────────────────────── */
    function onDocMouseDown(e) {
        if (!running) return;

        // Use elementsFromPoint so blocks behind dock / higher-z-index elements are still found
        const under = document.elementsFromPoint(e.clientX, e.clientY);
        const el    = under.find(el => el.dataset && el.dataset.blockColor);
        if (!el || !physEngine) return;
        if (NPCS.some(n => n.held?.el === el || n.claimed?.el === el)) return;

        e.preventDefault(); e.stopPropagation();

        // Block top-left sits under cursor tip
        const bx  = e.clientX;
        const by  = e.clientY;
        const bcx = bx + BLOCK_SZ / 2;
        const bcy = by + BLOCK_SZ / 2;

        let body = null;
        const si = scattered.findIndex(b => b.el === el);
        if (si !== -1) { body = scattered[si].body; scattered.splice(si, 1); }

        const allBuilt = allShapeBlocks();
        const bi = allBuilt.findIndex(b => b.el === el);
        if (bi !== -1 && !body) {
            body = allBuilt[bi].body;
            for (const s of [currentBuild, ...completedShapes]) {
                if (!s) continue;
                const idx = s.blocks.findIndex(b => b.el === el);
                if (idx !== -1) { s.blocks.splice(idx, 1); break; }
            }
        }

        const xi = physBodies.findIndex(pb => pb.el === el);
        if (xi !== -1) { if (!body) body = physBodies[xi].body; physBodies.splice(xi, 1); }

        const ji = jengaTower.blocks.findIndex(b => b.el === el);
        if (ji !== -1) {
            if (!body) body = jengaTower.blocks[ji].body;
            jengaTower.blocks.splice(ji, 1);
            // Release every block that was above the pulled block — they fall
            if (ji < jengaTower.blocks.length && physEngine && typeof Matter !== 'undefined') {
                const above = jengaTower.blocks.splice(ji);
                above.forEach(({ el: fEl, body: fBody }) => {
                    fEl.style.pointerEvents = 'none';
                    if (fBody) {
                        Matter.Body.setStatic(fBody, false);
                        Matter.Body.setVelocity(fBody, { x: rand(-0.6, 0.6), y: -0.2 });
                    }
                    physBodies.push({ el: fEl, body: fBody });
                });
            }
        }

        if (body) {
            Matter.Body.setStatic(body, true);
            Matter.Body.setVelocity(body,        { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setAngle(body, 0);
            Matter.Body.setPosition(body, { x: bcx, y: bcy });
        } else {
            body = Matter.Bodies.rectangle(bcx, bcy, BLOCK_SZ - 1, BLOCK_SZ - 1,
                { isStatic: true, restitution: 0.5, friction: 0.3 });
            Matter.Composite.add(physWorld, body);
        }

        recolorBlock(el, '#008CFF');

        el.style.transition      = 'none';
        el.style.opacity         = '0.85';
        el.style.zIndex          = '8';
        el.style.transformOrigin = '0 0';
        el.style.transform       = `translate(${bx}px,${by}px)`;

        // Move block into the drag layer so it renders above all page UI
        if (dragLayer) dragLayer.appendChild(el);

        // Signal cursor.js to switch to grab cursor
        document.body.classList.add('is-dragging');
        document.body.classList.remove('is-block-hovering');

        // Pendulum sway for user carry
        userDragSway.rot = 0;
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(userDragSway);
            gsap.to(userDragSway, { rot: 8, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        }

        userDrag = { body, el, curX: bx, curY: by, velX: 0, velY: 0, prevX: bx, prevY: by };
    }

    function onDocMouseMove(e) {
        userMouseY = e.clientY;
        if (userDrag) {
            const { body, el } = userDrag;
            const cx = e.clientX;
            const cy = e.clientY;
            userDrag.velX  = cx - userDrag.prevX;
            userDrag.velY  = cy - userDrag.prevY;
            userDrag.prevX = cx; userDrag.prevY = cy;
            userDrag.curX  = cx; userDrag.curY  = cy;
            Matter.Body.setPosition(body, { x: cx + BLOCK_SZ / 2, y: cy + BLOCK_SZ / 2 });
            const swayRad = (userDragSway.rot || 0) * Math.PI / 180;
            el.style.transform = `translate(${cx}px,${cy}px) rotate(${swayRad}rad)`;
            return;
        }

        if (!running) {
            document.body.classList.remove('is-block-hovering');
            return;
        }

        // Signal cursor.js to show open-hand when hovering a grabbable block
        const under = document.elementsFromPoint(e.clientX, e.clientY);
        if (under.some(el => el.dataset?.blockColor))
            document.body.classList.add('is-block-hovering');
        else
            document.body.classList.remove('is-block-hovering');
    }

    function onDocMouseUp() {
        if (!userDrag) return;
        const { body, el, velX, velY } = userDrag;
        userDrag = null;

        // Stop sway
        if (typeof gsap !== 'undefined') gsap.killTweensOf(userDragSway);
        userDragSway.rot = 0;
        el.style.transformOrigin = '';

        // Move block back from drag layer to scene
        scene.appendChild(el);

        // Restore cursor state
        document.body.classList.remove('is-dragging');
        document.body.classList.remove('is-block-hovering');

        // Drop into TTT cell?
        if (ttt.gridDrawn && ttt.cells.length) {
            const bx     = body.position.x;
            const by     = body.position.y;
            const margin = BLOCK_SZ * 0.55;
            const cellIdx = ttt.cells.findIndex(({ x, y }) =>
                bx >= x - margin && bx <= x + BLOCK_SZ + margin &&
                by >= y - margin && by <= y + BLOCK_SZ + margin
            );
            const canPlace = !ttt.active || ttt.waitingForUser;
            if (cellIdx >= 0 && canPlace && ttt.board[cellIdx] === null) {
                if (!ttt.active) startTicTacToe(NPC_EXPLORER);

                el.style.opacity = '1'; el.style.zIndex = '';
                placeTTTBlock(cellIdx, 'user', el, body);
                ttt.waitingForUser = false;

                if (tttCheckWin(ttt.board, 'user'))  { setTimeout(() => endTicTacToe('user-wins'), 350); return; }
                if (ttt.board.every(v => v !== null)) { setTimeout(() => endTicTacToe('draw'),      350); return; }

                const npc  = NPCS[NPC_EXPLORER];
                const pick = tttNPCPick();
                if (!npc || pick < 0) { endTicTacToe('draw'); return; }
                // NPC reacts to user's move
                if (Math.random() < 0.5) setTimeout(() => {
                    if (running && ttt.active) npcChat(npc.player, TTT_USER_PLACE_MSGS[randInt(0, TTT_USER_PLACE_MSGS.length - 1)]);
                }, rand(200, 600));
                npc.tttPick = pick;
                // Interrupt fires next frame via update()
                return;
            }
        }

        // Drop onto Jenga tower top?
        if (!jengaTower.falling && jengaTower.blocks.length > 0) {
            const topBlock = jengaTower.blocks[jengaTower.blocks.length - 1];
            const bx = body.position.x;
            const by = body.position.y;
            const nearTower = Math.abs(bx - JENGA_CX) < BLOCK_SZ * 2 &&
                              by < topBlock.y + BLOCK_SZ && by > topBlock.y - BLOCK_SZ * 2.5;
            if (nearTower) {
                const pos = jengaNextPos();
                el.style.opacity = '1'; el.style.zIndex = '';
                el.style.transformOrigin = '';
                jengaPlaceBlock(el, body, pos);
                return;
            }
        }

        // Regular throw
        Matter.Body.setStatic(body, false);
        Matter.Body.setAngle(body, 0);
        Matter.Body.setVelocity(body,        { x: velX * 0.9, y: velY * 0.9 });
        Matter.Body.setAngularVelocity(body, (velX - velY) * 0.012);
        el.style.opacity = '1'; el.style.zIndex = '';
        el.style.transformOrigin = '';
        physBodies.push({ el, body });
    }

    /* ── RAF loop ────────────────────────────────────────────────────────────── */
    function loop(now) {
        try {
            if (physEngine) {
                const delta = Math.min(lastPhysTime ? now - lastPhysTime : 16.67, 16.67);
                Matter.Engine.update(physEngine, delta);
                lastPhysTime = now;

                scattered.forEach(b => {
                    if (!b.body || b.claimed) return;
                    const { x, y } = b.body.position;
                    b.el.style.transform = `translate(${x - BLOCK_SZ/2}px,${y - BLOCK_SZ/2}px) rotate(${b.body.angle}rad)`;
                });

                physBodies.forEach(pb => {
                    const { x, y } = pb.body.position;
                    pb.el.style.transform = `translate(${x - BLOCK_SZ/2}px,${y - BLOCK_SZ/2}px) rotate(${pb.body.angle}rad)`;
                });

                if (now - lastCapCheck > 4000) {
                    lastCapCheck = now;
                    enforcePhysCap();
                }
            } else {
                lastPhysTime = 0;
            }

            NPCS.forEach(c => c.update(now));

            // NPC cursor hover events — dock magnification, folder scale, chat bubbles
            const userNearDock = userMouseY > window.innerHeight - DOCK_H - 70;
            let anyNpcNearDock = false;
            NPCS.forEach(npc => {
                const visible = npc.el.style.opacity !== '0';
                if (!visible) {
                    if (npc.hoveredEl) {
                        // Revert folder scale on leave
                        const oldFolder = npc.hoveredEl.closest?.('.projectfolder');
                        if (oldFolder) {
                            oldFolder.classList.remove('is-npc-hovered');
                            if (typeof gsap !== 'undefined')
                                gsap.to(oldFolder, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto',
                                    onComplete: () => gsap.set(oldFolder, { clearProps: 'scale' }) });
                        }
                        npc.hoveredEl.dispatchEvent(new MouseEvent('mouseout',   { bubbles: true,  cancelable: true }));
                        npc.hoveredEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, cancelable: true }));
                        npc.hoveredEl = null;
                    }
                    return;
                }

                // Dock magnification — skip if user's cursor is already near the dock,
                // or if a project window is covering the dock at the NPC's position
                const tipX = npc.x + 12;
                const tipY = npc.y + 6;
                if (!userNearDock && tipY > window.innerHeight - DOCK_H - 70) {
                    const tipTop = document.elementFromPoint(tipX, tipY);
                    const dockCovered = tipTop && !!(tipTop.closest('.window') || tipTop.closest('#gb-overlay') || tipTop.closest('#playground-window'));
                    if (!dockCovered) {
                        anyNpcNearDock = true;
                        npcMagnifyDock(tipX);
                    }
                }

                // Use elementsFromPoint (plural) to skip blocks/scene/NPC images
                const stack = document.elementsFromPoint(tipX, tipY);
                const pageEl = stack.find(el => {
                    if (!el || el === document.documentElement || el === document.body) return false;
                    if (el.dataset?.blockColor) return false;
                    if (el.closest?.('#bg-cursor-scene')) return false;
                    if (el.closest?.('#bg-chat')) return false;
                    if (el.id === 'bgcursor-toggle') return false;
                    if (el === dragLayer) return false;
                    if (el.id === 'bg-player-stamps' || el.closest?.('#bg-player-stamps')) return false;
                    if (NPCS.some(n => n.el === el)) return false;
                    return true;
                }) || null;

                if (pageEl !== npc.hoveredEl) {
                    // Leave old element
                    if (npc.hoveredEl) {
                        const oldFolder = npc.hoveredEl.closest?.('.projectfolder');
                        if (oldFolder) {
                            oldFolder.classList.remove('is-npc-hovered');
                            if (typeof gsap !== 'undefined')
                                gsap.to(oldFolder, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto',
                                    onComplete: () => gsap.set(oldFolder, { clearProps: 'scale' }) });
                        }
                        npc.hoveredEl.dispatchEvent(new MouseEvent('mouseout',   { bubbles: true,  cancelable: true, relatedTarget: pageEl }));
                        npc.hoveredEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, cancelable: true, relatedTarget: pageEl }));
                    }
                    // Enter new element
                    if (pageEl) {
                        pageEl.dispatchEvent(new MouseEvent('mouseover',  { bubbles: true,  cancelable: true, relatedTarget: npc.hoveredEl }));
                        pageEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: true, relatedTarget: npc.hoveredEl }));

                        // Scale up project folder + apply hover styling class
                        const newFolder = pageEl.closest?.('.projectfolder');
                        if (newFolder) {
                            newFolder.classList.add('is-npc-hovered');
                            if (typeof gsap !== 'undefined')
                                gsap.to(newFolder, { scale: 1.1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
                        }

                        // Chat bubble on hover (per-NPC cooldown)
                        // Only fire when NPC intentionally visits: explorer always; jenga/builder only while wandering
                        const key = npcHoverKey(pageEl);
                        // Explorer fires hover chat on arrival in _onArrival; skip here to avoid double-fire
                        const isIntentionalVisit = npc.state === 'idle-waiting' && npc.role !== 'explorer';
                        if (key && isIntentionalVisit) {
                            const msgs = HOVER_CHAT_MAP[key];
                            npcChat(npc.player, msgs[randInt(0, msgs.length - 1)]);
                            // 35% chance another visible NPC reacts — only if this key has a specific reaction pool
                            const reactPool = HOVER_REACT_MAP[key];
                            if (reactPool && reactPool.length && Math.random() < 0.35) {
                                const others = NPCS.filter(n => n !== npc && n.el.style.opacity !== '0');
                                if (others.length) {
                                    const reactor = others[randInt(0, others.length - 1)];
                                    setTimeout(() => {
                                        if (running) npcChat(reactor.player, reactPool[randInt(0, reactPool.length - 1)]);
                                    }, rand(600, 1800));
                                }
                            }
                        }
                    }
                    npc.hoveredEl = pageEl;
                }
            });
            if (!anyNpcNearDock && !userNearDock) npcResetDock();

            // User-drag block pushes Jenga tower
            if (userDrag && !jengaTower.falling && jengaTower.blocks.length) {
                const spd = Math.hypot(userDrag.velX || 0, userDrag.velY || 0);
                if (spd > 2) {
                    const ux = (userDrag.curX || 0) + BLOCK_SZ / 2;
                    const uy = (userDrag.curY || 0) + BLOCK_SZ / 2;
                    const hit = jengaTower.blocks.some(b => {
                        const dx = Math.abs(ux - b.cx);
                        const dy = Math.abs(uy - (b.y + BLOCK_SZ / 2));
                        return dx < BLOCK_SZ * 0.85 && dy < BLOCK_SZ * 0.85;
                    });
                    if (hit) jengaCollapse();
                }
            }
        } catch (e) {
            console.error('[bgcursors loop]', e);
        }
        requestAnimationFrame(loop);
    }

    const NPCS = [];

    /* ── Init ────────────────────────────────────────────────────────────────── */
    function init() {
        scene = document.createElement('div');
        scene.id = 'bg-cursor-scene';
        scene.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden;display:none;';
        document.body.appendChild(scene);

        // Drag layer — high-z-index container so the dragged block is above all page UI
        dragLayer = document.createElement('div');
        dragLayer.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
        document.body.appendChild(dragLayer);

        // Pre-load NPC cursor images (WiiPointer images already preloaded by cursor.js)
        PLAYERS.forEach(p => ['Pointer','Open','Closed'].forEach(s => { new Image().src = `/images/${p}/${s}.png`; }));

        pileZone = document.createElement('div');
        pileZone.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;pointer-events:none;';
        document.body.appendChild(pileZone);

        buildChat();
        initPhysics();

        // 1 Jenga NPC + 1 Shape builder + 1 Portfolio explorer (on-call TTT player)
        NPCS.push(new NPC('P2', 0, 'jenga',    false));  // NPC_JENGA
        NPCS.push(new NPC('P3', 1, 'builder',  false));  // NPC_BUILDER_A — shape builder
        NPCS.push(new NPC('P4', 2, 'explorer', true));   // NPC_EXPLORER  — portfolio explorer + TTT

        buildToggleBtn();

        document.addEventListener('mousedown', onDocMouseDown, { capture: true });
        document.addEventListener('mousemove', onDocMouseMove, { passive: true });
        document.addEventListener('mouseup',   onDocMouseUp);

        requestAnimationFrame(loop);
    }

    if (document.body.classList.contains('system-ready')) {
        init();
    } else {
        document.addEventListener('system:ready', init, { once: true });
    }
})();
