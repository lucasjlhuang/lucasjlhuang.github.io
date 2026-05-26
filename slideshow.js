// slideshow.js — About Me canvas, parallax, drag-to-expand, text pills

window.STORY_SECTIONS = [
    {
        title: 'Hello hello',
        body: [
            { text: `I'm Lucas (if you didn't already know). I spent WAY too much time on this portfolio so I hope you enjoy it.`, side: 'right' },
            { text: `As an architect-to-be turned designer, my goals have always been functional design and creativity. I'm constantly exploring new ideas (check out my playground) and challenging myself to diversify my skills.`, side: 'right' },
            { text: `Right now, I'm helping build the foundation for professional women's soccer in Canada <a class="about-me-link" href="https://www.NSL.ca" target="_blank">@NorthernSuperLeague</a>. On the side, I'm building a monthly mailing club and too many side projects to count.`, side: 'left' },
        ],
    },
    {
        title: 'Designer by accident',
        hideTitle: true,
        body: [
            { text: `Believe it or not, I ended up as a designer completely by accident. Every week leading up to my highschool graduation I had a new career plan.`, side: 'left' },
            { text: `All I knew was I liked creating.`, side: 'right' },
            { text: `I was making functional model cars, popsicle bridges holding up to 90lbs, bus stations with working electronics, but never once touched digital products. I only applied to GBDA at Waterloo because my sister was already in the program (shout out Sarah).`, side: 'left' },
            { text: `Like Bob Ross says, it was a happy accident — being creative while using logic and research to solve problems really scratched the itch.`, side: 'right' },
        ],
    },
    {
        title: 'Learning through exploration',
        body: [
            { text: `After graduating I decided to travel the world and find ways to learn about design through experiences and adventures. For three years I freelanced and worked odd jobs in Taiwan, Hong Kong, Japan, France, and Germany. I studied their designs, built products, taught students, cleaned hostels, translated, and lived life. I've learned a lot about communicating through design, because often times design was the only way for us to communicate.`, side: 'right' },
            { text: `Now i'm back home trying to find my next adventure, and catching up for lost time :)`, side: 'left' },
        ],
    },
];

window.TLDR_BODY = [
    { text: `I spent most of my life in Canada, but more recently i'm anywhere but. I'm exploring the world, side-questing and trying to find a fit! Let me know if you think you're it :)`, side: 'left' },
    { text: `(the rhyme was accidental, i'm not a rapper)`, side: 'left' },
    { text: `Current obsessions include, but aren't limited to, Magic the Gathering, Warhammer 40k, Carpentry, Clothing restoration, Trinket hunting.`, side: 'right' },
];

