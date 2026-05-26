// slideshow.js — About Me canvas, parallax, drag-to-expand, section navigator

window.STORY_SECTIONS = [
    {
        title: 'Hello hello',
        body:  `I'm Lucas (if you didn't already know). I spent WAY too much time on this portfolio so I hope you enjoy it. As an architect-to-be turned designer, my goals have always been functional design and creativity. I'm constantly exploring new ideas (check out my playground) and challenging myself to diversify my skills.<br><br>Right now, I'm helping build the foundation for professional women's soccer in Canada <a class="about-me-link" href="https://www.NSL.ca" target="_blank">@NorthernSuperLeague</a>. On the side, I'm building a monthly mailing club and too many side projects to count.`,
    },
    {
        title: 'Designer by accident',
        body:  `Believe it or not, I ended up as a designer completely by accident. Every week leading up to my highschool graduation I had a new career plan. All I knew was I liked creating. I was making functional model cars, popsicle bridges holding up to 90lbs, bus stations with working electronics, but never once touched digital products. I only applied to GBDA at Waterloo because my sister was already in the program (shout out Sarah).<br><br>Like Bob Ross says, it was a happy accident — being creative while using logic and research to solve problems really scratched the itch.`,
    },
    {
        title: 'Learning through exploration',
        body:  `After graduating I decided to travel the world and find ways to learn about design through experiences and adventures. For three years I freelanced and worked odd jobs in Taiwan, Hong Kong, Japan, France, and Germany. I studied their designs, built products, taught students, cleaned hostels, translated, and lived life. I've learned a lot about communicating through design, because often times design was the only way for us to communicate.<br><br>Now i'm back home trying to find my next adventure, and catching up for lost time :)`,
    },
];

window.TLDR_BODY = `"Super cool guy ;)" — My mom if you asked her. I spent most of my life in Canada, but more recently i'm anywhere but. I'm exploring the <span class="tldr-world">world</span>, side-questing and trying to find a fit! Let me know if you think you're it :) (the rhyme was accidental, i'm not a rapper) Current obsessions include, but aren't limited to, Magic the Gathering, Warhammer 40k, Carpentry, Clothing restoration, Trinket hunting.`;

