


document.addEventListener('DOMContentLoaded', () => {
    
    
    // Select both dock items and project folders
    const dockItems = document.querySelectorAll('.dock li a');
    const projectFolders = document.querySelectorAll('.projectfolder');
    
    const windowTemplate = document.getElementById('window-template');
    const desktop = document.querySelector('.desktop');
    
    // Map to track currently open windows (used by 'closeWindow' and for initial offset calculations)
    // IMPORTANT: openWindowsMap now stores { windowElement, folderRect } for project windows
    const openWindowsMap = new Map();

    // Preloaded project HTML cache — populated after system:ready
    const projectHTMLCache = new Map();

    // Tracks the nav pill indicator position from the previous window so the
    // next window can slide from there instead of snapping in from nothing.
    let _navIndicatorPrev = null;

    function preloadProjectHTML() {
        PROJECT_TITLES.forEach(title => {
            if (title === 'About me') return; // About me uses initSlideshow, skip
            const fileName = `projects/${title.toLowerCase().replace(/\s+/g, '-')}.html`;
            fetch(fileName)
                .then(r => r.ok ? r.text() : null)
                .then(html => { if (html) projectHTMLCache.set(title, html); })
                .catch(() => {});
        });
    }

    document.addEventListener('system:ready', preloadProjectHTML, { once: true });

    // ⭐ NEW: Map to store the last known position of each hobby image
    // Key: Image alt text, Value: { left: 'Xpx', top: 'Ypx' }
    const hobbyImagePositions = new Map();
    
    
            // ALL SPEECH BUBBLES
            const wallpaper = document.querySelector('.wallpaper');
            const allFolders = document.querySelectorAll('.projectfolder');

            // Filter the folders to exclude 'About Me'
            const targetFolders = Array.from(allFolders).filter(folder => {
                const projectText = folder.querySelector('.ProjectText');
                // We check if the text exists and is NOT "ABOUT ME"
                return projectText && projectText.innerText.replace(/\s+/g, ' ').trim();
                // return projectText && projectText.innerText.replace(/\s+/g, ' ').trim() !== "ABOUT ME";
            });

           // Locate this section in windows.js
targetFolders.forEach(folder => {
    folder.addEventListener('mouseenter', () => {
        // ⭐ NEW CHECK: If this folder is isolated, don't trigger other bubbles
        if (folder.classList.contains('isolate-bubble')) {
            return;
        }
        
        // Apply the class to the wallpaper container
        wallpaper.classList.add('all-bubbles-active');
    });

    folder.addEventListener('mouseleave', () => {
        // Remove the class when leaving
        wallpaper.classList.remove('all-bubbles-active');
    });
});

            
            
    
    // ⭐ UPDATED: Configuration for the Hobbies Sprawl Images ⭐
    const HOBBIES_IMAGES = [
        // Source, dimensions, initial position (vw/vh), and right-side label (editable)
        { src: "images/Hobbies/MAJ.png",         alt: "Mahjong",              width: 360, height: 450, initial_x: 10, initial_y: 15, rotate: 0, label: "Taichung" },
        { src: "images/Hobbies/Warhammer.png",    alt: "Warhammer",            width: 240, height: 360, initial_x: 70, initial_y: 45, rotate: 0, label: "Toronto"  },
        { src: "/images/Hobbies/Guitar.png",      alt: "Electric guitar",      width: 260, height: 400, initial_x: 55, initial_y: 10, rotate: 0, label: "Hong Kong" },
        { src: "images/Hobbies/Travel.png",       alt: "Travel",               width: 360, height: 320, initial_x: 80, initial_y: 20, rotate: 0, label: "Earth"    },
        { src: "/images/Hobbies/MTG.png",         alt: "Magic the gathering",  width: 260, height: 320, initial_x:  5, initial_y: 50, rotate: 0, label: "Taipei"    },
        { src: "/images/Hobbies/Lifedrawing.png", alt: "Life drawing",         width: 280, height: 280, initial_x: 50, initial_y: 60, rotate: 0, label: "Ishigaki"  },
    ];


    // ⭐ List of all 5 project keys for static navigation (unchanged) ⭐
    const PROJECT_TITLES = [
        "About me",
        "VoGro",
        "Bank of Taiwan",
        "Marcopolo",
        "Gilbert"
    ];

    // ⭐ List of dock apps that should only have one instance (UNCHANGED) ⭐
    const SINGLE_INSTANCE_APPS = [
        "Photoshop",
        "Illustrator",
        "VS Code",
        "Figma",
    ];

    // ⭐ List of apps that should be centered AND offset (UNCHANGED) ⭐
    const CENTERED_APPS = [
        "Photoshop",
        "Illustrator",
        "VS Code",
        "Figma"
    ];

    // New Map for custom display titles (UNCHANGED)
    const DISPLAY_TITLE_MAP = {
        "Photoshop": "Adobe Photoshop", 
        "Illustrator": "Adobe Illustrator",
        "VS Code": "Visual Studio Code",
        "Figma": "Figma",
        "Hobbies": "Hobbies", 
        "Bank of Taiwan": "Bank of Taiwan",
        "MARCOPOLO": "MarcoPolo",
        "VOGRO": "Vogro",
        "HESS": "HESS Education",
        "About me": "About me",
        "GILBERT": "Gilbert",
        "[REDACTED]": "[redacted]"
    };

    // ⭐ Map for Custom Default Window Sizes (UNCHANGED) ⭐
    const WINDOW_SIZE_MAP = {
        "Photoshop": { width: '375px', height: '150px' },
        "Illustrator": { width: '375px', height: '150px' },
        "VS Code": { width: '375px', height: '150px' },
        "Figma": { width: '375px', height: '150px' },
        
        "About me:": { width: '600px', height: '400px' },
        
        // Add a default size for project folders for use in the Genie animation
        "PROJECT_DEFAULT": { width: '1000px', height: '600px' } 
    };
    
    
    
    // ⭐ NEW: Variable to track the rotation angle for the Trash icon ⭐
    let trashRotationAngle = 0; 
    let trashCounter = 0;
    
    // ⭐ NEW: Genie Animation Constants ⭐
    const GENIE_EASING = 'cubic-bezier(0.7, -0.01, 0.4, 1)';
    const TRANSITION_DURATION = '0.5s';
    
    
    // Helper Functions
    
    /**
     * Finds the desktop project folder element by its title text.
     * @param {string} title The inner text of the project folder's <p class="ProjectText">.
     * @returns {HTMLElement | null} The project folder div.
     */
    function getProjectFolderElement(title) {
        let element = null;
        projectFolders.forEach(folder => {
            
            const projectText = folder.querySelector('.ProjectText');
            // Normalize the text before comparison (removing extra spaces and newlines)
            if (projectText && projectText.innerText.replace(/\s+/g, ' ').trim() === title) {
                element = folder;
            }
            
        });
        return element;
    }
    
    
    function getHobbiesIconRect() {
        // Use the 'Hobbies' dock item's bounding box
        const dockItem = document.querySelector('.dock li[data-label="Hobbies"]');
        if (dockItem) {
            // Get the bounding rect of the entire dock item
            return dockItem.getBoundingClientRect();
        }
        return null;
    }
    
    function capitalizeTitle(str) {
        if (!str) return '';
        const words = str.toLowerCase().split(' ');
        
        const capitalizedWords = words.map(word => {
            if (word.length > 0) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        });
        
        return capitalizedWords.join(' ');
    }
    
    function getNextZIndex() {
        // Include hobby images in z-index calculation
        let maxZ = 1001; 
        document.querySelectorAll('.window:not([style*="display: none"]), #spotify-player-widget').forEach(el => {
            const z = parseInt(el.style.zIndex);
            if (!isNaN(z) && z > maxZ) {
                maxZ = z;
            }
        });
        return maxZ + 1;
    }

    function showRotationMessage() {
        const messageElement = document.getElementById('rotation-message');
      
          if (!messageElement) return;

        // 1. Show the message (Fade in)
        messageElement.style.opacity = '1';

        // 2. Set a timeout to hide the message (Fade out) after 2 seconds (2000ms)
        // setTimeout(() => {
        //     messageElement.style.opacity = '0';
        // }, 1500); 
    }


    
    function preloadHobbyImages() {
    console.log("Preloading hobby images...");
    HOBBIES_IMAGES.forEach(config => {
        const img = new Image();
        img.src = config.src;
        // The image is now loaded in the background. No need to append it to the DOM.
    });
    }  

    // NEW HELPER: Counts currently open windows in the CENTERED_APPS group.
    function getCenteredAppCount() {
        let count = 0;
        document.querySelectorAll('.window[data-app-key]').forEach(win => {
            const appKey = win.getAttribute('data-app-key');
            // Check if the window is visible and is one of the centered apps
            if (CENTERED_APPS.includes(appKey) && win.style.display !== 'none') {
                count++;
            }
        });
        return count;
    }
    
    // Function to bring all matching project or app windows to the front
    function bringWindowsToFront(targetKey) {
        let windowsFound = 0;
        let newZIndex = getNextZIndex(); 
        
        // Iterate through all open window elements
        document.querySelectorAll('.window:not([style*="display: none"])').forEach(win => {
            // Check for match on EITHER data-project-key (for folders) OR data-app-key (for dock apps)
            if (win.getAttribute('data-project-key') === targetKey || 
                win.getAttribute('data-app-key') === targetKey) {
                
                win.style.zIndex = newZIndex++;
                windowsFound++;
            }
        });
        return windowsFound;
    }

    // MODIFIED: Determines the current text color based on the body class (light/dark mode).
    function getCurrentTextColor() {
        // Check if the body element has the 'dark-mode' class
        if (document.body.classList.contains('dark-mode')) {
            return '#ffffff'; // White for Dark Mode
        }
        // Otherwise, assume Light Mode
        return '#000000'; // Black for Light Mode
    }

    // NEW FUNCTION: Updates the text color of all open windows.
    function updateAllWindowColors() {
        const color = getCurrentTextColor();
        
        document.querySelectorAll('.window:not([style*="display: none"])').forEach(windowElement => {
            // 1. Update window title text
            const titleElement = windowElement.querySelector('.window-title');
            if (titleElement) {
                // The transition property added in openNewWindow will animate this change
                titleElement.style.color = color;
            }
            
            // 2. Update window content text
            const contentElement = windowElement.querySelector('.window-content');
            if (contentElement) {
                // The transition property added in openNewWindow will animate this change
                contentElement.style.color = color;
            }
        });
    }

    // MODIFIED: closeWindow now precisely controls map deletion for NAV swaps and 'X' clicks.
    function closeWindow(title, bypassAnimation = false, collapseToFolder = null) {
        const windowData = openWindowsMap.get(title);
        
        if (windowData) {
            const windowToClose = windowData.windowElement || windowData;
            const originalFolderRect = windowData.folderRect;
            const isProject = windowToClose.getAttribute('data-project-key');
            
            // This flag is needed to decide if we delete the key immediately (NAV swap) or later ('X' button).
            const isNavSwap = collapseToFolder !== null;

            // Check if it's a project folder window AND if we should run the Genie animation
            if (isProject && (originalFolderRect || collapseToFolder) && !bypassAnimation) {
                // --- CLOSE ANIMATION (Reverse Genie) ---
                
                // 1. Determine the target folder element for the collapse
                let targetFolderElement = collapseToFolder;
                if (!targetFolderElement) {
                    // If no specific collapse target is provided (i.e., header 'X' click), use the original folder element
                    targetFolderElement = getProjectFolderElement(title);
                }

                if (!targetFolderElement) {
                    // Fallback to simple removal if the target folder can't be found
                    windowToClose.remove();
                    openWindowsMap.delete(title); // Ensure deletion in fallback
                    return;
                }
                
                const rect = targetFolderElement.getBoundingClientRect(); 
                
                // 2. Start Animation
                windowToClose.style.overflow = 'visible';
                windowToClose.style.transition = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out, box-shadow 0.1s`;

                windowToClose.style.left = `${rect.left}px`;
                windowToClose.style.top = `${rect.top}px`;
                windowToClose.style.width = `${rect.width}px`; // Shrink to folder size
                windowToClose.style.height = `${rect.height}px`; // Shrink to folder size
                windowToClose.style.opacity = '0'; // Fade out
                windowToClose.style.transform = `scale(0.1)`; // Scale down

                // 3. Remove the element after the transition is complete
                windowToClose.addEventListener('transitionend', function removeAfterTransition(e) {
                    // Only remove on a single property (e.g., 'opacity') to ensure all transitions are done
                    if (e.propertyName === 'opacity') {
                        windowToClose.removeEventListener('transitionend', removeAfterTransition);
                        windowToClose.remove();
                        
                        // If it was NOT a NAV swap ('X' button close), delete the map entry here.
                        if (!isNavSwap) {
                           openWindowsMap.delete(title);
                        }
                    }
                });
                
            } else {
                // Default close behavior (for all other apps or nav-link swaps *that bypass animation*)
                windowToClose.remove();
                openWindowsMap.delete(title);
            }
        }
    }

    // Genie-closes a single hobby window back to the dock icon
    function genieCloseHobbyWindow(win) {
        const iconRect = getHobbiesIconRect();
        if (!iconRect) { win.remove(); return; }
        const genieTrans = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out`;
        win.style.transition = genieTrans;
        win.style.left      = `${iconRect.left}px`;
        win.style.top       = `${iconRect.top}px`;
        win.style.width     = `${iconRect.width}px`;
        win.style.height    = `${iconRect.height}px`;
        win.style.opacity   = '0';
        win.style.transform = 'scale(0.1)';
        win.addEventListener('transitionend', function handler(e) {
            if (e.propertyName === 'opacity') { win.removeEventListener('transitionend', handler); win.remove(); }
        });
    }

    // Toggles hobby image windows — Apple-style window per image
    function toggleHobbySprawl() {
        const existingWindows = document.querySelectorAll('.hobby-window');
        const iconRect = getHobbiesIconRect();

        if (!iconRect) { existingWindows.forEach(w => w.remove()); return; }

        // ── CLOSE ALL ────────────────────────────────────────────────────────
        if (existingWindows.length > 0) {
            existingWindows.forEach(w => genieCloseHobbyWindow(w));
            return;
        }

        // ── OPEN ─────────────────────────────────────────────────────────────
        const BORDER   = 4;   // px white border around image
        const HEADER_H = 30;  // px header height
        const genieTrans = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out`;

        HOBBIES_IMAGES.forEach(config => {
            const winW = config.width  + BORDER * 2;
            const winH = config.height + BORDER * 2 + HEADER_H;

            // ── Build window ─────────────────────────────────────────────────
            const win = document.createElement('div');
            win.className = 'window hobby-window';
            win.setAttribute('data-hobby-key', config.alt);

            // Header
            const header = document.createElement('div');
            header.className = 'window-header';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'hobby-close-btn';
            closeBtn.addEventListener('click', () => genieCloseHobbyWindow(win));

            const title = document.createElement('span');
            title.className = 'hobby-window-title';
            title.textContent = config.alt;

            const labelBtn = document.createElement('span');
            labelBtn.className = 'hobby-window-label';
            labelBtn.textContent = config.label || '';

            header.appendChild(closeBtn);
            header.appendChild(title);
            header.appendChild(labelBtn);

            // Content
            const content = document.createElement('div');
            content.className = 'hobby-window-content';

            const img = document.createElement('img');
            img.src       = config.src;
            img.alt       = config.alt;
            img.draggable = false;
            img.className = 'hobby-window-img';
            content.appendChild(img);

            win.appendChild(header);
            win.appendChild(content);

            // ── Initial (genie origin) state ─────────────────────────────────
            win.style.cssText = `
                position: absolute;
                left: ${iconRect.left}px;
                top: ${iconRect.top}px;
                width: ${iconRect.width}px;
                height: ${iconRect.height}px;
                opacity: 0;
                transform: scale(0.1);
                z-index: ${getNextZIndex()};
                overflow: hidden;
            `;

            makeMovable(win, config.alt, win);
            desktop.appendChild(win);

            // ── Animate to final position ─────────────────────────────────────
            setTimeout(() => {
                win.style.transition = genieTrans;

                const saved = hobbyImagePositions.get(config.alt);
                const finalX = saved ? saved.left : `calc(${config.initial_x}vw + ${Math.random() * 10}px)`;
                const finalY = saved ? saved.top  : `calc(${config.initial_y}vh + ${Math.random() * 10}px)`;

                win.style.left      = finalX;
                win.style.top       = finalY;
                win.style.width     = `${winW}px`;
                win.style.height    = `${winH}px`;
                win.style.opacity   = '1';
                win.style.transform = 'scale(1)';
            }, 20);
        });
    }
    
    // --- System Boot Sequence ---
    // Wrapped in a function so it only fires after the prescreen signals ready.
    // prescreen.js dispatches "prescreen:done" (or sets window.__prescreenDone)
    // before this should ever run.

    const isMobile = () => window.innerWidth <= 768;

    function runBootSequence() {
        const folders = Array.from(document.querySelectorAll('.projectfolder'));
        const staticFolders = folders.filter(f =>  f.classList.contains('system-static'));
        const randomFolders = folders.filter(f => !f.classList.contains('system-static'));

        // Always separate Gilbert — loads last on both platforms
        let gilbertFolder = null;
        const otherFolders = randomFolders.filter(folder => {
            const text = folder.querySelector('.ProjectText').innerText.trim().toUpperCase();
            if (text === 'GILBERT') { gilbertFolder = folder; return false; }
            return true;
        });

        if (isMobile()) {
            // ── Mobile: only Gilbert animates in, slam → ripple reveals everything ──
            const gilbertPromise = new Promise(resolve => {
                setTimeout(() => {
                    if (gilbertFolder) gilbertFolder.classList.add('appear');
                    setTimeout(resolve, 500);
                }, 0);
            });

            gilbertPromise.then(() => {
                if (gilbertFolder) gilbertFolder.classList.add('system-trigger');
                setTimeout(() => {
                    triggerSystemRipple(gilbertFolder, staticFolders, otherFolders);
                    document.body.classList.add('system-ready');
                    document.dispatchEvent(new CustomEvent('system:ready'));
                }, 375);
            });

        } else {
            // ── Desktop: all folders load sequentially (shuffled), Gilbert last ──
            for (let i = otherFolders.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [otherFolders[i], otherFolders[j]] = [otherFolders[j], otherFolders[i]];
            }

            const finalLoadingQueue = [...otherFolders];
            if (gilbertFolder) finalLoadingQueue.push(gilbertFolder);

            const growthPromises = finalLoadingQueue.map((folder, index) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        folder.classList.add('appear');
                        setTimeout(resolve, 500);
                    }, index * 175);
                });
            });

            Promise.all(growthPromises).then(() => {
                const lastFolder = finalLoadingQueue[finalLoadingQueue.length - 1];
                lastFolder.classList.add('system-trigger');
                setTimeout(() => {
                    triggerSystemRipple(lastFolder, staticFolders);
                    document.body.classList.add('system-ready');
                    document.dispatchEvent(new CustomEvent('system:ready'));
                }, 365);
            });
        }
    }

    function triggerSystemRipple(element, staticFolders, otherFolders = []) {
        const ripple = document.createElement('div');
        ripple.className = 'system-ripple';
        const rect = element.getBoundingClientRect();
        ripple.style.left = `${rect.left + rect.width / 2}px`;
        ripple.style.top  = `${rect.top  + rect.height / 2}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
        staticFolders.forEach(folder => folder.classList.add('appear'));
        otherFolders.forEach(folder  => folder.classList.add('appear'));
    }

    // Listen for prescreen to finish. If prescreen.js already fired before
    // windows.js was ready (shouldn't happen with defer, but safety net):
    if (window.__prescreenDone) {
        runBootSequence();
    } else {
        document.addEventListener('prescreen:done', runBootSequence, { once: true });
    }

    // Global click cursor — adds body class on mousedown, removes on mouseup
    document.addEventListener('mousedown', () => document.body.classList.add('is-clicking'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('is-clicking'));
    
    // UPDATED: Movable logic for the new images (now saves position)
    function makeMovable(element, key, dragHandle = element) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        dragHandle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-close-btn')) return;
            e.preventDefault();
            isDragging = true;
            element.style.zIndex = getNextZIndex();
            document.body.classList.add('is-dragging');
            element.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.1), 0 15px 40px rgba(0, 0, 0, 0.3)';
            // Disable the animation transition while dragging
            element.style.transition = 'none';

            offset.x = e.clientX - element.offsetLeft;
            offset.y = e.clientY - element.offsetTop;
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onStopDrag);
        });

        const onDrag = (e) => {
            if (!isDragging) return;
            let newX = e.clientX - offset.x;
            let newY = e.clientY - offset.y;
            
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        };

        const onStopDrag = () => {
            isDragging = false;
            document.body.classList.remove('is-dragging');
            element.style.boxShadow = '0 5px 10px rgba(154,160,185,.05), 0 15px 40px rgba(166,173,201,.2)';
            
            // ⭐ CRITICAL: Save the new position back to the map ⭐
            hobbyImagePositions.set(key, {
                left: element.style.left,
                top: element.style.top
            });

            // Re-enable the animation transition after dragging stops (needed for the close animation)
            element.style.transition = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out, box-shadow 0.1s`;
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
        };
    }
    
    // ⭐ MODIFIED: openNewWindow now applies coloring and a color transition to title and content.
    function openNewWindow(title, geometry = {}, folderElement = null, startFullscreen = false) {
        
        const defaultTemplate = windowTemplate; 

        const styledApps = ["Photoshop", "Illustrator", "VS Code", "Figma"];
        const useStyledTemplate = styledApps.includes(title);
        const isProjectFolder = PROJECT_TITLES.includes(title);
        // Only apply Genie Open if explicitly starting from a desktop folder
        const applyGenieOpen = isProjectFolder && folderElement !== null && geometry.left === undefined; 

        const templateToUse = useStyledTemplate ? 
                              document.getElementById('styled-window-template') : 
                              defaultTemplate;
                              
        const newWindow = templateToUse.cloneNode(true);
        newWindow.id = ''; 
        newWindow.style.display = 'flex'; 
        newWindow.style.zIndex = getNextZIndex(); 
        
        // Disable transitions initially for correct positioning/sizing
        newWindow.style.transition = 'none';

        // Store the project key OR app key on the element for identification
        if (isProjectFolder) {
            newWindow.setAttribute('data-project-key', title);
            
            // ⭐ ADDED FOR INDIVIDUAL STYLING ⭐
            // 1. Create a CSS-safe title (e.g., "BANK OF TAIWAN" -> "bank-of-taiwan")
            const safeTitle = title.toLowerCase().replace(/\s/g, '-');
            // 2. Add the unique class name to the window element
            newWindow.classList.add(`window-${safeTitle}`);
            
        } else if (SINGLE_INSTANCE_APPS.includes(title)) {
            newWindow.setAttribute('data-app-key', title);
        }
        
        // --- Determine Size and Position ---
        const defaultWidth = WINDOW_SIZE_MAP.PROJECT_DEFAULT.width;
        const defaultHeight = WINDOW_SIZE_MAP.PROJECT_DEFAULT.height;
        const customSize = WINDOW_SIZE_MAP[title];

        newWindow.style.width = geometry.width || (customSize ? customSize.width : defaultWidth);
        newWindow.style.height = geometry.height || (customSize ? customSize.height : defaultHeight);
        
        // 1. Append to DOM temporarily (needed for centering calculation)
        if (!newWindow.parentElement) {
            desktop.appendChild(newWindow);
        }

        // 2. Determine final target position
        let targetX, targetY;

        if (geometry.left && geometry.top) {
            // Case A: Use captured geometry (e.g., from a nav-link swap) -> Opens INSTANTLY
            targetX = geometry.left;
            targetY = geometry.top;
        } else if (CENTERED_APPS.includes(title)) {
            // Case B: Random position near centre of screen
            const windowWidth  = newWindow.offsetWidth;
            const windowHeight = newWindow.offsetHeight;
            const centerX = (window.innerWidth  / 2) - (windowWidth  / 2);
            const centerY = (window.innerHeight / 2) - (windowHeight / 2);
            const randX = (Math.random() - 0.5) * 300; // ±150px from centre
            const randY = (Math.random() - 0.5) * 200; // ±100px from centre
            targetX = Math.max(0, centerX + randX) + 'px';
            targetY = Math.max(0, centerY + randY) + 'px';
        } else {
            // Case C: Centre of screen (project windows)
            const windowWidth  = newWindow.offsetWidth;
            const windowHeight = newWindow.offsetHeight;
            targetX = Math.max(0, (window.innerWidth  / 2) - (windowWidth  / 2)) + 'px';
            targetY = Math.max(0, (window.innerHeight / 2) - (windowHeight / 2)) + 'px';
        }

        // 3. Apply Positioning: Genie Open vs. Standard
        if (applyGenieOpen) {
            // Case D: Genie Open Animation
            const folderRect = folderElement.getBoundingClientRect();
            
            // Set initial state: Start small, transparent, at the folder's location
            newWindow.style.left = `${folderRect.left}px`;
            newWindow.style.top = `${folderRect.top}px`;
            newWindow.style.width = `${folderRect.width}px`;
            newWindow.style.height = `${folderRect.height}px`;
            newWindow.style.opacity = '0';
            newWindow.style.transform = 'scale(0.1)';
            newWindow.style.overflow = 'hidden'; // Ensure content doesn't pop in early
            
            // Use setTimeout to start the transition after the initial state is rendered
            setTimeout(() => {
                // Apply the transition property
                newWindow.style.transition = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out, box-shadow 0.1s`;
                
                // Animate to the final target position/size (which is now random)
                newWindow.style.left = targetX;
                newWindow.style.top = targetY;
                newWindow.style.width = geometry.width || (customSize ? customSize.width : defaultWidth);
                newWindow.style.height = geometry.height || (customSize ? customSize.height : defaultHeight);
                newWindow.style.opacity = '1';
                newWindow.style.transform = 'scale(1)';
                
                // WINDOW RESIZING
              // Inside openNewWindow function in windows.js
                const toggleBtn = newWindow.querySelector('.window-size-toggle-btn');

                if (toggleBtn) {
                    let savedRect = null;
                    // Prevent dragging when clicking the button
                    toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation());

                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();

                        const isSmall = toggleBtn.classList.contains('small-mode');
                        newWindow.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

                        if (isSmall) {
                            // Save current geometry before going fullscreen
                            savedRect = {
                                left: newWindow.style.left,
                                top: newWindow.style.top,
                                width: newWindow.style.width,
                                height: newWindow.style.height,
                            };
                            newWindow.style.left = '0';
                            newWindow.style.top = '0';
                            newWindow.style.width = '100vw';
                            newWindow.style.height = '100vh';
                            toggleBtn.classList.remove('small-mode');
                            toggleBtn.classList.add('large-mode');
                            newWindow.classList.add('is-fullscreen');
                        } else {
                            // Restore saved geometry
                            if (savedRect) {
                                newWindow.style.left   = savedRect.left;
                                newWindow.style.top    = savedRect.top;
                                newWindow.style.width  = savedRect.width;
                                newWindow.style.height = savedRect.height;
                            } else {
                                newWindow.style.width  = '1000px';
                                newWindow.style.height = '600px';
                            }
                            toggleBtn.classList.remove('large-mode');
                            toggleBtn.classList.add('small-mode');
                            newWindow.classList.remove('is-fullscreen');
                        }

                        setTimeout(() => {
                            newWindow.style.transition = 'none';
                        }, 400);
                    });
                }
                
                // After the transition, remove overflow:hidden so the box-shadow shows correctly
                newWindow.addEventListener('transitionend', function removeOverflow(e) {
                    if (e.propertyName === 'opacity') {
                        newWindow.style.overflow = '';
                        newWindow.removeEventListener('transitionend', removeOverflow);
                        // Reset transition to 'none' so dragging/resizing isn't sluggish.
                        newWindow.style.transition = 'none';
                    }
                });
            }, 20);
            
            
            
        } else {
            // Standard Open (from nav bar or non-project apps, or if geometry was provided)
            newWindow.style.left = targetX;
            newWindow.style.top = targetY;
            newWindow.style.opacity = '1';
            newWindow.style.transform = 'scale(1)';
            newWindow.style.transition = 'none'; // Ensure no transition is active
            // --- NEW RESIZE BUTTON LOGIC ---
const toggleBtn = newWindow.querySelector('.window-size-toggle-btn');
if (toggleBtn) {
    // If nav-swapped from fullscreen, preset savedRect to a sensible windowed size
    let savedRect = startFullscreen
        ? { left: '10vw', top: '10vh', width: '1000px', height: '600px' }
        : null;

    if (startFullscreen) {
        toggleBtn.classList.replace('small-mode', 'large-mode');
        newWindow.classList.add('is-fullscreen');
    }

    toggleBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isSmall = toggleBtn.classList.contains('small-mode');
        newWindow.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

        if (isSmall) {
            savedRect = {
                left: newWindow.style.left,
                top: newWindow.style.top,
                width: newWindow.style.width,
                height: newWindow.style.height,
            };
            newWindow.style.left   = '0';
            newWindow.style.top    = '0';
            newWindow.style.width  = '100vw';
            newWindow.style.height = '100vh';
            toggleBtn.classList.replace('small-mode', 'large-mode');
            newWindow.classList.add('is-fullscreen');
        } else {
            if (savedRect) {
                newWindow.style.left   = savedRect.left;
                newWindow.style.top    = savedRect.top;
                newWindow.style.width  = savedRect.width;
                newWindow.style.height = savedRect.height;
            } else {
                newWindow.style.width  = '1000px';
                newWindow.style.height = '600px';
            }
            toggleBtn.classList.replace('large-mode', 'small-mode');
            newWindow.classList.remove('is-fullscreen');
        }

        setTimeout(() => { newWindow.style.transition = 'none'; }, 400);
    });
}
        }
        
        
        
        
       // --- Content & Title Injection ---
    const displayTitle = DISPLAY_TITLE_MAP[title] || capitalizeTitle(title);
    const titleElement = newWindow.querySelector('.window-title');
    titleElement.textContent = displayTitle;

    // About me has no scrolling — show title immediately.
    // All other windows reveal the title once the user scrolls down.
    if (title === 'About me') {
        titleElement.classList.add('title-visible');
    } else {
        const contentEl = newWindow.querySelector('.window-content');
        if (contentEl && titleElement) {
            contentEl.addEventListener('scroll', () => {
                titleElement.classList.toggle('title-visible', contentEl.scrollTop > 125);
            });
        }
    }

    // 1. Generate the filename (e.g., "BANK OF TAIWAN" -> "bank-of-taiwan.html")
    const safeTitle = title.toLowerCase().replace(/\s+/g, '-');
    const fileName = `projects/${safeTitle}.html`;
    
    const contentContainer = newWindow.querySelector('.window-content');

    // --- Transition Styles ---
    const colorTransition = 'color 0.8s ease-in-out';
    titleElement.style.transition = `opacity 0.8s ease, ${colorTransition}`;
    contentContainer.style.transition = colorTransition;

    const currentColor = getCurrentTextColor();
    titleElement.style.color = currentColor;
    contentContainer.style.color = currentColor;

    // 2. Fetch external content if it's NOT a styled app (like Photoshop)
    if (!useStyledTemplate) {
        contentContainer.innerHTML = '';

        function injectHTML(html) {
            contentContainer.innerHTML = html;
            if (isProjectFolder) {
                const mainContent = contentContainer.querySelector('main');
                if (mainContent) {
                    void contentContainer.getBoundingClientRect();
                    mainContent.classList.add('visible');
                }
            }
            if (title === 'About me') {
                initAboutCanvas(contentContainer, newWindow);
            }
        }

        const cached = projectHTMLCache.get(title);
        if (cached) {
            injectHTML(cached);
        } else {
            fetch(fileName)
                .then(response => {
                    if (!response.ok) throw new Error(`Could not find ${fileName}`);
                    return response.text();
                })
                .then(html => {
                    projectHTMLCache.set(title, html);
                    injectHTML(html);
                })
                .catch(err => {
                    console.error('Fetch error:', err);
                    contentContainer.innerHTML = `
                        <div style="padding: 20px; color: #ff3b30;">
                            <h3 style="margin-top: 0;">Update Needed</h3>
                            <p>Unable to load <strong>${fileName}</strong>.</p>
                            <p><small>Error: ${err.message}</small></p>
                        </div>`;
                });
        }
    }
        
        // --- Static Navigation Bar (existing logic) ---
        const navContainer = newWindow.querySelector('.window-footer-nav');
        
        if (navContainer && isProjectFolder) { 
            const allProjects = PROJECT_TITLES;
            
            let navHTML = '';
            allProjects.forEach(projectKey => {
                const navTitle = DISPLAY_TITLE_MAP[projectKey] || capitalizeTitle(projectKey);
                const isActive = projectKey === title;
                navHTML += `<a href="#" class="nav-project-link${isActive ? ' nav-active' : ''}" data-target-key="${projectKey}">${navTitle}</a>`;
            });
            navContainer.innerHTML = navHTML;

            // ── Pill indicator (Web Animations API — reliable across DOM rebuilds) ──
            const navIndicator = document.createElement('span');
            navIndicator.className = 'nav-pill-indicator';
            navContainer.insertBefore(navIndicator, navContainer.firstChild);

            const PILL_EASING   = 'cubic-bezier(0.87, 0, 0.13, 1)';
            const PILL_DURATION = 450;

            // offsetLeft/offsetWidth are layout-based and work even during
            // opacity/transform window-open animations (unlike getBoundingClientRect).
            function getActiveMetrics() {
                const activeLink = navContainer.querySelector('.nav-active');
                if (!activeLink) return null;
                return { left: activeLink.offsetLeft, width: activeLink.offsetWidth };
            }

            function placeIndicator(left, width) {
                // Cancel any in-flight WAAPI animation first.
                navIndicator.getAnimations().forEach(a => a.cancel());
                navIndicator.style.left  = left  + 'px';
                navIndicator.style.width = width + 'px';
            }

            function slideIndicatorFrom(fromLeft, fromWidth, toLeft, toWidth) {
                navIndicator.getAnimations().forEach(a => a.cancel());
                // Start position (committed to inline style so it's the baseline).
                navIndicator.style.left  = fromLeft  + 'px';
                navIndicator.style.width = fromWidth + 'px';

                const anim = navIndicator.animate(
                    [
                        { left: fromLeft  + 'px', width: fromWidth + 'px' },
                        { left: toLeft    + 'px', width: toWidth   + 'px' },
                    ],
                    { duration: PILL_DURATION, easing: PILL_EASING, fill: 'forwards' }
                );
                // Commit final position to inline style once done so resize/cancel is clean.
                anim.onfinish = () => {
                    navIndicator.style.left  = toLeft  + 'px';
                    navIndicator.style.width = toWidth + 'px';
                    anim.cancel();
                };
            }

            // ResizeObserver fires asynchronously after layout is computed —
            // unlike rAF which can fire before the nav has valid offsetLeft values.
            // The initial callback handles first-position (with optional slide from
            // the previous tab); subsequent callbacks handle fullscreen/resize snaps.
            let navIndicatorReady = false;
            new ResizeObserver(() => {
                const m = getActiveMetrics();
                if (!m || m.width === 0) return;

                if (!navIndicatorReady) {
                    navIndicatorReady = true;
                    if (_navIndicatorPrev) {
                        const prev = _navIndicatorPrev;
                        _navIndicatorPrev = null;
                        slideIndicatorFrom(prev.left, prev.width, m.left, m.width);
                    } else {
                        placeIndicator(m.left, m.width);
                    }
                } else {
                    // Resize / fullscreen toggle — just snap, no slide.
                    placeIndicator(m.left, m.width);
                }
            }).observe(navContainer);

            // Nav Click handler logic: Bring to front or perform the close/open swap.
            navContainer.querySelectorAll('.nav-project-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetKey = e.target.getAttribute('data-target-key');

                    if (!targetKey) return;

                    // 1. Prioritize: Check if a window for the target project is already open.
                    if (bringWindowsToFront(targetKey) > 0) {
                        return;
                    }

                    // 2. Fallback (No target window open): Perform the close/open swap

                    // Prevent swapping to the current content
                    if (targetKey === title) return;

                    const currentWindow = newWindow;

                    // 2a. Save the indicator's current VISUAL position via getBoundingClientRect
                    //     (captures the live animated position if mid-slide).
                    const navRect = navContainer.getBoundingClientRect();
                    const indRect = navIndicator.getBoundingClientRect();
                    _navIndicatorPrev = {
                        left:  indRect.left - navRect.left,
                        width: indRect.width,
                    };

                    // 2b. Capture the geometry of the current window.
                    const geometry = {
                        width: currentWindow.style.width,
                        height: currentWindow.style.height,
                        left: currentWindow.style.left,
                        top: currentWindow.style.top
                    };
                    const wasFullscreen = currentWindow.classList.contains('is-fullscreen');

                    // 2c. Get the desktop folder element for the *target* project.
                    const targetFolderElement = getProjectFolderElement(targetKey);

                    // 2d. Close the current window instantly, open the new one.
                    closeWindow(title, true, targetFolderElement);
                    openNewWindow(targetKey, geometry, null, wasFullscreen);
                });
            });
        }

        // --- Styled App Background (existing logic) ---
        if (useStyledTemplate) {
            let finalImageFileName = `${title.toLowerCase().replace(/\s/g, '')}.png`; 
            const imageURL = `/images/Dock Icons/${finalImageFileName}`; 
            
            const appContentContainer = newWindow.querySelector('.application-content');
            
            if (appContentContainer) {
                appContentContainer.style.backgroundImage = `url('${imageURL}')`;
                appContentContainer.style.backgroundRepeat = 'no-repeat'; 
                appContentContainer.style.backgroundPosition = '1rem 1rem'; 
                appContentContainer.style.backgroundSize = '30px 30px';      
            }
        }

        // Attach closing functionality (existing logic)
        newWindow.querySelector('.window-close-btn').addEventListener('click', () => {
            // Call the modified closeWindow function with bypassAnimation = false to enable the Genie effect
            closeWindow(title, false); 
        });

        newWindow.addEventListener('mousedown', () => {
            newWindow.style.zIndex = getNextZIndex();
        });

        // Initialize dragging and resizing (existing logic)
        makeWindowDraggable(newWindow);
        makeWindowResizable(newWindow);
        
        // Track the instance by its title key. For project folders, store the folder's initial rectangle.
        if (isProjectFolder) {
            
            let rectToStore = null;
            // Case 1: Opened from Desktop folder (applyGenieOpen is true) -> use the passed folderElement
            if (folderElement) {
                rectToStore = folderElement.getBoundingClientRect();
            } else if (geometry.left && geometry.top) {
                // Case 2: Opened from NAV Swap -> Find its own desktop folder for future Genie close 
                const ownFolder = getProjectFolderElement(title);
                if (ownFolder) {
                    rectToStore = ownFolder.getBoundingClientRect();
                }
            }
            
            openWindowsMap.set(title, {
                windowElement: newWindow,
                folderRect: rectToStore
            });
        } else {
            // For all other windows (dock apps, nav-link swaps), just store the element
            openWindowsMap.set(title, { windowElement: newWindow });
        }
        
        // If the window was not added earlier for centering, it should already be in the DOM.
        if (!newWindow.parentElement) {
            desktop.appendChild(newWindow);
        }
    }
    
    

    // Window dragging logic (unchanged)
    function makeWindowDraggable(win) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        win.addEventListener('mousedown', (e) => {
            // No dragging in fullscreen
            if (win.classList.contains('is-fullscreen')) return;

            if (e.target.classList.contains('window-close-btn') ||
                e.target.classList.contains('window-resize-handle') ||
                e.target.closest('.window-resize-handle')
            ) {
                return;
            }

            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'IFRAME']; // Added IFRAME to prevent dragging when interacting with it
            // Check if the click originated within the window's content but not on the header/title bar (if applicable)
            if (e.target.closest('.window-content') && !e.target.closest('.window-header')) {
                // If the element is an iframe, or inside an iframe (though the latter requires extra steps), don't drag.
                if (interactiveTags.includes(e.target.tagName) || e.target.closest('a, button, input, textarea, select, iframe')) {
                    return;
                }
            }
            
            e.preventDefault(); 
            isDragging = true;
            win.style.zIndex = getNextZIndex();
            offset.x = e.clientX - win.offsetLeft;
            offset.y = e.clientY - win.offsetTop;
            document.body.classList.add('is-dragging');
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onStopDrag);
        });

        const onDrag = (e) => {
            if (!isDragging) return;
            let newX = e.clientX - offset.x;
            let newY = e.clientY - offset.y;
            
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            win.style.left = `${newX}px`;
            win.style.top = `${newY}px`;
        };

        const onStopDrag = () => {
            isDragging = false;
            document.body.classList.remove('is-dragging');
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
        };
        
        const content = win.querySelector('.window-content');
        if (content) {
            content.style.cursor = '';
        }
    }

    // Window resizing logic (unchanged)
    function makeWindowResizable(win) {
        const handles = win.querySelectorAll('.window-resize-handle');
        
        const appKey = win.getAttribute('data-app-key');
        const isCenteredApp = CENTERED_APPS.includes(appKey);
        
        // 1. Determine Min Dimensions
        let minWidth;
        let minHeight;
        
        if (isCenteredApp) {
            // Force minimums to match the requested initial size for the styled apps
            minWidth = 250;
            minHeight = 55;
        } else {
            // Fallback to computed styles or defaults for all other windows
            minWidth = parseInt(getComputedStyle(win).minWidth) || 250;
            minHeight = parseInt(getComputedStyle(win).minHeight) || 200; // Default for other apps
        }

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                
                e.stopImmediatePropagation(); 
                e.preventDefault(); 
                
                let isResizing = true; 
                let startX = e.clientX;
                let startY = e.clientY;
                let startWidth = win.offsetWidth;
                let startHeight = win.offsetHeight;
                let startLeft = win.offsetLeft; 
                let startTop = win.offsetTop;   
                let currentHandle = handle.classList[1]; 
                
                win.style.zIndex = getNextZIndex(); 

                const onResize = (moveEvent) => {
                    if (!isResizing) return;

                    let diffX = moveEvent.clientX - startX;
                    let diffY = moveEvent.clientY - startY;

                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newX = startLeft;
                    let newY = startTop;

                    switch (currentHandle) {
                        case 'top-left':
                            newWidth = startWidth - diffX;
                            newHeight = startHeight - diffY;
                            newX = startLeft + diffX;
                            newY = startTop + diffY;
                            break;
                        case 'top-right':
                            newWidth = startWidth + diffX;
                            newHeight = startHeight - diffY;
                            newY = startTop + diffY;
                            break;
                        case 'bottom-left':
                            newWidth = startWidth - diffX;
                            newHeight = startHeight + diffY;
                            newX = startLeft + diffX;
                            break;
                        case 'bottom-right':
                            newWidth = startWidth + diffX;
                            newHeight = startHeight + diffY;
                            break;
                        default:
                            break;
                    }

                    // 1. Width Logic (Uses the defined minWidth)
                    if (newWidth >= minWidth) {
                        win.style.width = `${newWidth}px`;
                        if (currentHandle.includes('left')) {
                            win.style.left = `${newX}px`;
                        }
                    } else {
                        win.style.width = `${minWidth}px`;
                        if (currentHandle.includes('left')) {
                            let correctedX = startLeft + (startWidth - minWidth);
                            win.style.left = `${correctedX}px`;
                        }
                    }

                    // 2. Height Logic (Uses the defined minHeight, which is 55 for centered apps)
                    if (newHeight >= minHeight) {
                        win.style.height = `${newHeight}px`;
                        if (currentHandle.includes('top')) {
                            win.style.top = `${newY}px`;
                        }
                    } else {
                        win.style.height = `${minHeight}px`;
                        if (currentHandle.includes('top')) {
                            let correctedY = startTop + (startHeight - minHeight);
                            win.style.top = `${correctedY}px`;
                        }
                    }
                };

                const onStopResize = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', onResize);
                    document.removeEventListener('mouseup', onStopResize);
                };

                document.addEventListener('mousemove', onResize);
                document.addEventListener('mouseup', onStopResize);
            });
        });
    }


    // --- 1. Handle Dock Item Clicks (Single-instance logic) ---
    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
                const listItem = item.closest('li');
                const windowTitle = listItem.getAttribute('data-label');
                
                // ⭐ Handle Hobbies Separately (using the updated toggle function) ⭐
                if (windowTitle === "Hobbies") {
                    toggleHobbySprawl();
                    return; // Stop execution here
                }
                
                
                
                // ⭐ NEW: Handle Trash Click Separately (Rotation Logic) ⭐
                if (windowTitle === "Trash") {
                    // Increment the rotation angle by 45 degrees
                    trashRotationAngle += 45;
                    
                    // Select the <img> element inside the dock item
                    const trashImage = item.querySelector('img');
                      const counterDisplay = document.getElementById('trashCounter');
                      
                    if (trashImage) {
                        // Apply the rotation via CSS transform
                        trashImage.style.transition = 'transform 0.3s ease-out'; // Add a smooth transition
                        trashImage.style.transform = `rotate(${trashRotationAngle}deg)`;
                        
                        // --- NEW: Check for 360 degree completion ---
                        if (trashRotationAngle % 360 === 0) {
                            trashCounter++;
                            counterDisplay.innerText = trashCounter;
                            showRotationMessage();
                        }
                    }
                    return; // Stop execution here
                }
                
                if (SINGLE_INSTANCE_APPS.includes(windowTitle)) {
                    // Check if an instance exists and bring it to front
                    const existingWindowsCount = bringWindowsToFront(windowTitle);
                    
                    if (existingWindowsCount === 0) {
                        // No window found, open a new one (Standard open)
                        openNewWindow(windowTitle);
                    }
                } 
            }
        });
    });

    // --- 2. Handle Project Folder Clicks (Desktop - Bring to Front or Open New) (unchanged) ---
    projectFolders.forEach(folder => {
        
        let isMoving = false; 
        let startX = 0;
        let startY = 0;
        const DRAG_THRESHOLD = 10; 

        folder.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isMoving = false;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener('mousemove', checkMovement);
        });

        const checkMovement = (e) => {
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);

            if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
                isMoving = true;
                document.removeEventListener('mousemove', checkMovement); 
            }
        };

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', checkMovement);
        });
        
        folder.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (isMoving) {
                isMoving = false; 
                return;
            } else if (folder.classList.contains('is-tooltip-only')){
                return 
            }
            
            const projectTitleElement = folder.querySelector('.ProjectText');
            // Normalize the text to match the key in WINDOW_CONTENT_MAP
            const windowTitle = projectTitleElement.innerText.replace(/\s+/g, ' ').trim();
            
            // Logic: Check for existing windows.
            const existingWindowsCount = bringWindowsToFront(windowTitle);
            
            if (existingWindowsCount === 0) {
                // No windows found for this project, open a new one with the Genie effect
                // IMPORTANT: Pass the folder element to trigger the Genie open animation
                openNewWindow(windowTitle, {}, folder);
            } 
        });
    });
    
  // --- NEW: Spotify Player Toggle Logic (Direct on Desktop) ---
    const spotifyDockItem = document.querySelector('[data-label="Spotify"]');
    const spotifyPlayer = document.getElementById('spotify-player-widget');
    const spotifyIframe = spotifyPlayer ? spotifyPlayer.querySelector('iframe') : null;

    if (spotifyDockItem && spotifyPlayer && spotifyIframe) {
        
        // Flag to track if the iframe has successfully loaded its content once
        let contentLoaded = false;
        
        // 1. Listen for the iframe content to load
        spotifyIframe.addEventListener('load', () => {
            contentLoaded = true;
        });

        spotifyDockItem.addEventListener('click', (e) => {
            // Check if the clicked element is an <a> tag and prevent default navigation
            if (e.target.closest('a')) {
                e.preventDefault(); 
            }
            e.stopPropagation();
            
            // Toggle visibility based on the opacity state
            const isVisible = spotifyPlayer.style.opacity === '1';

            if (isVisible) {
                // Fade Out and hide
                spotifyPlayer.style.opacity = '0';
                spotifyPlayer.style.pointerEvents = 'none';
            } else {
                // Show/Fade In
                // If content is already loaded, show immediately.
                if (contentLoaded) {
                    spotifyPlayer.style.opacity = '1';
                    spotifyPlayer.style.pointerEvents = 'auto';
                } else {
                    // If content is not loaded, show when the 'load' event fires.
                    // The element is already at opacity: 0, so no visible black box.
                    
                    // We attach a one-time listener to fade it in right after the load event
                    const handleLoadAndShow = () => {
                        spotifyPlayer.style.opacity = '1';
                        spotifyPlayer.style.pointerEvents = 'auto';
                        spotifyIframe.removeEventListener('load', handleLoadAndShow);
                    };
                    spotifyIframe.addEventListener('load', handleLoadAndShow);
                }
            }
        });
    }
    // --- END Spotify Player Toggle Logic ---

    // Spotify cursor cover — keeps the custom cursor tracking over the iframe.
    // Steps aside on mousedown so the full click sequence reaches the iframe.
    // Restores on document mouseup (released outside iframe) or after 300ms
    // (released inside iframe — parent never sees that mouseup cross-origin).
    const spotifyCover = document.querySelector('.spotify-cursor-cover');
    if (spotifyCover) {
        spotifyCover.addEventListener('mousedown', () => {
            spotifyCover.style.pointerEvents = 'none';
            let restored = false;
            const restore = () => {
                if (restored) return;
                restored = true;
                spotifyCover.style.pointerEvents = '';
            };
            document.addEventListener('mouseup', restore, { once: true });
            setTimeout(restore, 300);
        });
    }
    
    // ⭐ NEW: MutationObserver to detect dark-mode class change on the body
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Class list changed, check if it's the dark-mode class being added or removed
                if (mutation.target.classList.contains('dark-mode') || !mutation.target.classList.contains('dark-mode')) {
                    updateAllWindowColors();
                }
            }
        }
    });
    
    // Initialize the Sticky Note
