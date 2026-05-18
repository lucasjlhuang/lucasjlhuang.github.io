// slideshow.js — About Me canvas, parallax, captions, section navigator

const STORY_SECTIONS = [
    {
        title: 'Hello hello',
        body:  `I'm Lucas (if you didn't already know). I spent WAY too much time on this portfolio so I hope you enjoy it. As an architect-to-be turned designer, my goals have always been functional design and creativity. I'm constantly exploring new ideas (check out my playground) and challenging myself to diversify my skills.<br><br>Right now, I'm helping build the foundation for professional women's soccer in Canada <a class="about-me-link" href="https://www.NSL.ca" target="_blank">@NorthernSuperLeague</a>. On the side, I'm building a monthly mailing club and too many side projects to count.`,
    },
    {
        title: 'Designer by accident',
        body:  `Believe it or not, I ended up as a designer completely by accident.
        Every week leading up to my highschool graduation I had a new career plan.
        All I knew was I liked creating. I was making functional model cars, popsicle bridges holding up to 90lbs, bus stations with working electronics, but never once touched digital products. 
        I only applied to GBDA at Waterloo because my sister was already in the program (shout out Sarah). <br><br>Like Bob Ross says, it was a happy accident — being creative while using logic and research to solve problems really scratched the itch.`,
    },
    {
        title: 'Learning through exploration',
        body:  `After graduating I decided to travel the world and find ways to learn about design through experiences and adventures. 
        For three years I freelanced and worked odd jobs in Taiwan, Hong kong, Japan, France, and Germany.
        I studied their designs, built products, taught students, cleaned hostels, translated, and lived life.
        I've learned a lot about communicating through design, because often times design was the only way for us to communicate.
        <br><br>Now i'm back home trying to find my next adventure, and catching up for lost time :)`,
    },
];

function initAboutCanvas(contentContainer, windowEl) {
    const canvas      = contentContainer.querySelector('.about-canvas');
    const items       = Array.from(contentContainer.querySelectorAll('.canvas-item'));
    const tldrCard    = contentContainer.querySelector('#about-tldr-card');
    const storyNav    = contentContainer.querySelector('#about-story-nav');
    const navTitle    = contentContainer.querySelector('#story-nav-title');
    const navBody     = contentContainer.querySelector('#story-nav-body');
    const prevBtn     = contentContainer.querySelector('#story-prev-btn');
    const nextBtn     = contentContainer.querySelector('#story-next-btn');
    const readMoreBtn = contentContainer.querySelector('#read-more-btn');

    if (!canvas) return;

    contentContainer.style.position = 'relative';
    contentContainer.style.overflow = 'hidden';

    // ── Parallax ─────────────────────────────────────────────────────────────
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const STRENGTH = 25;
    const LERP     = 0.06;

    // Mouse position is always tracked relative to the window's rect, even
    // when the cursor is outside it — so parallax continues past the edge.
    const onMouseMove = (e) => {
        const rect = windowEl.getBoundingClientRect();
        targetX = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
        targetY = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
        targetX = Math.max(-1, Math.min(1, targetX));
        targetY = Math.max(-1, Math.min(1, targetY));
    };

    // Listen on the document so the parallax keeps going outside the window.
    document.addEventListener('mousemove', onMouseMove);

    let rafId = null;

    function startParallax() {
        if (rafId) return;
        function loop() {
            // Stop and clean up if the window has been removed from the DOM.
            if (!document.contains(windowEl)) {
                rafId = null;
                document.removeEventListener('mousemove', onMouseMove);
                return;
            }
            currentX += (targetX - currentX) * LERP;
            currentY += (targetY - currentY) * LERP;
            items.forEach(item => {
                const depth = parseFloat(item.dataset.depth) || 1;
                item.style.transform = `translate(${currentX * STRENGTH * depth}px, ${currentY * STRENGTH * depth}px)`;
            });
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);
    }

    function stopParallax() {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    // ── Start parallax immediately — window handles its own fade-in ──────────
    startParallax();

    // ── "world" span — hover reveals all location labels ─────────────────────
    const worldSpan = contentContainer.querySelector('.tldr-world');
    if (worldSpan) {
        worldSpan.addEventListener('mouseenter', () => canvas.classList.add('locations-visible'));
        worldSpan.addEventListener('mouseleave', () => canvas.classList.remove('locations-visible'));
    }

    // ── Photo caption bubble ──────────────────────────────────────────────────
    const oldImgBubble = document.getElementById('img-caption-bubble');
    if (oldImgBubble) oldImgBubble.remove();
    const imgBubble = document.createElement('div');
    imgBubble.id = 'img-caption-bubble';
    document.body.appendChild(imgBubble);

    items.forEach(item => {
        const cap = item.dataset.caption;
        item.addEventListener('mouseenter', (e) => {
            if (!cap) return;
            imgBubble.innerHTML = cap;
            imgBubble.style.left    = e.clientX + 'px';
            imgBubble.style.top     = e.clientY + 'px';
            imgBubble.style.display = 'block';
        });
        item.addEventListener('mousemove', (e) => {
            imgBubble.style.left = e.clientX + 'px';
            imgBubble.style.top  = e.clientY + 'px';
        });
        item.addEventListener('mouseleave', () => {
            imgBubble.style.display = 'none';
        });
    });

    // ── Section navigator ─────────────────────────────────────────────────────
    let currentSection = 0;

    function renderSection(idx) {
        const sec = STORY_SECTIONS[idx];
        navTitle.textContent  = sec.title;
        navBody.innerHTML     = sec.body;
        prevBtn.disabled      = idx === 0;
        nextBtn.disabled      = idx === STORY_SECTIONS.length - 1;
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSection > 0) { currentSection--; renderSection(currentSection); }
        });
        nextBtn.addEventListener('click', () => {
            if (currentSection < STORY_SECTIONS.length - 1) { currentSection++; renderSection(currentSection); }
        });
    }

    // ── Open / close ──────────────────────────────────────────────────────────
    if (readMoreBtn && tldrCard && storyNav) {
        let storyOpen = false;

        readMoreBtn.addEventListener('click', () => {

            if (!storyOpen) {
                // ── Open: TLDR fades out → story nav fades in ──
                storyOpen = true;
                readMoreBtn.classList.add('is-active');

                currentSection = 0;
                renderSection(0);

                tldrCard.style.transition = 'opacity 0.35s ease';
                tldrCard.style.opacity    = '0';
                setTimeout(() => {
                    tldrCard.style.display = 'none';
                    storyNav.style.display = 'block';
                    requestAnimationFrame(() => storyNav.classList.add('visible'));
                }, 370);

            } else {
                // ── Close: story nav fades out → TLDR fades in ──
                storyOpen = false;
                readMoreBtn.classList.remove('is-active');

                storyNav.classList.remove('visible');
                setTimeout(() => {
                    storyNav.style.display = 'none';
                    tldrCard.style.display = '';
                    tldrCard.style.opacity = '0';
                    tldrCard.style.transition = 'opacity 0.35s ease';
                    requestAnimationFrame(() => { tldrCard.style.opacity = '1'; });
                }, 420);
            }
        });
    }
}

// Legacy alias — windows.js calls initSlideshow for About me
function initSlideshow() {}
