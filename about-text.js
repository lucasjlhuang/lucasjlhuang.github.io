// about-text.js — text layout module for About Me
// Uses @chenglou/pretext for measurement + Textflow.js for obstacle rendering.
// Exposes window.AboutText for slideshow.js to call.

import { prepare, layout } from '@chenglou/pretext';

// ── State ──────────────────────────────────────────────────────────────────────
let _container  = null;  // contentContainer
let _zone       = null;  // active textflow zone element
let _mode       = 'less'; // 'less' | 'more'
let _storyIdx   = 0;
let _overlay    = null;  // expandOverlay element when image is open
let _imageOpen  = false;
let _rafId      = null;
let _dirty      = false;

let _ptPreps    = {}; // pretext PreparedText cache keyed by text string
let _tfPreps    = {}; // Textflow PreparedText cache keyed by text string
let _font       = '';
let _lineH      = 20;

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFont() {
    const el = _container?.querySelector('#tldr-textzone') || document.body;
    const cs = window.getComputedStyle(el);
    return `${parseFloat(cs.fontSize) * 0.9}px ${cs.fontFamily}`;
}

function getLineH(font) {
    return parseFloat(font) * 1.55 || 20;
}

// Get the text for the current view (TLDR is always shown; story below it)
function currentTexts() {
    if (_mode !== 'more') return [];
    const texts = [];
    // TLDR
    if (window.TLDR_BODY) texts.push({ id: 'tldr', text: window.TLDR_BODY, zoneId: 'tldr-textzone' });
    // Story
    const sec = window.STORY_SECTIONS?.[_storyIdx];
    if (sec) texts.push({ id: 'story', text: sec.title + '. ' + sec.body, zoneId: 'story-textzone' });
    return texts;
}

function prepText(text) {
    if (!_tfPreps[text]) {
        _tfPreps[text] = Textflow.prepare(text, _font);
    }
    if (!_ptPreps[text]) {
        _ptPreps[text] = prepare(text, _font);
    }
    return { tf: _tfPreps[text], pt: _ptPreps[text] };
}

// Obstacle rect relative to a zone element.
// When an image is open, use the overlay's live position.
function obstacleFor(zoneEl) {
    if (!zoneEl) return null;
    const zr = zoneEl.getBoundingClientRect();

    if (_imageOpen && _overlay && _overlay.style.display !== 'none') {
        const or = _overlay.getBoundingClientRect();
        return {
            top:    or.top    - zr.top,
            left:   or.left   - zr.left,
            right:  or.right  - zr.left,
            bottom: or.bottom - zr.top,
        };
    }

    // Star placeholder
    const ph = _container?.querySelector('#tldr-placeholder');
    if (!ph) return null;
    const pr = ph.getBoundingClientRect();
    if (pr.width === 0) return null;
    return {
        top:    pr.top    - zr.top,
        left:   pr.left   - zr.left,
        right:  pr.right  - zr.left,
        bottom: pr.bottom - zr.top,
    };
}

// Layout + render one zone. Returns the vertical offset applied to tf-layer.
function layoutZone(zoneEl, text) {
    if (!zoneEl || !_font) return;
    const containerW = zoneEl.offsetWidth || zoneEl.parentElement?.offsetWidth || 0;
    if (!containerW) return;

    const { tf: tfPrep, pt: ptPrep } = prepText(text);
    const obs   = obstacleFor(zoneEl);
    const zoneH = zoneEl.offsetHeight;

    let layoutObs, result, offset;

    if (!_imageOpen) {
        // Star: two-pass — centre the star in the text block.
        // Use pretext for unobstructed height (fast, accurate).
        const { height: unobsH } = layout(ptPrep, containerW, _lineH);
        const obsH   = obs ? obs.bottom - obs.top : 0;
        const obsMid = unobsH / 2;
        layoutObs = obs ? { top: obsMid - obsH / 2, bottom: obsMid + obsH / 2,
                            left: obs.left, right: obs.right } : null;
        result = Textflow.layout(tfPrep, containerW, layoutObs, _lineH);
        offset = zoneH > 0 ? Math.max(0, (zoneH - result.totalH) / 2) : 0;
    } else {
        // Image: 3-pass iterative — converge obstacle into tf-layer coordinate space.
        // Each pass recomputes offset from totalH, then shifts obstacle by that offset.
        // Converges in 2-3 iterations because the obstacle height doesn't change much.
        result = Textflow.layout(tfPrep, containerW, obs, _lineH);
        let curOffset = 0;
        for (let pass = 0; pass < 3; pass++) {
            curOffset = zoneH > 0 ? Math.max(0, (zoneH - result.totalH) / 2) : 0;
            layoutObs = obs ? {
                top:    obs.top    - curOffset,
                bottom: obs.bottom - curOffset,
                left:   obs.left,
                right:  obs.right,
            } : null;
            result = Textflow.layout(tfPrep, containerW, layoutObs, _lineH);
        }
        offset = zoneH > 0 ? Math.max(0, (zoneH - result.totalH) / 2) : 0;
    }

    Textflow.render(zoneEl, result);
    if (zoneEl._tfLayer) zoneEl._tfLayer.style.top = offset + 'px';
}