function initAboutCanvas(contentContainer, windowEl) {
    const canvas      = contentContainer.querySelector('.about-canvas');
    const items       = Array.from(contentContainer.querySelectorAll('.canvas-item'));
    const placeholder = contentContainer.querySelector('#tldr-placeholder');

    if (!canvas) return;

    contentContainer.style.position = 'relative';
    contentContainer.style.overflow = 'hidden';

    // ── GSAP plugin registration ───────────────────────────────────────────────
    if (typeof gsap !== 'undefined') {
        if (typeof MorphSVGPlugin !== 'undefined') gsap.registerPlugin(MorphSVGPlugin);
        if (typeof DrawSVGPlugin  !== 'undefined') gsap.registerPlugin(DrawSVGPlugin);
    }

    // ── Star morph elements ────────────────────────────────────────────────────
    const starShape  = placeholder?.querySelector('.north-star-shape');
    const starBorder = placeholder?.querySelector('.star-border');
    const starPlus   = placeholder?.querySelector('.north-star-plus');
    const starOrigD  = starShape?.getAttribute('d');

    if (starBorder && typeof DrawSVGPlugin !== 'undefined') {
        gsap.set(starBorder, { drawSVG: '0%' });
    }

    function animateStarDrag() {
        if (!starShape || !starPlus) return;
        if (typeof MorphSVGPlugin !== 'undefined')
            gsap.to(starShape, { morphSVG: starPlus, duration: 0.35, ease: 'power2.inOut', overwrite: true });
        if (starBorder && typeof DrawSVGPlugin !== 'undefined')
            gsap.to(starBorder, { drawSVG: '100%', duration: 0.35, ease: 'power2.out', overwrite: true });
    }

    function animateStarReset() {
        if (!starShape || !starOrigD) return;
        if (typeof MorphSVGPlugin !== 'undefined')
            gsap.to(starShape, { morphSVG: starOrigD, duration: 0.3, ease: 'power2.inOut', overwrite: true });
        if (starBorder && typeof DrawSVGPlugin !== 'undefined')
            gsap.to(starBorder, { drawSVG: '0%', duration: 0.25, ease: 'power2.in', overwrite: true });
    }

    // ── Constants ─────────────────────────────────────────────────────────────
    const ICON_W = 60, ICON_H = 60;
    const STAR_W = 44, STAR_H = 44;
    const EXP_IMG_W = 300, EXP_IMG_H = 175;
    const EXP_IMG_W_FS = 700;
    const EXP_TEXT_W = 300, EXP_TEXT_H = 360;

    function getExpImgDims() {
        if (windowEl && windowEl.classList.contains('is-fullscreen')) {
            return { w: EXP_IMG_W_FS, h: Math.round(EXP_IMG_W_FS * EXP_IMG_H / EXP_IMG_W) };
        }
        return { w: EXP_IMG_W, h: EXP_IMG_H };
    }

    // ── Text pill data ─────────────────────────────────────────────────────────
    const TEXT_PILLS_DATA = [
        { title: 'TLDR<br>"Super cool guy ;)" — My mom if you asked her.', body: window.TLDR_BODY, left: '35%', top: '44%' },
        { title: 'Hello hello',                  body: window.STORY_SECTIONS[0].body,  left: '52%', top: '22%' },
        { title: 'Designer by accident',         body: window.STORY_SECTIONS[1].body,  left: '18%', top: '60%' },
        { title: 'Learning through exploration', body: window.STORY_SECTIONS[2].body,  left: '63%', top: '52%' },
    ];

    // ── Create text pills ──────────────────────────────────────────────────────
    const textPillEls = TEXT_PILLS_DATA.map(data => {
        const pill        = document.createElement('div');
        pill.className    = 'canvas-text-pill';
        pill.style.left   = data.left;
        pill.style.top    = data.top;
        pill.innerHTML    = `<span class="ctp-label">${data.title.split(/<br\s*\/?>/i)[0]}</span>`;
        pill._data        = data;
        pill._defaultLeft = data.left;
        pill._defaultTop  = data.top;
        pill._popping     = false;
        pill._tiltTX = 0; pill._tiltTY = 0;
        pill._tiltCX = 0; pill._tiltCY = 0;
        canvas.appendChild(pill);
        return pill;
    });

    // ── Store defaults & create image masks ────────────────────────────────────
    items.forEach(item => {
        item._defaultLeft = item.style.left;
        item._defaultTop  = item.style.top;
        item._popping     = false;
        item._tiltTX = 0; item._tiltTY = 0;
        item._tiltCX = 0; item._tiltCY = 0;

        const origImg = item.querySelector('img');
        if (!origImg) return;

        const mask     = document.createElement('div');
        mask.className = 'item-mask';
        const maskImg  = document.createElement('img');
        maskImg.className = 'item-mask-img';
        maskImg.src = origImg.src;
        maskImg.alt = '';
        mask.appendChild(maskImg);
        origImg.style.display = 'none';
        item.insertBefore(mask, origImg);
    });

    // ── Overlay instances ──────────────────────────────────────────────────────
    // Each entry: { el, phase, activeItem, activePill, activeType, tiltTX, tiltTY, tiltCX, tiltCY }
    const overlays  = [];
    let   zCounter  = 20;
    let   draggingItem = null;

    function bringToFront(ov) {
        ov.el.style.zIndex = ++zCounter;
    }

    // ── Parallax + tilt state ─────────────────────────────────────────────────
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const STRENGTH  = 25,  LERP      = 0.06;
    const TILT_RADIUS = 150, TILT_MAX = 12, TILT_LERP = 0.08;

    // ── Tilt + parallax update on mousemove ───────────────────────────────────
    contentContainer.addEventListener('mousemove', e => {
        const allEls = [...items, ...textPillEls];
        allEls.forEach(el => {
            if (el === draggingItem || el.style.display === 'none') {
                el._tiltTX = 0; el._tiltTY = 0; return;
            }
            const r  = el.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const d  = Math.hypot(dx, dy);
            if (d < TILT_RADIUS) {
                const t = 1 - d / TILT_RADIUS;
                el._tiltTY =  (dx / (r.width  / 2)) * TILT_MAX * t;
                el._tiltTX = -(dy / (r.height / 2)) * TILT_MAX * t;
            } else {
                el._tiltTX = 0; el._tiltTY = 0;
            }
        });

        overlays.forEach(ov => {
            if (ov.phase === 'open' && ov.activeType === 'image') {
                const r  = ov.el.getBoundingClientRect();
                const cx = r.left + r.width  / 2;
                const cy = r.top  + r.height / 2;
                ov.tiltTY =  ((e.clientX - cx) / Math.max(r.width  / 2, 1)) * (TILT_MAX * 0.5);
                ov.tiltTX = -((e.clientY - cy) / Math.max(r.height / 2, 1)) * (TILT_MAX * 0.5);
            } else {
                ov.tiltTX = 0; ov.tiltTY = 0;
            }
        });
    }, { passive: true });

    contentContainer.addEventListener('mouseleave', () => {
        [...items, ...textPillEls].forEach(el => { el._tiltTX = 0; el._tiltTY = 0; });
        overlays.forEach(ov => { ov.tiltTX = 0; ov.tiltTY = 0; });
    });

    const onMouseMove = (e) => {
        if (!windowEl) return;
        const rect = windowEl.getBoundingClientRect();
        targetX = Math.max(-1, Math.min(1, (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2)));
        targetY = Math.max(-1, Math.min(1, (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2)));
    };
    document.addEventListener('mousemove', onMouseMove);

    // ── Parallax RAF loop ─────────────────────────────────────────────────────
    let rafId = null;

    function startParallax() {
        if (rafId) return;
        function loop() {
            if (!document.contains(windowEl)) {
                rafId = null;
                document.removeEventListener('mousemove', onMouseMove);
                return;
            }
            currentX += (targetX - currentX) * LERP;
            currentY += (targetY - currentY) * LERP;

            items.forEach(item => {
                if (item === draggingItem || item.style.display === 'none' || item._popping) return;
                const depth = parseFloat(item.dataset.depth) || 1;
                item.style.setProperty('--px', `${currentX * STRENGTH * depth}px`);
                item.style.setProperty('--py', `${currentY * STRENGTH * depth}px`);
                item._tiltCX += (item._tiltTX - item._tiltCX) * TILT_LERP;
                item._tiltCY += (item._tiltTY - item._tiltCY) * TILT_LERP;
                item.style.setProperty('--rx', `${item._tiltCX}deg`);
                item.style.setProperty('--ry', `${item._tiltCY}deg`);
            });

            textPillEls.forEach(pill => {
                if (pill === draggingItem || pill.style.display === 'none' || pill._popping) return;
                pill.style.setProperty('--px', `${currentX * STRENGTH * 0.7}px`);
                pill.style.setProperty('--py', `${currentY * STRENGTH * 0.7}px`);
                pill._tiltCX += (pill._tiltTX - pill._tiltCX) * TILT_LERP;
                pill._tiltCY += (pill._tiltTY - pill._tiltCY) * TILT_LERP;
                pill.style.setProperty('--rx', `${pill._tiltCX}deg`);
                pill.style.setProperty('--ry', `${pill._tiltCY}deg`);
            });

            overlays.forEach(ov => {
                const active = ov.phase === 'open' && ov.activeType === 'image';
                ov.tiltCX += ((active ? ov.tiltTX : 0) - ov.tiltCX) * TILT_LERP;
                ov.tiltCY += ((active ? ov.tiltTY : 0) - ov.tiltCY) * TILT_LERP;
                if (Math.abs(ov.tiltCX) > 0.001 || Math.abs(ov.tiltCY) > 0.001) {
                    ov.el.style.setProperty('--rx', `${ov.tiltCX}deg`);
                    ov.el.style.setProperty('--ry', `${ov.tiltCY}deg`);
                }
            });

            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);
    }

    startParallax();

    // ── Star hover → show all location labels (suppressed while dragging) ─────
    placeholder.addEventListener('mouseenter', () => {
        if (!draggingItem) canvas.classList.add('locations-visible');
    });
    placeholder.addEventListener('mouseleave', () => {
        canvas.classList.remove('locations-visible');
    });

    // ── Window resize → reset everything ─────────────────────────────────────
    function playEntrance() {
        if (typeof gsap === 'undefined') return;
        const all = [...items, ...textPillEls];
        gsap.fromTo(all,
            { scale: 0.5, opacity: 0 },
            {
                scale: 1, opacity: 1, duration: 0.5, ease: 'power2.out',
                delay: 0.1, stagger: { amount: 0.4, from: 'random' },
                onComplete: () => gsap.set(all, { clearProps: 'transform,opacity' }),
            }
        );
    }

    function forceCloseAll() {
        // Destroy all overlay elements
        [...overlays].forEach(ov => ov.el.remove());
        overlays.length = 0;

        // Reset every item and pill to its default state
        [...items, ...textPillEls].forEach(el => {
            el.style.display    = '';
            el.style.left       = el._defaultLeft;
            el.style.top        = el._defaultTop;
            el.style.transform  = '';
            el.style.transition = '';
            el._popping         = false;
            el._tiltTX = 0; el._tiltTY = 0;
            el._tiltCX = 0; el._tiltCY = 0;
            el.style.removeProperty('--px');
            el.style.removeProperty('--py');
            el.style.removeProperty('--rx');
            el.style.removeProperty('--ry');
        });

        playEntrance();
    }

    if (windowEl) {
        let wasFullscreen = windowEl.classList.contains('is-fullscreen');
        new MutationObserver(() => {
            const isFS = windowEl.classList.contains('is-fullscreen');
            if (isFS === wasFullscreen) return;
            wasFullscreen = isFS;
            forceCloseAll();
        }).observe(windowEl, { attributes: true, attributeFilter: ['class'] });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    function centerOf(el) {
        const r  = el.getBoundingClientRect();
        const cr = contentContainer.getBoundingClientRect();
        return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    }

    function popItemIn(el) {
        el._popping       = true;
        el.style.transition = 'none';
        el.style.transform  = 'scale(0)';
        el.style.display    = '';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
            el.style.transform  = 'scale(1)';
            el.addEventListener('transitionend', function onPop(ev) {
                if (ev.propertyName !== 'transform') return;
                el.removeEventListener('transitionend', onPop);
                el.style.transition = '';
                el.style.transform  = '';
                el._popping = false;
            });
        }));
    }

    // ── Overlay factory ────────────────────────────────────────────────────────
    function createOverlay() {
        const el = document.createElement('div');
        el.className    = 'canvas-expand-overlay';
        el.style.display = 'none';
        el.style.zIndex  = ++zCounter;
        el.innerHTML = `
            <div class="overlay-img-clip">
                <img class="overlay-img" src="" alt="">
            </div>
            <div class="overlay-text-group">
                <span class="overlay-location"></span>
            </div>
            <div class="overlay-caption-bubble"></div>
            <div class="overlay-tp">
                <div class="overlay-tp-title"></div>
                <div class="overlay-tp-body"></div>
            </div>`;
        contentContainer.appendChild(el);

        const ov = {
            el,
            phase: null, activeItem: null, activePill: null, activeType: null,
            tiltTX: 0, tiltTY: 0, tiltCX: 0, tiltCY: 0,
        };
        overlays.push(ov);
        attachOverlayHandlers(ov);
        return ov;
    }

    function setImageContent(ov, item) {
        const iconSrc = (item.querySelector('.item-mask-img') || {}).src || '';
        const fullSrc = iconSrc.replace('/about-me-images/icons/', '/about-me-images/full/');
        ov.el.querySelector('.overlay-img').src                   = fullSrc || iconSrc;
        ov.el.querySelector('.overlay-caption-bubble').innerHTML  = item.dataset.caption || '';
        ov.el.querySelector('.overlay-location').textContent      = item.dataset.location || '';
    }

    // ── Ransom note: style each word with random font/size/rotation/color ────────
    function ransomNote(html) {
        const fonts  = ['SFRegular', 'SFBold', 'SFItalic', 'SFMedium', 'Suntage', 'InstrumentSans', 'Georgia', 'monospace'];
        const colors = ['#1a1a1a', '#2d1a00', '#001a2d', '#1a002d', '#2d0000', '#001a1a'];
        const bgs    = ['transparent','transparent','transparent','transparent','#fff3b0','#ffd6d6','#d6f0ff','#d6ffd6'];

        // Replace words only — skip HTML tags
        return html.replace(/(<[^>]+>)|(\S+)/g, (match, tag, word) => {
            if (tag) return tag;
            if (!word) return match;

            const font  = fonts [Math.floor(Math.random() * fonts.length)];
            const size  = (9.5 + Math.random() * 5).toFixed(1);
            const rot   = (-5  + Math.random() * 10).toFixed(1);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const bg    = bgs   [Math.floor(Math.random() * bgs.length)];
            const pad   = bg !== 'transparent' ? 'padding:1px 3px;border-radius:2px;' : '';

            return `<span style="font-family:'${font}',sans-serif;font-size:${size}px;display:inline-block;transform:rotate(${rot}deg);color:${color};background:${bg};${pad}margin:0 1px;">${word}</span>`;
        });
    }

    // ── Chat bubbles: render array of {text, side} objects ────────────────────
    function chatBubbles(bodyArr) {
        if (!Array.isArray(bodyArr)) return bodyArr;
        return bodyArr.map(({ text, side }) =>
            `<div class="chat-row chat-${side}"><div class="chat-bubble">${text}</div></div>`
        ).join('');
    }

    function setTextContent(ov, pill) {
        const titleBubble = pill._data.hideTitle ? '' :
            `<div class="chat-row chat-right"><div class="chat-bubble chat-title">${pill._data.title}</div></div>`;
        ov.el.querySelector('.overlay-tp-body').innerHTML = titleBubble + chatBubbles(pill._data.body);
    }

    function snapOv(ov, cx, cy, w, h, radius) {
        const el = ov.el;
        el.style.transition   = 'none';
        el.style.transform    = '';
        el.style.left         = (cx - w / 2) + 'px';
        el.style.top          = (cy - h / 2) + 'px';
        el.style.width        = w + 'px';
        el.style.height       = h + 'px';
        el.style.borderRadius = radius + 'px';
    }

    // ── Bubble genie: fade in, wait 5s, squish into image ─────────────────────
    function startBubbleGenie(ov) {
        const bubble = ov.el.querySelector('.overlay-caption-bubble');
        if (!bubble || !bubble.innerHTML.trim()) return;

        // Fade in
        gsap.to(bubble, { opacity: 1, duration: 0.3, ease: 'power1.out' });

        // After 5s, genie-squish into image
        ov._bubbleTimer = setTimeout(() => {
            ov._bubbleTimer = null;
            gsap.timeline()
                .to(bubble, {
                    duration: 0.08,
                    scaleY: 1.1,
                    transformOrigin: 'bottom center',
                    ease: 'power1.in'
                })
                .to(bubble, {
                    duration: 0.38,
                    scaleX: 0.05,
                    scaleY: 0,
                    y: 20,
                    opacity: 0,
                    transformOrigin: 'bottom center',
                    ease: 'power2.in'
                });
        }, 3000);
    }

    function cancelBubbleGenie(ov) {
        if (ov._bubbleTimer) { clearTimeout(ov._bubbleTimer); ov._bubbleTimer = null; }
        const bubble = ov.el.querySelector('.overlay-caption-bubble');
        if (bubble) gsap.killTweensOf(bubble);
    }

    // ── Overlay: close (animated) ──────────────────────────────────────────────
    function closeOverlay(ov) {
        if (ov.phase !== 'open') return;
        cancelBubbleGenie(ov);
        const item = ov.activeItem;
        const pill = ov.activePill;

        ov.phase = 'shrinking';
        ov.el.classList.remove('is-expanded');
        // Leave 'is-text' intact — removing it mid-close shows the blank image layout.

        // For text overlays: hide panel content instantly before collapse
        if (ov.activeType === 'text') {
            const tp = ov.el.querySelector('.overlay-tp');
            tp.style.transition = 'none';
            tp.style.opacity    = '0';
        }

        const pc   = centerOf(placeholder);
        const EASE = 'cubic-bezier(0.4, 0, 0.6, 1)';
        const DUR  = '0.2s';
        ov.el.style.transition   = `left ${DUR} ${EASE}, top ${DUR} ${EASE}, width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
        ov.el.style.left         = (pc.x - STAR_W / 2) + 'px';
        ov.el.style.top          = (pc.y - STAR_H / 2) + 'px';
        ov.el.style.width        = STAR_W + 'px';
        ov.el.style.height       = STAR_H + 'px';
        ov.el.style.borderRadius = '8px';

        ov.el.addEventListener('transitionend', function onShrink(ev) {
            if (ev.propertyName !== 'width') return;
            ov.el.removeEventListener('transitionend', onShrink);
            ov.el.remove();
            overlays.splice(overlays.indexOf(ov), 1);
            if (item) { item.style.left = item._defaultLeft; item.style.top = item._defaultTop; popItemIn(item); }
            if (pill) { pill.style.left = pill._defaultLeft; pill.style.top = pill._defaultTop; popItemIn(pill); }
        });
    }

    // ── Overlay: force-close (instant) ────────────────────────────────────────
    function forceCloseOv(ov) {
        cancelBubbleGenie(ov);
        const item = ov.activeItem;
        const pill = ov.activePill;
        ov.el.remove();
        overlays.splice(overlays.indexOf(ov), 1);
        if (item) { item.style.left = item._defaultLeft; item.style.top = item._defaultTop; popItemIn(item); }
        if (pill) { pill.style.left = pill._defaultLeft; pill.style.top = pill._defaultTop; popItemIn(pill); }
    }

    // ── Overlay: expand from star (image) ─────────────────────────────────────
    function expandAt(item) {
        const ov  = createOverlay();
        ov.activeItem = item;
        ov.activeType = 'image';
        ov.phase      = 'expanding';

        const dims = getExpImgDims();
        setImageContent(ov, item);

        ov.el.style.display = 'block';
        const pc = centerOf(placeholder);
        snapOv(ov, pc.x, pc.y, STAR_W, STAR_H, 8);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
            const DUR  = '0.32s';
            ov.el.style.transition   = `left ${DUR} ${EASE}, top ${DUR} ${EASE}, width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
            ov.el.style.left         = (pc.x - dims.w / 2) + 'px';
            ov.el.style.top          = (pc.y - dims.h / 2) + 'px';
            ov.el.style.width        = dims.w + 'px';
            ov.el.style.height       = dims.h + 'px';
            ov.el.style.borderRadius = '0px';
            ov.el.classList.add('is-expanded');
            ov.el.addEventListener('transitionend', function onExpand(ev) {
                if (ev.propertyName !== 'width') return;
                ov.el.removeEventListener('transitionend', onExpand);
                ov.phase = 'open';
                startBubbleGenie(ov);
            });
        }));
    }

    // ── Overlay: expand from star (text pill) ─────────────────────────────────
    function expandAtText(pill) {
        const ov  = createOverlay();
        ov.activePill = pill;
        ov.activeType = 'text';
        ov.phase      = 'expanding';

        setTextContent(ov, pill);
        ov.el.classList.add('is-text');
        ov.el.style.display = 'block';

        const pc = centerOf(placeholder);
        snapOv(ov, pc.x, pc.y, STAR_W, STAR_H, 8);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
            const DUR  = '0.32s';
            ov.el.style.transition   = `left ${DUR} ${EASE}, top ${DUR} ${EASE}, width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
            ov.el.style.left         = (pc.x - EXP_TEXT_W / 2) + 'px';
            ov.el.style.top          = (pc.y - EXP_TEXT_H / 2) + 'px';
            ov.el.style.width        = EXP_TEXT_W + 'px';
            ov.el.style.height       = EXP_TEXT_H + 'px';
            ov.el.style.borderRadius = '16px';
            ov.el.classList.add('is-expanded');
            ov.el.addEventListener('transitionend', function onExpand(ev) {
                if (ev.propertyName !== 'width') return;
                ov.el.removeEventListener('transitionend', onExpand);
                ov.phase = 'open';
            });
        }));
    }

    // ── Overlay: swap content (drop on existing overlay) ──────────────────────
    function swapAt(ov, item) {
        if (ov.activeType === 'text') {
            const dims = getExpImgDims();
            const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)', DUR = '0.22s';
            ov.el.style.transition   = `width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
            ov.el.style.width        = dims.w + 'px';
            ov.el.style.height       = dims.h + 'px';
            ov.el.style.borderRadius = '0px';
            ov.el.classList.remove('is-text');
            ov.el.classList.add('is-expanded');
        }
        const prev = ov.activeItem, prevPill = ov.activePill;
        ov.activeItem = item; ov.activePill = null; ov.activeType = 'image';
        setImageContent(ov, item);
        if (prev)     { prev.style.left     = prev._defaultLeft;     prev.style.top     = prev._defaultTop;     popItemIn(prev);     }
        if (prevPill) { prevPill.style.left = prevPill._defaultLeft; prevPill.style.top = prevPill._defaultTop; popItemIn(prevPill); }
    }

    function swapAtText(ov, pill) {
        if (ov.activeType === 'image') {
            const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)', DUR = '0.22s';
            ov.el.style.transition   = `width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
            ov.el.style.width        = EXP_TEXT_W + 'px';
            ov.el.style.height       = EXP_TEXT_H + 'px';
            ov.el.style.borderRadius = '16px';
            ov.el.classList.add('is-text');
        }
        const prev = ov.activePill, prevItem = ov.activeItem;
        ov.activePill = pill; ov.activeItem = null; ov.activeType = 'text';
        setTextContent(ov, pill);
        if (prev)     { prev.style.left     = prev._defaultLeft;     prev.style.top     = prev._defaultTop;     popItemIn(prev);     }
        if (prevItem) { prevItem.style.left = prevItem._defaultLeft; prevItem.style.top = prevItem._defaultTop; popItemIn(prevItem); }
    }

    // ── Overlay interaction: click-to-close + drag to reposition ──────────────
    function attachOverlayHandlers(ov) {
        ov.el.addEventListener('mousedown', (e) => {
            if (ov.phase !== 'open') return;
            if (e.target.closest('a')) return;
            e.preventDefault();
            e.stopPropagation();

            bringToFront(ov);

            const or      = ov.el.getBoundingClientRect();
            const offsetX = e.clientX - or.left;
            const offsetY = e.clientY - or.top;
            const ovW     = or.width, ovH = or.height;
            const startX  = e.clientX, startY = e.clientY;
            let dragging  = false;

            const onMoveOverlay = (me) => {
                if (!dragging) {
                    if (Math.abs(me.clientX - startX) < 5 && Math.abs(me.clientY - startY) < 5) return;
                    dragging    = true;
                    ov.phase    = 'dragging-overlay';
                    ov.tiltTX   = 0; ov.tiltTY   = 0;
                    ov.tiltCX   = 0; ov.tiltCY   = 0;
                    ov.el.style.setProperty('--rx', '0deg');
                    ov.el.style.setProperty('--ry', '0deg');
                    document.body.classList.add('is-dragging');
                }
                const cr  = contentContainer.getBoundingClientRect();
                ov.el.style.transition = 'none';
                ov.el.style.left = (me.clientX - cr.left - offsetX) + 'px';
                ov.el.style.top  = (me.clientY - cr.top  - offsetY) + 'px';

                // Force-close if dragged outside container
                const cx = me.clientX - offsetX + ovW / 2;
                const cy = me.clientY - offsetY + ovH / 2;
                if (cx < cr.left || cx > cr.right || cy < cr.top || cy > cr.bottom) {
                    cleanup(); forceCloseOv(ov);
                }
            };

            const onUpOverlay = () => {
                cleanup();
                if (!dragging) closeOverlay(ov);
                else ov.phase = 'open';
            };

            function cleanup() {
                document.removeEventListener('mousemove', onMoveOverlay);
                document.removeEventListener('mouseup',   onUpOverlay);
                document.body.classList.remove('is-dragging');
            }

            document.addEventListener('mousemove', onMoveOverlay);
            document.addEventListener('mouseup',   onUpOverlay);
        });

        // Bubble hover — image only: bring back on enter, fade out on leave
        ov.el.addEventListener('mouseenter', () => {
            if (ov.activeType !== 'image') return;
            const bubble = ov.el.querySelector('.overlay-caption-bubble');
            if (!bubble || !bubble.innerHTML.trim()) return;
            cancelBubbleGenie(ov);
            gsap.to(bubble, { opacity: 1, duration: 0.2, ease: 'power1.out' });
        });

        ov.el.addEventListener('mouseleave', () => {
            if (ov.activeType !== 'image') return;
            const bubble = ov.el.querySelector('.overlay-caption-bubble');
            if (!bubble) return;
            cancelBubbleGenie(ov);
            gsap.to(bubble, { opacity: 0, duration: 0.2, ease: 'power1.in' });
        });
    }

    // ── Canvas item + pill drag ────────────────────────────────────────────────
    function makeDraggable(el, isText) {
        el.addEventListener('mousedown', (e) => {
            if (el.style.display === 'none') return;
            if (e.target.closest('a')) return;
            e.preventDefault();
            e.stopPropagation();

            el._popping  = false;
            draggingItem = el;
            canvas.classList.remove('locations-visible');
            animateStarDrag();

            const cr  = contentContainer.getBoundingClientRect();
            const ir  = el.getBoundingClientRect();
            const elW = ir.width, elH = ir.height;
            const offsetX = e.clientX - (ir.left + elW / 2);
            const offsetY = e.clientY - (ir.top  + elH / 2);
            const elCX    = ir.left - cr.left + elW / 2;
            const elCY    = ir.top  - cr.top  + elH / 2;

            el.style.transition = 'none';
            el.style.transform  = 'none';
            el.style.removeProperty('--px');
            el.style.removeProperty('--py');
            el.style.left = (elCX - elW / 2) + 'px';
            el.style.top  = (elCY - elH / 2) + 'px';
            el.classList.add('is-dragging');
            document.body.classList.add('is-dragging');

            const onMove = (me) => {
                const cr2 = contentContainer.getBoundingClientRect();
                el.style.left = (me.clientX - cr2.left - elW / 2 - offsetX) + 'px';
                el.style.top  = (me.clientY - cr2.top  - elH / 2 - offsetY) + 'px';
            };

            const onUp = (ue) => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
                el.classList.remove('is-dragging');
                el.style.removeProperty('transform');
                document.body.classList.remove('is-dragging');
                draggingItem = null;
                animateStarReset();

                // 1. Check if dropped on any open overlay (swap)
                let droppedOnOv = null;
                for (const ov of overlays) {
                    if (ov.phase !== 'open' && ov.phase !== 'dragging-overlay') continue;
                    const or = ov.el.getBoundingClientRect();
                    if (ue.clientX >= or.left && ue.clientX <= or.right &&
                        ue.clientY >= or.top  && ue.clientY <= or.bottom) {
                        droppedOnOv = ov; break;
                    }
                }

                // 2. Check if dropped on star placeholder (open new overlay)
                const pr = placeholder.getBoundingClientRect();
                const er = el.getBoundingClientRect();
                const overPlaceholder = !droppedOnOv && !(
                    er.right  < pr.left  || er.left   > pr.right ||
                    er.bottom < pr.top   || er.top    > pr.bottom
                );

                if (droppedOnOv) {
                    el.style.display = 'none';
                    if (isText) swapAtText(droppedOnOv, el);
                    else        swapAt(droppedOnOv, el);
                } else if (overPlaceholder) {
                    el.style.display = 'none';
                    if (isText) expandAtText(el);
                    else        expandAt(el);
                }
                // else: stay where dropped — no action needed
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
        });
    }

    items.forEach(item => makeDraggable(item, false));
    textPillEls.forEach(pill => makeDraggable(pill, true));

    // ── Entrance animation ─────────────────────────────────────────────────────
    playEntrance();
}

// Legacy alias — windows.js calls initSlideshow for About me
function initSlideshow() {}
