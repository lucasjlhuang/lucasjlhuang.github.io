(() => {
    // No custom cursor on touch/mobile devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const BASE = '/images/wii-pointer-set/';
    const IMG  = {
        default:     BASE + 'WiiPointer.png',
        openhand:    BASE + 'WiiPointerOpenHand.png',
        link:        BASE + 'WiiPointerLink.png',
        help:        BASE + 'WiiPointerHelp.png',
        person:      BASE + 'Person.png',
        typing:      BASE + 'Typing.png',
        resize:      BASE + 'Resize.png',
        click:       BASE + 'WiiPointerBlue.png',
        grab:        BASE + 'WiiPointerGrab.png',
        unavailable: BASE + 'Unavailable.png',
    };

    // Reuse existing element or create one
    const el = document.getElementById('custom-cursor') || document.createElement('div');
    el.id = 'wii-cursor';
    el.style.cssText = [
        'position:fixed',
        'top:0', 'left:0',
        'width:64px', 'height:64px',
        'pointer-events:none',
        'z-index:2147483647',
        'will-change:transform',
        'background-size:contain',
        'background-repeat:no-repeat',
        'background-position:center',
    ].join(';');

    // Preload all images
    Object.values(IMG).forEach(src => { const i = new Image(); i.src = src; });

    let currentSrc = '';
    function setImg(src) {
        if (src === currentSrc) return;
        currentSrc = src;
        el.style.backgroundImage = `url('${src}')`;
    }

    function pickCursor(target) {
        const body = document.body;

        // Drag overrides everything (site-wide + guestbook stamp drag)
        if (body.classList.contains('is-dragging') ||
            body.classList.contains('gb-is-dragging')) return IMG.grab;

        // Click state — but not inside typing field
        if (body.classList.contains('is-clicking')) {
            if (target.closest('.stamp-name-input')) return IMG.typing;
            return IMG.click;
        }

        // Typing field
        if (target.closest('.stamp-name-input'))       return IMG.typing;

        // Palette / person zone
        if (
            target.closest('#inner-palette-overlay') ||
            target.closest('.ipc') ||
            target.closest('.color-swatch-btn') ||
            (target.closest('#stamp-inner-area') &&
             document.getElementById('inner-palette-overlay'))
        ) return IMG.person;

        // Resize handles
        if (target.closest('.top-left, .top-right, .bottom-left, .bottom-right, .window-resize-handle'))
            return IMG.resize;

        // Window buttons, nav, read-more — check before the open-hand window rule
        if (
            target.closest('.window-close-btn') ||
            target.closest('.window-size-toggle-btn') ||
            target.closest('.hobby-close-btn') ||
            target.closest('.nav-project-link') ||
            target.closest('#read-more-btn') ||
            target.closest('.story-nav-arrow')
        ) return IMG.help;

        // Under-construction folders — unavailable cursor
        if (target.closest('.under-construction')) return IMG.unavailable;

        // Canvas items — open hand (draggable), expanded overlay — open hand
        if (target.closest('.canvas-expand-overlay')) return IMG.openhand;
        if (target.closest('.canvas-item'))      return IMG.openhand;
        if (target.closest('.canvas-text-pill')) return IMG.openhand;
        if (target.closest('.tldr-world'))  return IMG.default;

        // About-me text zones and TLDR card — default pointer, links get link cursor
        if (
            target.closest('.textflow-zone') ||
            target.closest('#story-nav-title') ||
            target.closest('.about-tldr-card')
        ) {
            if (target.closest('a')) return IMG.link;
            return IMG.default;
        }

        // Fullscreen windows are not draggable — use default cursor
        if (target.closest('.window.is-fullscreen')) return IMG.default;

        // Windowed = open hand (drag to reposition)
        if (target.closest('.window')) return IMG.openhand;

        // NSL / PMC system-static folders (not while dragging)
        if (target.closest('.projectfolder.system-static')) return IMG.link;

        // Open hand — draggable containers
        if (
            target.closest('.projectfolderheader') ||
            target.closest('#desktop-id-card') ||
            target.closest('.scatter-icon') ||
            target.closest('.window-header') ||
            target.closest('.sprawled-hobby-image')
        ) return IMG.openhand;

        // Dock items that use link cursor
        if (
            target.closest('[data-label="Spotify"]') ||
            target.closest('[data-label="Instagram"]') ||
            target.closest('[data-label="LinkedIn"]') ||
            target.closest('[data-label="E-mail"]') ||
            target.closest('[data-label="Resume"]')
        ) return IMG.link;

        // Guestbook gallery stamps — open hand for draggable (non-user) stamps
        const gbCell = target.closest('.gb-stamp-cell');
        if (gbCell) {
            if (gbCell.dataset.isUserStamp) return IMG.help;
            return IMG.openhand;
        }

        // Clickable elements
        if (
            target.closest('.dock li') ||
            target.closest('#gb-crate-btn') ||
            target.closest('.gb-close-btn') ||
            target.closest('.stamp-enter-btn') ||
            target.closest('.theme-toggle-btn') ||
            target.closest('.in-progress-header') ||
            target.closest('.progress-item') ||
            target.closest('.clickable') ||
            target.closest('button') ||
            target.closest('a')
        ) return IMG.help;

        return IMG.default;
    }

    let raf = null;
    let mx = -200, my = -200;

    function onMove(e) {
        mx = e.clientX;
        my = e.clientY;
        if (!raf) raf = requestAnimationFrame(() => {
            el.style.transform = `translate(${mx}px,${my}px)`;
            // elementFromPoint is reliable even when e.target is stale (e.g. during GSAP drag)
            setImg(pickCursor(document.elementFromPoint(mx, my) || document.body));
            raf = null;
        });
    }

    // mousemove for normal use; pointermove on window for when GSAP Draggable's
    // preventDefault(pointerdown) suppresses the compatibility mousemove events
    document.addEventListener('mousemove',  onMove, { passive: true });
    window.addEventListener('pointermove',  onMove, { passive: true });

    // Keep cursor image in sync when body classes change (drag/click states)
    const bodyObserver = new MutationObserver(() => {
        setImg(pickCursor(document.elementFromPoint(mx, my) || document.body));
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(el);
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    });
})();
