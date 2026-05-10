/* prescreen.js — Stamp Pre-screen */

(function () {
    'use strict';

    window.__prescreenDone = false;

    // Immediately cover the page so the desktop never flashes during the async stamp-number fetch
    const _shield = document.createElement('div');
    _shield.id = 'prescreen-init-shield';
    _shield.style.cssText = 'position:fixed;inset:0;z-index:100001;background:#FCFCFC;pointer-events:none;';
    document.body.prepend(_shield);

    const STORAGE_KEY   = 'lh_id_card_v1';
    const SUPABASE_URL  = 'https://szzuffjmcrckyipgsquq.supabase.co';
    const SUPABASE_ANON = 'sb_publishable_aIS1KXvtPNOimEnzsQ84PQ_2uYvA-Qz';
    const TABLE         = 'guest_cards';

    window.__SUPABASE_URL  = SUPABASE_URL;
    window.__SUPABASE_ANON = SUPABASE_ANON;

    async function saveCardToSupabase(cardData) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'apikey':        SUPABASE_ANON,
                    'Authorization': `Bearer ${SUPABASE_ANON}`,
                    'Prefer':        'return=minimal',
                },
                body: JSON.stringify({
                    name:          cardData.name        || null,
                    visit_date:    cardData.date        || null,
                    card_color:    cardData.innerColor  || null,
                    border_color:  cardData.outlineColor|| null,
                    character_svg: cardData.selectedImg || null,
                    stamp_number:  cardData.stampNumber || null,
                    pattern_id:    cardData.patternId   || null,
                    // NOTE: add a `pattern_id` text column to the guest_cards table in Supabase
                }),
            });
        } catch (err) { console.warn('Stamp upload failed:', err); }
    }

    window.fetchAllGuestCards = async function () {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=submitted_at.desc`,
                { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
            );
            return res.ok ? res.json() : [];
        } catch { return []; }
    };

    // ─── Images: 1–59 — edit the label field for each bubble ────────────────
    const STAMP_IMAGES = [
        { id: '1',  icon: '/images/prescreen-small/1.png',  full: '/images/prescreen-big/1.png',  label: 'the weekday' },
        { id: '2',  icon: '/images/prescreen-small/2.png',  full: '/images/prescreen-big/2.png',  label: 'wheres the wok?' },
        { id: '3',  icon: '/images/prescreen-small/3.png',  full: '/images/prescreen-big/3.png',  label: 'ok ok ok ok ok ok' },
        { id: '4',  icon: '/images/prescreen-small/4.png',  full: '/images/prescreen-big/4.png',  label: 'mums favourite' },
        { id: '5',  icon: '/images/prescreen-small/5.png',  full: '/images/prescreen-big/5.png',  label: 'jdm' },
        { id: '6',  icon: '/images/prescreen-small/6.png',  full: '/images/prescreen-big/6.png',  label: 'absolute goat' },
        { id: '7',  icon: '/images/prescreen-small/7.png',  full: '/images/prescreen-big/7.png',  label: '🔥' },
        { id: '8',  icon: '/images/prescreen-small/8.png',  full: '/images/prescreen-big/8.png',  label: '👁️' },
        { id: '9',  icon: '/images/prescreen-small/9.png',  full: '/images/prescreen-big/9.png',  label: 'good for the gym' },
        { id: '10', icon: '/images/prescreen-small/10.png', full: '/images/prescreen-big/10.png', label: 'the 6ix' },
        { id: '11', icon: '/images/prescreen-small/11.png', full: '/images/prescreen-big/11.png', label: 'forgot where this is from' },
        { id: '12', icon: '/images/prescreen-small/12.png', full: '/images/prescreen-big/12.png', label: 'hey siri, play baby' },
        { id: '13', icon: '/images/prescreen-small/13.png', full: '/images/prescreen-big/13.png', label: 'I always had that swag' },
        { id: '14', icon: '/images/prescreen-small/14.png', full: '/images/prescreen-big/14.png', label: 'banff :)' },
        { id: '15', icon: '/images/prescreen-small/15.png', full: '/images/prescreen-big/15.png', label: 'un musée' },
        { id: '16', icon: '/images/prescreen-small/16.png', full: '/images/prescreen-big/16.png', label: 'remember shark tale?' },
        { id: '17', icon: '/images/prescreen-small/17.png', full: '/images/prescreen-big/17.png', label: 'youll never guess where this was' },
        { id: '18', icon: '/images/prescreen-small/18.png', full: '/images/prescreen-big/18.png', label: 'I (didnt) draw this' },
        { id: '19', icon: '/images/prescreen-small/19.png', full: '/images/prescreen-big/19.png', label: '❄️' },
        { id: '20', icon: '/images/prescreen-small/20.png', full: '/images/prescreen-big/20.png', label: 'wedding day :)' },
        { id: '21', icon: '/images/prescreen-small/21.png', full: '/images/prescreen-big/21.png', label: 'thought this was nice' },
        { id: '22', icon: '/images/prescreen-small/22.png', full: '/images/prescreen-big/22.png', label: 'canada!' },
        { id: '23', icon: '/images/prescreen-small/23.png', full: '/images/prescreen-big/23.png', label: '黄龍' },
        { id: '24', icon: '/images/prescreen-small/24.png', full: '/images/prescreen-big/24.png', label: 'just keep swimming' },
        { id: '25', icon: '/images/prescreen-small/25.png', full: '/images/prescreen-big/25.png', label: 'mooooo-se' },
        { id: '26', icon: '/images/prescreen-small/26.png', full: '/images/prescreen-big/26.png', label: '🦋 but orange' },
        { id: '27', icon: '/images/prescreen-small/27.png', full: '/images/prescreen-big/27.png', label: 'france!' },
        { id: '28', icon: '/images/prescreen-small/28.png', full: '/images/prescreen-big/28.png', label: 'home' },
        { id: '29', icon: '/images/prescreen-small/29.png', full: '/images/prescreen-big/29.png', label: 'couldnt find the pot of gold' },
        { id: '30', icon: '/images/prescreen-small/30.png', full: '/images/prescreen-big/30.png', label: '🛥️' },
        { id: '31', icon: '/images/prescreen-small/31.png', full: '/images/prescreen-big/31.png', label: 'quack quack' },
        { id: '32', icon: '/images/prescreen-small/32.png', full: '/images/prescreen-big/32.png', label: '🍷 (they dont taste good off the vine)' },
        { id: '33', icon: '/images/prescreen-small/33.png', full: '/images/prescreen-big/33.png', label: 'I was freezing (Banff again)' },
        { id: '34', icon: '/images/prescreen-small/34.png', full: '/images/prescreen-big/34.png', label: 'lost so much money here' },
        { id: '35', icon: '/images/prescreen-small/35.png', full: '/images/prescreen-big/35.png', label: 'lucas in paris' },
        { id: '36', icon: '/images/prescreen-small/36.png', full: '/images/prescreen-big/36.png', label: 'I had a joke for this' },
        { id: '37', icon: '/images/prescreen-small/37.png', full: '/images/prescreen-big/37.png', label: '🌿' },
        { id: '38', icon: '/images/prescreen-small/38.png', full: '/images/prescreen-big/38.png', label: '🇫🇷' },
        { id: '39', icon: '/images/prescreen-small/39.png', full: '/images/prescreen-big/39.png', label: 'great picture tbh' },
        { id: '40', icon: '/images/prescreen-small/40.png', full: '/images/prescreen-big/40.png', label: 'un musée deux' },
        { id: '41', icon: '/images/prescreen-small/41.png', full: '/images/prescreen-big/41.png', label: 'me and my girl' },
        { id: '42', icon: '/images/prescreen-small/42.png', full: '/images/prescreen-big/42.png', label: 'woof' },
        { id: '43', icon: '/images/prescreen-small/43.png', full: '/images/prescreen-big/43.png', label: 'ouch' },
        { id: '44', icon: '/images/prescreen-small/44.png', full: '/images/prescreen-big/44.png', label: 'take me back' },
        { id: '45', icon: '/images/prescreen-small/45.png', full: '/images/prescreen-big/45.png', label: '🦀' },
        { id: '46', icon: '/images/prescreen-small/46.png', full: '/images/prescreen-big/46.png', label: 'Meow' },
        { id: '47', icon: '/images/prescreen-small/47.png', full: '/images/prescreen-big/47.png', label: 'strasbourg is beautiful' },
        { id: '48', icon: '/images/prescreen-small/48.png', full: '/images/prescreen-big/48.png', label: 'taiwan temple :)' },
        { id: '49', icon: '/images/prescreen-small/49.png', full: '/images/prescreen-big/49.png', label: 'new wallpaper' },
        { id: '50', icon: '/images/prescreen-small/50.png', full: '/images/prescreen-big/50.png', label: 'he spat on me' },
        { id: '51', icon: '/images/prescreen-small/51.png', full: '/images/prescreen-big/51.png', label: '🌅' },
        { id: '52', icon: '/images/prescreen-small/52.png', full: '/images/prescreen-big/52.png', label: 'quack?' },
        { id: '53', icon: '/images/prescreen-small/53.png', full: '/images/prescreen-big/53.png', label: ':)' },
        { id: '54', icon: '/images/prescreen-small/54.png', full: '/images/prescreen-big/54.png', label: 'fieldtrip with my students' },
        { id: '55', icon: '/images/prescreen-small/55.png', full: '/images/prescreen-big/55.png', label: '🚊' },
        { id: '56', icon: '/images/prescreen-small/56.png', full: '/images/prescreen-big/56.png', label: 'quack' },
        { id: '57', icon: '/images/prescreen-small/57.png', full: '/images/prescreen-big/57.png', label: '🌼' },
        { id: '58', icon: '/images/prescreen-small/58.png', full: '/images/prescreen-big/58.png', label: 'quack^2' },
        { id: '59', icon: '/images/prescreen-small/59.png', full: '/images/prescreen-big/59.png', label: 'me' },
    ];

    // Random default on each visit
    const DEFAULT_IMG = STAMP_IMAGES[Math.floor(Math.random() * STAMP_IMAGES.length)];

    // ─── Color palette ────────────────────────────────────────────────────────
    // Inner square colors
    const INNER_COLORS = [
        '#FADADD','#F5E6CA','#FFF3B0','#D4EDDA','#B8D4E8',
        '#C4B5D5','#FF6B6B','#4ECDC4','#DDA0DD','#F7DC6F',
        '#FDFCFC','#2C3E50','#1B4F72','#6E2C00','#4A235A',
        '#E8D5B7','#A8D5BA','#FFB347','#45B7D1','#96CEB4',
    ];
    // Outline colors
    const OUTLINE_COLORS = [
        '#FDFCFC','#2C3E50','#1B4F72','#6E2C00','#4A235A',
        '#1A1A2E','#2D4739','#4A4A5A','#6C7A89','#784212',
    ];

    // ─── Stamp dimensions (60% of 248×334) ───────────────────────────────────
    const STAMP_W = 149;
    const STAMP_H = 200;

    // ─── Outline SVG path ────────────────────────────────────────────────────
    const OUTLINE_PATH = `M6.19238 0C7.06014 2.26642 8.31005 3.83614 10.5576 5C10.9803 5.21883 11.9101 5.51479 12.3906 5.33984C15.1166 4.14182 15.7894 2.62007 17.1162 0.223633C18.3596 0.120604 19.5673 0.21255 20.8896 0.0654297C21.2802 2.21691 22.3002 4.14042 24.501 4.90527C25.6377 5.30626 26.8902 5.22061 27.9619 4.66895C29.8657 3.70764 30.6475 2.0677 31.2529 0.176758C32.5381 0.21822 33.8245 0.197229 35.1074 0.113281C36.6542 6.80041 44.0327 6.8701 45.3477 0.216797C46.692 0.209079 48.0366 0.19398 49.3809 0.170898C49.6889 1.16146 50.0308 1.89512 50.6084 2.75879C53.4925 7.07151 59.0789 5.03364 59.7559 0.217773L63.875 0.199219C63.9856 1.22297 64.0433 1.69179 64.6055 2.61523C65.3514 3.83145 66.5526 4.70038 67.9414 5.02734C71.2099 5.78238 73.2445 2.96689 73.873 0.120117C75.1976 0.216931 76.4258 0.101997 77.7178 0.196289C78.0783 0.477796 78.6589 2.37883 79.0976 2.9248C82.5517 7.22261 87.2725 4.93624 88.3154 0.182617C89.6313 0.214172 91.0446 0.179719 92.3682 0.170898C92.5174 1.05401 92.8462 1.8976 93.333 2.64941C96.2859 7.14674 101.65 5.27401 102.596 0.0830078C103.696 0.157612 105.367 0.214108 106.444 0.0537109C106.627 0.764569 106.783 1.39245 107.132 2.04883C107.866 3.44554 109.127 4.49189 110.635 4.95703C113.661 5.87003 116.322 2.95565 117.085 0.303711C118.05 0.106304 122.282 0.277706 123.497 0.291016C123.631 0.379907 123.748 0.456348 123.844 0.519531V6.16797C123.018 7.16336 120.435 6.44765 118.809 9.26465C118.357 10.0468 118.146 10.919 118.233 11.8203C118.351 13.0257 119.073 14.6357 120.031 15.4277C120.8 16.063 123.436 16.6165 123.665 16.9346C123.682 16.9582 123.7 16.982 123.717 17.0059C123.762 17.0688 123.803 17.1336 123.844 17.1992V20.4941C123.83 20.5123 123.817 20.5315 123.803 20.5488C123.087 21.3893 120.466 20.6655 118.913 23.4688C118.479 24.2399 118.264 25.1147 118.291 25.999C118.387 28.8397 120.872 30.9456 123.495 30.8828C123.527 30.8823 123.81 31.3795 123.844 31.4395V33.4072C123.671 33.9932 123.596 34.6782 123.221 35.0645C123.033 35.0463 122.831 35.0302 122.646 35.0029C119.581 35.8943 118.058 37.949 118.268 41.1729C118.734 43.6943 121.258 44.8444 123.481 45.3477C123.589 46.4571 123.507 48.248 123.486 49.4092C122.781 49.4479 122.081 49.4517 121.417 49.7217C117.814 51.1861 117.233 56.0792 120.233 58.5029C121.402 59.4469 122.147 59.4648 123.56 59.4727C123.498 60.8816 123.479 62.2921 123.502 63.7021C121.613 63.946 120.618 64.1224 119.317 65.7197C117.534 67.9086 118.236 71.0953 120.351 72.7822C121.345 73.5756 122.312 73.6641 123.521 73.7988C123.53 75.1756 123.484 76.6393 123.525 78.001C121.928 78.1592 120.706 78.2331 119.596 79.6094C116.679 83.2231 119.059 87.798 123.454 88.4521C123.579 89.7054 123.519 91.0032 123.556 92.2646C121.834 92.3264 120.948 92.5351 119.676 93.8486C117.661 95.928 117.83 99.0668 119.913 101.025C121.045 102.089 122.082 102.231 123.532 102.384C123.533 103.804 123.516 105.224 123.479 106.644C121.772 106.878 120.505 107.105 119.354 108.607C118.493 109.729 118.133 111.156 118.361 112.552C118.815 115.511 120.789 116.536 123.546 116.521C123.505 117.999 123.49 119.478 123.501 120.956C122.025 121.009 120.882 121.076 119.809 122.283C116.679 125.798 118.852 130.763 123.486 131.224C123.519 132.501 123.52 133.778 123.488 135.055C121.927 135.205 120.635 135.43 119.611 136.769C116.744 140.521 118.845 145.029 123.561 145.138C123.513 146.621 123.474 147.913 123.526 149.397C121.697 149.718 120.376 150.007 119.192 151.666C118.426 152.732 118.12 154.064 118.343 155.359C118.685 157.379 120.276 158.962 122.313 159.232C122.916 159.276 123.361 159.208 123.764 159.641L123.844 159.733V165.675C123.583 166 123.61 166.069 123.132 166.104C122.138 166.177 120.92 166.057 119.949 166.182C118.163 166.217 117.253 167.064 116.585 164.669C115.499 160.776 111.153 160.052 108.243 162.289C107.405 162.945 106.792 165.132 106.192 166.263C104.97 166.305 103.803 166.357 102.577 166.308C102.215 164.389 102.13 163.087 100.364 161.84C99.2559 161.057 97.7732 160.82 96.4463 161.069C95.239 161.293 94.1733 161.995 93.4902 163.016C92.8346 163.983 92.6426 165.1 92.5713 166.244C91.0974 166.262 89.6234 166.269 88.1494 166.265C88.0207 164.631 87.7411 163.089 86.416 162.011C84.5367 160.481 80.8997 160.616 79.3896 162.623C78.4314 163.898 78.2802 164.831 77.9941 166.271C76.7723 166.277 75.3301 166.316 74.125 166.283C73.5085 164.358 73.155 162.53 71.1631 161.494C69.0864 160.413 65.7218 161.071 64.5459 163.209C64.194 163.848 63.9241 165.384 63.791 166.15C63.1774 166.185 60.8844 166.277 60.4414 166.373C59.1528 165.909 59.7728 163.554 58.0752 162.188C56.8933 161.236 55.1226 160.905 53.79 161.012C50.7761 161.254 50.4875 163.752 49.5586 165.819C49.3175 166.354 46.1908 166.263 45.3545 166.27C45.206 164.301 44.4807 161.818 42.3877 161.31C37.4752 160.117 36.3542 162.348 35.0381 166.167C33.8532 166.156 32.5454 166.242 31.3525 166.295C30.4409 162.352 27.6115 159.438 23.1475 161.767C21.6388 162.555 21.2062 164.553 20.9023 166.13C19.71 166.226 18.5149 166.292 17.3193 166.327C16.8713 165.572 16.4679 164.586 16.1094 163.751C14.946 161.04 11.5584 160.389 9.07715 161.651C7.33761 162.537 6.86958 164.488 6.35352 166.245C4.62868 166.487 1.83429 166.42 0 166.429C0.115862 164.168 0.0603805 161.641 0.149414 159.304C1.14035 159.241 2.07179 159.106 2.9541 158.631C3.95456 158.098 4.69622 157.181 5.00781 156.092C6.12584 152.25 3.39504 150.111 0.101562 149.176L0.150391 145.262C4.72469 144.671 6.79447 140.517 3.77539 136.648C2.8246 135.43 1.62672 135.138 0.141602 135.049C0.0979432 133.843 0.078005 132.637 0.0800781 131.431C0.420527 131.327 0.756002 131.205 1.08496 131.068C4.08025 129.841 6.00895 127.415 4.80664 123.967C4.53392 123.185 3.45063 122.088 2.66406 121.78C0.788063 120.583 0.642492 121.524 0.470703 119.68L0.390625 118.705L0.518555 116.568C1.33637 116.676 2.24934 116.342 2.90625 115.931C6.33062 113.787 5.85042 108.212 1.89453 106.93C1.3571 106.756 0.849047 106.649 0.319336 106.532C0.392996 105.255 0.384949 103.702 0.411133 102.403C6.91588 101.137 6.85737 93.4366 0.367188 92.0762L0.375977 88.6094C1.15455 88.1997 1.92546 87.7633 2.67383 87.3477C5.9126 85.5488 6.03633 80.6841 2.90332 78.7197C2.05019 78.1849 1.44321 78.0902 0.486328 77.8623C0.349811 76.4702 0.345209 75.4731 0.495117 74.0869C2.25291 73.3885 4.21227 72.7447 4.76953 70.7168C5.86992 66.7102 4.29544 64.7257 0.442383 63.6133C0.314627 62.4732 0.367246 60.8287 0.386719 59.6543C2.55247 59.0896 4.59978 58.0741 5.04395 55.6914C5.74547 51.9278 3.72248 50.0277 0.375977 49.2871L0.330078 45.3965C1.33505 45.0407 2.57978 44.5869 3.41992 43.9385C6.43974 41.6073 5.45404 36.4344 1.83496 35.2939C1.45923 35.1756 0.878152 35.1258 0.480469 35.0791C0.433583 33.4567 0.404385 32.5873 0.523438 30.9512C3.80842 30.1412 5.99955 27.8147 4.91211 24.1338C4.43755 22.5284 2.94173 21.6815 1.5 21.0205C0.631498 20.7813 0.854359 20.7899 0.0815348 20.7899C0.0815348 20.0513 0.058582 17.6649 0.0966797 16.7793C7.31655 15.5256 6.50124 7.05386 0.12207 6.44922C0.0717229 5.18313 0.0470602 3.91552 0.046875 2.64844C0.13333 1.93589 0.136494 1.03457 0.158203 0.298828C1.63068 0.220641 5.01381 0.394876 6.19238 0ZM112.824 10.5771C107.812 10.6871 102.399 10.5912 97.3662 10.5938L69.3779 10.6182L11.2744 10.6084L11.2432 79.6719C11.2699 90.3783 10.9638 101.542 11.2393 112.169C19.8737 111.956 28.7567 112.377 37.4268 112.051L37.915 112.089C40.4208 112.264 43.7987 112.168 46.2813 112.165L61.0606 112.162C75.673 112.171 90.6545 112.333 105.238 112.138C106.806 112.282 111.171 112.129 112.787 112.061C112.683 111.031 112.733 108.93 112.729 107.849L112.683 100.325C112.621 90.2694 112.626 80.213 112.696 70.1572L112.68 32.7607C112.633 27.8025 112.627 22.844 112.659 17.8857C112.682 15.521 112.662 12.913 112.824 10.5771Z`;

    let _spCounter = 0;

    function makePatternDef(fill, pat, uid) {
        if (!pat || pat.randomize) return '';
        const f = fill || '#FDFCFC';
        const id = uid || 'sp';

        // Adaptive mark colors:
        // markColor  — general: dark mark on light fills, white on dark fills (used by v-stripes, dots, topo)
        // hMarkColor — h-stripes: dark on light fills, light-version-of-color on dark fills (not white)
        const light      = isLightColor(f);
        const markColor  = light ? darkenColor(f, 0.38) : 'rgba(255,255,255,0.55)';
        const hMarkColor = light ? darkenColor(f, 0.38) : lightenColor(f, 0.62);

        // Custom SVG mode: randomly pick one of the hand-crafted 500×500 SVG files.
        // The SVG is placed at a random position/rotation inside the stamp border area.
        if (pat.svgCount > 0) {
            const n   = Math.floor(Math.random() * pat.svgCount) + 1;
            const src = `/images/patterns/${pat.id}/${n}.svg`;
            const scale = 124 / 500;
            const ox = (Math.random() * 30 - 15).toFixed(1);
            const oy = (Math.random() * 30 - 15).toFixed(1);
            const angle = (Math.random() * 20 - 10).toFixed(1);
            return `<defs>
                <pattern id="${id}" width="124" height="167" patternUnits="userSpaceOnUse">
                    <rect width="124" height="167" fill="${f}"/>
                    <g transform="translate(${ox},${oy}) rotate(${angle} 62 83.5) scale(${scale})">
                        <image href="${src}" width="500" height="500"/>
                    </g>
                </pattern>
            </defs>`;
        }

        if (pat.id === 'topo') {
            const ox = Math.floor(Math.random() * -180);
            const oy = Math.floor(Math.random() * -180);
            const blendMode = light ? 'multiply' : 'screen';
            const filterStyle = light ? '' : 'filter:invert(1);';
            return `<defs>
                <pattern id="${id}" width="124" height="167" patternUnits="userSpaceOnUse">
                    <rect width="124" height="167" fill="${f}"/>
                    <image href="/images/swatch/topography.svg"
                           x="${ox}" y="${oy}" width="500" height="500"
                           preserveAspectRatio="none"
                           style="mix-blend-mode:${blendMode};opacity:0.55;${filterStyle}"/>
                </pattern>
            </defs>`;
        }

        const defs = {
            dots: `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse">
                     <rect width="9" height="9" fill="${f}"/>
                     <circle cx="4.5" cy="4.5" r="4.5" fill="${markColor}"/>
                   </pattern>`,
            'v-stripes': `<pattern id="${id}" width="124" height="167" patternUnits="userSpaceOnUse">
                     <rect width="62" height="167" fill="${f}"/>
                     <rect x="62" y="0" width="62" height="167" fill="${markColor}"/>
                   </pattern>`,
            'h-stripes': `<pattern id="${id}" width="124" height="167" patternUnits="userSpaceOnUse">
                     <rect width="124" height="66.8" fill="${hMarkColor}"/>
                     <rect y="66.8" width="124" height="100.2" fill="${f}"/>
                   </pattern>`,
        };
        return defs[pat.id] ? `<defs>${defs[pat.id]}</defs>` : '';
    }

    function makeOutlineSVG(w, h, fillColor, pat) {
        const fill = fillColor || '#FDFCFC';
        const uid  = 'sp' + (++_spCounter);
        const patDef  = makePatternDef(fill, pat, uid);
        const pathFill = (pat && !pat.randomize && patDef) ? `url(#${uid})` : fill;
        return `<svg viewBox="0 0 124 167" xmlns="http://www.w3.org/2000/svg"
                     width="${w}" height="${h}" style="display:block">
            ${patDef}
            <path fill-rule="evenodd" clip-rule="evenodd" d="${OUTLINE_PATH}"
                  fill="${pathFill}" stroke="rgba(0,0,0,0.18)" stroke-width="0.5"/>
        </svg>`;
    }

    let activeInnerColor   = '#FFFFFF';
    let activeOutlineColor = OUTLINE_COLORS[0];
    let activePattern      = null; // null = solid color, otherwise pattern id
    let selectedImgDef     = DEFAULT_IMG;
    let stampNumber        = null;
    let paletteOpen        = false;

    function loadSavedCard() {
        try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; }
        catch { return null; }
    }
    function saveCard(d) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
    }
    function signalBoot() {
        window.__prescreenDone = true;
        document.dispatchEvent(new CustomEvent('prescreen:done'));
    }
    async function fetchStampNumber() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=id&limit=1`, {
                headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Prefer': 'count=exact' }
            });
            const range = res.headers.get('Content-Range') || res.headers.get('content-range');
            if (!range) return 1;
            const n = parseInt(range.split('/')[1], 10);
            return isNaN(n) ? 1 : n + 1;
        } catch { return 1; }
    }

    // ─── Apply image (colors stay independent) ────────────────────────────────
    function applyImageToStamp(imgDef) {
        selectedImgDef = imgDef;
        document.getElementById('stamp-selected-img').src = imgDef.full;
        // Bounce
        const wrapper = document.getElementById('stamp-wrapper');
        wrapper.classList.remove('stamp-drop-bounce');
        void wrapper.offsetWidth;
        wrapper.classList.add('stamp-drop-bounce');
    }

    // ─── Apply colors ─────────────────────────────────────────────────────────
    function applyInnerColor(color) {
        activeInnerColor = color;
        const sq = document.getElementById('stamp-inner-sq');
        if (sq) sq.style.background = color;
        const btn = document.getElementById('color-swatch-btn');
        if (btn) btn.style.background = color;
    }

    function applyOutlineColor(color) {
        activeOutlineColor = color;
        document.getElementById('stamp-outline-svg').innerHTML =
            makeOutlineSVG(STAMP_W, STAMP_H, color, activePattern);
        updateStampTextColor();
    }

    // Track which imgDef is currently in the stamp (its icon is hidden)
    let activeIconEl  = null; // the icon element currently placed in stamp
    let activeImgDef  = DEFAULT_IMG;

    // ─── Weighted scatter: denser toward center ───────────────────────────────
    function scatterIcons(prescreen, skipId) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const cx = vw / 2;
        const cy = vh / 2;
        const ICON_SIZE = 44;
        const MARGIN    = 20;

        const excludeW = STAMP_W + 80;
        const excludeH = STAMP_H + 140;
        const exLeft   = cx - excludeW / 2;
        const exRight  = cx + excludeW / 2;
        const exTop    = cy - excludeH / 2;
        const exBottom = cy + excludeH / 2;

        const placed = [];

        function inExclude(x, y) {
            return x + ICON_SIZE > exLeft && x < exRight &&
                   y + ICON_SIZE > exTop  && y < exBottom;
        }
        function overlaps(x, y) {
            if (inExclude(x, y)) return true;
            for (const p of placed) {
                if (x < p.x + p.w + 5 && x + ICON_SIZE + 5 > p.x &&
                    y < p.y + p.h + 5 && y + ICON_SIZE + 5 > p.y) return true;
            }
            return false;
        }

        // Gaussian toward center (σ = 28% of viewport), fallback to uniform
        function samplePos() {
            for (let t = 0; t < 6; t++) {
                const u1 = Math.max(1e-10, Math.random());
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
                const x  = Math.max(MARGIN, Math.min(vw - ICON_SIZE - MARGIN,
                               cx + z0 * vw * 0.28 - ICON_SIZE / 2));
                const y  = Math.max(MARGIN, Math.min(vh - ICON_SIZE - MARGIN,
                               cy + z1 * vh * 0.28 - ICON_SIZE / 2));
                if (!inExclude(x, y)) return { x, y };
            }
            // Fallback: uniform
            return {
                x: MARGIN + Math.random() * (vw - ICON_SIZE - MARGIN * 2),
                y: MARGIN + Math.random() * (vh - ICON_SIZE - MARGIN * 2),
            };
        }

        const toScatter = skipId
            ? STAMP_IMAGES.filter(img => img.id !== skipId)
            : STAMP_IMAGES;

        toScatter.forEach(imgDef => {
            let pos, attempts = 0;
            do {
                pos = samplePos();
                attempts++;
            } while (overlaps(pos.x, pos.y) && attempts < 300);

            placed.push({ x: pos.x, y: pos.y, w: ICON_SIZE, h: ICON_SIZE });
            const icon = createIcon(prescreen, imgDef, pos.x, pos.y);
            // Stagger appear animation
            const delay = placed.length * 22;
            setTimeout(() => icon.classList.add('icon-appear'), delay);
        });
    }

    function createIcon(prescreen, imgDef, x, y) {
        const icon = document.createElement('div');
        icon.className = 'scatter-icon';
        icon.style.left = x + 'px';
        icon.style.top  = y + 'px';
        icon.dataset.id = imgDef.id;

        const img = document.createElement('img');
        img.src      = imgDef.icon;
        img.alt      = imgDef.id;
        img.draggable = false;
        icon.appendChild(img);

        // Speech bubble
        const bubble = document.createElement('div');
        bubble.className = 'icon-bubble';
        bubble.textContent = imgDef.label || imgDef.id;
        icon.appendChild(bubble);

        attachIconDrag(icon, imgDef, prescreen);
        prescreen.appendChild(icon);
        return icon;
    }

    // ─── Drag: icon itself moves, no clone ────────────────────────────────────
    function attachIconDrag(icon, imgDef, prescreen) {
        let dragging = false;
        let ox = 0, oy = 0;

        function startDrag(clientX, clientY) {
            dragging = true;
            const r = icon.getBoundingClientRect();
            ox = clientX - r.left;
            oy = clientY - r.top;
            icon.style.zIndex    = '9000';
            icon.style.cursor    = 'grabbing';
            icon.style.transform = 'scale(1.12)';
            icon.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)';
            icon.style.opacity   = '1';
            const bub = icon.querySelector('.icon-bubble');
            if (bub) bub.style.display = 'none';
            document.body.style.cursor = 'grabbing';
        }

        function moveDrag(clientX, clientY) {
            if (!dragging) return;
            icon.style.left = (clientX - ox) + 'px';
            icon.style.top  = (clientY - oy) + 'px';
            const dropTarget = document.getElementById('stamp-inner-area');
            if (dropTarget) {
                const dr = dropTarget.getBoundingClientRect();
                const over = clientX >= dr.left && clientX <= dr.right &&
                             clientY >= dr.top  && clientY <= dr.bottom;
                dropTarget.classList.toggle('drop-hover', over);
            }
        }

        function endDrag(clientX, clientY) {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = '';
            icon.style.zIndex    = '50';
            icon.style.cursor    = 'grab';
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = '';
            const bub = icon.querySelector('.icon-bubble');
            if (bub) bub.style.display = '';
            const dropTarget = document.getElementById('stamp-inner-area');
            if (dropTarget) {
                const dr = dropTarget.getBoundingClientRect();
                const over = clientX >= dr.left && clientX <= dr.right &&
                             clientY >= dr.top  && clientY <= dr.bottom;
                if (over) {
                    if (activeIconEl && activeIconEl !== icon) {
                        respawnIcon(prescreen, activeIconEl);
                    }
                    icon.style.opacity       = '0';
                    icon.style.pointerEvents = 'none';
                    activeIconEl = icon;
                    activeImgDef = imgDef;
                    applyImageToStamp(imgDef);
                }
                dropTarget.classList.remove('drop-hover');
            }
        }

        // Mouse
        icon.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
        });

        function onMove(e) { moveDrag(e.clientX, e.clientY); }
        function onUp(e)   { endDrag(e.clientX, e.clientY); }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);

        // Touch
        icon.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
        }, { passive: false });

        document.addEventListener('touchmove', e => {
            if (!dragging) return;
            e.preventDefault();
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
        }, { passive: false });

        document.addEventListener('touchend', e => {
            if (!dragging) return;
            const t = e.changedTouches[0];
            endDrag(t.clientX, t.clientY);
        });
    }

    function respawnIcon(prescreen, icon) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const MARGIN = 20;
        const ICON_SIZE = 44;
        const cx = vw / 2, cy = vh / 2;
        const excludeW = STAMP_W + 80, excludeH = STAMP_H + 140;
        const exLeft = cx - excludeW/2, exRight = cx + excludeW/2;
        const exTop  = cy - excludeH/2, exBottom = cy + excludeH/2;

        let x, y, attempts = 0;
        do {
            x = MARGIN + Math.random() * (vw - ICON_SIZE - MARGIN * 2);
            y = MARGIN + Math.random() * (vh - ICON_SIZE - MARGIN * 2);
            attempts++;
        } while (
            attempts < 200 &&
            x + ICON_SIZE > exLeft && x < exRight &&
            y + ICON_SIZE > exTop  && y < exBottom
        );

        icon.style.left         = x + 'px';
        icon.style.top          = y + 'px';
        icon.style.opacity      = '0';
        icon.style.pointerEvents = 'auto';
        icon.style.transform    = 'scale(0.6)';
        icon.style.transition   = 'none';
        void icon.getBoundingClientRect();
        icon.style.transition   = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        requestAnimationFrame(() => {
            icon.style.opacity   = '1';
            icon.style.transform = 'scale(1)';
        });
    }


        // ─── Luminance helper ─────────────────────────────────────────────────────
    function isLightColor(hex) {
        const c = hex.replace('#','');
        const r = parseInt(c.slice(0,2),16);
        const g = parseInt(c.slice(2,4),16);
        const b = parseInt(c.slice(4,6),16);
        return (r*299 + g*587 + b*114) / 1000 > 155;
    }

    // Returns a darkened version of a hex color (factor 0–1)
    function darkenColor(hex, factor) {
        const c = hex.replace('#','');
        const r = Math.round(parseInt(c.slice(0,2),16) * factor);
        const g = Math.round(parseInt(c.slice(2,4),16) * factor);
        const b = Math.round(parseInt(c.slice(4,6),16) * factor);
        return `rgb(${r},${g},${b})`;
    }

    // Returns a lightened version of a hex color (factor 0=unchanged, 1=white)
    function lightenColor(hex, factor) {
        const c = hex.replace('#','');
        const r = Math.round(parseInt(c.slice(0,2),16) + (255 - parseInt(c.slice(0,2),16)) * factor);
        const g = Math.round(parseInt(c.slice(2,4),16) + (255 - parseInt(c.slice(2,4),16)) * factor);
        const b = Math.round(parseInt(c.slice(4,6),16) + (255 - parseInt(c.slice(4,6),16)) * factor);
        return `rgb(${r},${g},${b})`;
    }

    function updateStampTextColor() {
        // Number and name sit bottom-right of the stamp border area.
        // For the vertical split pattern the text is on the RIGHT half (markColor),
        // so contrast logic must be inverted relative to the fill.
        const outlineLight = isLightColor(activeOutlineColor);
        const textOnLight  = activePattern?.id === 'v-stripes' ? !outlineLight : outlineLight;

        const numEl  = document.querySelector('.stamp-number');
        const nameEl = document.querySelector('.stamp-name-input');
        if (numEl)  numEl.style.color = textOnLight ? '#000' : '#fff';
        if (nameEl) {
            nameEl.style.color = textOnLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
            nameEl.style.setProperty('--placeholder-color', textOnLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)');
        }
    }

    // ─── HSL Color Picker (unused — kept for reference) ──────────────────────
    function buildHSLPicker_UNUSED(initialHex, onColorChange) {
        // Convert hex → HSL
        function hexToHSL(hex) {
            const c = hex.replace('#','');
            let r = parseInt(c.slice(0,2),16)/255;
            let g = parseInt(c.slice(2,4),16)/255;
            let b = parseInt(c.slice(4,6),16)/255;
            const max = Math.max(r,g,b), min = Math.min(r,g,b);
            let h, s, l = (max+min)/2;
            if (max===min) { h=s=0; }
            else {
                const d = max-min;
                s = l>0.5 ? d/(2-max-min) : d/(max+min);
                switch(max){
                    case r: h=((g-b)/d+(g<b?6:0))/6; break;
                    case g: h=((b-r)/d+2)/6; break;
                    default: h=((r-g)/d+4)/6;
                }
            }
            return [h*360, s*100, l*100];
        }
        function hslToHex(h,s,l) {
            s/=100; l/=100;
            const a = s*Math.min(l,1-l);
            const f = n => { const k=(n+h/30)%12; const c=l-a*Math.max(-1,Math.min(k-3,9-k,1)); return Math.round(255*c).toString(16).padStart(2,'0'); };
            return `#${f(0)}${f(8)}${f(4)}`;
        }

        let [H, S, L] = hexToHSL(initialHex);

        const popup = document.createElement('div');
        popup.id = 'color-palette-popup';
        popup.className = 'color-palette-popup hsl-picker';

        popup.innerHTML = `
            <div class="hsl-sl-wrap">
                <canvas class="hsl-sl-canvas" width="160" height="140"></canvas>
                <div class="hsl-sl-cursor"></div>
            </div>
            <div class="hsl-hue-wrap">
                <canvas class="hsl-hue-canvas" width="160" height="14"></canvas>
                <div class="hsl-hue-cursor"></div>
            </div>
            <div class="hsl-preview-row">
                <div class="hsl-preview-swatch"></div>
                <input class="hsl-hex-input" type="text" maxlength="7" spellcheck="false">
            </div>
        `;

        popup.addEventListener('click', e => e.stopPropagation());

        const slCanvas   = popup.querySelector('.hsl-sl-canvas');
        const slCtx      = slCanvas.getContext('2d');
        const slCursor   = popup.querySelector('.hsl-sl-cursor');
        const hueCanvas  = popup.querySelector('.hsl-hue-canvas');
        const hueCtx     = hueCanvas.getContext('2d');
        const hueCursor  = popup.querySelector('.hsl-hue-cursor');
        const preview    = popup.querySelector('.hsl-preview-swatch');
        const hexInput   = popup.querySelector('.hsl-hex-input');

        function drawHue() {
            const grad = hueCtx.createLinearGradient(0,0,160,0);
            for (let i=0; i<=360; i+=10) grad.addColorStop(i/360, `hsl(${i},100%,50%)`);
            hueCtx.fillStyle = grad;
            hueCtx.fillRect(0,0,160,14);
        }

        function drawSL() {
            // White → hue gradient (left to right)
            const gradH = slCtx.createLinearGradient(0,0,160,0);
            gradH.addColorStop(0, `hsl(${H},0%,100%)`);
            gradH.addColorStop(1, `hsl(${H},100%,50%)`);
            slCtx.fillStyle = gradH;
            slCtx.fillRect(0,0,160,140);
            // Transparent → black gradient (top to bottom)
            const gradV = slCtx.createLinearGradient(0,0,0,140);
            gradV.addColorStop(0, 'rgba(0,0,0,0)');
            gradV.addColorStop(1, 'rgba(0,0,0,1)');
            slCtx.fillStyle = gradV;
            slCtx.fillRect(0,0,160,140);
        }

        function updateCursors() {
            // SL cursor position: S = x/160, L maps to y
            // In the canvas: right = full sat, top = full lightness
            const x = (S/100) * 160;
            const y = (1 - (L-0)/(50)) * 140; // approximate
            slCursor.style.left = Math.max(0,Math.min(158,x)) + 'px';
            slCursor.style.top  = Math.max(0,Math.min(138,y)) + 'px';
            // Hue cursor
            hueCursor.style.left = (H/360)*160 + 'px';
        }

        function emitColor() {
            const hex = hslToHex(H, S, L);
            preview.style.background = hex;
            hexInput.value = hex;
            onColorChange(hex);
        }

        function posToSL(x, y) {
            S = Math.max(0, Math.min(100, (x / 160) * 100));
            // Map y: top=100% lightness, bottom=0%
            L = Math.max(0, Math.min(100, (1 - y/140) * 50 + 0));
            // Clamp: at bottom-right (full S, 0L) → ensure black
        }

        // SL drag
        let draggingSL = false;
        slCanvas.addEventListener('mousedown', e => {
            draggingSL = true;
            const r = slCanvas.getBoundingClientRect();
            posToSL(e.clientX-r.left, e.clientY-r.top);
            updateCursors(); emitColor();
        });
        document.addEventListener('mousemove', e => {
            if (!draggingSL) return;
            const r = slCanvas.getBoundingClientRect();
            posToSL(Math.max(0,Math.min(160,e.clientX-r.left)), Math.max(0,Math.min(140,e.clientY-r.top)));
            updateCursors(); emitColor();
        });
        document.addEventListener('mouseup', () => { draggingSL = false; });

        // Hue drag
        let draggingHue = false;
        hueCanvas.addEventListener('mousedown', e => {
            draggingHue = true;
            const r = hueCanvas.getBoundingClientRect();
            H = Math.max(0, Math.min(360, ((e.clientX-r.left)/160)*360));
            drawSL(); updateCursors(); emitColor();
        });
        document.addEventListener('mousemove', e => {
            if (!draggingHue) return;
            const r = hueCanvas.getBoundingClientRect();
            H = Math.max(0, Math.min(360, ((e.clientX-r.left)/160)*360));
            drawSL(); updateCursors(); emitColor();
        });
        document.addEventListener('mouseup', () => { draggingHue = false; });

        // Hex input
        hexInput.addEventListener('change', () => {
            const val = hexInput.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                [H, S, L] = hexToHSL(val);
                drawSL(); updateCursors(); emitColor();
            }
        });

        // Initial draw
        requestAnimationFrame(() => {
            drawHue();
            drawSL();
            updateCursors();
            emitColor();
        });

        return popup;
    }

    // ─── Pattern rendering ────────────────────────────────────────────────────
    // svgCount: set to the number of 500×500 SVG files in /images/patterns/{id}/ when ready.
    // When svgCount > 0, a random SVG from that folder will be used in the stamp border instead
    // of the CSS-generated tile. Add files as /images/patterns/{id}/1.svg, 2.svg, …
    const PATTERNS = [
        { id: 'dots',      swatch: '/images/swatch/dots.png',       svgCount: 0 },
        { id: 'v-stripes', swatch: '/images/swatch/verticle.png',   svgCount: 0 },
        { id: 'h-stripes', swatch: '/images/swatch/horizontal.png', svgCount: 0 },
        { id: 'topo',      swatch: '/images/swatch/topo.png',       svgCount: 0 },
        // Randomize button — not a real pattern
        { id: 'random', randomize: true },
    ];

    // 5 color rows × 6 cols = 30 colors
    const SWATCH_COLORS = [
        '#FFFFFF','#F5F5F5','#E8E0D0','#FADADD','#F4A8B0','#FF6B6B',
        '#E74C3C','#FFF3B0','#F5E6CA','#FFB347','#F39C12','#E67E22',
        '#D4EDDA','#A8D5BA','#4ECDC4','#45B7D1','#B8D4E8','#3498DB',
        '#1B4F72','#C4B5D5','#9B59B6','#2C3E50','#1A1A2E','#4A4A5A',
        '#6C7A89','#2D4739','#6E2C00','#4A235A','#000000','#888888',
    ];

    function applyPattern(pat) {
        activePattern = pat;
        // Pattern renders on the outline SVG border area, not the character image
        const outlineSvgEl = document.getElementById('stamp-outline-svg');
        if (outlineSvgEl) {
            outlineSvgEl.innerHTML = makeOutlineSVG(STAMP_W, STAMP_H, activeOutlineColor, pat);
        }
        // Text contrast may change when switching to/from v-stripes
        updateStampTextColor();
    }

    // ─── Randomize stamp ─────────────────────────────────────────────────────
    function randomizeStamp() {
        const color = SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)];
        applyInnerColor(color);
        applyOutlineColor(color);

        const nonRandom = PATTERNS.filter(p => !p.randomize);
        const choices   = [...nonRandom, null]; // null = no pattern
        const pat       = choices[Math.floor(Math.random() * choices.length)];
        applyPattern(pat);

        // Sync active states inside the palette if it's open
        const overlay = document.getElementById('inner-palette-overlay');
        if (overlay) {
            overlay.querySelectorAll('.ipc-color').forEach(b => b.classList.remove('ipc-active'));
            overlay.querySelectorAll('.ipc-pat:not(.ipc-random)').forEach(b => {
                const idx = parseInt(b.dataset.patIdx);
                b.classList.toggle('ipc-active', !!(pat && PATTERNS[idx]?.id === pat.id));
            });
        }
    }

    // ─── Palette grid constants ───────────────────────────────────────────────
    const PAL_COLS = 6;
    const PAL_ROWS = 6; // 5 color rows + 1 pattern/close row
    const PAL_CELL = 14;
    const PAL_GAP  = 2;
    const PAL_PAD  = 7;

    function togglePalette() {
        const existing = document.getElementById('inner-palette-overlay');
        if (existing) { closePalette(); return; }
        paletteOpen = true;

        const innerArea = document.getElementById('stamp-inner-area');

        const overlay = document.createElement('div');
        overlay.id = 'inner-palette-overlay';
        overlay.addEventListener('click', e => e.stopPropagation());

        const allCells = [];

        for (let row = 0; row < PAL_ROWS; row++) {
            for (let col = 0; col < PAL_COLS; col++) {
                const btn = document.createElement('button');
                btn.className = 'ipc';

                const isBottomRow  = row === PAL_ROWS - 1;
                const isCloseCell  = isBottomRow && col === 0;
                const patIdx       = col - 1; // col 1 = pattern 0, col 2 = pattern 1 …
                const isPatCell    = isBottomRow && col > 0 && patIdx < PATTERNS.length;
                const colorIdx     = row * PAL_COLS + col;
                const isColorCell  = !isBottomRow && colorIdx < SWATCH_COLORS.length;

                if (isCloseCell) {
                    btn.textContent = '×';
                    btn.classList.add('ipc-close');
                    // X contrasts against the swatch button color (activeInnerColor)
                    btn.style.color = isLightColor(activeInnerColor) ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
                    btn.addEventListener('click', e => { e.stopPropagation(); closePalette(); });

                } else if (isPatCell) {
                    const pat = PATTERNS[patIdx];
                    btn.classList.add('ipc-pat');
                    btn.dataset.patIdx = patIdx;

                    if (pat.randomize) {
                        btn.classList.add('ipc-random');
                        btn.textContent = '↺';
                        btn.addEventListener('click', e => { e.stopPropagation(); randomizeStamp(); });
                    } else {
                        // Use the PNG swatch icon as the button preview
                        if (pat.swatch) {
                            btn.style.background = `url('${pat.swatch}') center/cover no-repeat`;
                        } else {
                            btn.style.background = '#f0f0f0';
                        }
                        if (activePattern?.id === pat.id) btn.classList.add('ipc-active');
                        btn.addEventListener('click', e => {
                            e.stopPropagation();
                            if (activePattern?.id === pat.id) {
                                applyPattern(null);
                                btn.classList.remove('ipc-active');
                            } else {
                                applyPattern(pat);
                                overlay.querySelectorAll('.ipc-pat').forEach(b => b.classList.remove('ipc-active'));
                                btn.classList.add('ipc-active');
                            }
                        });
                    }

                } else if (isColorCell) {
                    const color = SWATCH_COLORS[colorIdx];
                    btn.classList.add('ipc-color');
                    btn.style.background = color;
                    if (color === '#FFFFFF' || color === '#F5F5F5')
                        btn.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.15)';
                    if (activeInnerColor === color && !activePattern)
                        btn.classList.add('ipc-active');
                    btn.addEventListener('click', e => {
                        e.stopPropagation();
                        applyInnerColor(color);
                        applyOutlineColor(color); // preserves activePattern via makeOutlineSVG
                        overlay.querySelectorAll('.ipc-color').forEach(b => b.classList.remove('ipc-active'));
                        btn.classList.add('ipc-active');
                        // Keep X contrasting against the new swatch color
                        const closeBtn = overlay.querySelector('.ipc-close');
                        if (closeBtn) closeBtn.style.color = isLightColor(color) ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
                    });

                } else {
                    btn.style.visibility = 'hidden';
                }

                // Wave animation: delay = (rowsFromBottom + colsFromLeft) * 35ms
                const rowsFromBottom = PAL_ROWS - 1 - row;
                const delay = (rowsFromBottom + col) * 35;

                btn.style.transform = 'scale(0)';
                btn.style.opacity   = '0';
                btn.style.transition = 'none';

                overlay.appendChild(btn);
                allCells.push({ btn, delay });
            }
        }

        innerArea.appendChild(overlay);

        // Lock swatch button at enlarged size; stays visible so X sits inside it
        const swatchBtn = document.getElementById('color-swatch-btn');
        if (swatchBtn) {
            swatchBtn.style.transition = 'transform 0.15s ease';
            swatchBtn.style.transform  = 'scale(1.25)';
        }

        // Stagger cells in
        requestAnimationFrame(() => {
            allCells.forEach(({ btn, delay }) => {
                setTimeout(() => {
                    btn.style.transition = `transform 0.28s cubic-bezier(0.34,1.3,0.64,1), opacity 0.2s ease`;
                    btn.style.transform  = 'scale(1)';
                    btn.style.opacity    = '1';
                }, delay);
            });
        });
    }

    function closePalette() {
        const overlay = document.getElementById('inner-palette-overlay');
        if (overlay) {
            const cells   = [...overlay.querySelectorAll('.ipc')];
            const maxDist = (PAL_ROWS - 1) + (PAL_COLS - 1);

            // 1. X fades out first
            const closeBtn = overlay.querySelector('.ipc-close');
            if (closeBtn) {
                closeBtn.style.transition = 'opacity 0.1s ease';
                closeBtn.style.opacity    = '0';
            }

            // 2. All other cells wave-collapse (bottom-left last, mirroring the open)
            cells.forEach((btn) => {
                if (btn.classList.contains('ipc-close')) return;
                const i   = [...overlay.children].indexOf(btn);
                const row = Math.floor(i / PAL_COLS);
                const col = i % PAL_COLS;
                const rowsFromBottom = PAL_ROWS - 1 - row;
                const dist  = rowsFromBottom + col;
                const delay = (maxDist - dist) * 18 + 80; // 80ms offset after X fades
                btn.style.transition = `transform 0.16s ease ${delay}ms, opacity 0.14s ease ${delay}ms`;
                btn.style.transform  = 'scale(0)';
                btn.style.opacity    = '0';
            });

            // 3. After cells are gone, restore swatch button then let CSS take over
            const totalMs = maxDist * 18 + 80 + 220;
            setTimeout(() => {
                overlay.remove();
                const swatchBtn = document.getElementById('color-swatch-btn');
                if (swatchBtn) {
                    swatchBtn.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
                    swatchBtn.style.transform  = 'scale(1)';
                    setTimeout(() => {
                        swatchBtn.style.transform  = '';
                        swatchBtn.style.transition = '';
                    }, 280);
                }
            }, totalMs);
        }
        paletteOpen = false;
    }


    // ─── Build prescreen ──────────────────────────────────────────────────────
    function buildPrescreen(number) {
        stampNumber = number;

        const el = document.createElement('div');
        el.id = 'prescreen';
        el.innerHTML = `
            <!-- Stamp centered -->
            <div class="stamp-wrapper" id="stamp-wrapper">
                <div class="stamp-outline-svg" id="stamp-outline-svg">
                    ${makeOutlineSVG(STAMP_W, STAMP_H, activeOutlineColor)}
                </div>
                <div class="stamp-inner-area" id="stamp-inner-area">
                    <div class="stamp-inner-sq" id="stamp-inner-sq"
                         style="background:${activeInnerColor}"></div>
                    <img class="stamp-selected-img" id="stamp-selected-img"
                         src="${DEFAULT_IMG.full}" alt="">
                    <div class="drop-hint">drag here</div>
                    <button class="color-swatch-btn" id="color-swatch-btn"
                            title="Pick color"
                            style="background:${activeInnerColor}"></button>
                </div>
                <div class="stamp-number">${number}</div>
                <input class="stamp-name-input" id="stamp-name-input"
                       type="text" placeholder="Your name"
                       maxlength="28" autocomplete="off" spellcheck="false">
            </div>

            <!-- Enter button below stamp -->
            <div class="stamp-enter-wrap" id="stamp-enter-wrap">
                <button class="stamp-enter-btn" id="prescreen-enter">enter</button>
            </div>
        `;

        document.body.prepend(el);

        // Remove the loading shield — prescreen now covers the page
        const s = document.getElementById('prescreen-init-shield');
        if (s) s.remove();

        // Scatter icons
        requestAnimationFrame(() => scatterIcons(el, DEFAULT_IMG.id));

        return el;
    }

    // ─── Reveal ───────────────────────────────────────────────────────────────
    function revealPrescreen() {
        document.getElementById('stamp-wrapper').classList.add('stamp-appear');
        setTimeout(() => {
            document.getElementById('stamp-enter-wrap').classList.add('enter-appear');
        }, 400);
    }

    // ─── Enter button SVG ─────────────────────────────────────────────────────
    function initEnterButton() {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const btn = document.getElementById('prescreen-enter');
            if (!btn) return;
            const r  = btn.getBoundingClientRect();
            const w  = r.width, h = r.height, rx = 4;
            const m  = 0.75; // inset margin

            const PL = 100;
            const hw = w / 2;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('stamp-enter-svg');
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

            // Custom path starting at top-center going clockwise back to top-center.
            // This means dashoffset animation naturally draws FROM top-center.
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('stamp-enter-rect');
            path.setAttribute('d',
                `M ${hw} ${m}` +
                ` H ${w - rx - m} A ${rx} ${rx} 0 0 1 ${w - m} ${rx + m}` +
                ` V ${h - rx - m} A ${rx} ${rx} 0 0 1 ${w - rx - m} ${h - m}` +
                ` H ${rx + m} A ${rx} ${rx} 0 0 1 ${m} ${h - rx - m}` +
                ` V ${rx + m} A ${rx} ${rx} 0 0 1 ${rx + m} ${m}` +
                ` H ${hw}`
            );
            path.setAttribute('pathLength', String(PL));

            // At rest: full dash but pushed entirely off the path (nothing visible)
            path.style.strokeDasharray  = `${PL} ${PL}`;
            path.style.strokeDashoffset = String(PL);
            path.style.transition       = 'none';

            svg.appendChild(path);
            btn.appendChild(svg);

            btn.addEventListener('mouseenter', () => {
                path.style.transition       = `stroke-dashoffset 0.32s linear`;
                path.style.strokeDashoffset = '0';
            });

            btn.addEventListener('mouseleave', () => {
                path.style.transition       = `stroke-dashoffset 0.22s linear`;
                path.style.strokeDashoffset = String(PL);
            });
        }));
    }

    // ─── Exit ─────────────────────────────────────────────────────────────────
    function stampGenieOut(prescreen, cardData) {
        saveCard(cardData);
        saveCardToSupabase(cardData);

        const wrapper   = document.getElementById('stamp-wrapper');
        const enterWrap = document.getElementById('stamp-enter-wrap');

        // Enter button fades away cleanly
        const enterBtn = document.getElementById('prescreen-enter');
        if (enterBtn) {
            enterBtn.style.transition = 'opacity 0.3s ease';
            enterBtn.style.opacity    = '0';
        }

        // Close palette
        closePalette();

        // Everything fades simultaneously
        const FADE = '0.4s ease';
        document.querySelectorAll('.scatter-icon').forEach(icon => {
            icon.style.transition = `opacity ${FADE}`;
            icon.style.opacity    = '0';
        });

        if (wrapper) {
            wrapper.style.transition = `opacity ${FADE}`;
            wrapper.style.opacity    = '0';
        }

        // Wallpaper fades in after elements are gone
        setTimeout(() => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position:fixed;inset:0;z-index:100000;
                background-image:url('/images/lightmode.jpg');
                background-size:cover;background-position:center;
                opacity:0;pointer-events:none;
            `;
            document.body.appendChild(overlay);
            overlay.getBoundingClientRect();
            overlay.style.transition = 'opacity 0.8s ease';
            overlay.style.opacity    = '1';
            setTimeout(() => {
                prescreen.style.display = 'none';
                overlay.remove();
                signalBoot();
                document.addEventListener('system:ready', () => {
                    buildDesktopWidget(cardData);
                }, { once: true });
            }, 850);
        }, 500);
    }

    // ─── Desktop widget ───────────────────────────────────────────────────────
    function buildDesktopWidget(cardData) {
        const el = document.createElement('div');
        el.id = 'desktop-id-card';

        const inner   = cardData.innerColor   || INNER_COLORS[0];
        const outline = cardData.outlineColor || OUTLINE_COLORS[0];
        const imgSrc  = cardData.selectedImg  || DEFAULT_IMG.full;
        const widgetPat = cardData.patternId ? PATTERNS.find(p => p.id === cardData.patternId) || null : null;

        // Adaptive text colors — same logic as updateStampTextColor
        const outlineLight = isLightColor(outline);
        const textOnLight  = cardData.patternId === 'v-stripes' ? !outlineLight : outlineLight;
        const numColor     = textOnLight ? '#000' : '#fff';
        const nameColor    = textOnLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';

        el.innerHTML = `
            <div class="widget-stamp-wrap">
                <div class="widget-stamp-inner">
                    <div class="widget-stamp-inner-sq" style="background:${inner}"></div>
                    ${imgSrc ? `<img class="widget-stamp-img" src="${imgSrc}" alt=""
                                     onerror="this.style.display='none'">` : ''}
                </div>
                <div class="widget-stamp-outline">
                    ${makeOutlineSVG(86, 116, outline, widgetPat)}
                </div>
                <div class="widget-stamp-text">
                    <div class="widget-stamp-num" style="color:${numColor}">${cardData.stampNumber || '?'}</div>
                    <div class="widget-stamp-name" style="color:${nameColor}">${cardData.name || '—'}</div>
                </div>
            </div>
        `;

        document.body.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.classList.add('visible');
            makeDraggable(el);
        }));
        return el;
    }

    function makeDraggable(el) {
        let dragging = false;
        let ox = 0, oy = 0;

        function startDrag(clientX, clientY) {
            dragging = true;
            const r = el.getBoundingClientRect();
            // Switch transform-origin to top-left BEFORE changing to left-based positioning,
            // otherwise the scale anchor jumps and the element visually shifts.
            el.style.setProperty('transform-origin', 'top left',  'important');
            el.style.setProperty('right',            'auto',      'important');
            el.style.setProperty('left',             r.left + 'px', 'important');
            el.style.setProperty('top',              r.top  + 'px', 'important');
            el.style.setProperty('transition',       'none',      'important');
            el.style.cursor = 'grabbing';
            ox = clientX - r.left;
            oy = clientY - r.top;
        }

        function moveDrag(clientX, clientY) {
            if (!dragging) return;
            const maxX = window.innerWidth  - el.offsetWidth;
            const maxY = window.innerHeight - el.offsetHeight;
            el.style.setProperty('left', Math.max(0, Math.min(maxX, clientX - ox)) + 'px', 'important');
            el.style.setProperty('top',  Math.max(0, Math.min(maxY, clientY - oy)) + 'px', 'important');
        }

        function endDrag() {
            if (!dragging) return;
            dragging = false;
            el.style.cursor = 'grab';
        }

        // Mouse
        el.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
        });
        document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup',   endDrag);

        // Touch
        el.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
        }, { passive: false });
        document.addEventListener('touchmove', e => {
            if (!dragging) return;
            e.preventDefault();
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
        }, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    function initPrescreen(number) {
        const prescreen = buildPrescreen(number);

        // Stamp image speech bubble on hover
        const stampImg = document.getElementById('stamp-selected-img');
        const stampBubble = document.createElement('div');
        stampBubble.className = 'stamp-img-bubble';
        stampBubble.textContent = activeImgDef.id;
        document.getElementById('stamp-inner-area').appendChild(stampBubble);

        stampImg.addEventListener('mouseenter', () => {
            stampBubble.textContent = activeImgDef.id;
            stampBubble.classList.add('bubble-show');
        });
        stampImg.addEventListener('mouseleave', () => {
            stampBubble.classList.remove('bubble-show');
        });

        // Color swatch → palette
        document.getElementById('color-swatch-btn').addEventListener('click', e => {
            e.stopPropagation();
            togglePalette();
        });

        // Close palette on outside click
        prescreen.addEventListener('click', () => {
            if (paletteOpen) closePalette();
        });

        document.getElementById('prescreen-enter').addEventListener('click', () => {
            stampGenieOut(prescreen, {
                name:         document.getElementById('stamp-name-input').value.trim(),
                date:         new Date().toISOString().split('T')[0],
                innerColor:   activeInnerColor,
                outlineColor: activeOutlineColor,
                selectedImg:  activeImgDef.full,
                stampNumber,
                patternId:    activePattern?.id || null,
            });
        });

        initEnterButton();
        requestAnimationFrame(() => setTimeout(revealPrescreen, 80));
    }

    // ─── Entry point ─────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const saved = loadSavedCard();
        if (saved) {
            // Returning visitor: fade shield away, no prescreen shown
            const s = document.getElementById('prescreen-init-shield');
            if (s) {
                s.style.transition = 'opacity 0.35s ease';
                s.style.opacity    = '0';
                setTimeout(() => s.remove(), 380);
            }
            signalBoot();
            document.addEventListener('system:ready', () => {
                buildDesktopWidget(saved);
            }, { once: true });
        } else {
            fetchStampNumber().then(n => initPrescreen(n));
        }
    });

    window.__stampRenderer = { makeOutlineSVG, PATTERNS };
})();