const stickyNote = document.getElementById('sticky-note');
if (stickyNote) {
    // We use 'StickyNote' as a key for potential position saving later
    makeMovable(stickyNote, 'StickyNote');
    
    // Ensure clicking the editable text doesn't trigger a drag incorrectly
    const content = stickyNote.querySelector('.sticky-note-content');
    content.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevents makeMovable from taking over when you want to edit
    });
};

    // Start observing the body element for attribute changes (specifically 'class')
    observer.observe(document.body, { attributes: true });
    // ⭐ END MutationObserver Setup ⭐
    
   // windows.js

window.toggleInProgress = function() {
    const dock = document.getElementById('progress-dock');
    const arrow = document.getElementById('progress-arrow');
    const label = document.querySelector('.playground-label');

    if (!dock || !arrow || !label) return;

    const isOpening = dock.classList.contains('progress-dock-hidden');

    if (isOpening) {
        // STEP 1: THE HOP
        label.classList.add('title-hopping');

        // STEP 2: THE VANISH
        setTimeout(() => {
            label.classList.remove('title-hopping');
            label.classList.add('title-vanished');

            // STEP 3: THE GENIE REVEAL
            // Triggered shortly after the title vanishes
            setTimeout(() => {
                dock.classList.remove('progress-dock-hidden');
                arrow.classList.add('arrow-flipped');
            }, 210); 

        }, 325); // Wait for hop duration

    } else {
        // REVERSE: Close Dock then show Title
        dock.classList.add('progress-dock-hidden');
        arrow.classList.remove('arrow-flipped');

        setTimeout(() => {
            label.classList.remove('title-vanished');
        }, 500); // Title reappears as dock is halfway "sucked in"
    }
};




