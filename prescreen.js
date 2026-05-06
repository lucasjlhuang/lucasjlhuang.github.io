/* prescreen.js — ID Card Pre-screen */

(function () {
    'use strict';

    window.__prescreenDone = false;

    const STORAGE_KEY = 'lh_id_card_v1'; // current card — returning visitor detection

    // ─── Supabase config ─────────────────────────────────────────────────────
    // Replace these two values with your own project URL and anon key.
    // The anon key is safe to expose in browser code — access is controlled
    // by Supabase Row Level Security policies on the table.
    //
    // Table setup (run once in Supabase SQL editor):
    //
    //   create table guest_cards (
    //     id            bigserial primary key,
    //     name          text,
    //     visit_date    text,
    //     card_color    text,
    //     signature_url text,
    //     submitted_at  timestamptz default now()
    //   );
    //   alter table guest_cards enable row level security;
    //   create policy "Anyone can insert"
    //     on guest_cards for insert to anon with check (true);
    //   create policy "Anyone can read"
    //     on guest_cards for select to anon using (true);
    //
    const SUPABASE_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SUPABASE_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';
    const TABLE         = 'guest_cards';

    // Expose for other scripts (guestbook.js visitor counter)
    window.__SUPABASE_URL  = SUPABASE_URL;
    window.__SUPABASE_ANON = SUPABASE_ANON;

    async function saveCardToSupabase(cardData) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'apikey':        SUPABASE_ANON,
                    'Authorization': `Bearer ${SUPABASE_ANON}`,
                    'Prefer':        'return=minimal',
                },
                body: JSON.stringify({
                    name:          cardData.name          || null,
                    visit_date:    cardData.date          || null,
                    card_color:    cardData.cardColor     || null,
                    signature_url: cardData.signatureDataURL || null,
                    character_svg: cardData.characterSVG  || null,
                }),
            });
        } catch (err) {
            console.warn('Guest card upload failed:', err);
        }
    }

    // Exposed so guestbook.js can fetch all cards
    window.fetchAllGuestCards = async function () {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=submitted_at.desc`,
                {
                    headers: {
                        'apikey':        SUPABASE_ANON,
                        'Authorization': `Bearer ${SUPABASE_ANON}`,
                    },
                }
            );
            return res.ok ? res.json() : [];
        } catch { return []; }
    };

    const CARD_COLORS = [
        { name: 'Sky',    value: '#D9EDF8' },
        { name: 'Lavender', value: '#DEDAF4' },
        { name: 'Mint',   value: '#E4F1EE' },
        { name: 'Lemon',  value: '#FDFFB6' },
        { name: 'Rose',   value: '#FFADAD' },
    ];
    let activeColor = CARD_COLORS[0].value;

    const RANDOM_NAMES = [
        'Alex Rivera','Jordan Kim','Sam Okafor','Taylor Reyes',
        'Morgan Chen','Casey Patel','Drew Nakamura','Quinn Adeyemi',
        'Avery Liu','Blake Hassan','Charlie Russo','Dana Osei',
        'Emery Tanaka','Finley Soto','Gray Mensah','Harper Novak',
        'Indigo Cruz','Jamie Yuen','Kris Boateng','Lane Müller',
        'Max Fernández','Nico Ashworth','Ola Svensson','Park Winters',
        'Rowan Ibeji','Sage Fontaine','Tatum Wolfe','Uma Bright',
        'Val Okwu','West Liang',
    ];

    function formatDate(d) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()}`;
    }

    function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function loadSavedCard() {
        try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
        catch { return null; }
    }

    function saveCard(data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    }

    // Public helper so other scripts can read the archive
    window.getAllIDCards = function () {
        try {
            const raw = localStorage.getItem(STORAGE_ALL_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    };

    function signalBoot() {
        window.__prescreenDone = true;
        document.dispatchEvent(new CustomEvent('prescreen:done'));
    }

    function isLightColor(hex) {
        const c = hex.replace('#','');
        const r = parseInt(c.slice(0,2),16);
        const g = parseInt(c.slice(2,4),16);
        const b = parseInt(c.slice(4,6),16);
        return (r*299 + g*587 + b*114) / 1000 > 155;
    }

    function applyColor(color) {
        activeColor = color;
        const card   = document.querySelector('.id-card');
        const circle = document.querySelector('.id-card-reveal-circle');
        if (card)   card.style.background   = color;
        if (circle) circle.style.background = color;
        // Toggle light/dark text mode on the card
        if (card) {
            if (isLightColor(color)) {
                card.classList.add('light-card');
            } else {
                card.classList.remove('light-card');
            }
        }
    }

    // ─── Signature pad ────────────────────────────────────────────────────────
    // KEY FIX: We do NOT rely on CSS width/height at all.
    // Instead we set the canvas width/height explicitly in px from its
    // parent's offsetWidth/offsetHeight, which works even during animations.
    // We also attach events to the DOCUMENT during a stroke (not the canvas)
    // to guarantee we never miss a mousemove/mouseup regardless of pointer speed.

    function makeSignaturePad(canvas, placeholderEl) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let hasContent = false;
        let lastX = 0;
        let lastY = 0;

        function styleCtx() {
            const card = document.querySelector('.id-card');
            const light = card && card.classList.contains('light-card');
            ctx.strokeStyle = light ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)';
            ctx.fillStyle   = light ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)';
            ctx.lineWidth   = 2.5;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
        }

        // Set canvas backing store to match its rendered size
        function resize() {
            const dpr = window.devicePixelRatio || 1;
            // Use offsetWidth/offsetHeight — these reflect CSS layout even inside transforms
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (w === 0 || h === 0) return; // not laid out yet
            // Save drawing if any
            let snap = null;
            if (hasContent) {
                try { snap = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch(e) {}
            }
            canvas.width  = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.scale(dpr, dpr);
            styleCtx();
            if (snap) ctx.putImageData(snap, 0, 0);
        }

        // Convert a client-space point into canvas CSS-pixel space
        function toLocal(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }

        // ── Mouse events (attached to document during drag for reliability) ──
        function onMouseDown(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            styleCtx(); // re-read card class in case color changed
            isDrawing = true;

            const p = toLocal(e.clientX, e.clientY);
            lastX = p.x; lastY = p.y;

            // Dot on press
            ctx.beginPath();
            ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();

            markContent();

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
        }

        function onMouseMove(e) {
            if (!isDrawing) return;
            const p = toLocal(e.clientX, e.clientY);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            lastX = p.x; lastY = p.y;
        }

        function onMouseUp() {
            isDrawing = false;
            ctx.beginPath();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);
        }

        // ── Touch events ──
        function onTouchStart(e) {
            e.preventDefault();
            const t = e.touches[0];
            isDrawing = true;
            const p = toLocal(t.clientX, t.clientY);
            lastX = p.x; lastY = p.y;
            ctx.beginPath();
            ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
            markContent();
        }

        function onTouchMove(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const t = e.touches[0];
            const p = toLocal(t.clientX, t.clientY);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            lastX = p.x; lastY = p.y;
        }

        function onTouchEnd() {
            isDrawing = false;
            ctx.beginPath();
        }

        function markContent() {
            if (!hasContent) {
                hasContent = true;
                if (placeholderEl) placeholderEl.classList.add('hidden');
            }
        }

        canvas.addEventListener('mousedown',  onMouseDown,  { passive: false });
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
        canvas.addEventListener('touchend',   onTouchEnd);

        return {
            resize,
            clear() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasContent = false;
                if (placeholderEl) placeholderEl.classList.remove('hidden');
            },
            getDataURL() { return hasContent ? canvas.toDataURL('image/png') : null; },
        };
    }

    // ─── Build prescreen HTML ─────────────────────────────────────────────────
    function buildPrescreen() {
        const today = formatDate(new Date());

        const swatchHTML = CARD_COLORS.map((c, i) =>
            `<button class="color-swatch${i === 0 ? ' active' : ''}"
                     data-color="${c.value}" title="${c.name}"
                     style="background:${c.value}"></button>`
        ).join('');

        const el = document.createElement('div');
        el.id = 'prescreen';
        el.innerHTML = `
        <div class="id-card-mask">
            <div class="id-card-reveal-circle" style="background:${activeColor}">
                <div class="id-card" style="background:${activeColor}">
                    <div class="id-card-header">
                        <img class="card-logo-img" src="/images/wordlogo.png" alt="Lucas Huang">
                        <span class="card-label">ID Card</span>
                    </div>
                    <div class="id-card-body">
                        <div class="id-card-photo-col">
                            <div class="photo-frame" id="char-photo-frame">
                                <!-- Character customizer injected here by JS -->
                            </div>
                        </div>
                        <div class="id-card-fields-col">
                            <div class="id-field">
                                <span class="id-field-label">Name</span>
                                <div class="id-field-name-row">
                                    <input class="id-name-input" id="id-name-input"
                                           type="text" placeholder="Your name"
                                           maxlength="30" autocomplete="off" spellcheck="false">
                                    <button class="randomize-btn" id="randomize-btn" title="Random name">
                                        <!-- Two circular arrows -->
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                             stroke="currentColor" stroke-width="2.2"
                                             stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                            <path d="M3 3v5h5"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="id-field">
                                <span class="id-field-label">Date</span>
                                <div class="id-date-value" id="id-date-value">${today}</div>
                            </div>
                            <div class="id-field">
                                <span class="id-field-label">Signature</span>
                                <div class="signature-wrapper" id="sig-wrapper">
                                    <canvas class="signature-canvas" id="sig-canvas"></canvas>
                                    <div class="sig-placeholder" id="sig-placeholder">Sign here</div>
                                    <button class="signature-clear-btn" id="sig-clear">Clear</button>
                                </div>
                                <div class="signature-underline"></div>
                            </div>
                        </div>
                    </div>
                    <div class="id-card-footer">
                        <div class="color-palette" id="color-palette">${swatchHTML}</div>
                        <button class="enter-btn" id="prescreen-enter">Enter →</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.prepend(el);
        return el;
    }

    // ─── Reveal + init pad AFTER card is fully visible ───────────────────────
    function revealCard(pad) {
        const circle    = document.querySelector('.id-card-reveal-circle');
        const header    = document.querySelector('.id-card-header');
        const photoCol  = document.querySelector('.id-card-photo-col');
        const fieldsCol = document.querySelector('.id-card-fields-col');
        const footer    = document.querySelector('.id-card-footer');

        requestAnimationFrame(() => {
            circle.style.background = activeColor;
            circle.classList.add('expanded');
            // Apply light/dark mode immediately for the default color
            const card = document.querySelector('.id-card');
            if (card && isLightColor(activeColor)) card.classList.add('light-card');
        });

        const base = 580;
        setTimeout(() => header.classList.add('loaded'),    base);
        setTimeout(() => photoCol.classList.add('loaded'),  base + 90);
        setTimeout(() => fieldsCol.classList.add('loaded'), base + 180);
        setTimeout(() => footer.classList.add('loaded'),    base + 260);

        // Resize the canvas AFTER the circle expand transition completes (~600ms)
        // so offsetWidth/offsetHeight are real, non-zero values
        setTimeout(() => {
            pad.resize();
        }, base + 50);
    }

    // ─── Genie-out ───────────────────────────────────────────────────────────
    function genieOutAndBoot(prescreen, cardData) {
        saveCard(cardData);
        saveCardToSupabase(cardData); // fire-and-forget — doesn't block animation
        const mask = prescreen.querySelector('.id-card-mask');
        mask.classList.add('genie-out');

        setTimeout(() => {
            prescreen.style.transition = 'opacity 0.3s ease';
            prescreen.style.opacity    = '0';
            setTimeout(() => {
                prescreen.style.display = 'none';
                signalBoot();
                document.addEventListener('system:ready', () => {
                    buildDesktopWidget(cardData);
                }, { once: true });
            }, 320);
        }, 560);
    }

    // ─── Desktop widget ───────────────────────────────────────────────────────
    function buildDesktopWidget(cardData) {
        const el = document.createElement('div');
        el.id = 'desktop-id-card';
        const bg = cardData.cardColor || CARD_COLORS[0].value;
        el.style.background = bg;
        // Transition handled by CSS to match system UI ease animation

        const logoF  = 'brightness(0) invert(1)'; // always white
        const light  = isLightColor(bg);
        const labelC = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
        const photoBg  = light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.2)';
        const photoBdr = light ? 'rgba(0,0,0,0.1)'  : 'rgba(255,255,255,0.2)';
        const svgStroke = light ? '#000' : '#fff';
        const fieldLabel = light ? 'rgba(0,0,0,0.38)'  : 'rgba(255,255,255,0.45)';
        const fieldValue = light ? '#222'               : '#fff';
        const hdrBdr   = light ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.15)';
        const hdrBg    = light ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)';

        // Character: rendered into .widget-photo after DOM append
        const hasChar = !!cardData.characterSVG;

        el.innerHTML = `
        <div class="widget-header" style="border-bottom:1px solid ${hdrBdr};background:${hdrBg}">
            <img class="widget-logo-img" src="/images/wordlogo.png" alt="Lucas Huang"
                 style="filter:${logoF};opacity:0.8">
            <span class="widget-card-label" style="color:${labelC}">ID Card</span>
        </div>
        <div class="widget-body">
            <div class="widget-photo" id="widget-photo-frame"
                 style="background:${photoBg};border-color:${photoBdr};position:relative;overflow:hidden">
                ${!hasChar ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="${svgStroke}" stroke-width="1.5" opacity="0.3">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>` : ''}
            </div>
            <div class="widget-fields">
                ${cardData.signatureDataURL ? `
                <div class="widget-sig-bg">
                    <canvas class="widget-sig-canvas" id="widget-sig-canvas"></canvas>
                </div>` : ''}
                <div class="widget-field-label" style="color:${fieldLabel}">Name</div>
                <div class="widget-field-value widget-name" style="color:${fieldValue}">${cardData.name || '—'}</div>
                <div class="widget-field-label" style="color:${fieldLabel};margin-top:4px">Date</div>
                <div class="widget-field-value widget-date" style="color:${fieldValue}">${cardData.date}</div>
            </div>
        </div>`;

        document.body.appendChild(el);

        // Render character image stack into the photo frame
        if (hasChar && window.CharacterSystem) {
            const frame = el.querySelector('#widget-photo-frame');
            if (frame) window.CharacterSystem.renderInto(frame, cardData.characterSVG);
        }

        if (cardData.signatureDataURL) {
            setTimeout(() => {
                const wsc = document.getElementById('widget-sig-canvas');
                if (!wsc) return;
                const dpr = window.devicePixelRatio || 1;
                const w   = wsc.offsetWidth;
                const h   = wsc.offsetHeight;
                if (!w || !h) return;
                wsc.width  = Math.round(w * dpr);
                wsc.height = Math.round(h * dpr);
                const wctx = wsc.getContext('2d');
                wctx.scale(dpr, dpr);

                const img = new Image();
                img.onload = () => {
                    // Contain: show full signature, no cropping, no distortion
                    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
                    const dw = img.naturalWidth  * scale;
                    const dh = img.naturalHeight * scale;
                    wctx.clearRect(0, 0, w, h);
                    wctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
                };
                img.src = cardData.signatureDataURL;
            }, 120);
        }

        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
        return el;
    }

    // ─── Wire up prescreen ────────────────────────────────────────────────────
    function initPrescreen() {
        const prescreen = buildPrescreen();

        const sigCanvas      = document.getElementById('sig-canvas');
        const sigPlaceholder = document.getElementById('sig-placeholder');

        // Create pad immediately — resize() will be called after card is visible
        const pad = makeSignaturePad(sigCanvas, sigPlaceholder);

        // Character customizer — init after card reveal so frame has layout
        let charCustomizer = null;
        setTimeout(() => {
            const frame = document.getElementById('char-photo-frame');
            if (frame && window.CharacterSystem) {
                charCustomizer = window.CharacterSystem.initCustomizer(frame);
            }
        }, 680); // after circle expand + content fade-in

        document.getElementById('sig-clear').addEventListener('click', () => pad.clear());

        document.getElementById('color-palette').addEventListener('click', e => {
            const swatch = e.target.closest('.color-swatch');
            if (!swatch) return;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            applyColor(swatch.dataset.color);
        });

        const nameInput    = document.getElementById('id-name-input');
        const randomizeBtn = document.getElementById('randomize-btn');
        randomizeBtn.addEventListener('click', () => {
            nameInput.value = randomFrom(RANDOM_NAMES);
            randomizeBtn.classList.remove('spinning');
            void randomizeBtn.offsetWidth;
            randomizeBtn.classList.add('spinning');
            setTimeout(() => randomizeBtn.classList.remove('spinning'), 500);
            nameInput.focus();

            // Also randomize the character
            if (charCustomizer && charCustomizer.reRandomize) {
                charCustomizer.reRandomize();
            }
        });

        document.getElementById('prescreen-enter').addEventListener('click', () => {
            const charState = charCustomizer ? charCustomizer.getState() : null;
            const charSVG   = charCustomizer ? charCustomizer.getSVG()   : null;
            genieOutAndBoot(prescreen, {
                name:             nameInput.value.trim(),
                date:             document.getElementById('id-date-value').textContent,
                signatureDataURL: pad.getDataURL(),
                cardColor:        activeColor,
                characterState:   charState,
                characterSVG:     charSVG,
            });
        });

        // Pass pad into revealCard so it can call resize() at the right moment
        requestAnimationFrame(() => setTimeout(() => revealCard(pad), 80));
    }

    // ─── Entry point ──────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const saved = loadSavedCard();
        if (saved) {
            signalBoot();
            document.addEventListener('system:ready', () => {
                buildDesktopWidget(saved);
            }, { once: true });
        } else {
            initPrescreen();
        }
    });

})();