function initAboutCanvas(contentContainer, windowEl) {
    const canvas      = contentContainer.querySelector('.about-canvas');
    const items       = Array.from(contentContainer.querySelectorAll('.canvas-item'));
    const placeholder = contentContainer.querySelector('#tldr-placeholder');
    const tldrCard    = contentContainer.querySelector('#about-tldr-card');
    const storyNav    = contentContainer.querySelector('#about-story-nav');
    const navTitle    = contentContainer.querySelector('#story-nav-title');
    const prevBtn     = contentContainer.querySelector('#story-prev-btn');
    const nextBtn     = contentContainer.querySelector('#story-next-btn');
    const readMoreBtn = contentContainer.querySelector('#read-more-btn');

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

    // Hide border initially
    if (starBorder && typeof DrawSVGPlugin !== 'undefined') {
        gsap.set(starBorder, { drawSVG: '0%' });
    }

    function animateStarDrag() {
        if (!starShape || !starPlus) return;
        if (typeof MorphSVGPlugin !== 'undefined')
            gsap.to(starShape, { morphSVG: starPlus, duration: 0.35, ease: 'power2.inOut' });
        if (starBorder && typeof DrawSVGPlugin !== 'undefined')
            gsap.to(starBorder, { drawSVG: '100%', duration: 0.35, ease: 'power2.out' });
    }

    function animateStarReset() {
        if (!starShape || !starOrigD) return;
        if (typeof MorphSVGPlugin !== 'undefined')
            gsap.to(starShape, { morphSVG: starOrigD, duration: 0.3, ease: 'power2.inOut' });
        if (starBorder && typeof DrawSVGPlugin !== 'undefined')
            gsap.to(starBorder, { drawSVG: '0%', duration: 0.25, ease: 'power2.in' });
    }

    // ── Constants ─────────────────────────────────────────────────────────────
    const ICON_W = 60, ICON_H = 60;  // canvas item size
    const STAR_W = 44, STAR_H = 44;  // star placeholder size
    const EXP_W  = 300, EXP_H = 175;

    // ── Store defaults & create masks ─────────────────────────────────────────
    items.forEach(item => {
        item._defaultLeft = item.style.left;
        item._defaultTop  = item.style.top;
        item._popping     = false;

        const origImg = item.querySelector('img');
        if (!origImg) return;

        const mask    = document.createElement('div');
        mask.className = 'item-mask';
        const maskImg = document.createElement('img');
        maskImg.className = 'item-mask-img';
        maskImg.src = origImg.src;
        maskImg.alt = '';
        mask.appendChild(maskImg);
        origImg.style.display = 'none';
        item.insertBefore(mask, origImg);
    });

    // ── Parallax ──────────────────────────────────────────────────────────────
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const STRENGTH = 25;
    const LERP     = 0.06;
    let draggingItem = null;

    // ── Tilt ──────────────────────────────────────────────────────────────────
    const TILT_RADIUS = 150;
    const TILT_MAX    = 12;  // degrees
    const TILT_LERP   = 0.08;

    items.forEach(item => {
        item._tiltTX = 0; item._tiltTY = 0; // targets
        item._tiltCX = 0; item._tiltCY = 0; // current (lerped)
    });

    contentContainer.addEventListener('mousemove', e => {
        items.forEach(item => {
            if (item === draggingItem || item === activeItem) {
                item._tiltTX = 0; item._tiltTY = 0; return;
            }
            const r  = item.getBoundingClientRect();
            const cx = r.left + r.width  / 2;
            const cy = r.top  + r.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const d  = Math.hypot(dx, dy);
            if (d < TILT_RADIUS) {
                const t = 1 - d / TILT_RADIUS;
                item._tiltTY =  (dx / (r.width  / 2)) * TILT_MAX * t;
                item._tiltTX = -(dy / (r.height / 2)) * TILT_MAX * t;
            } else {
                item._tiltTX = 0; item._tiltTY = 0;
            }
        });
    }, { passive: true });

    contentContainer.addEventListener('mouseleave', () => {
        items.forEach(item => { item._tiltTX = 0; item._tiltTY = 0; });
    });
    let activeItem   = null;

    const onMouseMove = (e) => {
        const rect = windowEl.getBoundingClientRect();
        targetX = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
        targetY = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
        targetX = Math.max(-1, Math.min(1, targetX));
        targetY = Math.max(-1, Math.min(1, targetY));
    };

    document.addEventListener('mousemove', onMouseMove);

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
                if (item === draggingItem) return;
                if (item === activeItem)   return;
                if (item._popping)         return;
                const depth = parseFloat(item.dataset.depth) || 1;
                item.style.setProperty('--px', `${currentX * STRENGTH * depth}px`);
                item.style.setProperty('--py', `${currentY * STRENGTH * depth}px`);
                item._tiltCX += (item._tiltTX - item._tiltCX) * TILT_LERP;
                item._tiltCY += (item._tiltTY - item._tiltCY) * TILT_LERP;
                item.style.setProperty('--rx', `${item._tiltCX}deg`);
                item.style.setProperty('--ry', `${item._tiltCY}deg`);
            });
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);
    }

    startParallax();

    // ── Expand overlay ─────────────────────────────────────────────────────────
    const oldOverlay = contentContainer.querySelector('.canvas-expand-overlay');
    if (oldOverlay) oldOverlay.remove();

    const expandOverlay = document.createElement('div');
    expandOverlay.className = 'canvas-expand-overlay';
    expandOverlay.innerHTML = `
        <img class="overlay-img" src="" alt="">
        <div class="overlay-text-group">
            <div class="overlay-caption-bubble"></div>
            <span class="overlay-location"></span>
        </div>`;
    contentContainer.appendChild(expandOverlay);

    const overlayImg = expandOverlay.querySelector('.overlay-img');
    const overlayCap = expandOverlay.querySelector('.overlay-caption-bubble');
    const overlayLoc = expandOverlay.querySelector('.overlay-location');

    let phase    = null; // 'expanding' | 'open' | 'shrinking' | 'dragging-overlay'
    let moreOpen = false;

    function centerOf(el) {
        const r  = el.getBoundingClientRect();
        const cr = contentContainer.getBoundingClientRect();
        return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    }

    function snapOverlay(cx, cy, w, h, radius) {
        expandOverlay.style.transition   = 'none';
        expandOverlay.style.transform    = '';
        expandOverlay.style.left         = (cx - w / 2) + 'px';
        expandOverlay.style.top          = (cy - h / 2) + 'px';
        expandOverlay.style.width        = w + 'px';
        expandOverlay.style.height       = h + 'px';
        expandOverlay.style.borderRadius = radius + 'px';
    }

    function setPlaceholderSize(w, h, ease) {
        if (ease) {
            placeholder.style.transition = `width 0.32s ${ease}, height 0.32s ${ease}`;
        } else {
            placeholder.style.transition = 'none';
        }
        placeholder.style.width  = w + 'px';
        placeholder.style.height = h + 'px';
    }

    function popItemIn(item) {
        item._popping    = true;
        item.style.transition = 'none';
        item.style.transform  = 'scale(0)';
        item.style.display    = '';

        requestAnimationFrame(() => requestAnimationFrame(() => {
            item.style.transition = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';
            item.style.transform  = 'scale(1)';
            item.addEventListener('transitionend', function onPop(e) {
                if (e.propertyName !== 'transform') return;
                item.removeEventListener('transitionend', onPop);
                item.style.transition = '';
                item.style.transform  = '';
                item._popping = false;
            });
        }));
    }

    // Update overlay image content without moving it (swap in place)
    function swapImageContent(item) {
        const iconSrc = (item.querySelector('.item-mask-img') || {}).src || '';
        const fullSrc = iconSrc.replace('/about-me-images/icons/', '/about-me-images/full/');
        overlayImg.src         = fullSrc || iconSrc;
        overlayCap.innerHTML   = item.dataset.caption || '';
        overlayLoc.textContent = item.dataset.location || '';
    }

    function expandAt(item) {
        if (activeItem && activeItem !== item) {
            const prev = activeItem;
            expandOverlay.style.display = 'none';
            expandOverlay.classList.remove('is-expanded');
            activeItem = null;
            phase      = null;
            setPlaceholderSize(STAR_W, STAR_H, null);
            prev.style.left = prev._defaultLeft;
            prev.style.top  = prev._defaultTop;
            popItemIn(prev);
        }

        activeItem = item;
        phase      = 'expanding';
        swapImageContent(item);
        expandOverlay.classList.remove('is-expanded');
        expandOverlay.style.display = 'block';
        placeholder.style.opacity = '0';

        const pc = centerOf(placeholder);
        snapOverlay(pc.x, pc.y, STAR_W, STAR_H, 8);

        // Notify text module immediately so it starts reflowing during the animation
        window.AboutText?.onImageOpen(expandOverlay);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
            const DUR  = '0.32s';
            expandOverlay.style.transition   = `left ${DUR} ${EASE}, top ${DUR} ${EASE}, width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
            expandOverlay.style.left         = (pc.x - EXP_W / 2) + 'px';
            expandOverlay.style.top          = (pc.y - EXP_H / 2) + 'px';
            expandOverlay.style.width        = EXP_W + 'px';
            expandOverlay.style.height       = EXP_H + 'px';
            expandOverlay.style.borderRadius = '0px';
            setPlaceholderSize(EXP_W, EXP_H, EASE);
            expandOverlay.classList.add('is-expanded');

            expandOverlay.addEventListener('transitionend', function onExpand(e) {
                if (e.propertyName !== 'width') return;
                expandOverlay.removeEventListener('transitionend', onExpand);
                phase = 'open';
            });
        }));
    }

    // Swap to a new item at the overlay's current position (no animation, just content swap)
    function swapAt(item) {
        const prev = activeItem;
        activeItem = item;
        swapImageContent(item);
        if (prev && prev !== item) {
            prev.style.left = prev._defaultLeft;
            prev.style.top  = prev._defaultTop;
            popItemIn(prev);
        }
        window.AboutText?.onImageMove(expandOverlay);
    }

    function closeImage() {
        if (!activeItem || phase !== 'open') return;
        const item = activeItem;
        phase = 'shrinking';
        expandOverlay.classList.remove('is-expanded');
        // Restore placeholder size FIRST so layout sees the correct star size
        setPlaceholderSize(STAR_W, STAR_H, null);
        window.AboutText?.onImageClose();

        const pc   = centerOf(placeholder);
        const EASE = 'cubic-bezier(0.4, 0, 0.6, 1)';
        const DUR  = '0.2s';
        expandOverlay.style.transition   = `left ${DUR} ${EASE}, top ${DUR} ${EASE}, width ${DUR} ${EASE}, height ${DUR} ${EASE}, border-radius ${DUR} ${EASE}`;
        expandOverlay.style.left         = (pc.x - STAR_W / 2) + 'px';
        expandOverlay.style.top          = (pc.y - STAR_H / 2) + 'px';
        expandOverlay.style.width        = STAR_W + 'px';
        expandOverlay.style.height       = STAR_H + 'px';
        expandOverlay.style.borderRadius = '8px';

        expandOverlay.addEventListener('transitionend', function onShrink(e) {
            if (e.propertyName !== 'width') return;
            expandOverlay.removeEventListener('transitionend', onShrink);
            expandOverlay.style.display = 'none';
            placeholder.style.opacity   = '';
            activeItem = null;
            phase      = null;
            item.style.left = item._defaultLeft;
            item.style.top  = item._defaultTop;
            popItemIn(item);
        });
    }

    function forceCloseImage(item) {
        expandOverlay.style.display = 'none';
        expandOverlay.classList.remove('is-expanded');
        placeholder.style.opacity   = '';
        activeItem = null;
        phase      = null;
        setPlaceholderSize(STAR_W, STAR_H, null);
        window.AboutText?.onImageClose();
        if (item) {
            item.style.left = item._defaultLeft;
            item.style.top  = item._defaultTop;
            popItemIn(item);
        }
    }

    // ── Overlay interaction: click to close, drag to reposition ───────────────
    expandOverlay.addEventListener('mousedown', (e) => {
        if (phase !== 'open') return;
        e.preventDefault();
        e.stopPropagation();

        const or      = expandOverlay.getBoundingClientRect();
        const offsetX = e.clientX - or.left;
        const offsetY = e.clientY - or.top;
        const ovW     = or.width;   // capture actual expanded size at drag start
        const ovH     = or.height;
        const item    = activeItem;
        const startX  = e.clientX, startY = e.clientY;
        let dragging  = false;

        const onMoveOverlay = (me) => {
            if (!dragging) {
                if (Math.abs(me.clientX - startX) < 5 && Math.abs(me.clientY - startY) < 5) return;
                dragging = true;
                phase    = 'dragging-overlay';
                document.body.classList.add('is-dragging');
            }

            const cr      = contentContainer.getBoundingClientRect();
            const newLeft = me.clientX - cr.left - offsetX;
            const newTop  = me.clientY - cr.top  - offsetY;

            expandOverlay.style.transition = 'none';
            expandOverlay.style.left       = newLeft + 'px';
            expandOverlay.style.top        = newTop  + 'px';

            const cx = me.clientX - offsetX + ovW / 2;
            const cy = me.clientY - offsetY + ovH / 2;
            if (cx < cr.left || cx > cr.right || cy < cr.top || cy > cr.bottom) {
                cleanupOverlay();
                forceCloseImage(item);
                return;
            }

            window.AboutText?.onImageMove(expandOverlay);
        };

        const onUpOverlay = () => {
            cleanupOverlay();
            if (!dragging) {
                closeImage();
            } else {
                phase = 'open';
                window.AboutText?.onImageMove(expandOverlay);
            }
        };

        function cleanupOverlay() {
            document.removeEventListener('mousemove', onMoveOverlay);
            document.removeEventListener('mouseup',   onUpOverlay);
            document.body.classList.remove('is-dragging');
        }

        document.addEventListener('mousemove', onMoveOverlay);
        document.addEventListener('mouseup',   onUpOverlay);
    });

    // ── Canvas item drag system ────────────────────────────────────────────────
    items.forEach(item => {
        item.addEventListener('mousedown', (e) => {
            if (item.style.display === 'none') return;
            e.preventDefault();
            e.stopPropagation();

            item._popping = false;
            draggingItem  = item;

            const cr = contentContainer.getBoundingClientRect();
            const ir = item.getBoundingClientRect();

            const itemCX  = ir.left - cr.left + ir.width  / 2;
            const itemCY  = ir.top  - cr.top  + ir.height / 2;
            const offsetX = e.clientX - (ir.left + ir.width  / 2);
            const offsetY = e.clientY - (ir.top  + ir.height / 2);

            item.style.transition = 'none';
            item.style.transform  = 'none';
            item.style.removeProperty('--px');
            item.style.removeProperty('--py');
            item.style.left = (itemCX - ICON_W / 2) + 'px';
            item.style.top  = (itemCY - ICON_H / 2) + 'px';
            item.classList.add('is-dragging');
            document.body.classList.add('is-dragging');

            let starAnimated = false;

            const onMove = (me) => {
                if (!starAnimated) {
                    starAnimated = true;
                    animateStarDrag();
                }
                const cr2 = contentContainer.getBoundingClientRect();
                item.style.left = (me.clientX - cr2.left - ICON_W / 2 - offsetX) + 'px';
                item.style.top  = (me.clientY - cr2.top  - ICON_H / 2 - offsetY) + 'px';
            };

            const onUp = (ue) => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup',   onUp);
                item.classList.remove('is-dragging');
                item.style.removeProperty('transform'); // let CSS variables take back control
                document.body.classList.remove('is-dragging');
                draggingItem = null;
                animateStarReset();

                // Check drop target: expanded overlay (swap) or star placeholder (open)
                const or = expandOverlay.getBoundingClientRect();
                const overOverlay = (phase === 'open') &&
                    ue.clientX >= or.left && ue.clientX <= or.right &&
                    ue.clientY >= or.top  && ue.clientY <= or.bottom;

                // Overlap check — any part of the dragged icon touching the star counts
                const pr = placeholder.getBoundingClientRect();
                const ir = item.getBoundingClientRect();
                const overPlaceholder = !overOverlay && !(
                    ir.right  < pr.left  ||
                    ir.left   > pr.right ||
                    ir.bottom < pr.top   ||
                    ir.top    > pr.bottom
                );

                if (overOverlay) {
                    item.style.display = 'none';
                    swapAt(item);
                } else if (overPlaceholder) {
                    item.style.display = 'none';
                    expandAt(item);
                }
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup',   onUp);
        });
    });

    // ── Section navigator ──────────────────────────────────────────────────────
    let currentSection = 0;

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSection > 0) {
                currentSection--;
                if (navTitle) navTitle.textContent = STORY_SECTIONS[currentSection].title;
                prevBtn.disabled = currentSection === 0;
                nextBtn.disabled = false;
                window.AboutText?.setStory(currentSection);
            }
        });
        nextBtn.addEventListener('click', () => {
            if (currentSection < STORY_SECTIONS.length - 1) {
                currentSection++;
                if (navTitle) navTitle.textContent = STORY_SECTIONS[currentSection].title;
                nextBtn.disabled = currentSection === STORY_SECTIONS.length - 1;
                prevBtn.disabled = false;
                window.AboutText?.setStory(currentSection);
            }
        });
    }

    // ── Read more toggle ───────────────────────────────────────────────────────
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', () => {
            // Always close any open image first
            if (activeItem) {
                forceCloseImage(activeItem);
            }

            moreOpen = !moreOpen;
            readMoreBtn.classList.toggle('is-active', moreOpen);
            currentSection = 0;
            if (navTitle) navTitle.textContent = STORY_SECTIONS[0].title;
            if (prevBtn)  prevBtn.disabled = true;
            if (nextBtn)  nextBtn.disabled = STORY_SECTIONS.length <= 1;

            window.AboutText?.setMode(moreOpen ? 'more' : 'less');
        });
    }

    // ── Entrance animation ─────────────────────────────────────────────────────
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(items,
            { scale: 0.5, opacity: 0 },
            {
                scale:      1,
                opacity:    1,
                duration:   0.5,
                ease:       'power2.out',
                delay:      0.5,
                stagger:    { amount: 0.4, from: 'random' },
                onComplete: () => gsap.set(items, { clearProps: 'transform,opacity' }),
            }
        );
    }

    // ── Init text module ───────────────────────────────────────────────────────
    window.AboutText?.init(contentContainer);
}

// Legacy alias — windows.js calls initSlideshow for About me
function initSlideshow() {}
