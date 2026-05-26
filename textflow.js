// textflow.js — text layout that flows around a centered rectangular obstacle.
//
// Same design as chenglou/pretext:
//   prepare()  → one-time Canvas measurement pass (expensive)
//   layout()   → pure arithmetic hot path, call every frame during animation (cheap)
//   render()   → update a pooled DOM layer
//
// Usage:
//   const prep = Textflow.prepare(htmlString, cssFont)
//   const lines = Textflow.layout(prep, containerW, {top,left,right,bottom}, lineH)
//   Textflow.render(layerEl, lines)

const Textflow = (() => {
    const _ctx = document.createElement('canvas').getContext('2d');

    // ── Tokenizer — splits HTML text into measured tokens ────────────────────
    // Each token: { plain: string, html: string|null, w: number }
    // Tokens with html get rendered as innerHTML; plain tokens as textContent.
    function _tokenize(html, font) {
        _ctx.font = font;
        const tokens = [];

        // Walk the string: find inline HTML elements or plain text runs.
        // Handles <a ...>text</a> and <span ...>text</span>; skips all other tags.
        const re = /(<(?:a|span)\b[^>]*>)(.*?)(<\/(?:a|span)>)|<[^>]+>|([^<]+)/g;
        let m;
        while ((m = re.exec(html)) !== null) {
            if (m[4] !== undefined) {
                // Plain text run — split into individual words.
                m[4].split(/\s+/).filter(Boolean).forEach(word => {
                    tokens.push({ plain: word, html: null, w: _ctx.measureText(word).width });
                });
            } else if (m[1] !== undefined) {
                // Inline element: measure the inner text, keep full HTML for render.
                const inner = m[2].replace(/<[^>]+>/g, '').trim();
                if (inner) {
                    tokens.push({
                        plain: inner,
                        html:  m[1] + m[2] + m[3],
                        w:     _ctx.measureText(inner).width,
                    });
                }
            }
        }
        return tokens;
    }

    // ── prepare — measure once, reuse across layouts ─────────────────────────
    function prepare(html, font) {
        _ctx.font = font;
        return {
            tokens: _tokenize(html, font),
            spaceW: _ctx.measureText(' ').width,
            font,
        };
    }

    // ── layout — pure arithmetic, call every frame ────────────────────────────
    // obs: { top, left, right, bottom } relative to the container, or null.
    // Returns an array of line objects:
    //   { tokens: Token[], x: number, y: number, w: number }
    function layout(prep, containerW, obs, lineH) {
        const { tokens, spaceW } = prep;
        const GAP = 10; // horizontal clearance around the obstacle
        const lines = [];
        let ti = 0; // token index
        let y  = 0;

        while (ti < tokens.length) {
            // Which horizontal regions are available at this y?
            const inObs = obs &&
                y            < obs.bottom + GAP &&
                y + lineH    > obs.top    - GAP;

            let regions;
            if (inObs) {
                const lw = obs.left  - GAP;
                const rx = obs.right + GAP;
                const rw = containerW - rx;
                regions = [];
                if (lw > 24) regions.push({ x: 0, w: lw });
                if (rw > 24) regions.push({ x: rx, w: rw });
                if (!regions.length) regions.push({ x: 0, w: containerW }); // fallback
            } else {
                regions = [{ x: 0, w: containerW }];
            }

            let advanced = false;
            for (const reg of regions) {
                const lineTokens = [];
                let lineW = 0;

                while (ti < tokens.length) {
                    const tok   = tokens[ti];
                    const addW  = lineW === 0 ? tok.w : spaceW + tok.w;
                    if (lineW > 0 && lineW + addW > reg.w) break;
                    lineTokens.push(tok);
                    lineW += addW;
                    ti++;
                    advanced = true;
                }

                if (lineTokens.length) {
                    lines.push({ tokens: lineTokens, x: reg.x, y, w: reg.w });
                }
            }

            // Safety valve: force at least one token per row to avoid infinite loop.
            if (!advanced && ti < tokens.length) {
                lines.push({ tokens: [tokens[ti]], x: regions[0].x, y, w: regions[0].w });
                ti++;
            }

            y += lineH;
        }

        return { lines, totalH: y };
    }

    // ── render — update a pooled DOM layer inside `el` ────────────────────────
    // `el` must be `position: relative` (or absolute). Line divs are absolute.
    function render(el, layoutResult) {
        const { lines, totalH } = layoutResult;
        let pool = el._tfPool;
        if (!pool) {
            pool = el._tfPool = [];
            // Transparent overlay div that holds the text lines.
            const layer = document.createElement('div');
            layer.className = 'tf-layer';
            layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible;';
            el._tfLayer = layer;
            el.appendChild(layer);
        }

        const layer = el._tfLayer;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let div = pool[i];
            if (!div) {
                div = document.createElement('div');
                div.style.cssText = 'position:absolute;white-space:nowrap;pointer-events:auto;';
                layer.appendChild(div);
                pool.push(div);
            }
            div.style.left    = line.x + 'px';
            div.style.top     = line.y + 'px';
            div.style.width   = line.w + 'px';
            div.style.display = '';

            // Build the line's DOM content.
            // If all tokens are plain text, use the fast textContent path.
            const hasHtml = line.tokens.some(t => t.html);
            if (hasHtml) {
                div.innerHTML = line.tokens.map(t => t.html ?? t.plain).join(' ');
            } else {
                div.textContent = line.tokens.map(t => t.plain).join(' ');
            }
        }

        // Hide unused pool entries.
        for (let i = lines.length; i < pool.length; i++) {
            pool[i].style.display = 'none';
        }

        return totalH;
    }

    return { prepare, layout, render };
})();
