/* guestbook.js — Guest Book Stack */

(function () {
    'use strict';

    let isOpen    = false;
    let isLoading = false;
    let stackEl   = null;
    let btnEl     = null;
    let allCards  = [];

    let scrollOffset = 0; // px scrolled within the stack
    const CARD_W = 220;   // matches desktop widget width
    const CARD_GAP = 12;  // gap between stacked cards

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function isLightColor(hex) {
        const c = (hex || '#D9EDF8').replace('#','');
        const r = parseInt(c.slice(0,2),16);
        const g = parseInt(c.slice(2,4),16);
        const b = parseInt(c.slice(4,6),16);
        return (r*299 + g*587 + b*114) / 1000 > 155;
    }

    function drawSig(canvas) {
        const src = canvas.dataset.src;
        if (!src) return;
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth, h = canvas.offsetHeight;
        if (!w || !h) return;
        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
            const dw = img.naturalWidth  * scale;
            const dh = img.naturalHeight * scale;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        };
        img.src = src;
    }

    // ─── Shuffle array ────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ─── Build one card element ───────────────────────────────────────────────
    function buildCardEl(card) {
        const el = document.createElement('div');
        el.className = 'gb-stack-card';
        el.style.background = card.card_color || '#D9EDF8';

        const light = isLightColor(card.card_color);
        const textMain  = light ? '#222'                   : '#fff';
        const textSub   = light ? 'rgba(0,0,0,0.35)'      : 'rgba(255,255,255,0.45)';
        const logoF     = 'brightness(0) invert(1)'; // always white
        const photoBg   = light ? 'rgba(0,0,0,0.08)'      : 'rgba(0,0,0,0.18)';
        const photoBdr  = light ? 'rgba(0,0,0,0.1)'       : 'rgba(255,255,255,0.18)';
        const hdrBdr    = light ? 'rgba(0,0,0,0.07)'      : 'rgba(255,255,255,0.12)';
        const hdrBg     = light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)';

        const sigHTML = card.signature_url
            ? `<div class="gb-sig-bg"><canvas class="gb-sig-canvas" data-src="${escHtml(card.signature_url)}"></canvas></div>`
            : '';

        const hasChar = !!card.character_svg;

        el.innerHTML = `
            <div class="gb-card-header" style="border-bottom:1px solid ${hdrBdr};background:${hdrBg}">
                <img class="gb-logo" src="/images/wordlogo.png" alt="Lucas Huang"
                     style="filter:${logoF};opacity:0.8">
                <span class="gb-card-label" style="color:${textSub}">ID Card</span>
            </div>
            <div class="gb-card-body">
                <div class="gb-photo" style="background:${photoBg};border-color:${photoBdr};position:relative;overflow:hidden">
                    ${!hasChar ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="${light?'#000':'#fff'}" stroke-width="1.5" opacity="0.3">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>` : ''}
                </div>
                <div class="gb-fields">
                    ${sigHTML}
                    <div class="gb-label" style="color:${textSub}">Name</div>
                    <div class="gb-value gb-name" style="color:${textMain}">${escHtml(card.name||'—')}</div>
                    <div class="gb-label" style="color:${textSub};margin-top:4px">Date</div>
                    <div class="gb-value gb-date" style="color:${textMain}">${escHtml(card.visit_date||'—')}</div>
                </div>
            </div>`;

        // Render character image layers after element is built
        if (hasChar && window.CharacterSystem) {
            const photoEl = el.querySelector('.gb-photo');
            if (photoEl) window.CharacterSystem.renderInto(photoEl, card.character_svg);
        }

        // No drag — sticker feature removed for now
        return el;
    }

    // ─── Build the stack panel ────────────────────────────────────────────────
    function buildStack(cards) {
        const btn = document.getElementById('gb-open-btn');
        const btnBottom = btn ? btn.getBoundingClientRect().bottom : 200;
        const stackTop    = btnBottom + 10;
        const stackHeight = window.innerHeight - stackTop; // extend to screen bottom

        const panel = document.createElement('div');
        panel.id = 'gb-stack-panel';
        panel.style.top    = stackTop + 'px';
        panel.style.right  = '18px';
        panel.style.width  = CARD_W + 'px';
        panel.style.height = stackHeight + 'px';

        // No fade masks — seamless clip at edges
        const list = document.createElement('div');
        list.className = 'gb-card-list';
        panel.appendChild(list);

        if (!cards || cards.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gb-empty-msg';
            empty.textContent = 'No guests yet';
            list.appendChild(empty);
        } else {
            // For infinite scroll: triplicate the shuffled list so we always
            // have content above and below the initial scroll position.
            const shuffled = shuffle(cards);
            const copies = cards.length < 4 ? 5 : 3; // more copies for tiny lists
            for (let c = 0; c < copies; c++) {
                shuffled.forEach(card => list.appendChild(buildCardEl(card)));
            }
        }

        document.body.appendChild(panel);

        // ── Infinite scroll: centre the list so there's content both ways ──
        if (cards && cards.length > 0) {
            // Jump to the middle copy so user can scroll up or down indefinitely
            requestAnimationFrame(() => {
                const cardCount    = cards.length;
                const copies       = cards.length < 4 ? 5 : 3;
                const totalCards   = cardCount * copies;
                const middleCopy   = Math.floor(copies / 2);
                // Approximate height of one card + gap
                const cardH = list.scrollHeight / totalCards;
                list.scrollTop = middleCopy * cardCount * cardH;

                // When approaching either end, teleport to the equivalent
                // position in the middle copy (seamless loop)
                list.addEventListener('scroll', () => {
                    const max     = list.scrollHeight - list.clientHeight;
                    const oneSet  = list.scrollHeight / copies;

                    if (list.scrollTop < oneSet * 0.15) {
                        // Near top — jump down by one set
                        list.scrollTop += oneSet;
                    } else if (list.scrollTop > max - oneSet * 0.15) {
                        // Near bottom — jump up by one set
                        list.scrollTop -= oneSet;
                    }
                }, { passive: true });
            });
        }

        // Draw signatures after layout
        setTimeout(() => panel.querySelectorAll('.gb-sig-canvas').forEach(drawSig), 120);

        // Wheel scroll — attach to the LIST so it gets native overflow-y scrolling
        list.addEventListener('wheel', e => {
            e.preventDefault();
            e.stopPropagation();
            list.scrollTop += e.deltaY * 0.8;
        }, { passive: false });

        requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('gb-stack-open')));
        return panel;
    }

    // ─── Open / close ─────────────────────────────────────────────────────────
    async function openStack() {
        if (isLoading || isOpen) return;
        isLoading = true;
        if (btnEl) btnEl.classList.add('gb-btn-loading');

        try {
            if (typeof window.fetchAllGuestCards === 'function') {
                allCards = await window.fetchAllGuestCards();
            }
        } catch (err) {
            console.warn('Guest book fetch failed:', err);
            allCards = [];
        }

        isLoading = false;
        if (btnEl) btnEl.classList.remove('gb-btn-loading');

        const panel = buildStack(allCards);
        if (!panel) {
            // buildStack failed (e.g. widget not in DOM yet) — reset state cleanly
            console.warn('Guest book: could not build panel');
            return;
        }

        stackEl = panel;
        isOpen  = true;
        if (btnEl) btnEl.classList.add('active');
    }

    function closeStack() {
        if (!isOpen) return;
        isOpen = false;
        if (btnEl) btnEl.classList.remove('active');
        if (!stackEl) return;
        stackEl.classList.remove('gb-stack-open');
        stackEl.classList.add('gb-stack-close');
        const el = stackEl;
        stackEl = null;
        setTimeout(() => el.remove(), 340); // matches the 0.32s CSS transition
    }

    // ─── Visitor number ───────────────────────────────────────────────────────

    function loadSavedCard() {
        try {
            const raw = localStorage.getItem('lh_id_card_v1');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    // Credentials — copied directly here so guestbook.js never depends on
    // prescreen.js having run first (defer order isn't guaranteed)
    const SB_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SB_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';

    async function fetchVisitorNumber() {
        if (!loadSavedCard()) return null;
        try {
            // Use exact count via Prefer header — Supabase returns it in Content-Range
            const res = await fetch(
                `${SB_URL}/rest/v1/guest_cards?select=id&limit=1`,
                {
                    headers: {
                        'apikey':        SB_ANON,
                        'Authorization': `Bearer ${SB_ANON}`,
                        'Prefer':        'count=exact',
                    }
                }
            );
            if (!res.ok) return null;
            // Content-Range: 0-0/TOTAL  or  */TOTAL
            const range = res.headers.get('Content-Range') || res.headers.get('content-range');
            if (!range) return null;
            const total = parseInt(range.split('/')[1], 10);
            return isNaN(total) ? null : total;
        } catch { return null; }
    }

    function buildVisitorBadge(number) {
        if (!number) return;
        const existing = document.getElementById('gb-visitor-badge');
        if (existing) existing.remove();

        const badge = document.createElement('div');
        badge.id = 'gb-visitor-badge';
        badge.textContent = `${number.toLocaleString()} employees`;
        document.body.appendChild(badge);

        function positionBadge() {
            const widget = document.getElementById('desktop-id-card');
            const btn    = document.getElementById('gb-open-btn');
            if (!widget || !btn) return;
            const wRect = widget.getBoundingClientRect();
            const bRect = btn.getBoundingClientRect();
            const bh    = badge.offsetHeight || 12;
            // Vertically centred on the CTA button row
            badge.style.top  = Math.round(bRect.top + (bRect.height - bh) / 2) + 'px';
            // Left-aligned with the widget's left edge
            badge.style.left = Math.round(wRect.left) + 'px';
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                positionBadge();
                badge.classList.add('gb-visible');
                setTimeout(positionBadge, 900);
            });
        });
    }
    const TEXT_OPEN  = 'see em all!';
    const TEXT_CLOSE = 'put em away';

    function swapText(el, target) {
        // Hop up — text swaps at the peak (halfway through), new text comes down
        el.classList.add('gb-btn-hop');
        setTimeout(() => {
            el.textContent = target;
        }, 150); // peak of the hop
        setTimeout(() => {
            el.classList.remove('gb-btn-hop');
        }, 320);
    }

    function buildButton() {
        if (document.getElementById('gb-open-btn')) return;
        btnEl = document.createElement('button');
        btnEl.id          = 'gb-open-btn';
        btnEl.textContent = TEXT_OPEN;
        btnEl.addEventListener('click', () => {
            if (isOpen) {
                closeStack();
                swapText(btnEl, TEXT_OPEN);
            } else {
                openStack();
                swapText(btnEl, TEXT_CLOSE);
            }
        });
        document.body.appendChild(btnEl);

        function positionBtn() {
            const widget = document.getElementById('desktop-id-card');
            if (widget) {
                const rect = widget.getBoundingClientRect();
                btnEl.style.top   = (rect.bottom + 4) + 'px'; // tighter gap
                btnEl.style.right = '18px';
            }
        }

        positionBtn();
        setTimeout(positionBtn, 800);

        if (document.body.classList.contains('system-ready')) {
            requestAnimationFrame(() => { btnEl.classList.add('gb-visible'); });
            fetchVisitorNumber().then(buildVisitorBadge);
        } else {
            document.addEventListener('system:ready', () => {
                setTimeout(() => {
                    positionBtn();
                    btnEl.classList.add('gb-visible');
                    fetchVisitorNumber().then(buildVisitorBadge);
                }, 400);
            }, { once: true });
        }
    }

    document.addEventListener('DOMContentLoaded', buildButton);

})();