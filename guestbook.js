/* guestbook.js — Crate guest book */

(function () {
    'use strict';

    const SB_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SB_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';

    const STAMP_W = 149, STAMP_H = 200;
    const INNER_L = 13, INNER_T = 13, INNER_W = 122, INNER_H = 122;

    let overlayEl  = null;
    let isOpen     = false;

    // ─── Filter / sort state ─────────────────────────────────────────────────
    let activeFilters  = {};   // { color: '#hex', image: 'url', pattern: 'id' }
    let sortByNumber   = false;
    let originalOrder  = [];   // cell elements in insertion order
    let updateGen      = 0;    // incremented each updateGrid call to cancel stale phases

    let paletteEl          = null;
    let filterBarEl        = null;  // outer .gb-filter-wrap
    let filterPillEl       = null;  // inner .gb-filter-bar pill (for palette Y position)
    let draggableInstances = [];    // GSAP Draggable instances — killed on close

    // ─── Stamp counter ───────────────────────────────────────────────────────
    let counterEl    = null;
    let counterCount = 0;

    // ─── Edit button SVG tracing ─────────────────────────────────────────────
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
        const onLight = card.pattern_id === 'v-stripes' ? !outlineLight
                      : (card.pattern_id === 'dots' && outlineLight) ? false
                      : outlineLight;
        return {
            num:  onLight ? '#000'             : '#fff',
            name: onLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
        };
    }

    // ─── Render a single stamp ────────────────────────────────────────────────
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

        const txt     = stampTextColors(card);
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
                <div style="position:absolute;inset:0;pointer-events:none;">${outlineSVG}</div>
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

    // ─── Organize cards ───────────────────────────────────────────────────────
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

    // ─── Filter & sort logic ──────────────────────────────────────────────────
    function matchesAllFilters(cell) {
        if (activeFilters.color && (cell.dataset.borderColor || '').toLowerCase() !== activeFilters.color.toLowerCase())
            return false;
        if (activeFilters.image && cell.dataset.characterSvg !== activeFilters.image)
            return false;
        if (activeFilters.pattern) {
            if (activeFilters.pattern === 'none') {
                if (cell.dataset.patternId) return false;
            } else {
                if (cell.dataset.patternId !== activeFilters.pattern) return false;
            }
        }
        return true;
    }

    function updateGrid(grid) {
        const myGen  = ++updateGen;

        const visible = originalOrder.filter(c =>  matchesAllFilters(c));
        const hidden  = originalOrder.filter(c => !matchesAllFilters(c));

        setCounterValue(visible.length);

        const ordered = sortByNumber
            ? [...visible].sort((a, b) =>
                (parseInt(a.dataset.stampNumber) || 0) - (parseInt(b.dataset.stampNumber) || 0))
            : visible;

        if (typeof gsap !== 'undefined') {
            const nowVisible      = originalOrder.filter(c => c.style.display !== 'none');
            const nowVisibleBodies = nowVisible.map(c => c.querySelector('.gb-stamp-body')).filter(Boolean);

            function revealOrdered() {
                if (updateGen !== myGen) return; // newer filter fired, abort

                // Hide all, reorder DOM
                originalOrder.forEach(c => { c.style.display = 'none'; });
                ordered.forEach(c => grid.appendChild(c));
                hidden.forEach(c  => grid.appendChild(c));

                // Reveal matching stamps one by one, left to right
                // x: 0 resets any drag-displaced stamps back to grid position
                ordered.forEach((cell, i) => {
                    cell.style.display = '';
                    const body     = cell.querySelector('.gb-stamp-body');
                    const targetOp = cell.dataset.isUserStamp === '1' ? 0.4 : 1;
                    const d        = i * 0.04;
                    gsap.fromTo(cell,
                        { y: 10, x: 0 },
                        { y: 0, x: 0, duration: 0.6, ease: 'power2.out', delay: d, overwrite: 'auto',
                          onComplete() { gsap.set(cell, { clearProps: 'y,x' }); } }
                    );
                    if (body) {
                        gsap.fromTo(body,
                            { opacity: 0 },
                            { opacity: targetOp, duration: 0.6, ease: 'power2.out', delay: d, overwrite: 'auto' }
                        );
                    }
                });
            }

            if (nowVisibleBodies.length > 0) {
                // Phase 1: fade all stamp bodies out together, then reveal matching ones
                gsap.to(nowVisibleBodies, {
                    opacity: 0, duration: 0.18, ease: 'power2.in',
                    overwrite: 'auto',
                    onComplete: revealOrdered,
                });
            } else {
                revealOrdered();
            }
        } else {
            ordered.forEach(cell => { cell.style.display = ''; grid.appendChild(cell); });
            hidden.forEach(cell  => { cell.style.display = 'none'; grid.appendChild(cell); });
        }
    }

    function applyFilter(type, value, grid) {
        if (activeFilters[type] === value) {
            delete activeFilters[type];
        } else {
            activeFilters[type] = value;
        }
        updateGrid(grid);
        updateFilterBtnStates();
    }

    // ─── Stamp counter ───────────────────────────────────────────────────────
    function buildCounter(overlay, total) {
        counterCount = total;

        const wrap = document.createElement('div');
        wrap.className = 'gb-counter';
        overlay.appendChild(wrap);
        counterEl = wrap;

        const clip = document.createElement('div');
        clip.className = 'gb-counter-clip';
        wrap.appendChild(clip);

        const numEl = document.createElement('span');
        numEl.className   = 'gb-counter-number';
        numEl.textContent = String(total);
        clip.appendChild(numEl);
    }

    // Odometer-style flip on filter change
    function setCounterValue(newCount) {
        if (!counterEl) return;
        const numEl = counterEl.querySelector('.gb-counter-number');
        if (!numEl) { counterCount = newCount; return; }

        const prev = counterCount;
        counterCount = newCount;
        const dir = newCount < prev ? 1 : -1; // fewer → roll down; more → roll up

        if (typeof gsap !== 'undefined') {
            gsap.timeline()
                .to(numEl,  { y: dir * -12, opacity: 0, duration: 0.12, ease: 'power2.in' })
                .call(()  => { numEl.textContent = String(newCount); })
                .fromTo(numEl,
                    { y: dir * 12, opacity: 0 },
                    { y: 0,        opacity: 1, duration: 0.16, ease: 'power2.out' }
                );
        } else {
            numEl.textContent = String(newCount);
        }
    }

    // ─── Active filter button — fill the whole pill ──────────────────────────
    const PAT_SWATCHES = {
        'dots':      '/images/swatch/dots.png',
        'v-stripes': '/images/swatch/verticle.png',
        'h-stripes': '/images/swatch/horizontal.png',
        'topo':      '/images/swatch/topo.png',
    };

    function updateFilterBtnStates() {
        if (!filterBarEl) return;
        filterBarEl.querySelectorAll('.gb-filter-btn').forEach(b => {
            const isActive = b.dataset.key in activeFilters;
            b.classList.toggle('gb-filter-btn-active', isActive);
            b.classList.toggle('gb-filter-btn-filled',  isActive);

            if (isActive) {
                const key   = b.dataset.key;
                const value = activeFilters[key];
                // Clear text — explicit height + aspect-ratio in CSS sizes the circle
                b.innerHTML = '';

                if (key === 'color') {
                    b.style.background      = value;
                    b.style.backgroundImage = '';
                } else {
                    let src = null;
                    if (key === 'image') {
                        src = value.replace('/prescreen-big/', '/prescreen-small/');
                    } else if (key === 'pattern' && value !== 'none') {
                        src = PAT_SWATCHES[value] || null;
                    }
                    if (src) {
                        b.style.background      = 'rgba(0,0,0,0.04)';
                        b.style.backgroundImage = `url('${src}')`;
                    } else {
                        // 'none' pattern → plain light fill
                        b.style.background      = '#e8e8e8';
                        b.style.backgroundImage = '';
                    }
                }
            } else {
                b.textContent           = b.dataset.label || b.dataset.key;
                b.style.background      = '';
                b.style.backgroundImage = '';
            }
        });
        const sortBtn = filterBarEl.querySelector('.gb-filter-123-btn');
        if (sortBtn) sortBtn.classList.toggle('gb-filter-btn-active', sortByNumber);
    }

    // ─── Filter bar ───────────────────────────────────────────────────────────
    function buildFilterBar(overlay, allCards, grid) {
        // Determine which filter types have multiple distinct values (worth filtering)
        const colorSet   = new Set(allCards.filter(c => c.border_color).map(c => c.border_color));
        const imageSet   = new Set(allCards.filter(c => c.character_svg).map(c => c.character_svg));
        const patternSet = new Set(allCards.filter(c => c.pattern_id).map(c => c.pattern_id));
        const solidCount = allCards.filter(c => !c.pattern_id).length;

        const showColor   = colorSet.size   > 1;
        const showImage   = imageSet.size   > 1;
        const showPattern = patternSet.size > 0 && (solidCount > 0 || patternSet.size > 1);

        // If no filters are useful at all, skip building the bar
        if (!showColor && !showImage && !showPattern) return;

        const wrap = document.createElement('div');
        wrap.className = 'gb-filter-wrap';
        filterBarEl = wrap;
        overlay.appendChild(wrap);

        // Circle "All" — left of pill
        const allBtn = document.createElement('button');
        allBtn.className   = 'gb-filter-all-btn';
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => {
            activeFilters = {};
            updateGrid(grid);
            updateFilterBtnStates();
            closePalette();
        });
        wrap.appendChild(allBtn);

        // Pill — only filter types with real options
        const pill = document.createElement('div');
        pill.className = 'gb-filter-bar';
        filterPillEl = pill;
        wrap.appendChild(pill);

        const defs = [
            { key: 'color',   label: 'Color',   show: showColor   },
            { key: 'image',   label: 'Image',   show: showImage   },
            { key: 'pattern', label: 'Pattern', show: showPattern },
        ];
        defs.filter(d => d.show).forEach(({ key, label }) => {
            const btn = document.createElement('button');
            btn.className    = 'gb-filter-btn';
            btn.textContent  = label;
            btn.dataset.key  = key;
            btn.dataset.label = label;   // preserved for restoring inactive text
            btn.addEventListener('click', () => {
                const alreadyOpen = paletteEl && paletteEl.dataset.key === key;
                closePalette();
                if (!alreadyOpen) spawnPalette(key, allCards, grid);
            });
            pill.appendChild(btn);
        });

        // Circle "123" — right of pill
        const sortBtn = document.createElement('button');
        sortBtn.className   = 'gb-filter-123-btn';
        sortBtn.textContent = '123';
        sortBtn.addEventListener('click', () => {
            closePalette();
            sortByNumber = !sortByNumber;
            updateGrid(grid);
            updateFilterBtnStates();
        });
        wrap.appendChild(sortBtn);
    }

    // ─── Palette ──────────────────────────────────────────────────────────────
    function spawnPalette(key, allCards, grid) {
        const pal       = document.createElement('div');
        pal.className   = 'gb-filter-palette';
        pal.dataset.key = key;
        paletteEl = pal;

        // Only show options valid under the OTHER active filters (not this key's own filter)
        const otherFiltered = allCards.filter(c => {
            if (key !== 'color'   && activeFilters.color   && (c.border_color || '').toLowerCase() !== activeFilters.color)  return false;
            if (key !== 'image'   && activeFilters.image   && c.character_svg !== activeFilters.image)  return false;
            if (key !== 'pattern' && activeFilters.pattern) {
                if (activeFilters.pattern === 'none') { if (c.pattern_id) return false; }
                else { if (c.pattern_id !== activeFilters.pattern) return false; }
            }
            return true;
        });

        if (key === 'color') {
            // Canonical 30-color palette in the same order as the prescreen picker
            const CANONICAL = [
                '#ffffff','#f5f5f5','#e8e0d0','#fadadd','#f4a8b0','#ff6b6b',
                '#e74c3c','#fff3b0','#f5e6ca','#ffb347','#f39c12','#e67e22',
                '#d4edda','#a8d5ba','#4ecdc4','#45b7d1','#b8d4e8','#3498db',
                '#1b4f72','#c4b5d5','#9b59b6','#2c3e50','#1a1a2e','#4a4a5a',
                '#6c7a89','#2d4739','#6e2c00','#4a235a','#000000','#888888',
            ];
            const inData = new Set(
                otherFiltered.map(c => (c.border_color || '').toLowerCase()).filter(Boolean)
            );
            CANONICAL.forEach(color => {
                if (!inData.has(color)) return; // not present in filtered cards
                const chip = makeChip('gb-palette-color');
                chip.style.background = color;
                chip.title = color.toUpperCase();
                if ((activeFilters.color || '').toLowerCase() === color) chip.classList.add('gb-palette-chip-selected');
                chip.addEventListener('click', () => { applyFilter('color', color, grid); closePalette(); });
                pal.appendChild(chip);
            });

        } else if (key === 'image') {
            const seen = new Set();
            otherFiltered.forEach(c => { if (c.character_svg) seen.add(c.character_svg); });
            seen.forEach(src => {
                const chip = makeChip('gb-palette-image');
                const img  = document.createElement('img');
                img.src       = src.replace('/prescreen-big/', '/prescreen-small/');
                img.loading   = 'lazy';
                img.draggable = false;
                chip.appendChild(img);
                if (activeFilters.image === src) chip.classList.add('gb-palette-chip-selected');
                chip.addEventListener('click', () => { applyFilter('image', src, grid); closePalette(); });
                pal.appendChild(chip);
            });

        } else if (key === 'pattern') {
            const PATS = [
                { id: 'none',      label: 'Solid',      swatch: null },
                { id: 'dots',      label: 'Dots',       swatch: '/images/swatch/dots.png' },
                { id: 'v-stripes', label: 'Vertical',   swatch: '/images/swatch/verticle.png' },
                { id: 'h-stripes', label: 'Horizontal', swatch: '/images/swatch/horizontal.png' },
                { id: 'topo',      label: 'Topo',       swatch: '/images/swatch/topo.png' },
            ];
            // Only show options that actually appear among cards matching other active filters
            const solidCount = otherFiltered.filter(c => !c.pattern_id).length;
            const patternSet = new Set(otherFiltered.filter(c => c.pattern_id).map(c => c.pattern_id));

            PATS.forEach(({ id, label, swatch }) => {
                const exists = id === 'none' ? solidCount > 0 : patternSet.has(id);
                if (!exists) return;

                const chip = makeChip(swatch ? 'gb-palette-pattern' : 'gb-palette-pattern gb-palette-solid');
                chip.title = label;
                if (swatch) {
                    const img = document.createElement('img');
                    img.src = swatch; img.draggable = false;
                    chip.appendChild(img);
                } else {
                    chip.textContent = label;
                }
                if (activeFilters.pattern === id) chip.classList.add('gb-palette-chip-selected');
                chip.addEventListener('click', () => { applyFilter('pattern', id, grid); closePalette(); });
                pal.appendChild(chip);
            });
        }

        document.body.appendChild(pal);

        // Set grid columns — palette is exactly as wide as its chips, no dead space
        const chips = pal.querySelectorAll('.gb-palette-chip');
        if (chips.length) {
            const CHIP = key === 'color' ? 22 : 36;
            const MAX  = key === 'color' ? 8 : 5;
            const cols = Math.min(chips.length, MAX);
            pal.style.gridTemplateColumns = `repeat(${cols}, ${CHIP}px)`;
        }

        // Mark which pill button opened this palette (keeps hover look while open)
        if (filterBarEl) {
            filterBarEl.querySelectorAll('.gb-filter-btn').forEach(b => b.classList.remove('gb-filter-btn-open'));
            const openBtn = filterBarEl.querySelector(`.gb-filter-btn[data-key="${key}"]`);
            if (openBtn) openBtn.classList.add('gb-filter-btn-open');
        }

        // Centre horizontally; position below the filter pill
        const barBottom = (filterPillEl || filterBarEl).getBoundingClientRect().bottom;
        pal.style.left = '50%';
        pal.style.top  = (barBottom + 8) + 'px';

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(pal,
                { xPercent: -50, opacity: 0, y: -8, scale: 0.97 },
                { xPercent: -50, opacity: 1, y: 0,  scale: 1, duration: 0.22, ease: 'back.out(1.6)' }
            );
        } else {
            pal.style.transform = 'translateX(-50%)';
            pal.style.opacity   = '1';
        }
    }

    function makeChip(extraClass) {
        const chip = document.createElement('button');
        chip.className = 'gb-palette-chip' + (extraClass ? ' ' + extraClass : '');
        return chip;
    }

    function closePalette() {
        if (!paletteEl) return;
        const el = paletteEl;
        paletteEl = null;
        // Remove open-state highlight from all pill buttons
        if (filterBarEl) filterBarEl.querySelectorAll('.gb-filter-btn-open').forEach(b => b.classList.remove('gb-filter-btn-open'));
        if (typeof gsap !== 'undefined') {
            gsap.to(el, {
                opacity: 0, y: -4, scale: 0.97, duration: 0.15, ease: 'power2.in',
                onComplete: () => el.remove(),
            });
        } else {
            el.remove();
        }
    }

    // ─── Open ─────────────────────────────────────────────────────────────────
    async function openGuestBook() {
        if (isOpen) return;
        isOpen = true;

        // Register Club GSAP plugins if available (safe to call multiple times)
        if (typeof gsap !== 'undefined') {
            if (typeof Draggable     !== 'undefined') gsap.registerPlugin(Draggable);
            if (typeof InertiaPlugin !== 'undefined') gsap.registerPlugin(InertiaPlugin);
        }

        const overlay = document.createElement('div');
        overlay.id = 'gb-overlay';
        overlayEl = overlay;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeGuestBook();
        });

        const closeBtn = document.createElement('div');
        closeBtn.className = 'gb-close-btn';
        closeBtn.setAttribute('role', 'button');
        closeBtn.setAttribute('tabindex', '0');
        closeBtn.innerHTML = `
            <img class="gb-crate-back"    src="/images/crate/crate-back.svg"    alt="" draggable="false">
            <img class="gb-crate-stamps"  src="/images/crate/crate-stamps.svg"  alt="" draggable="false">
            <img class="gb-crate-front"   src="/images/crate/crate-front.svg"   alt="" draggable="false">
        `;
        closeBtn.addEventListener('click', closeGuestBook);
        closeBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') closeGuestBook(); });
        overlay.appendChild(closeBtn);
        setTimeout(() => closeBtn.classList.add('gb-close-ready'), 400);

        const scroll = document.createElement('div');
        scroll.className = 'gb-grid-scroll';
        overlay.appendChild(scroll);

        const grid = document.createElement('div');
        grid.className = 'gb-grid';
        scroll.appendChild(grid);

        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('gb-overlay-in')));

        const cards   = await fetchCards();
        const ordered = organizeCards(cards);

        if (ordered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gb-empty';
            empty.textContent = 'No stamps yet';
            grid.appendChild(empty);
        } else {
            let userStampNumber = null;
            try {
                const saved = localStorage.getItem('lh_id_card_v1');
                if (saved) userStampNumber = JSON.parse(saved)?.stampNumber ?? null;
            } catch {}

            ordered.forEach((card, i) => {
                const cell = document.createElement('div');
                cell.className = 'gb-stamp-cell';

                const isUserStamp = !!(userStampNumber && card.stamp_number === userStampNumber);
                cell.dataset.borderColor  = (card.border_color  || '').toLowerCase();
                cell.dataset.characterSvg = card.character_svg || '';
                cell.dataset.patternId    = card.pattern_id    || '';
                cell.dataset.stampNumber  = String(card.stamp_number || 0);
                if (isUserStamp) cell.dataset.isUserStamp = '1';

                cell.innerHTML = renderStampHTML(card);

                if (isUserStamp) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'gb-edit-btn';
                    editBtn.textContent = 'edit';

                    // Hover: user's stamp body fades to 100%, then back to 40%
                    const body = cell.querySelector('.gb-stamp-body');
                    editBtn.addEventListener('mouseenter', () => {
                        if (body && typeof gsap !== 'undefined')
                            gsap.to(body, { opacity: 1, duration: 0.2, overwrite: 'auto' });
                    });
                    editBtn.addEventListener('mouseleave', () => {
                        if (body && typeof gsap !== 'undefined')
                            gsap.to(body, { opacity: 0.4, duration: 0.2, overwrite: 'auto' });
                    });

                    editBtn.addEventListener('click', e => {
                        e.stopPropagation();
                        closeGuestBook();
                        setTimeout(() => {
                            if (window.__openEditPrescreen) window.__openEditPrescreen();
                        }, 450);
                    });
                    // Button is a sibling of stamp-body (not inside it) so it's
                    // unaffected by the body's 0.4 opacity and stays at 100% always
                    cell.appendChild(editBtn);
                }

                grid.appendChild(cell);
                originalOrder.push(cell);

                // GSAP load-in: y on cell, opacity on stamp body
                // (keeps edit button outside the opacity context → always 100%)
                if (typeof gsap !== 'undefined') {
                    const body     = cell.querySelector('.gb-stamp-body');
                    const targetOp = isUserStamp ? 0.4 : 1;
                    const d        = 0.08 + i * 0.035;
                    gsap.fromTo(cell,
                        { y: 10 },
                        { y: 0, duration: 0.6, ease: 'power2.out', delay: d, overwrite: 'auto',
                          onComplete() { gsap.set(cell, { clearProps: 'y' }); } }
                    );
                    if (body) {
                        gsap.fromTo(body,
                            { opacity: 0 },
                            { opacity: targetOp, duration: 0.6, ease: 'power2.out', delay: d, overwrite: 'auto' }
                        );
                    }

                }
            });

            buildFilterBar(overlay, ordered, grid);
            buildCounter(overlay, ordered.length);

            if (typeof gsap !== 'undefined') {
                const PAN_STRENGTH  = 8;
                const TILT_MAX      = 30;
                const RADIUS        = Math.hypot(window.innerWidth, window.innerHeight);

                scroll.addEventListener('mousemove', (e) => {
                    if (document.body.classList.contains('gb-is-dragging')) return;
                    scroll.querySelectorAll('.gb-stamp-cell').forEach(cell => {
                        if (cell.style.zIndex === '100') return;
                        const r    = cell.getBoundingClientRect();
                        const cx   = r.left + r.width  / 2;
                        const cy   = r.top  + r.height / 2;
                        const dx   = e.clientX - cx;
                        const dy   = e.clientY - cy;
                        const dist = Math.hypot(dx, dy);
                        if (dist < RADIUS && dist > 0) {
                            const t  = 1 - dist / RADIUS;
                            const rx = -(Math.max(-1, Math.min(1, dy / (r.height / 2)))) * TILT_MAX * t;
                            const ry =  (Math.max(-1, Math.min(1, dx / (r.width  / 2)))) * TILT_MAX * t;
                            const tx =  (dx / dist) * PAN_STRENGTH * t;
                            const ty =  (dy / dist) * PAN_STRENGTH * t;
                            gsap.to(cell, { x: tx, y: ty, rotateX: rx, rotateY: ry, transformPerspective: 600, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
                        } else {
                            gsap.to(cell, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
                        }
                    });
                }, { passive: true });

                scroll.addEventListener('mouseleave', () => {
                    scroll.querySelectorAll('.gb-stamp-cell').forEach(cell => {
                        gsap.to(cell, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
                    });
                }, { passive: true });
            }
        }
    }

    // ─── Close ────────────────────────────────────────────────────────────────
    function closeGuestBook() {
        if (!isOpen || !overlayEl) return;
        isOpen = false;

        closePalette();
        activeFilters = {};
        sortByNumber  = false;
        filterBarEl   = null;
        filterPillEl  = null;
        counterEl     = null;
        counterCount  = 0;

        // Kill all Draggable instances — fresh ones are created on next open
        draggableInstances.forEach(d => d.kill());
        draggableInstances = [];

        // Fade crate button out immediately
        const openBtn = document.getElementById('gb-crate-btn');
        if (openBtn) {
            openBtn.style.transition    = 'opacity 0.15s ease, transform 0.15s ease';
            openBtn.style.opacity       = '0';
            openBtn.style.pointerEvents = 'none';
            setTimeout(() => {
                openBtn.style.transition    = 'opacity 0.6s ease, transform 0.15s ease';
                openBtn.style.opacity       = '';
                openBtn.style.pointerEvents = '';
                setTimeout(() => { openBtn.style.transition = ''; }, 700);
            }, 400);
        }

        const el = overlayEl;
        overlayEl = null;

        function doOverlayFade() {
            originalOrder = [];
            el.classList.remove('gb-overlay-in');
            el.classList.add('gb-overlay-out');
            setTimeout(() => el.remove(), 400);
        }

        // Animate stamps out first — reverse of load-in (stagger from last to first)
        const visibleCells = Array.from(el.querySelectorAll('.gb-stamp-cell'))
            .filter(c => c.style.display !== 'none');

        if (typeof gsap !== 'undefined' && visibleCells.length > 0) {
            // Use timeline so onComplete fires once after ALL cells finish (not per cell)
            gsap.timeline({ onComplete: doOverlayFade })
                .to(visibleCells, {
                    opacity: 0, y: 10, duration: 0.2, ease: 'power2.in',
                    stagger: { amount: 0.15, from: 'end' },
                    overwrite: 'auto',
                });
        } else {
            doOverlayFade();
        }
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