// DRAWING AND COLOR PICKER LOGIC (WORK IN PROGRESS)
// const hueSlider = document.getElementById('hue-slider');
// const huePicker = document.getElementById('hue-picker');
// const spectrumSquare = document.getElementById('spectrum-square');
// const spectrumPicker = document.getElementById('spectrum-picker');

// // Utility to clamp and calculate percentage
// function getClampedPercents(e, element) {
//     const rect = element.getBoundingClientRect();
//     const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
//     const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
//     return { x, y };
// }

// // --- Hue Handling ---
// const handleHue = (e) => {
//     const { y } = getClampedPercents(e, hueSlider);
//     const hue = y * 360;
    
//     // Update CSS Variable and Picker position
//     document.documentElement.style.setProperty('--current-hue', hue);
//     huePicker.style.top = `${y * 100}%`;
// };

// hueSlider.addEventListener('pointerdown', (e) => {
//     hueSlider.setPointerCapture(e.pointerId);
//     handleHue(e);
    
//     const onPointerMove = (ev) => handleHue(ev);
//     const onPointerUp = () => {
//         hueSlider.removeEventListener('pointermove', onPointerMove);
//         window.removeEventListener('pointerup', onPointerUp);
//     };

//     hueSlider.addEventListener('pointermove', onPointerMove);
//     window.addEventListener('pointerup', onPointerUp);
// });

