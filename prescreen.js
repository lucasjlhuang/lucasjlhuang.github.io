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
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'apikey':        SUPABASE_ANON,
                    'Authorization': `Bearer ${SUPABASE_ANON}`,
                    'Prefer':        'return=representation',
                },
                body: JSON.stringify({
                    name:          cardData.name        || null,
                    visit_date:    cardData.date        || null,
                    card_color:    cardData.innerColor  || null,
                    border_color:  cardData.outlineColor|| null,
                    character_svg: cardData.selectedImg || null,
                    stamp_number:  cardData.stampNumber || null,
                    pattern_id:    cardData.patternId   || null,
                }),
            });
            if (res.ok) {
                const rows = await res.json();
                return rows[0]?.id ?? null;
            }
        } catch (err) { console.warn('Stamp upload failed:', err); }
        return null;
    }

    async function updateCardInSupabase(rowId, cardData) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${rowId}`, {
                method: 'PATCH',
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
                    pattern_id:    cardData.patternId   || null,
                }),
            });
        } catch (err) { console.warn('Stamp update failed:', err); }
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
            // objectBoundingBox: tile = 100% of bounding box → always exactly 1 tile,
            // immune to GPU compositing-layer rasterisation at fractional scales.
            // Content coords remain in user space (0–124 × 0–167) — no visual change.
            'v-stripes': `<pattern id="${id}" width="1" height="1" patternUnits="objectBoundingBox">
                     <rect width="62" height="167" fill="${f}"/>
                     <rect x="62" y="0" width="62" height="167" fill="${markColor}"/>
                   </pattern>`,
            'h-stripes': `<pattern id="${id}" width="1" height="1" patternUnits="objectBoundingBox">
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
    let stamp1Row          = null; // cached Supabase row for stamp #1

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

    async function fetchStamp1() {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/${TABLE}?stamp_number=eq.1&select=*&limit=1`,
                { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
            );
            if (res.ok) {
                const rows = await res.json();
                if (rows.length) stamp1Row = rows[0];
            }
        } catch { /* silent — stamp1Row stays null */ }
    }

    // ─── Continuous-carousel constants & state ───────────────────────────────
    const _CS_TILE      = 50;
    const _CS_GAP       = 8;
    const _CS_INNER_SQ  = 122;
    const _CS_STEP      = _CS_TILE + _CS_GAP;               // 58px
    const _CS_REEL_LEFT = (_CS_INNER_SQ - _CS_TILE) / 2;   // 36px — centres first tile
    const _CS_RADIUS    = 8;
    const _CS_BORDER    = '1.5px solid rgba(0,0,0,0.08)';
    const _CS_BG        = '#FFFFFF';
    const _CS_SPIN_DUR  = 0.28;                             // seconds per tile

    let _carouselReel   = null;
    let _carouselActive = false;
    let _carouselPool   = [];    // shuffle pool — no repeat images
    let _topoOverlay    = null;  // loading-topo SVG element while active

    // ─── Topo SVG DrawSVG overlay ─────────────────────────────────────────────
    // Fetches /images/loading-topo.svg, injects it into stamp-wrapper, and
    // animates all paths drawing from 0→100% over totalDuration seconds.
    function startTopoDrawing(totalDuration) {
        if (typeof DrawSVGPlugin === 'undefined') return;
        gsap.registerPlugin(DrawSVGPlugin);

        fetch('/images/loading-topo.svg')
            .then(r => r.text())
            .then(text => {
                const tmp = document.createElement('div');
                tmp.innerHTML = text;
                const svg = tmp.querySelector('svg');
                if (!svg) return;

                // Remove white background rect (keep paths + defs intact)
                svg.querySelectorAll('rect').forEach(r => {
                    if (!r.closest('mask, clipPath') && r.getAttribute('fill') !== 'none')
                        r.remove();
                });


                // Replace the outer clipPath with a donut so the topo only renders
                // in the stamp's border frame + bottom section, never over the inner
                // square where the carousel lives. Must use createElementNS — innerHTML
                // on an SVG node uses the HTML parser and produces non-SVG elements
                // that browsers silently ignore as clip geometry.
                // stamp-inner-area: left:13 top:13 width:122 height:122 → x:13-135, y:13-135
                const NS     = 'http://www.w3.org/2000/svg';
                const clipEl = svg.querySelector('clipPath');
                if (clipEl) {
                    const donut = document.createElementNS(NS, 'path');
                    donut.setAttribute('fill-rule', 'evenodd');
                    donut.setAttribute('d', 'M0,0 H149 V200 H0 Z M13,13 H135 V135 H13 Z');
                    while (clipEl.firstChild) clipEl.removeChild(clipEl.firstChild);
                    clipEl.appendChild(donut);
                }

                // z-index 3, appended to stamp-wrapper after stamp-outline-svg:
                //   • DOM order makes topo render above the outline fill (both z:3) → visible in frame ✓
                //   • stamp-number / stamp-name-input are z:4 → render above topo ✓
                //   • stamp-inner-area is z:1 → below topo, but the donut clip means
                //     topo never paints over the inner square / carousel ✓
                svg.style.cssText = 'position:absolute;top:0;left:0;width:149px;height:200px;pointer-events:none;z-index:3;';
                const stampWrapper = document.getElementById('stamp-wrapper');
                if (!stampWrapper) return;
                stampWrapper.appendChild(svg);
                _topoOverlay = svg;

                // Target only the stroked topo paths (not the clip/mask helper geometry)
                const maskedG   = svg.querySelector('g[mask]');
                const drawPaths = maskedG
                    ? maskedG.querySelectorAll('path')
                    : svg.querySelectorAll('path');

                gsap.set(drawPaths, { drawSVG: '0%' });

                const n            = drawPaths.length;        // 20
                const pathDuration = totalDuration * 0.6;
                const staggerEach  = (totalDuration - pathDuration) / Math.max(n - 1, 1);

                gsap.to(drawPaths, {
                    drawSVG:  '100%',
                    duration: pathDuration,
                    ease:     'none',
                    stagger:  { each: staggerEach, from: 'edges' },
                });
            })
            .catch(e => console.warn('loading-topo.svg failed:', e));
    }

    function removeTopoOverlay() {
        if (!_topoOverlay) return;
        const el = _topoOverlay;
        _topoOverlay = null;
        gsap.to(el, {
            opacity: 0, duration: 0.3, ease: 'power2.in',
            onComplete() { if (el.parentNode) el.parentNode.removeChild(el); },
        });
    }

    function reverseTopoDrawing(onComplete) {
        if (!_topoOverlay) { if (onComplete) onComplete(); return; }
        if (typeof DrawSVGPlugin === 'undefined') { removeTopoOverlay(); if (onComplete) onComplete(); return; }
        const el = _topoOverlay;
        _topoOverlay = null;

        const maskedG   = el.querySelector('g[mask]');
        const drawPaths = maskedG ? maskedG.querySelectorAll('path') : el.querySelectorAll('path');
        const n         = drawPaths.length;
        const revDur    = 0.2;
        const staggerEa = 0.035;

        gsap.to(drawPaths, {
            drawSVG:  '0%',
            duration: revDur,
            ease:     'power2.in',
            stagger:  { each: staggerEa, from: 'start' },
            onComplete() {
                if (el.parentNode) el.parentNode.removeChild(el);
                if (onComplete) onComplete();
            },
        });
    }

    // ─── Apply image (colors stay independent) ────────────────────────────────
    function applyImageToStamp(imgDef, skipAnim = false) {
        selectedImgDef = imgDef;
        const imgEl = document.getElementById('stamp-selected-img');
        if (!imgEl) return;

        if (skipAnim || typeof gsap === 'undefined') {
            imgEl.src = imgDef.full;
            return;
        }

        const wasEmpty = imgEl.getAttribute('src') === '';
        stampCarouselSwap(imgEl, imgDef, wasEmpty);
    }

    // ─── Carousel animation ───────────────────────────────────────────────────
    // Scrolls a reel of 50×50 tiles through the inner-area viewport.
    function stampCarouselSwap(imgEl, targetDef, wasEmpty = false) {
        const innerArea = document.getElementById('stamp-inner-area');
        if (!innerArea) { imgEl.src = targetDef.full; return; }

        // Clean up any hover-shrink state
        const hoverTile = innerArea.querySelector('.hover-ready-tile');
        if (hoverTile) hoverTile.remove();
        gsap.killTweensOf(imgEl);
        imgEl.style.opacity = '0';
        gsap.set(imgEl, { clearProps: 'scale,borderRadius' });

        const INNER_SQ  = 122;
        const TILE      = 50;
        const GAP       = 8;
        const STEP      = TILE + GAP;              // 58px scroll per tile
        const REEL_LEFT = (INNER_SQ - TILE) / 2;  // 36px — centers first tile in viewport
        const RADIUS    = 8;
        const BORDER    = '1.5px solid rgba(0,0,0,0.08)';
        const BG        = '#f5f5f5';
        const N_INTER   = 5;

        const curSrc = imgEl.getAttribute('src') || '';
        const pool = STAMP_IMAGES.filter(img => img.id !== targetDef.id && img.full !== curSrc);
        const intermediates = [...pool].sort(() => Math.random() - 0.5).slice(0, N_INTER);

        const items = [
            wasEmpty ? { type: 'white' } : { type: 'img', src: curSrc },
            ...intermediates.map(i => ({ type: 'img', src: i.full })),
            { type: 'img', src: targetDef.full },
        ];
        const totalTiles = items.length;

        // Build reel — tiles in a flex row; offset so tile 0 is centred in viewport
        const reel = document.createElement('div');
        reel.style.cssText = `
            position:absolute;
            top:0; left:${REEL_LEFT}px; height:${INNER_SQ}px;
            display:flex; align-items:center; gap:${GAP}px;
            z-index:10; pointer-events:none;
            will-change:transform;
        `;

        const tileShared = `width:${TILE}px;height:${TILE}px;flex-shrink:0;box-sizing:border-box;border-radius:${RADIUS}px;border:${BORDER};background:${BG};`;
        items.forEach(item => {
            if (item.type === 'white') {
                const sq = document.createElement('div');
                sq.style.cssText = tileShared;
                reel.appendChild(sq);
            } else {
                const img = document.createElement('img');
                img.src = item.src;
                img.style.cssText = tileShared + `object-fit:cover;display:block;`;
                reel.appendChild(img);
            }
        });

        innerArea.appendChild(reel);

        const finalX = -(totalTiles - 1) * STEP;

        gsap.fromTo(reel,
            { x: 0 },
            {
                x: finalX,
                duration: 0.72,
                ease: 'power3.out',
                onComplete() {
                    if (reel.parentNode) reel.parentNode.removeChild(reel);
                    imgEl.src = targetDef.full;
                    imgEl.style.opacity = '1';
                    // Spring from carousel tile size to full square
                    gsap.fromTo(imgEl,
                        { scale: TILE / INNER_SQ },  // ~0.41
                        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
                    );
                },
            }
        );
    }

    // ─── Continuous carousel (intro sequence) ────────────────────────────────
    function _buildCarouselTile(src) {
        const shared = `width:${_CS_TILE}px;height:${_CS_TILE}px;flex-shrink:0;box-sizing:border-box;border-radius:${_CS_RADIUS}px;border:${_CS_BORDER};background:${_CS_BG};`;
        if (!src) {
            const d = document.createElement('div');
            d.style.cssText = shared;
            return d;
        }
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = shared + `object-fit:cover;display:block;`;
        return img;
    }

    function _initCarouselPool(excludeId) {
        _carouselPool = STAMP_IMAGES
            .filter(img => img.id !== excludeId)
            .sort(() => Math.random() - 0.5);
    }

    function _carouselAppendRandom() {
        if (!_carouselReel) return;
        if (_carouselPool.length === 0) _initCarouselPool();
        const def = _carouselPool.pop();
        _carouselReel.appendChild(_buildCarouselTile(def.full));
    }

    function _carouselGetX() {
        return _carouselReel ? (Number(gsap.getProperty(_carouselReel, 'x')) || 0) : 0;
    }

    function _carouselSpinStep() {
        if (!_carouselActive || !_carouselReel) return;
        const currentIdx = Math.round(Math.abs(_carouselGetX()) / _CS_STEP);
        const tilesAhead = _carouselReel.children.length - currentIdx - 1;
        if (tilesAhead < 8) {
            for (let i = 0; i < 8; i++) _carouselAppendRandom();
        }
        gsap.to(_carouselReel, {
            x: _carouselGetX() - _CS_STEP,
            duration: _CS_SPIN_DUR,
            ease: 'none',
            onComplete: _carouselSpinStep,
        });
    }

    function startContinuousCarousel(onSpinning) {
        const innerArea = document.getElementById('stamp-inner-area');
        if (!innerArea || typeof gsap === 'undefined') return;
        _carouselActive = false;
        if (_carouselReel) { _carouselReel.remove(); _carouselReel = null; }

        // Initialise the no-repeat pool, excluding the landing image
        _initCarouselPool('13');

        // White overlay fills the inner square; border makes it visible against white background
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:absolute;inset:0;background:#FFFFFF;box-sizing:border-box;border-radius:${_CS_RADIUS}px;border:${_CS_BORDER};z-index:11;pointer-events:none;transform-origin:center;`;
        innerArea.appendChild(overlay);

        // Build reel behind the overlay using the pool
        const reel = document.createElement('div');
        reel.className = 'carousel-reel';
        reel.style.cssText = `position:absolute;top:0;left:${_CS_REEL_LEFT}px;height:${_CS_INNER_SQ}px;display:flex;align-items:center;gap:${_CS_GAP}px;z-index:10;pointer-events:none;will-change:transform;`;
        reel.appendChild(_buildCarouselTile(null)); // white tile slot 0
        for (let i = 0; i < 12; i++) {
            if (_carouselPool.length === 0) _initCarouselPool('13');
            const def = _carouselPool.pop();
            reel.appendChild(_buildCarouselTile(def.full));
        }
        innerArea.appendChild(reel);
        gsap.set(reel, { x: 0 });
        _carouselReel = reel;

        // Slow, visible shrink so the white square is clearly seen contracting
        gsap.to(overlay, {
            scale: _CS_TILE / _CS_INNER_SQ, duration: 0.55, ease: 'power2.inOut',
            onComplete() {
                overlay.remove();
                _carouselActive = true;
                _carouselSpinStep();
                if (onSpinning) onSpinning();
            },
        });
    }

    function landCarousel(imgDef, onComplete) {
        _carouselActive = false;
        if (!_carouselReel) {
            const imgEl = document.getElementById('stamp-selected-img');
            if (imgEl) { imgEl.src = imgDef.full; imgEl.style.opacity = '1'; }
            if (onComplete) onComplete();
            return;
        }
        gsap.killTweensOf(_carouselReel);
        const fromX = _carouselGetX();
        // Add slowdown buffer then target tile
        for (let i = 0; i < 4; i++) _carouselAppendRandom();
        _carouselReel.appendChild(_buildCarouselTile(imgDef.full));
        const targetX = -(_carouselReel.children.length - 1) * _CS_STEP;

        gsap.fromTo(_carouselReel, { x: fromX }, {
            x: targetX, duration: 0.9, ease: 'power3.out',
            onComplete() {
                const reel = _carouselReel;
                _carouselReel = null;
                if (reel && reel.parentNode) reel.remove();
                const imgEl = document.getElementById('stamp-selected-img');
                if (imgEl) {
                    imgEl.src = imgDef.full;
                    imgEl.style.opacity = '1';
                    gsap.fromTo(imgEl,
                        { scale: _CS_TILE / _CS_INNER_SQ },
                        { scale: 1, duration: 0.3, ease: 'back.out(2)',
                          onComplete: () => { if (onComplete) onComplete(); } }
                    );
                } else {
                    if (onComplete) onComplete();
                }
            },
        });
    }

    // ─── Apply colors ─────────────────────────────────────────────────────────
    function applyInnerColor(color) {
        activeInnerColor = color;
        const sq = document.getElementById('stamp-inner-sq');
        if (sq) sq.style.background = '#FFFFFF'; // inner square is always white
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
    function scatterIcons(prescreen, skipId, onDone) {
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

        const scatterIcons = [];
        toScatter.forEach(imgDef => {
            let pos, attempts = 0;
            do {
                pos = samplePos();
                attempts++;
            } while (overlaps(pos.x, pos.y) && attempts < 300);

            placed.push({ x: pos.x, y: pos.y, w: ICON_SIZE, h: ICON_SIZE });
            scatterIcons.push(createIcon(prescreen, imgDef, pos.x, pos.y));
        });

        // Entrance animation — GSAP if available, CSS fallback otherwise
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(scatterIcons,
                { scale: 0.5, opacity: 0 },
                {
                    scale:    1,
                    opacity:  1,
                    duration: 0.5,
                    ease:     'power2.out',
                    stagger:  { amount: 0.4, from: 'random' },
                    onComplete() {
                        scatterIcons.forEach(el => el.classList.add('icon-appear'));
                        gsap.set(scatterIcons, { clearProps: 'transform,opacity' });
                        if (onDone) onDone();
                    },
                }
            );
        } else {
            scatterIcons.forEach((icon, i) => {
                setTimeout(() => icon.classList.add('icon-appear'), i * 22);
            });
            if (onDone) onDone();
        }
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
        let wasOver = false; // tracks drop-zone hover to fire enter/leave once

        function startDrag(clientX, clientY) {
            dragging = true;
            const r = icon.getBoundingClientRect();
            ox = clientX - r.left;
            oy = clientY - r.top;
            icon.style.zIndex    = '9000';
            icon.style.transform = 'scale(1.12)';
            icon.style.boxShadow = '0 8px 24px rgba(0,0,0,0.22)';
            icon.style.opacity   = '1';
            const bub = icon.querySelector('.icon-bubble');
            if (bub) bub.style.display = 'none';
            document.body.classList.add('is-dragging');
        }

        function moveDrag(clientX, clientY) {
            if (!dragging) return;
            icon.style.left = (clientX - ox) + 'px';
            icon.style.top  = (clientY - oy) + 'px';
            const dropTarget = document.getElementById('stamp-inner-area');
            if (!dropTarget) return;

            const dr   = dropTarget.getBoundingClientRect();
            const over = clientX >= dr.left && clientX <= dr.right &&
                         clientY >= dr.top  && clientY <= dr.bottom;
            dropTarget.classList.toggle('drop-hover', over);

            // Never show the large preview — we use shrink-to-tile instead
            const preview = document.getElementById('stamp-preview-img');
            if (preview) preview.style.display = 'none';

            const selectedImg = document.getElementById('stamp-selected-img');

            if (over && !wasOver) {
                // ── Entered drop zone ── shrink current state to carousel tile
                wasOver = true;
                const hasImg = selectedImg && selectedImg.getAttribute('src') !== '';
                if (hasImg) {
                    gsap.to(selectedImg, {
                        scale: 50 / 122, borderRadius: '8px',
                        duration: 0.22, ease: 'back.out(1.8)', overwrite: true,
                    });
                } else {
                    // No image — pop in a white tile to show "ready to cycle"
                    if (!dropTarget.querySelector('.hover-ready-tile')) {
                        const hoverTile = document.createElement('div');
                        hoverTile.className = 'hover-ready-tile';
                        hoverTile.style.cssText = `
                            position:absolute;inset:0;display:flex;
                            align-items:center;justify-content:center;
                            z-index:5;pointer-events:none;
                        `;
                        const sq = document.createElement('div');
                        sq.style.cssText = `
                            width:50px;height:50px;background:#f5f5f5;
                            border-radius:8px;border:1.5px solid rgba(0,0,0,0.08);
                        `;
                        hoverTile.appendChild(sq);
                        dropTarget.appendChild(hoverTile);
                        gsap.fromTo(hoverTile,
                            { opacity: 0, scale: 0.7 },
                            { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(1.5)' }
                        );
                    }
                }
            } else if (!over && wasOver) {
                // ── Left drop zone ── restore
                wasOver = false;
                const hasImg = selectedImg && selectedImg.getAttribute('src') !== '';
                if (hasImg) {
                    gsap.to(selectedImg, {
                        scale: 1, borderRadius: '0px',
                        duration: 0.22, ease: 'power2.out', overwrite: true,
                    });
                }
                const hoverTile = dropTarget.querySelector('.hover-ready-tile');
                if (hoverTile) {
                    gsap.to(hoverTile, {
                        opacity: 0, scale: 0.7, duration: 0.15, ease: 'power2.in',
                        onComplete: () => hoverTile.remove(),
                    });
                }
            }
        }

        function endDrag(clientX, clientY) {
            if (!dragging) return;
            dragging = false;
            wasOver  = false;
            document.body.classList.remove('is-dragging');
            icon.style.zIndex    = '50';
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = '';

            const preview = document.getElementById('stamp-preview-img');
            if (preview) preview.style.display = 'none';

            const dropTarget  = document.getElementById('stamp-inner-area');
            const selectedImg = document.getElementById('stamp-selected-img');
            if (dropTarget) {
                const dr   = dropTarget.getBoundingClientRect();
                const over = clientX >= dr.left && clientX <= dr.right &&
                             clientY >= dr.top  && clientY <= dr.bottom;
                if (over) {
                    // Dropped — carousel handles all state restoration
                    const bub = icon.querySelector('.icon-bubble');
                    if (bub) bub.style.display = 'none';
                    if (activeIconEl && activeIconEl !== icon) {
                        respawnIcon(prescreen, activeIconEl);
                    }
                    icon.style.opacity       = '0';
                    icon.style.pointerEvents = 'none';
                    activeIconEl = icon;
                    activeImgDef = imgDef;
                    applyImageToStamp(imgDef);
                } else {
                    // Not dropped — restore hover state and icon
                    const hoverTile = dropTarget.querySelector('.hover-ready-tile');
                    if (hoverTile) hoverTile.remove();
                    if (selectedImg) {
                        gsap.killTweensOf(selectedImg);
                        gsap.to(selectedImg, {
                            scale: 1, borderRadius: '0px', opacity: 1,
                            duration: 0.22, ease: 'power2.out',
                        });
                    }
                    const bub = icon.querySelector('.icon-bubble');
                    if (bub) bub.style.display = '';
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

        const bub = icon.querySelector('.icon-bubble');
        if (bub) bub.style.display = '';
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
        const textOnLight  = activePattern?.id === 'v-stripes' ? !outlineLight
                           : (activePattern?.id === 'dots' && outlineLight) ? false
                           : outlineLight;

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

        // Remove any stale prescreen element so a second edit visit starts clean
        document.querySelectorAll('#prescreen').forEach(existing => existing.remove());

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
                         src="" alt="">
                    <img class="stamp-preview-img" id="stamp-preview-img"
                         src="" alt="">
                    <button class="color-swatch-btn" id="color-swatch-btn"
                            title="Pick color"
                            style="background:${activeInnerColor}"></button>
                </div>
                <div class="stamp-number">${number}</div>
                <input class="stamp-name-input" id="stamp-name-input"
                       type="text" placeholder="Your name"
                       maxlength="28" autocomplete="off" spellcheck="false">
            </div>

            <!-- Cycle word above stamp -->
            <div id="stamp-cycle-word" class="stamp-cycle-word"></div>

            <!-- Enter button below stamp -->
            <div class="stamp-enter-wrap" id="stamp-enter-wrap">
                <button class="stamp-enter-btn" id="prescreen-enter">enter</button>
            </div>
        `;

        document.body.prepend(el);

        // Remove the loading shield — prescreen now covers the page
        const s = document.getElementById('prescreen-init-shield');
        if (s) s.remove();

        // Scatter icons deferred — triggered later by showStampBubbles

        return el;
    }

    // ─── Random name pool for cycles ─────────────────────────────────────────
    const RANDOM_NAMES = [
        'Alex','Jordan','Sam','Taylor','Casey','Riley','Morgan','Jamie',
        'Quinn','Avery','Reese','Skyler','Dakota','Emery','Finley',
    ];

    // ─── 3 randomization cycles with GSAP ────────────────────────────────────
    function runRandomCycles(onDone) {
        const wrapper = document.getElementById('stamp-wrapper');
        const wordEl  = document.getElementById('stamp-cycle-word');
        const words   = ['Lucas', 'Lee', 'Huang'];
        let count = 0;

        // Suppress CSS transition so GSAP controls motion cleanly
        wrapper.style.transition = 'none';
        gsap.set(wordEl, { xPercent: -50, opacity: 0, scale: 1, y: 0 });

        // Stamp stays white during the entire loading sequence (topo drawn via SVG overlay)
        applyInnerColor('#FFFFFF');
        applyOutlineColor(OUTLINE_COLORS[0]);
        applyPattern(null);

        function applySwap(mode) {
            const numEl  = document.querySelector('.stamp-number');
            const nameEl = document.getElementById('stamp-name-input');

            if (mode === 'lucas') {
                // Number spins down from invisible "0" to "1"; name fades in typing
                if (numEl)  spinNumber(numEl, '1');
                if (nameEl) { setTimeout(() => typewriteName(nameEl, 'Lucas', ''), 200); gsap.fromTo(nameEl, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out', delay: 0.2 }); }
            } else if (mode === 'lee') {
                if (nameEl) typewriteName(nameEl, 'Lucas Lee', 'Lucas');
            } else if (mode === 'huang') {
                if (nameEl) typewriteName(nameEl, 'Lucas Lee Huang', 'Lucas Lee');
                if (numEl)  numEl.textContent = '1';
            } else if (mode === 'reset') {
                removeTopoOverlay();
                const imgEl = document.getElementById('stamp-selected-img');
                if (imgEl) imgEl.src = '';
                applyInnerColor('#FFFFFF');
                applyOutlineColor(OUTLINE_COLORS[0]);
                applyPattern(null);
                if (nameEl) nameEl.value = '';
                if (numEl)  { numEl.textContent = stampNumber != null ? stampNumber : ''; numEl.style.opacity = '0'; }
                if (nameEl) nameEl.style.opacity = '0';
                const paletteBtn = document.getElementById('color-swatch-btn');
                if (paletteBtn) { paletteBtn.style.opacity = '0'; }
            }
        }

        let _typeTimer = null;
        function typewriteName(el, target, from) {
            if (_typeTimer) clearInterval(_typeTimer);
            // Set first new character immediately so it's visible on the same frame
            // that opacity becomes 1 — eliminates the empty-input flash
            let i = from.length < target.length ? from.length + 1 : from.length;
            el.value = target.slice(0, i);
            if (i >= target.length) return;
            _typeTimer = setInterval(() => {
                if (i < target.length) {
                    el.value = target.slice(0, ++i);
                } else {
                    clearInterval(_typeTimer);
                    _typeTimer = null;
                }
            }, 55);
        }

        // Slot-machine spin: reel has "1" (top) and "0" invisible (bottom).
        // Reel starts at y = -lineH (clip shows invisible "0"), scrolls down
        // to y = 0 (clip shows "1"). "0" is never seen.
        function spinNumber(el, target) {
            const lineH = el.offsetHeight || 15;
            el.style.overflow = 'hidden';
            el.style.height   = lineH + 'px';
            el.style.opacity  = '1';
            el.innerHTML      = '';

            const reel = document.createElement('div');
            reel.style.willChange = 'transform';

            const rowTarget = document.createElement('div');   // "1" — shown at end
            rowTarget.textContent = target;
            rowTarget.style.cssText = `height:${lineH}px;line-height:${lineH}px;`;

            const rowFrom = document.createElement('div');     // "0" — invisible, shown at start
            rowFrom.textContent = '0';
            rowFrom.style.cssText = `height:${lineH}px;line-height:${lineH}px;opacity:0;`;

            reel.appendChild(rowTarget);  // index 0 — enters from above when reel scrolls down
            reel.appendChild(rowFrom);    // index 1 — starts in clip window (invisible)
            el.appendChild(reel);

            gsap.fromTo(reel,
                { y: -lineH },   // clip shows row 1 ("0" invisible)
                {
                    y: 0,        // clip shows row 0 ("1")
                    duration: 0.45,
                    ease: 'power3.out',
                    onComplete() {
                        el.innerHTML   = '';
                        el.textContent = target;
                        el.style.overflow = '';
                        el.style.height   = '';
                    },
                }
            );
        }

        function animateCycle(word, mode, cb, postReveal) {
            const tl = gsap.timeline({ onComplete: cb });
            if (mode === 'reset') {
                // ':)' — show word label, then reveal
                tl.call(() => { applySwap(mode); wordEl.textContent = word; })
                  .fromTo(wordEl,
                      { opacity: 0, y: 6 },
                      { opacity: 1, y: 0, duration: 0.26, ease: 'back.out(1.4)' }
                  )
                  .call(() => { if (postReveal) postReveal(); })
                  .to({}, { duration: 0.1 });
            } else {
                // Lucas / Lee / Huang — seamless, no words; carousel+topo do the visual work
                tl.call(() => applySwap(mode))
                  .call(() => { if (postReveal) postReveal(); })
                  .to({}, { duration: 0.8 });
            }
        }

        function runResetAnimations() {
            const numEl      = document.querySelector('.stamp-number');
            const nameEl     = document.getElementById('stamp-name-input');
            const paletteBtn = document.getElementById('color-swatch-btn');
            const FROM = { opacity: 0, y: 7 };
            if (numEl)  gsap.fromTo(numEl,  FROM, { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' });
            if (nameEl) gsap.fromTo(nameEl, FROM, { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', delay: 0.08 });
            if (paletteBtn) {
                gsap.fromTo(paletteBtn,
                    FROM,
                    { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', delay: 0.16,
                      onComplete() { paletteBtn.style.pointerEvents = ''; } }
                );
            }
        }

        function getLandingImgDef() {
            return STAMP_IMAGES.find(img => img.id === '13') || STAMP_IMAGES[0];
        }

        function next() {
            if (count >= 3) {
                gsap.set(wrapper, { clearProps: 'transform,opacity,filter' });
                wrapper.style.transition = '';

                // Gate scatter icons until both ':)' timeline and reverse draw finish
                let reverseDone = false;
                let cycleDone   = false;
                function checkBothDone() { if (reverseDone && cycleDone && onDone) onDone(); }

                reverseTopoDrawing(() => { reverseDone = true; checkBothDone(); });
                setTimeout(() => animateCycle(':)', 'reset',
                    () => { cycleDone = true; checkBothDone(); },
                    runResetAnimations
                ), 300);
                return;
            }
            const modeMap = ['lucas', 'lee', 'huang'];
            const word = words[count];
            const mode = modeMap[count];
            count++;
            if (mode === 'huang') {
                const savedCard = loadSavedCard();
                if (savedCard) {
                    animateCycle(word, mode, () => {
                        landCarousel(getLandingImgDef(), () => bootZoom(savedCard));
                    });
                } else {
                    animateCycle(word, mode, () => {
                        landCarousel(getLandingImgDef(), () => setTimeout(next, 300));
                    });
                }
            } else {
                animateCycle(word, mode, next);
            }
        }
        next();
    }

    // ─── Stamp hint bubbles ───────────────────────────────────────────────────
    // ─── Proximity effect for scatter icons ──────────────────────────────────
    function setupIconProximity(prescreen) {
        const RADIUS   = 120;
        const STRENGTH = 10;

        function onMove(e) {
            if (document.body.classList.contains('is-dragging')) return;
            const mx = e.clientX, my = e.clientY;

            prescreen.querySelectorAll('.scatter-icon').forEach(icon => {
                if (icon.style.zIndex === '9000') return;
                const r  = icon.getBoundingClientRect();
                const cx = r.left + r.width  / 2;
                const cy = r.top  + r.height / 2;
                const d  = Math.hypot(mx - cx, my - cy);

                if (d < RADIUS && d > 0) {
                    const t  = 1 - d / RADIUS;
                    const nx = (mx - cx) / d;
                    const ny = (my - cy) / d;
                    gsap.to(icon, { x: nx * STRENGTH * t, y: ny * STRENGTH * t, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
                } else {
                    gsap.to(icon, { x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
                }
            });
        }

        prescreen.addEventListener('mousemove', onMove, { passive: true });

        document.addEventListener('prescreen:done', () => {
            prescreen.removeEventListener('mousemove', onMove);
        }, { once: true });
    }

    function setupStampTilt(prescreen) {
        if (typeof gsap === 'undefined') return;

        const TILT_MAX      = 20;
        const PAN           = 12;
        const SHADOW_FACTOR = 0.22;
        const SHADOW_BLUR   = 12;
        const SHADOW_BASE_Y = 4;
        const SHADOW_COLOR  = 'rgba(0,0,0,0.11)';

        const wrapper = document.getElementById('stamp-wrapper');

        function getTargets() {
            return [
                wrapper,
                document.getElementById('stamp-enter-wrap'),
                ...document.querySelectorAll('.stamp-hint-bubble'),
            ].filter(Boolean);
        }

        function applyShadow(rx, ry) {
            if (!wrapper) return;
            const tiltMag = Math.sqrt(rx * rx + ry * ry) / TILT_MAX;
            const sx   = (-ry * SHADOW_FACTOR).toFixed(2);
            const sy   = (rx * SHADOW_FACTOR + SHADOW_BASE_Y).toFixed(2);
            const blur = (SHADOW_BLUR + tiltMag * 4).toFixed(1);
            wrapper.style.filter = `drop-shadow(${sx}px ${sy}px ${blur}px ${SHADOW_COLOR})`;
        }

        function onMove(e) {
            wrapper && (wrapper.style.transition = '');
            const hw = window.innerWidth  / 2;
            const hh = window.innerHeight / 2;
            const dx = e.clientX - hw;
            const dy = e.clientY - hh;
            const rx = -(Math.max(-1, Math.min(1, dy / hh))) * TILT_MAX;
            const ry =  (Math.max(-1, Math.min(1, dx / hw))) * TILT_MAX;
            const tx =  (Math.max(-1, Math.min(1, dx / hw))) * PAN;
            const ty =  (Math.max(-1, Math.min(1, dy / hh))) * PAN;
            gsap.to(getTargets(), { rotateX: rx, rotateY: ry, x: tx, y: ty, transformPerspective: 800, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
            applyShadow(rx, ry);
        }

        function onLeave() {
            gsap.to(getTargets(), { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
            if (wrapper) {
                wrapper.style.transition = 'filter 0.7s ease';
                wrapper.style.filter = `drop-shadow(0px ${SHADOW_BASE_Y}px ${SHADOW_BLUR}px ${SHADOW_COLOR})`;
            }
        }

        applyShadow(0, 0);

        prescreen.addEventListener('mousemove', onMove, { passive: true });
        prescreen.addEventListener('mouseleave', onLeave, { passive: true });

        document.addEventListener('prescreen:done', () => {
            prescreen.removeEventListener('mousemove', onMove);
            prescreen.removeEventListener('mouseleave', onLeave);
            gsap.set(getTargets(), { clearProps: 'rotateX,rotateY,x,y,transformPerspective' });
            if (wrapper) { wrapper.style.filter = ''; wrapper.style.transition = ''; }
        }, { once: true });
    }

    function bootZoom(savedCard) {
        const prescreen = document.getElementById('prescreen');
        const wrapper   = document.getElementById('stamp-wrapper');
        if (!wrapper) { signalBoot(); return; }

        _topoOverlay = null;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed;inset:0;z-index:100000;
            background-image:url('/images/lightmode.jpg');
            background-size:cover;background-position:center;
            opacity:0;pointer-events:none;
        `;
        document.body.appendChild(overlay);
        overlay.getBoundingClientRect();

        // Brief pause, then stamp fades; wallpaper follows 0.3s later
        gsap.to(wrapper, { scale: 0.93, opacity: 0, duration: 1.0, ease: 'sine.inOut', transformOrigin: '50% 50%', delay: 0.3 });
        overlay.style.transition = 'opacity 1.0s 0.6s ease';
        overlay.style.opacity    = '1';

        setTimeout(() => {
            const wp = document.querySelector('.wallpaper');
            if (wp) { wp.style.transition = 'none'; wp.style.opacity = '1'; }
            prescreen.style.display = 'none';
            overlay.remove();
            signalBoot();
            document.addEventListener('system:ready', () => {
                buildDesktopWidget(savedCard);
            }, { once: true });
        }, 1700);
    }

    function showStampBubbles() {
        const prescreen = document.getElementById('prescreen');
        const wordEl    = document.getElementById('stamp-cycle-word');
        const enterWrap = document.getElementById('stamp-enter-wrap');

        setupStampTilt(prescreen);

        // stamp-inner-sq  → 3px extra gap above; stamp-name-input → anchor to right edge (text is right-aligned)
        const targets = [
            { id: 'stamp-inner-sq',   text: 'drop it',        gap: 11 },
            { id: 'color-swatch-btn', text: 'personalize it',  gap: 8  },
            { id: 'stamp-name-input', text: 'sign it',         gap: 8, rightAlign: true, offsetX: -20 },
        ];

        function spawnBubbles() {
            const bubbles = targets.map(({ id, text, gap, rightAlign, offsetX = 0 }) => {
                const el = document.getElementById(id);
                if (!el) return null;
                const r   = el.getBoundingClientRect();
                const bub = document.createElement('div');
                bub.className   = 'stamp-hint-bubble';
                bub.textContent = text;
                // Right-aligned inputs: anchor to right edge so bubble sits over the visible text
                bub.style.left = ((rightAlign ? r.right : r.left + r.width / 2) + offsetX) + 'px';
                bub.style.top  = '0px';
                document.body.appendChild(bub);
                gsap.set(bub, { xPercent: -50 });
                const bubH = bub.offsetHeight;
                bub.style.top = (r.top - bubH - gap) + 'px';
                return bub;
            }).filter(Boolean);

            // Slower, gentle fade-in upward
            gsap.fromTo(bubbles,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power1.out', stagger: 0.2, delay: 0.2 }
            );

            // NPCs enter at t+1.5s
            setTimeout(() => document.dispatchEvent(new CustomEvent('prescreen:start-npcs')), 1500);

            // Bubbles leave at t+5s; enter button after
            setTimeout(() => {
                gsap.to(bubbles, {
                    y: -6, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.05,
                    onComplete: () => {
                        bubbles.forEach(b => b.remove());
                        if (enterWrap) enterWrap.classList.add('enter-appear');
                    },
                });
            }, 4250);
        }

        // Stamp is blank — scatter all images (no skip)
        scatterIcons(prescreen, null, () => {
            setupIconProximity(prescreen);
            // Icons loaded — brief pause, then slide "please :)" out, then bubbles
            setTimeout(() => {
                if (wordEl) {
                    gsap.to(wordEl, {
                        y: 18, opacity: 0, duration: 0.35, ease: 'power2.in',
                        onComplete: () => {
                            if (wordEl.parentNode) wordEl.remove();
                            spawnBubbles();
                        },
                    });
                } else {
                    spawnBubbles();
                }
            }, 300);
        });
    }

    // ─── Reveal ───────────────────────────────────────────────────────────────
    function revealPrescreen() {
        const wrapper = document.getElementById('stamp-wrapper');

        // Stamp starts blank — image, name, colours applied on first cycle ('Lucas')
        const initImgEl = document.getElementById('stamp-selected-img');
        if (initImgEl) initImgEl.src = '';

        // Hide number, name, and palette button — they reveal in the ':)' cycle
        const initNumEl = document.querySelector('.stamp-number');
        if (initNumEl)  initNumEl.style.opacity  = '0';
        const initNameEl2 = document.getElementById('stamp-name-input');
        if (initNameEl2) { initNameEl2.value = ''; initNameEl2.style.opacity = '0'; }
        const initPaletteBtn = document.getElementById('color-swatch-btn');
        if (initPaletteBtn) { initPaletteBtn.style.opacity = '0'; initPaletteBtn.style.pointerEvents = 'none'; }

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(wrapper,
                { scale: 0.5, opacity: 0 },
                {
                    scale:    1,
                    opacity:  1,
                    duration: 0.3,
                    ease:     'power2.out',
                    onComplete() {
                        wrapper.classList.add('stamp-appear');
                        gsap.set(wrapper, { clearProps: 'scale,opacity' });
                        // Begin drawing topo lines. Duration covers stamp-appear → end of Huang:
                        // 550ms pause + 550ms shrink + 300ms delay + 3×0.8s cycles + 0.9s land ≈ 4.7s
                        startTopoDrawing(4.7);
                        // Brief pause on blank stamp, then shrink+spin, then cycles
                        setTimeout(() => {
                            startContinuousCarousel(() => {
                                setTimeout(() => runRandomCycles(showStampBubbles), 300);
                            });
                        }, 550);
                    },
                }
            );
        } else {
            wrapper.classList.add('stamp-appear');
        }
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
    function stampGenieOut(prescreen, cardData, editMode = false) {
        if (editMode) {
            const rowId = loadSavedCard()?.rowId;
            saveCard({ ...cardData, rowId });
            if (rowId) updateCardInSupabase(rowId, cardData);
            // Cache locally — applied to all guestbook opens until Supabase propagates the update
            window.__gbUserCardOverride = {
                stamp_number:  cardData.stampNumber,
                card_color:    cardData.innerColor   || null,
                border_color:  cardData.outlineColor || null,
                character_svg: cardData.selectedImg  || null,
                pattern_id:    cardData.patternId    ?? null,
                name:          cardData.name         || null,
            };
        } else {
            saveCard(cardData);
            saveCardToSupabase(cardData).then(id => {
                if (id != null) saveCard({ ...cardData, rowId: id });
            });
        }

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

        if (editMode && typeof gsap !== 'undefined' && window.__openGuestBookFromEdit) {
            // ── Edit → guestbook grid transition ──────────────────────────────
            // Fade wallpaper in now so the desktop is ready when the prescreen closes
            const wallpaper = document.querySelector('.wallpaper');
            if (wallpaper) gsap.to(wallpaper, { opacity: 1, duration: 0.6, ease: 'power2.out' });

            const FADE = '0.4s ease';
            document.querySelectorAll('.scatter-icon').forEach(icon => {
                icon.style.transition = `opacity ${FADE}`;
                icon.style.opacity    = '0';
            });
            if (enterWrap) { enterWrap.style.transition = `opacity ${FADE}`; enterWrap.style.opacity = '0'; }

            // Start fetch immediately so cards are ready by the time ghost is created
            let pendingFirstCell = null;
            let pendingFlight    = null;
            window.__openGuestBookFromEdit(firstCell => {
                pendingFirstCell = firstCell;
                if (pendingFlight) pendingFlight(firstCell);
            }, cardData);

            // Build ghost after icons have faded
            setTimeout(() => {
                const stampW = STAMP_W, stampH = STAMP_H;
                const startX = window.innerWidth  / 2 - stampW / 2;
                const startY = window.innerHeight / 2 - stampH / 2;

                const ghost = document.createElement('div');
                ghost.style.cssText = `
                    position:fixed;
                    left:${startX}px; top:${startY}px;
                    width:${stampW}px; height:${stampH}px;
                    z-index:100020; pointer-events:none;
                `;

                // Use guestbook rendering so ghost matches the destination cell exactly
                if (window.__gbRenderer?.renderStampHTML) {
                    const gbCard = {
                        border_color:  activeOutlineColor,
                        card_color:    activeInnerColor,
                        character_svg: activeImgDef?.full || null,
                        stamp_number:  cardData.stampNumber || loadSavedCard()?.stampNumber,
                        name:          cardData.name || '',
                        pattern_id:    activePattern?.id || null,
                    };
                    ghost.innerHTML = window.__gbRenderer.renderStampHTML(gbCard);
                } else if (wrapper) {
                    const clone = wrapper.cloneNode(true);
                    clone.removeAttribute('id');
                    clone.style.cssText = `
                        position:absolute; left:50%; top:50%;
                        transform:translate(-50%,-50%);
                        width:${stampW}px; height:${stampH}px;
                        opacity:1; filter:none;
                    `;
                    ghost.appendChild(clone);
                }
                if (wrapper) wrapper.style.opacity = '0';
                document.body.appendChild(ghost);

                const startFlight = firstCell => {
                    const body     = firstCell.querySelector('.gb-stamp-body');
                    const destRect = (body || firstCell).getBoundingClientRect();
                    gsap.to(ghost, {
                        left: destRect.left, top: destRect.top,
                        duration: 0.75, ease: 'power3.inOut',
                        onComplete() {
                            // Show first cell instantly before removing ghost — seamless swap, no blink
                            if (body) gsap.set(body, { opacity: 1, y: 0 });
                            ghost.remove();
                            if (window.__triggerGuestBookGridStagger) window.__triggerGuestBookGridStagger();
                            // Cross-fade prescreen out as the guestbook grid comes in
                            gsap.to(prescreen, {
                                opacity: 0, duration: 0.4, ease: 'power2.in',
                                onComplete() {
                                    prescreen.remove();
                                    // Remove stale widget now; rebuild deferred until guestbook closes
                                    // so the entrance animation doesn't flash through the glassmorphism.
                                    const old = document.getElementById('desktop-id-card');
                                    if (old) old.remove();
                                    window.__pendingDesktopWidget = cardData;
                                }
                            });
                        },
                    });
                };

                if (pendingFirstCell) startFlight(pendingFirstCell);
                else                  pendingFlight = startFlight;
            }, 420);
            return;
        }

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

        if (editMode) {
            // Desktop already running — just close the prescreen and refresh widget
            setTimeout(() => {
                prescreen.remove();
                const old = document.getElementById('desktop-id-card');
                if (old) old.remove();
                buildDesktopWidget(cardData);
            }, 500);
        } else {
            // First visit — wallpaper fade-in + boot sequence
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
                    const wp = document.querySelector('.wallpaper');
                    if (wp) { wp.style.transition = 'none'; wp.style.opacity = '1'; }
                    prescreen.style.display = 'none';
                    overlay.remove();
                    signalBoot();
                    document.addEventListener('system:ready', () => {
                        buildDesktopWidget(cardData);
                    }, { once: true });
                }, 850);
            }, 500);
        }
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
        const textOnLight  = cardData.patternId === 'v-stripes' ? !outlineLight
                           : (cardData.patternId === 'dots' && outlineLight) ? false
                           : outlineLight;
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
            // Strip transform from transition after entrance so GSAP can control it freely
            setTimeout(() => { el.style.transition = 'opacity 1s ease'; }, 1050);
            // Only draggable on desktop (fine pointer / mouse)
            if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                makeDraggable(el);
            }

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
            document.body.classList.add('is-dragging');
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
            document.body.classList.remove('is-dragging');
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
    function initPrescreen(number, editData = null) {
        const prescreen  = buildPrescreen(number);
        const onMobile   = window.innerWidth <= 768;

        // ── Mobile-only prescreen adjustments ────────────────────────────────
        if (onMobile && !editData) {
            // Placeholder
            const nameInput = document.getElementById('stamp-name-input');
            if (nameInput) nameInput.placeholder = 'Your name';

            // Start with no image — src="" triggers the existing display:none CSS rule
            const mobileImg = document.getElementById('stamp-selected-img');
            if (mobileImg) mobileImg.src = '';

        }

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

        // Pre-populate all fields in edit mode
        if (editData) {
            const nameInput = document.getElementById('stamp-name-input');
            if (nameInput) nameInput.value = editData.name || '';
            const stampImg = document.getElementById('stamp-selected-img');
            if (stampImg) { stampImg.src = activeImgDef.full; stampImg.style.display = 'block'; }
            const enterBtn = document.getElementById('prescreen-enter');
            if (enterBtn) enterBtn.textContent = 'update';
        }

        document.getElementById('prescreen-enter').addEventListener('click', () => {
            const nameVal = document.getElementById('stamp-name-input').value.trim();

            // Mobile: name is required
            if (onMobile && !nameVal) {
                const input = document.getElementById('stamp-name-input');
                input.style.transition = 'outline 0.1s ease';
                input.style.outline    = '1.5px solid rgba(0,0,0,0.4)';
                input.placeholder      = 'name required!';
                setTimeout(() => {
                    input.style.outline = '';
                    input.placeholder   = 'Your name';
                }, 1200);
                return;
            }

            // If the user never picked an image, assign one at random
            if (!document.getElementById('stamp-selected-img')?.getAttribute('src')) {
                activeImgDef = STAMP_IMAGES[Math.floor(Math.random() * STAMP_IMAGES.length)];
                applyImageToStamp(activeImgDef);
            }

            stampGenieOut(prescreen, {
                name:         nameVal,
                date:         new Date().toISOString().split('T')[0],
                innerColor:   activeInnerColor,
                outlineColor: activeOutlineColor,
                selectedImg:  activeImgDef?.full || null,
                stampNumber,
                patternId:    activePattern?.id || null,
            }, !!editData);
        });

        initEnterButton();
        requestAnimationFrame(() => setTimeout(editData ? revealPrescreenForEdit : revealPrescreen, 80));
    }

    // ─── Edit-mode reveal — skip loading carousel, jump straight to interactive ─
    function revealPrescreenForEdit() {
        const wrapper    = document.getElementById('stamp-wrapper');
        const enterWrap  = document.getElementById('stamp-enter-wrap');
        const numEl      = document.querySelector('.stamp-number');
        const nameInput  = document.getElementById('stamp-name-input');
        const paletteBtn = document.getElementById('color-swatch-btn');
        const prescreen  = document.getElementById('prescreen');

        if (numEl) numEl.style.opacity = '1';

        // Apply full stamp state before revealing
        applyOutlineColor(activeOutlineColor);
        applyInnerColor(activeInnerColor);
        applyImageToStamp(activeImgDef, true);

        // Interactive elements hidden until ghost arrives at center
        if (nameInput)  { nameInput.style.opacity  = '0'; nameInput.style.pointerEvents  = 'none'; }
        if (paletteBtn) { paletteBtn.style.opacity = '0'; paletteBtn.style.pointerEvents = 'none'; }

        const afterReveal = () => {
            // setupStampTilt is called HERE — after stamp-appear is already applied.
            // GSAP must not touch the wrapper before stamp-appear, because GSAP caches
            // the transform it reads on first contact. If it reads scale(0.5) during the
            // ghost animation, its inline transform overrides stamp-appear and the stamp
            // stays small permanently on that visit.
            setupStampTilt(prescreen);
            if (nameInput)  { nameInput.style.pointerEvents  = ''; gsap.to(nameInput,  { opacity: 1, duration: 0.2 }); }
            if (paletteBtn) { paletteBtn.style.pointerEvents = ''; gsap.to(paletteBtn, { opacity: 1, duration: 0.2 }); }
            if (enterWrap) enterWrap.classList.add('enter-appear');
            setTimeout(() => scatterIcons(prescreen, null, () => setupIconProximity(prescreen)), 100);
            // NOTE: prescreen:start-npcs is intentionally NOT dispatched here.
            // NPCs only belong on the initial prescreen, not the edit page.
        };

        const td = window.__editTransition;
        if (td && typeof gsap !== 'undefined' && wrapper) {
            window.__editTransition = null;

            // Ghost was pre-created at click time so it's already covering the stamp position.
            // Fall back to creating it here if needed.
            const ghost = td.ghost || (() => {
                const g = document.createElement('div');
                g.style.cssText = `position:fixed;left:${td.rect.left}px;top:${td.rect.top}px;
                    width:${td.rect.width}px;height:${td.rect.height}px;
                    z-index:100020;pointer-events:none;`;
                g.innerHTML = td.html;
                document.body.appendChild(g);
                return g;
            })();

            const targetX = window.innerWidth  / 2 - STAMP_W / 2;
            const targetY = window.innerHeight / 2 - STAMP_H / 2;

            gsap.to(ghost, {
                left: targetX, top: targetY,
                duration: 0.7, ease: 'power3.inOut',
                onComplete() {
                    // Commit transition:none before adding stamp-appear so no CSS transition fires.
                    // Ghost still covers the stamp position during the reflow — no visible flash.
                    wrapper.style.transition = 'none';
                    void wrapper.offsetHeight; // force reflow to apply transition:none
                    wrapper.classList.add('stamp-appear'); // instant: opacity:1, scale:1
                    ghost.remove(); // stamp revealed — ghost no longer needed
                    requestAnimationFrame(() => {
                        wrapper.style.transition = ''; // restore CSS transition for future animations
                        afterReveal();
                    });
                },
            });
        } else {
            // No transition data — snap stamp to center
            if (wrapper) {
                wrapper.style.transition = 'none';
                wrapper.style.opacity    = '1';
                wrapper.style.transform  = 'translate(-50%,-50%) scale(1)';
                wrapper.classList.add('stamp-appear');
                requestAnimationFrame(() => {
                    wrapper.style.opacity    = '';
                    wrapper.style.transform  = '';
                    wrapper.style.transition = '';
                });
            }
            if (nameInput)  { nameInput.style.opacity = '1'; }
            if (paletteBtn) { paletteBtn.style.opacity = '1'; paletteBtn.style.pointerEvents = ''; }
            if (enterWrap) enterWrap.classList.add('enter-appear');
            setTimeout(() => scatterIcons(prescreen, null, () => setupIconProximity(prescreen)), 280);
            // NOTE: prescreen:start-npcs is intentionally NOT dispatched here (edit page, no NPCs).
        }
    }

    // ─── Edit mode entry point (called from guestbook gallery) ────────────────
    // gbCard — the Supabase card object passed from the guestbook click handler.
    // Using it as the display source of truth avoids localhost/Supabase drift.
    window.__openEditPrescreen = function (gbCard) {
        const saved = loadSavedCard();
        if (!saved) return;

        // Colors and pattern from localStorage (reflects latest edits)
        activeInnerColor   = saved.innerColor   || '#FFFFFF';
        activeOutlineColor = saved.outlineColor || OUTLINE_COLORS[0];
        activePattern      = saved.patternId
            ? PATTERNS.find(p => p.id === saved.patternId) || null
            : null;

        // Image: prefer the Supabase value (matches what the guestbook displayed);
        // fall back to localStorage if unavailable
        const imgPath = gbCard?.character_svg || saved.selectedImg;
        const foundImg = STAMP_IMAGES.find(img => img.full === imgPath);
        activeImgDef   = foundImg || DEFAULT_IMG;
        selectedImgDef = activeImgDef;

        initPrescreen(saved.stampNumber, saved);
    };

    // ─── Entry point ─────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const saved = loadSavedCard();
        // Both new and returning users play the loading sequence.
        // For returning users, bootZoom handles the exit after 'Huang'.
        fetchStamp1();
        fetchStampNumber().then(n => initPrescreen(n));
    });

    window.__stampRenderer = { makeOutlineSVG, PATTERNS };
    window.__buildDesktopWidget = buildDesktopWidget;
})();