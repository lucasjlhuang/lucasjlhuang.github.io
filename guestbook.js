/* guestbook.js — Crate guest book */

(function () {
    'use strict';

    const SB_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SB_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';

    // Exact same pixel dimensions as the prescreen stamp (prescreen.js STAMP_W/H)
    const STAMP_W = 149, STAMP_H = 200;
    const INNER_L = 13, INNER_T = 13, INNER_W = 122, INNER_H = 122;

    let overlayEl = null;
    let isOpen    = false;

    // ─── Edit button SVG tracing (mirrors prescreen enter button animation) ──────
    function initEditButton(btn) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const r  = btn.getBoundingClientRect();
            const w  = r.width, h = r.height, rx = 3, m = 0.75;
            const PL = 100, hw = w / 2;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('stamp-enter-svg');
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('stamp-enter-rect');
            path.setAttribute('d',
                `M ${hw} ${m}` +
                ` H ${w-rx-m} A ${rx} ${rx} 0 0 1 ${w-m} ${rx+m}` +
                ` V ${h-rx-m} A ${rx} ${rx} 0 0 1 ${w-rx-m} ${h-m}` +
                ` H ${rx+m} A ${rx} ${rx} 0 0 1 ${m} ${h-rx-m}` +
                ` V ${rx+m} A ${rx} ${rx} 0 0 1 ${rx+m} ${m}` +
                ` H ${hw}`
            );
            path.setAttribute('pathLength', String(PL));
            path.style.strokeWidth      = '1';
            path.style.stroke           = 'rgba(0,0,0,0.75)';
            path.style.strokeDasharray  = `${PL} ${PL}`;
            path.style.strokeDashoffset = String(PL);
            path.style.transition       = 'none';

            svg.appendChild(path);
            btn.appendChild(svg);

            btn.addEventListener('mouseenter', () => {
                path.style.transition       = 'stroke-dashoffset 0.32s linear';
                path.style.strokeDashoffset = '0';
            });
            btn.addEventListener('mouseleave', () => {
                path.style.transition       = 'stroke-dashoffset 0.22s linear';
                path.style.strokeDashoffset = String(PL);
            });
        }));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function escHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function isLightColor(hex) {
        const c = (hex || '#FDFCFC').replace('#','');
        const r = parseInt(c.slice(0,2),16);
        const g = parseInt(c.slice(2,4),16);
        const b = parseInt(c.slice(4,6),16);
        return (r*299 + g*587 + b*114) / 1000 > 155;
    }

    function stampTextColors(card) {
        const outlineLight = isLightColor(card.border_color);
        const onLight = card.pattern_id === 'v-stripes' ? !outlineLight : outlineLight;
        return {
            num:  onLight ? '#000'             : '#fff',
            name: onLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
        };
    }

    // ─── Render a single stamp — exact prescreen dimensions & pixel values ──────
    function renderStampHTML(card) {
        const renderer    = window.__stampRenderer;
        const borderColor = card.border_color || '#FDFCFC';
        const innerColor  = card.card_color   || '#FFFFFF';

        let outlineSVG = '';
        if (renderer) {
            const pat = card.pattern_id
                ? renderer.PATTERNS.find(p => p.id === card.pattern_id) || null
                : null;
            outlineSVG = renderer.makeOutlineSVG(STAMP_W, STAMP_H, borderColor, pat);
        }

        const txt = stampTextColors(card);
        const imgHTML = card.character_svg
            ? `<img src="${escHtml(card.character_svg)}" loading="lazy"
                    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;">`
            : '';

        return `
            <div class="gb-stamp-body">
                <div style="position:absolute;
                     left:${INNER_L}px;top:${INNER_T}px;
                     width:${INNER_W}px;height:${INNER_H}px;overflow:hidden;">
                    <div style="position:absolute;inset:0;background:${escHtml(innerColor)};"></div>
                    ${imgHTML}
                </div>
                <div style="position:absolute;inset:0;pointer-events:none;">
                    ${outlineSVG}
                </div>
                <div style="position:absolute;bottom:25px;right:14px;
                     font-family:'SFMedium',sans-serif;font-size:15px;font-weight:700;
                     color:${txt.num};line-height:1;pointer-events:none;">
                    ${escHtml(String(card.stamp_number || '?'))}
                </div>
                <div style="position:absolute;bottom:12px;right:14px;
                     font-family:'SFMedium',sans-serif;font-size:10px;
                     color:${txt.name};line-height:1;
                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                     max-width:116px;pointer-events:none;">
                    ${escHtml(card.name || '')}
                </div>
            </div>
        `;
    }

    // ─── Organize: #1 pinned first, user's stamp second, rest shuffled ──────────
    function organizeCards(cards) {
        if (!cards || !cards.length) return [];

        let userStampNumber = null;
        try {
            const saved = localStorage.getItem('lh_id_card_v1');
            if (saved) userStampNumber = JSON.parse(saved)?.stampNumber ?? null;
        } catch {}

        const second = cards.find(c => c.stamp_number === 1)
                    || [...cards].sort((a,b) => (a.id||0)-(b.id||0))[0];
        const first  = userStampNumber && userStampNumber !== 1
                    ? cards.find(c => c.stamp_number === userStampNumber)
                    : null;
        const rest   = cards.filter(c => c !== first && c !== second);

        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }

        return [first, second, ...rest].filter(Boolean);
    }

    // ─── Fetch from Supabase ──────────────────────────────────────────────────
    async function fetchCards() {
        try {
            const res = await fetch(
                `${SB_URL}/rest/v1/guest_cards?select=*&order=submitted_at.desc`,
                { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
            );
            return res.ok ? res.json() : [];
        } catch { return []; }
    }

    // ─── Open ─────────────────────────────────────────────────────────────────
    async function openGuestBook() {
        if (isOpen) return;
        isOpen = true;

        // White overlay
        const overlay = document.createElement('div');
        overlay.id = 'gb-overlay';
        overlayEl = overlay;
        document.body.appendChild(overlay);

        // Close on background click
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeGuestBook();
        });

        // Close button — empty crate at the same position as the open button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'gb-close-btn';
        closeBtn.setAttribute('role', 'button');
        closeBtn.setAttribute('tabindex', '0');
        closeBtn.innerHTML = `
            <img class="gb-crate-back"  src="/images/crate/crate-back.svg"  alt="" draggable="false">
            <img class="gb-crate-front" src="/images/crate/crate-front.svg" alt="" draggable="false">
        `;
        closeBtn.addEventListener('click', closeGuestBook);
        closeBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') closeGuestBook(); });
        overlay.appendChild(closeBtn);

        // Grid scroll area
        const scroll = document.createElement('div');
        scroll.className = 'gb-grid-scroll';
        overlay.appendChild(scroll);

        const grid = document.createElement('div');
        grid.className = 'gb-grid';
        scroll.appendChild(grid);

        // Fade overlay in
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('gb-overlay-in')));

        // Fetch + render stamps
        const cards    = await fetchCards();
        const ordered  = organizeCards(cards);

        if (ordered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gb-empty';
            empty.textContent = 'No stamps yet';
            grid.appendChild(empty);
        } else {
            // Check if the user has their own stamp in the gallery
            let userStampNumber = null;
            try {
                const saved = localStorage.getItem('lh_id_card_v1');
                if (saved) userStampNumber = JSON.parse(saved)?.stampNumber ?? null;
            } catch {}

            ordered.forEach((card, i) => {
                const cell = document.createElement('div');
                cell.className = 'gb-stamp-cell';
                cell.innerHTML = renderStampHTML(card);

                // Add edit button to the user's own stamp
                if (userStampNumber && card.stamp_number === userStampNumber) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'gb-edit-btn';
                    editBtn.textContent = 'edit';
                    editBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        closeGuestBook();
                        setTimeout(() => {
                            if (window.__openEditPrescreen) window.__openEditPrescreen();
                        }, 450);
                    });
                    const body = cell.querySelector('.gb-stamp-body');
                    if (body) {
                        body.appendChild(editBtn);
                        initEditButton(editBtn);
                    }
                }

                grid.appendChild(cell);
                setTimeout(() => cell.classList.add('gb-cell-in'), 80 + i * 35);
            });
        }
    }

    // ─── Close ────────────────────────────────────────────────────────────────
    function closeGuestBook() {
        if (!isOpen || !overlayEl) return;
        isOpen = false;
        overlayEl.classList.remove('gb-overlay-in');
        overlayEl.classList.add('gb-overlay-out');
        const el = overlayEl;
        overlayEl = null;
        setTimeout(() => el.remove(), 400);
    }

    // ─── Crate button ─────────────────────────────────────────────────────────
    function buildCrateButton() {
        if (document.getElementById('gb-crate-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'gb-crate-btn';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.innerHTML = `
            <img class="gb-crate-back"   src="/images/crate/crate-back.svg"   alt="" draggable="false">
            <img class="gb-crate-stamps" src="/images/crate/crate-stamps.svg" alt="" draggable="false">
            <img class="gb-crate-front"  src="/images/crate/crate-front.svg"  alt="" draggable="false">
        `;
        btn.addEventListener('click', () => isOpen ? closeGuestBook() : openGuestBook());
        btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') btn.click(); });
        document.body.appendChild(btn);

        function show() {
            requestAnimationFrame(() => requestAnimationFrame(() => btn.classList.add('gb-crate-visible')));
        }
        if (document.body.classList.contains('system-ready')) {
            show();
        } else {
            document.addEventListener('system:ready', show, { once: true });
        }
    }

    document.addEventListener('DOMContentLoaded', buildCrateButton);
})();