// // --- Spectrum Handling ---
// const handleSpectrum = (e) => {
//     const { x, y } = getClampedPercents(e, spectrumSquare);
    
//     spectrumPicker.style.left = `${x * 100}%`;
//     spectrumPicker.style.top = `${y * 100}%`;
    
//     // x = Saturation (0-1), y = Value (invert for brightness)
//     console.log(`Saturation: ${Math.round(x * 100)}%, Value: ${Math.round((1 - y) * 100)}%`);
// };

// spectrumSquare.addEventListener('pointerdown', (e) => {
//     spectrumSquare.setPointerCapture(e.pointerId);
//     handleSpectrum(e);

//     const onPointerMove = (ev) => handleSpectrum(ev);
//     const onPointerUp = () => {
//         spectrumSquare.removeEventListener('pointermove', onPointerMove);
//         window.removeEventListener('pointerup', onPointerUp);
//     };

//     spectrumSquare.addEventListener('pointermove', onPointerMove);
//     window.addEventListener('pointerup', onPointerUp);
// });


// const canvas = document.getElementById('drawing-canvas');
// const ctx = canvas.getContext('2d');

// // Resize canvas to fill the screen
// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }
// window.addEventListener('resize', resizeCanvas);
// resizeCanvas();

// let drawing = false;

