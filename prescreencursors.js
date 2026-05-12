(() => {
    'use strict';

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.innerWidth <= 768) return;

    const PLAYERS      = ['P2', 'P3'];
    const CURSOR_SZ    = 64;
    const SPEED        = 240;
    const USER_AVOID_R = 130;
    const ICON_SKIP_R  = 160;
    const DROP_MIN     = 80;
    const DROP_MAX     = 220;

    let userX = -999, userY = -999;
    const npcs = [];
    let rafId  = null;

    document.addEventListener('mousemove', e => { userX = e.clientX; userY = e.clientY; }, { passive: true });

    /* ── Utils ───────────────────────────────────────────────────────────────── */
    function rand(a, b)        { return Math.random() * (b - a) + a; }
    function randInt(a, b)     { return Math.floor(rand(a, b + 1)); }
    function lerp(a, b, t)     { return a + (b - a) * t; }
    function ease(t)           { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function dist(ax,ay,bx,by) { return Math.hypot(bx-ax, by-ay); }
    function iconCenter(icon)  { const r = icon.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; }

    function getIcons() { return Array.from(document.querySelectorAll('.scatter-icon')); }

    function availableIcons(exclude = []) {
        return getIcons().filter(icon => {
            if (exclude.includes(icon)) return false;
            const { x, y } = iconCenter(icon);
            if (dist(x, y, userX, userY) < ICON_SKIP_R) return false;
            if (npcs.some(n => n.heldIcon === icon)) return false;
            return true;
        });
    }

    /* ── NPC ─────────────────────────────────────────────────────────────────── */
    class PrescreenNPC {
        constructor(player, index) {
            this.player     = player;
            // Start off-screen on a random edge
            const side = randInt(0, 3);
            if      (side === 0) { this.x = rand(0, window.innerWidth);  this.y = -CURSOR_SZ; }
            else if (side === 1) { this.x = window.innerWidth + CURSOR_SZ; this.y = rand(0, window.innerHeight); }
            else if (side === 2) { this.x = rand(0, window.innerWidth);  this.y = window.innerHeight + CURSOR_SZ; }
            else                 { this.x = -CURSOR_SZ;                   this.y = rand(0, window.innerHeight); }
            this.sx = this.x; this.sy = this.y;
            this.tx = 0; this.ty = 0;
            this.t0 = 0; this.dur = 0;
            this.nextState  = '';
            this.state      = 'waiting';
            this.timer      = performance.now() + rand(1500 + index * 800, 2800 + index * 800);
            this.targetIcon = null;
            this.heldIcon   = null;
            this.thinkQueue = [];
            this.dragQueue  = [];
            this.thinkIndex = 0;
            this.dragIndex  = 0;
            this.dropX      = 0;
            this.dropY      = 0;

            this.el = document.createElement('img');
            this.el.src = `/images/${player}/Pointer.png`;
            this.el.draggable = false;
            this.el.style.cssText = `
                position:fixed; top:0; left:0;
                width:${CURSOR_SZ}px; height:${CURSOR_SZ}px;
                pointer-events:none; will-change:transform;
                z-index:2147483640; opacity:1;
                transition:opacity 0.4s ease;
            `;
            this.el.style.transform = `translate(${this.x}px,${this.y}px)`;
            document.body.appendChild(this.el);
        }

        img(s) { this.el.src = `/images/${this.player}/${s}.png`; }

        journey(tx, ty, next) {
            this.sx = this.x; this.sy = this.y;
            this.tx = tx;     this.ty = ty;
            this.t0  = performance.now();
            this.dur = Math.max(250, (dist(this.x, this.y, tx, ty) / SPEED) * 1000);
            this.nextState = next;
            this.state = 'moving';
            this.img('Pointer');
        }

        showBubble(icon) { if (icon) icon.classList.add('npc-hover');    this.img('Open'); }
        hideBubble(icon) { if (icon) icon.classList.remove('npc-hover'); this.img('Pointer'); }

        /* ── Cycle: think over 2–4 icons, then drag 1–2 of them ─────────────── */
        startCycle() {
            const avail = availableIcons();
            if (avail.length < 1) { this.wait(1500); return; }

            const count = randInt(2, Math.min(4, avail.length));
            this.thinkQueue = [...avail].sort(() => Math.random() - 0.5).slice(0, count);
            this.thinkIndex = 0;
            this.dragQueue  = [];
            this.dragIndex  = 0;
            this.visitNextThink();
        }

        visitNextThink() {
            if (this.thinkIndex >= this.thinkQueue.length) {
                // Done thinking — pick 1–2 icons to drag
                const stillAvail = this.thinkQueue.filter(icon =>
                    availableIcons().includes(icon)
                );
                const dragCount = randInt(1, Math.min(2, stillAvail.length));
                this.dragQueue = stillAvail.slice(0, dragCount);
                this.dragIndex = 0;
                this.dragNextIcon();
                return;
            }

            const icon = this.thinkQueue[this.thinkIndex];
            this.targetIcon = icon;
            const { x, y } = iconCenter(icon);
            this.journey(x - 4, y - 4, 'arrivedThink');
        }

        /* ── Drag ────────────────────────────────────────────────────────────── */
        dragNextIcon() {
            if (this.dragIndex >= this.dragQueue.length) {
                this.wait();
                return;
            }
            const icon = this.dragQueue[this.dragIndex];
            this.targetIcon = icon;
            const { x, y } = iconCenter(icon);
            this.journey(x - 4, y - 4, 'arrivedForDrag');
        }

        beginDrag() {
            const icon = this.targetIcon;
            this.targetIcon = null;
            this.heldIcon   = icon;
            this.img('Closed');

            icon.style.zIndex    = '9000';
            icon.style.transform = 'scale(1.12)';
            icon.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)';
            const bub = icon.querySelector('.icon-bubble');
            if (bub) bub.style.display = 'none';

            // Drop position — random direction from current cursor spot
            const angle = rand(0, Math.PI * 2);
            const d     = rand(DROP_MIN, DROP_MAX);
            this.dropX  = Math.max(30, Math.min(window.innerWidth  - 80, this.x + Math.cos(angle) * d));
            this.dropY  = Math.max(30, Math.min(window.innerHeight - 80, this.y + Math.sin(angle) * d));

            // Cursor tip moves to drop position; icon follows at top-left of cursor
            this.journey(this.dropX, this.dropY, 'arrivedDrop');
            this.img('Closed'); // override pointer reset from journey()
        }

        releaseIcon() {
            const icon = this.heldIcon;
            if (!icon) return;
            this.heldIcon = null;
            icon.style.left      = this.dropX + 'px';
            icon.style.top       = this.dropY + 'px';
            icon.style.zIndex    = '50';
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = '';
            const bub = icon.querySelector('.icon-bubble');
            if (bub) bub.style.display = '';
            this.img('Open');
        }

        /* ── Back off from user cursor ───────────────────────────────────────── */
        backOff() {
            this.hideBubble(this.targetIcon);
            this.targetIcon = null;
            if (this.heldIcon) {
                const r = this.heldIcon.getBoundingClientRect();
                this.dropX = r.left; this.dropY = r.top;
                this.releaseIcon();
            }
            this.thinkQueue = []; this.dragQueue = [];
            const angle = Math.atan2(this.y - userY, this.x - userX);
            const tx = Math.max(60, Math.min(window.innerWidth  - 120, this.x + Math.cos(angle) * 180));
            const ty = Math.max(60, Math.min(window.innerHeight - 120, this.y + Math.sin(angle) * 180));
            this.journey(tx, ty, 'backedOff');
        }

        wait(extra = 0) {
            this.hideBubble(this.targetIcon);
            this.targetIcon = null;
            this.state = 'waiting';
            this.timer = performance.now() + extra + rand(1200, 3000);
        }

        fadeOut() {
            this.hideBubble(this.targetIcon);
            if (this.heldIcon) {
                const r = this.heldIcon.getBoundingClientRect();
                this.dropX = r.left; this.dropY = r.top;
                this.releaseIcon();
            }
            this.el.style.opacity = '0';
        }

        destroy() { this.el.remove(); }

        update(now) {
            // Back off if user is too close (not already doing so)
            if (this.state !== 'moving' || this.nextState !== 'backedOff') {
                if (dist(this.x, this.y, userX, userY) < USER_AVOID_R) {
                    this.backOff(); return;
                }
            }

            switch (this.state) {
                case 'waiting':
                    if (now >= this.timer) this.startCycle();
                    break;

                case 'thinkingOnIcon':
                    if (now >= this.timer) {
                        this.hideBubble(this.targetIcon);
                        this.targetIcon = null;
                        this.thinkIndex++;
                        this.visitNextThink();
                    }
                    break;

                case 'preGrab':
                    if (now >= this.timer) this.beginDrag();
                    break;

                case 'postDrop':
                    if (now >= this.timer) {
                        this.dragIndex++;
                        this.dragNextIcon();
                    }
                    break;

                case 'moving': {
                    const t  = Math.min(1, (now - this.t0) / this.dur);
                    const et = ease(t);
                    this.x = lerp(this.sx, this.tx, et);
                    this.y = lerp(this.sy, this.ty, et);
                    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

                    // Icon sits at top-left of cursor tip
                    if (this.heldIcon) {
                        this.heldIcon.style.left = this.x + 'px';
                        this.heldIcon.style.top  = this.y + 'px';
                    }

                    if (t >= 1) {
                        switch (this.nextState) {
                            case 'arrivedThink':
                                this.showBubble(this.targetIcon);
                                this.state = 'thinkingOnIcon';
                                this.timer = now + rand(1000, 2500);
                                break;
                            case 'arrivedForDrag':
                                this.img('Open');
                                this.state = 'preGrab';
                                this.timer = now + rand(200, 450);
                                break;
                            case 'arrivedDrop':
                                this.releaseIcon();
                                this.state = 'postDrop';
                                this.timer = now + rand(250, 600);
                                break;
                            case 'backedOff':
                                this.wait(500);
                                break;
                        }
                    }
                    break;
                }
            }
        }
    }

    /* ── Loop ────────────────────────────────────────────────────────────────── */
    function loop(now) {
        npcs.forEach(n => n.update(now));
        rafId = requestAnimationFrame(loop);
    }

    /* ── Init ────────────────────────────────────────────────────────────────── */
    function init() {
        if (npcs.length) return; // already running
        PLAYERS.forEach((p, i) => npcs.push(new PrescreenNPC(p, i)));
        rafId = requestAnimationFrame(loop);

        // Fade at exactly the same moment scatter icons fade (enter button click)
        document.addEventListener('click', function onEnter(e) {
            if (!e.target.closest('.stamp-enter-btn')) return;
            document.removeEventListener('click', onEnter, true);
            npcs.forEach(n => n.fadeOut());
        }, true);

        // Clean up elements after prescreen:done (fade is already complete by then)
        document.addEventListener('prescreen:done', () => {
            cancelAnimationFrame(rafId);
            npcs.forEach(n => n.destroy());
            npcs.length = 0;
        }, { once: true });
    }

    /* ── Wait for scatter icons ──────────────────────────────────────────────── */
    function waitForIcons() {
        if (document.querySelector('.scatter-icon')) { init(); return; }
        const observer = new MutationObserver(() => {
            if (document.querySelector('.scatter-icon')) {
                observer.disconnect();
                init();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForIcons);
    } else {
        waitForIcons();
    }
})();
