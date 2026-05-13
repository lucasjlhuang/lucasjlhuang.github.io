(() => {
    // No custom cursor on touch/mobile devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const BASE = '/images/wii-pointer-set/';
    const IMG  = {
        default:   BASE + 'WiiPointer.png',
        openhand:  BASE + 'WiiPointerOpenHand.png',
        link:      BASE + 'WiiPointerLink.png',
        help:      BASE + 'WiiPointerHelp.png',
        person:    BASE + 'Person.png',
        typing:    BASE + 'Typing.png',
        resize:    BASE + 'Resize.png',
        click:     BASE + 'WiiPointerBlue.png',
        grab:      BASE + 'WiiPointerGrab.png',
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

        // Drag overrides everything
        if (body.classList.contains('is-dragging')) return IMG.grab;

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

        // Window buttons and nav — check before the open-hand window rule
        if (
            target.closest('.window-close-btn') ||
            target.closest('.window-size-toggle-btn') ||
            target.closest('.hobby-close-btn') ||
            target.closest('.nav-project-link')
        ) return IMG.help;

        // Entire window body = open hand (drag to reposition)
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
            target.closest('.gb-stamp-cell') ||
            target.closest('button') ||
            target.closest('a')
        ) return IMG.help;

        return IMG.default;
    }

    let raf = null;
    let mx = -200, my = -200;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        if (!raf) raf = requestAnimationFrame(() => {
            el.style.transform = `translate(${mx}px,${my}px)`;
            setImg(pickCursor(e.target));
            raf = null;
        });
    }, { passive: true });

    // Keep cursor image in sync when body classes change (drag/click states)
    const bodyObserver = new MutationObserver(() => {
        setImg(pickCursor(document.elementFromPoint(mx, my) || document.body));
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(el);
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    });
})();
