// slideshow.js
let slideshowInterval;
let autoScrollInterval;

function initSlideshow() {
    let slideIndex = 0;
    let cycleCount = 0;
    let slideshowSettled = false;
    const slides = document.getElementsByClassName("mySlides");
    const dotContainer = document.querySelector(".window-about-me #dotContainer");
    const container = document.querySelector(".about-slideshow");
    const textColumn = document.querySelector(".about-me-text");

    if (slides.length === 0 || !container) return;

    // --- GENERATE DOTS ---
    if (dotContainer) {
        dotContainer.innerHTML = "";
        for (let i = 0; i < slides.length; i++) {
            const span = document.createElement("span");
            span.classList.add("dot");
            dotContainer.appendChild(span);
        }
    }

    const dots = document.getElementsByClassName("dot");

    // --- RESET STATE ---
    clearTimeout(slideshowInterval);
    clearInterval(autoScrollInterval);
    if (textColumn) {
        textColumn.classList.remove("visible");
        textColumn.scrollTop = 0;
    }

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    function startAutoScroll() {
        clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            textColumn.scrollTop += 0.5;
            if (textColumn.scrollTop + textColumn.clientHeight >= textColumn.scrollHeight) {
                clearInterval(autoScrollInterval);
            }
        }, 30);
    }

    // ── Shared image caption bubble ──────────────────────────────────────────
    const oldImgBubble = document.getElementById('img-caption-bubble');
    if (oldImgBubble) oldImgBubble.remove();
    const imgBubble = document.createElement('div');
    imgBubble.id = 'img-caption-bubble';
    document.body.appendChild(imgBubble);

    function showImgBubble(caption, x, y) {
        imgBubble.innerHTML = caption;
        imgBubble.style.left = x + 'px';
        imgBubble.style.top  = y + 'px';
        imgBubble.style.display = 'block';
    }
    function hideImgBubble() {
        imgBubble.style.display = 'none';
    }

    // Grid image captions (fullscreen)
    const gridImgs = document.querySelectorAll('.about-me-grid img');
    gridImgs.forEach(img => {
        img.addEventListener('mouseenter', (e) => {
            const cap = img.dataset.caption;
            if (cap) showImgBubble(cap, e.clientX, e.clientY);
        });
        img.addEventListener('mousemove', (e) => {
            imgBubble.style.left = e.clientX + 'px';
            imgBubble.style.top  = e.clientY + 'px';
        });
        img.addEventListener('mouseleave', hideImgBubble);
    });

    // Slideshow caption (small window) — only after slideshow settles
    container.addEventListener('mouseenter', (e) => {
        if (!slideshowSettled) return;
        const cap = slides[slideIndex - 1]?.dataset.caption;
        if (cap) showImgBubble(cap, e.clientX, e.clientY);
    });
    container.addEventListener('mousemove', (e) => {
        if (!slideshowSettled) return;
        // Keep text current in case slide changed via click
        const cap = slides[slideIndex - 1]?.dataset.caption;
        if (cap) {
            imgBubble.innerHTML = cap;
            imgBubble.style.left = e.clientX + 'px';
            imgBubble.style.top  = e.clientY + 'px';
            imgBubble.style.display = 'block';
        }
    });
    container.addEventListener('mouseleave', hideImgBubble);

    // ── "Scroll me" hover bubble ─────────────────────────────────────────────
    const oldBubble = document.getElementById('about-scroll-bubble');
    if (oldBubble) oldBubble.remove();
    const bubble = document.createElement('div');
    bubble.id = 'about-scroll-bubble';
    bubble.textContent = 'scroll me';
    document.body.appendChild(bubble);

    if (textColumn) {
        textColumn.addEventListener('mouseenter', (e) => {
            if (!textColumn.classList.contains('visible')) return;
            bubble.style.left = e.clientX + 'px';
            bubble.style.top  = e.clientY + 'px';
            bubble.style.display = 'block';
            clearInterval(autoScrollInterval);
        });
        textColumn.addEventListener('mouseleave', () => {
            bubble.style.display = 'none';
            if (textColumn.classList.contains('visible')) startAutoScroll();
        });
        textColumn.addEventListener('mousemove', (e) => {
            bubble.style.left = e.clientX + 'px';
            bubble.style.top  = e.clientY + 'px';
        });
    }

    // ── Slide display ────────────────────────────────────────────────────────
    function updateDisplay() {
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
            if (dots[i]) dots[i].classList.remove("active");
        }
        slides[slideIndex - 1].style.display = "block";
        if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");
    }

    function showSlides() {
        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1;
            cycleCount++;
        }
        updateDisplay();

        if (cycleCount < 1) {
            slideshowInterval = setTimeout(showSlides, 75);
        } else {
            // Land on a random slide
            slideIndex = Math.floor(Math.random() * slides.length) + 1;
            updateDisplay();
            slideshowSettled = true;

            // Wire up "read more?" button
            const readMoreBtn = document.getElementById('read-more-btn');
            const tldrContent = document.querySelector('.tldr-content');
            if (readMoreBtn && textColumn && tldrContent) {
                readMoreBtn.addEventListener('click', () => {
                    // Fade out TLDR
                    tldrContent.style.transition = 'opacity 0.4s ease';
                    tldrContent.style.opacity = '0';

                    setTimeout(() => {
                        tldrContent.style.display = 'none';
                        textColumn.classList.add('visible');
                        // Start auto-scroll after fade-in, unless cursor is already over text
                        setTimeout(() => {
                            if (!textColumn.matches(':hover')) startAutoScroll();
                        }, 900);
                    }, 420);
                });
            }
        }
    }

    setTimeout(showSlides, 400);

    // Manual slideshow click — advance slide and immediately update caption bubble
    container.onclick = () => {
        slideIndex++;
        if (slideIndex > slides.length) slideIndex = 1;
        updateDisplay();
        // If bubble is showing, refresh its text for the new slide
        if (slideshowSettled && imgBubble.style.display !== 'none') {
            const cap = slides[slideIndex - 1]?.dataset.caption;
            if (cap) imgBubble.innerHTML = cap;
        }
    };
}
