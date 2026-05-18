// cassette-player.js — Custom cassette tape player widget

(function () {

    const TRACKS = [
        {
            title:  'Eyes On Me',
            artist: 'Ramir & Pdubcookin',
            art:    'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02f3b45792f796442cc3feae58',
            url:    'https://open.spotify.com/track/7tJRJdivnb0RRWp8wyjvTX',
            color:  '#7a5c3a',
        },
        {
            title:  'Fly Without Feathers',
            artist: 'PARIS The Prince',
            art:    'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b1acfdfaa1038a276dec233f',
            url:    'https://open.spotify.com/track/1W7yvwV8RjGQY5t6vh1R1M',
            color:  '#2e5a7a',
        },
        {
            title:  'Love Is Only a Feeling',
            artist: 'Joey Bada$$',
            art:    'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02b142bbe4a766121f8d6fad41',
            url:    'https://open.spotify.com/track/7umZiitjVsEjMQ6HNddpUI',
            color:  '#6b2e2e',
        },
    ];

    let currentIdx  = 0;
    let isPlaying   = false;
    let isAnimating = false;

    // ── Build the main tape HTML rendered inside the player window ────────────
    function tapeHTML(track) {
        return `
        <div class="cp-tape-body" style="background:${track.color}">
            <div class="cp-tape-label">
                <img class="cp-tape-art" src="${track.art}" alt="">
                <div class="cp-tape-text">
                    <span class="cp-tape-title">${track.title}</span>
                    <span class="cp-tape-artist">${track.artist}</span>
                </div>
            </div>
            <div class="cp-reels">
                <div class="cp-reel"></div>
                <div class="cp-reel"></div>
            </div>
        </div>`;
    }

    // ── Build a small rack tape ───────────────────────────────────────────────
    function rackTapeHTML(track, idx) {
        return `
        <button class="cp-rack-tape${idx === currentIdx ? ' active' : ''}" data-idx="${idx}" aria-label="${track.title}">
            <div class="cp-rack-body" style="background:${track.color}">
                <div class="cp-rack-label">
                    <img src="${track.art}" alt="">
                </div>
                <div class="cp-rack-reels">
                    <div class="cp-rack-reel"></div>
                    <div class="cp-rack-reel"></div>
                </div>
            </div>
        </button>`;
    }

    // ── Update reel spin state ────────────────────────────────────────────────
    function setReels(playing) {
        const reels = document.querySelectorAll('#cp-tape-slot .cp-reel');
        reels.forEach((r, i) => {
            r.style.animationDuration = playing ? (i === 0 ? '1.8s' : '2.4s') : '0s';
            r.classList.toggle('spinning', playing);
        });
    }

    // ── Swap to a new track with eject → insert animation ────────────────────
    function selectTrack(idx) {
        if (isAnimating || idx === currentIdx) return;
        isAnimating = true;

        // Pause playing state
        isPlaying = false;
        document.getElementById('cp-play').textContent = '▶';
        document.getElementById('cp-led').classList.remove('playing');

        // Update rack highlight
        document.querySelectorAll('.cp-rack-tape').forEach(t => {
            t.classList.toggle('active', parseInt(t.dataset.idx) === idx);
        });

        const slot = document.getElementById('cp-tape-slot');
        const body = slot.querySelector('.cp-tape-body');

        // Eject current tape
        if (body) {
            body.classList.add('cp-ejecting');
            body.addEventListener('animationend', () => {
                currentIdx = idx;
                slot.innerHTML = tapeHTML(TRACKS[currentIdx]);
                const newBody = slot.querySelector('.cp-tape-body');
                newBody.classList.add('cp-inserting');
                newBody.addEventListener('animationend', () => {
                    newBody.classList.remove('cp-inserting');
                    isAnimating = false;
                }, { once: true });
            }, { once: true });
        } else {
            currentIdx = idx;
            slot.innerHTML = tapeHTML(TRACKS[currentIdx]);
            isAnimating = false;
        }
    }

    // ── Initialise ────────────────────────────────────────────────────────────
    function init() {
        const widget  = document.getElementById('spotify-player-widget');
        const slot    = document.getElementById('cp-tape-slot');
        const rack    = document.getElementById('cp-rack');
        const playBtn = document.getElementById('cp-play');
        const prevBtn = document.getElementById('cp-prev');
        const nextBtn = document.getElementById('cp-next');
        const led     = document.getElementById('cp-led');
        if (!widget || !slot || !rack) return;

        // Render tape + rack
        slot.innerHTML = tapeHTML(TRACKS[currentIdx]);
        rack.innerHTML = TRACKS.map((t, i) => rackTapeHTML(t, i)).join('');

        // Rack clicks
        rack.addEventListener('click', e => {
            const tape = e.target.closest('.cp-rack-tape');
            if (!tape) return;
            selectTrack(parseInt(tape.dataset.idx));
        });

        // Play button — opens Spotify and toggles reel animation
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            playBtn.textContent = isPlaying ? '⏸' : '▶';
            led.classList.toggle('playing', isPlaying);
            setReels(isPlaying);
            if (isPlaying) window.open(TRACKS[currentIdx].url, '_blank');
        });

        // Prev / next
        prevBtn.addEventListener('click', () => {
            selectTrack((currentIdx - 1 + TRACKS.length) % TRACKS.length);
        });
        nextBtn.addEventListener('click', () => {
            selectTrack((currentIdx + 1) % TRACKS.length);
        });

        // Dock toggle — replaces the iframe-based toggle in windows.js
        const dockItem = document.querySelector('[data-label="Spotify"]');
        if (dockItem) {
            dockItem.addEventListener('click', e => {
                if (e.target.closest('a')) e.preventDefault();
                e.stopPropagation();
                const visible = widget.style.opacity === '1';
                widget.style.opacity      = visible ? '0' : '1';
                widget.style.pointerEvents = visible ? 'none' : 'auto';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);

})();
