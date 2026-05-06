/* character.js — ID Card Character Customizer
 *
 * HOW TO ADD YOUR OWN ART:
 * ─────────────────────────────────────────────────────────────────────────────
 * Each category is an array of image file paths in /images/character/.
 * To add a new option just push its path into the array.
 *
 * Categories (rendered back-to-front):
 *   SKIN  — base face/body layer
 *   HAIR  — hair / hat on top of skin
 *   SHIRT — clothing at the bottom
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.CharacterSystem = (function () {
    'use strict';

    // =========================================================================
    // ✏️  EDIT THESE ARRAYS — just add/remove file paths
    // =========================================================================

    const SKIN = [
        '/images/character/skin-1.svg',
        '/images/character/skin-2.svg',
        '/images/character/skin-3.svg',
        '/images/character/skin-4.svg',
    ];

    const HAIR = [
        '/images/character/hair-1.svg',
        '/images/character/hair-2.svg',
        '/images/character/hair-3.svg',
        '/images/character/hair-4.svg',
        '/images/character/hair-5.svg',
        '/images/character/hair-6.svg',
        '/images/character/hair-7.svg',
    ];

    const SHIRT = [
        '/images/character/shirt-1.svg',
        '/images/character/shirt-2.svg',
        '/images/character/shirt-3.svg',
        '/images/character/shirt-4.svg',
        '/images/character/shirt-5.svg',
        '/images/character/shirt-6.svg',
    ];

    // =========================================================================
    // LAYER REGISTRY
    // arrowTop: vertical centre of the ‹ › pair as % of the frame height
    // =========================================================================
    const LAYERS = [
        { id: 'skin',  label: 'Skin',     paths: SKIN,  arrowTop: '50%' },
        { id: 'hair',  label: 'Hair/Hat', paths: HAIR,  arrowTop: '37%' },
        { id: 'shirt', label: 'Shirt',    paths: SHIRT, arrowTop: '80%' },
    ];

    // Render order (bottom → top)
    const RENDER_ORDER = ['skin', 'shirt', 'hair'];

    // =========================================================================
    // STATE
    // =========================================================================

    function randomState() {
        const state = {};
        LAYERS.forEach(l => {
            state[l.id] = Math.floor(Math.random() * l.paths.length);
        });
        return state;
    }

    // =========================================================================
    // BUILD CHARACTER — stacks <img> layers into a wrapper div
    // =========================================================================

    function buildCharacterEl(state) {
        const wrap = document.createElement('div');
        wrap.className = 'char-wrap';

        RENDER_ORDER.forEach(id => {
            const layer = LAYERS.find(l => l.id === id);
            if (!layer || !layer.paths.length) return;
            const idx = Math.max(0, Math.min(state[id] || 0, layer.paths.length - 1));
            const img = document.createElement('img');
            img.src = layer.paths[idx];
            img.className = 'char-layer-img';
            img.alt = '';
            img.draggable = false;
            wrap.appendChild(img);
        });

        return wrap;
    }

    // Saved as JSON string in Supabase
    function renderCharacterSVG(state) {
        return JSON.stringify(state);
    }

    // =========================================================================
    // CUSTOMIZER UI
    // =========================================================================

    function initCustomizer(photoFrameEl) {
        let state = randomState();
        let charWrap = buildCharacterEl(state);
        photoFrameEl.innerHTML = '';
        photoFrameEl.style.position = 'relative';
        photoFrameEl.style.overflow = 'hidden';
        photoFrameEl.appendChild(charWrap);

        LAYERS.forEach(layer => {
            if (layer.paths.length <= 1) return;

            const leftBtn  = makeArrowBtn('left',  layer.label);
            const rightBtn = makeArrowBtn('right', layer.label);

            leftBtn.style.top   = layer.arrowTop;
            leftBtn.style.left  = '4px';
            rightBtn.style.top  = layer.arrowTop;
            rightBtn.style.right = '4px';

            function update() {
                charWrap.remove();
                charWrap = buildCharacterEl(state);
                photoFrameEl.insertBefore(charWrap, photoFrameEl.firstChild);
            }

            leftBtn.addEventListener('click', e => {
                e.stopPropagation();
                state[layer.id] = (state[layer.id] - 1 + layer.paths.length) % layer.paths.length;
                update();
                pop(leftBtn);
            });

            rightBtn.addEventListener('click', e => {
                e.stopPropagation();
                state[layer.id] = (state[layer.id] + 1) % layer.paths.length;
                update();
                pop(rightBtn);
            });

            photoFrameEl.appendChild(leftBtn);
            photoFrameEl.appendChild(rightBtn);
        });

        return {
            getState: () => ({ ...state }),
            getSVG:   () => JSON.stringify(state),
            reRandomize() {
                state = randomState();
                charWrap.remove();
                charWrap = buildCharacterEl(state);
                photoFrameEl.insertBefore(charWrap, photoFrameEl.firstChild);
            },
        };
    }

    // Plain text ‹ and › — no circle, no SVG wrapper
    function makeArrowBtn(dir, label) {
        const btn = document.createElement('button');
        btn.className = 'char-arrow-btn';
        btn.title = label;
        btn.style.position  = 'absolute';
        btn.style.transform = 'translateY(-50%)';
        btn.style.zIndex    = '10';
        btn.textContent = dir === 'left' ? '‹' : '›';
        return btn;
    }

    function pop(btn) {
        btn.classList.remove('char-arrow-pop');
        void btn.offsetWidth;
        btn.classList.add('char-arrow-pop');
    }

    // =========================================================================
    // READ-ONLY DISPLAY (widget + guest book)
    // =========================================================================

    function renderInto(containerEl, stateOrJSON) {
        if (!containerEl || !stateOrJSON) return;
        let state;
        try {
            state = typeof stateOrJSON === 'string' ? JSON.parse(stateOrJSON) : stateOrJSON;
        } catch { return; }
        containerEl.innerHTML = '';
        containerEl.style.position = 'relative';
        containerEl.appendChild(buildCharacterEl(state));
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    return {
        initCustomizer,
        renderInto,
        randomState,
        renderCharacterSVG,
        SKIN, HAIR, SHIRT, LAYERS,
    };

})();