// function getPenColor() {
//     // Replace '.spectrum-square' with the actual class or ID of your main color area
//     const spectrumSquare = document.querySelector('.spectrum-square'); 
    
//     if (spectrumSquare) {
//         // This gets the final computed RGB value from the element
//         return window.getComputedStyle(spectrumSquare).backgroundColor;
//     }
    
//     return '#000000'; // Fallback to black if element isn't found
// }

// function startDrawing(e) {
//     drawing = true;
//     draw(e);
// }

// function stopDrawing() {
//     drawing = false;
//     ctx.beginPath(); // Resets the path so lines don't connect weirdly
// }

// function draw(e) {
//     if (!drawing) return;

//     ctx.lineWidth = 5;
//     ctx.lineCap = 'round';
//     ctx.strokeStyle = getPenColor(); // Dynamically gets color from your picker

//     ctx.lineTo(e.clientX, e.clientY);
//     ctx.stroke();
//     ctx.beginPath();
//     ctx.moveTo(e.clientX, e.clientY);
// }

// // Event Listeners
// canvas.addEventListener('mousedown', startDrawing);
// canvas.addEventListener('mousemove', draw);
// window.addEventListener('mouseup', stopDrawing);

// If your palette JS updates the --current-hue variable on the root or container, 
// the CSS 'hsl(var(--current-hue), 100%, 50%)' will update the cursor color automatically.

    preloadHobbyImages();
});