function runLayout() {
    if (_mode !== 'more' || !_container) return;

    for (const { text, zoneId } of currentTexts()) {
        const el = _container.querySelector(`#${zoneId}`);
        if (el) layoutZone(el, text);
    }

    _dirty = false;
}

// RAF loop — runs while image is moving, stops when settled.
function startLoop() {
    if (_rafId) return;
    function tick() {
        if (!_dirty && !_imageOpen) { _rafId = null; return; }
        _dirty = true;
        runLayout();
        _rafId = requestAnimationFrame(tick);
    }
    _rafId = requestAnimationFrame(tick);
}

// ── Mode / story transitions ───────────────────────────────────────────────────

function showMore() {
    const tldrCard = _container.querySelector('#about-tldr-card');
    const storyNav = _container.querySelector('#about-story-nav');

    if (tldrCard) {
        tldrCard.style.display = '';
        // TODO: replace with GSAP entrance animation
        gsapFadeIn(tldrCard);
    }
    if (storyNav) {
        storyNav.style.display = '';
        // TODO: replace with GSAP entrance animation
        gsapFadeIn(storyNav);
    }

    requestAnimationFrame(() => {
        _dirty = true;
        runLayout();
    });
}

function showLess() {
    const tldrCard = _container.querySelector('#about-tldr-card');
    const storyNav = _container.querySelector('#about-story-nav');

    // TODO: replace with GSAP exit animations
    if (tldrCard) gsapFadeOut(tldrCard, () => { tldrCard.style.display = 'none'; });
    if (storyNav) gsapFadeOut(storyNav, () => { storyNav.style.display = 'none'; });
}

function changeStory(idx) {
    _storyIdx = idx;
    if (_mode !== 'more') return;
    const storyZone = _container?.querySelector('#story-textzone');
    if (!storyZone) return;

    // TODO: replace inner transition with GSAP (slide/fade between stories)
    gsapFadeOut(storyZone, () => {
        _dirty = true;
        runLayout();
        gsapFadeIn(storyZone);
    });
}

// ── GSAP wrappers (falls back to CSS if GSAP not loaded) ──────────────────────

function gsapFadeIn(el, onComplete) {
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(el);
        gsap.fromTo(el,
            { y: 20, opacity: 0 },
            { y: 0,  opacity: 1, duration: 0.4, ease: 'power2.out', onComplete }
        );
    } else {
        el.style.transition = 'opacity 0.25s ease';
        el.style.opacity    = '0';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            if (onComplete) setTimeout(onComplete, 260);
        });
    }
}

function gsapFadeOut(el, onComplete) {
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(el);
        gsap.fromTo(el,
            { opacity: 1 },
            { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete }
        );
    } else {
        el.style.transition = 'opacity 0.18s ease';
        el.style.opacity    = '0';
        if (onComplete) setTimeout(onComplete, 200);
    }
}

// ── Public API ─────────────────────────────────────────────────────────────────

window.AboutText = {

    init(container) {
        _container = container;
        _font  = getFont();
        _lineH = getLineH(_font);

        // Re-measure on font load and resize
        document.fonts.ready.then(() => {
            _font  = getFont();
            _lineH = getLineH(_font);
            _tfPreps = {};
            _ptPreps = {};
            _dirty = true;
            runLayout();
        });

        window.addEventListener('resize', () => {
            _font    = getFont();
            _lineH   = getLineH(_font);
            _tfPreps = {};
            _ptPreps = {};
            _dirty   = true;
            runLayout();
        });
    },

    setMode(mode) {
        _mode = mode;
        if (mode === 'more') {
            showMore();
        } else {
            showLess();
        }
    },

    setStory(idx) {
        changeStory(idx);
    },

    onImageOpen(overlay) {
        _overlay   = overlay;
        _imageOpen = true;
        _dirty     = true;
        startLoop();
    },

    onImageMove(overlay) {
        _overlay = overlay;
        _dirty   = true;
        if (_mode === 'more') runLayout();
    },

    onImageClose() {
        _imageOpen = false;
        _overlay   = null;
        _dirty     = true;
        runLayout();
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    },
};
