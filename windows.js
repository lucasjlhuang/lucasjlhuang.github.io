document.addEventListener('DOMContentLoaded', () => {
    // Select both dock items and project folders
    const dockItems = document.querySelectorAll('.dock li a');
    const projectFolders = document.querySelectorAll('.projectfolder');
    
    const windowTemplate = document.getElementById('window-template');
    const desktop = document.querySelector('.desktop');
    
    // Map to track currently open windows (used by 'closeWindow' and for initial offset calculations)
    const openWindowsMap = new Map(); 

    // ⭐ NEW: Map to store the last known position of each hobby image
    // Key: Image alt text, Value: { left: 'Xpx', top: 'Ypx' }
    const hobbyImagePositions = new Map();

    // ⭐ UPDATED: Configuration for the Hobbies Sprawl Images ⭐
    const HOBBIES_IMAGES = [
        // Source, dimensions (doubled), and upright rotation
        // Initial position (initial_x in vw, initial_y in vh) - Used if no saved position exists
        { src: "images/Hobbies/MAJ.png", alt: "Mahjong", width: 360, height: 450, initial_x: 10, initial_y: 15, rotate: 0 },
        { src: "images/Hobbies/Warhammer.png", alt: "Warhammer", width: 240, height: 360, initial_x: 70, initial_y: 45, rotate: 0 },
        { src: "/images/Hobbies/Guitar.png", alt: "Electric Guitar", width: 260, height: 400, initial_x: 55, initial_y: 10, rotate: 0 }, 
        { src: "images/Hobbies/Travel.png", alt: "Travel", width: 360, height: 320, initial_x: 80, initial_y: 20, rotate: 0 }, 
        { src: "/images/Hobbies/MTG.png", alt: "MTG", width: 260, height: 320, initial_x: 5, initial_y: 50, rotate: 0 }, 
        { src: "/images/Hobbies/Lifedrawing.png", alt: "Life Drawing", width: 280, height: 280, initial_x: 50, initial_y: 60, rotate: 0 }, 
    ];

    // ⭐ Map for Custom Window Content (UNCHANGED) ⭐
    const WINDOW_CONTENT_MAP = {
        // CONTENT FOR PROJECT FOLDERS (Using the inner text/title)
        "ABOUT ME": `
            <h3 style="margin-top: 0;">Hi, I'm Lucas! 👋</h3>
            <p>Welcome to my digital space. This section is where I share a little more about my journey and who I am outside of design and code. I'm passionate about creating user-centric and beautiful experiences.</p>
            <div style="display: flex; justify-content: space-around; padding: 10px;">
                <img src="/images/Me_Portrait_1.jpg" alt="A photo of Lucas smiling" style="width: 45%; height: auto; border-radius: 8px; object-fit: cover;">
                <img src="/images/Me_Portrait_2.jpg" alt="A photo of Lucas working" style="width: 45%; height: auto; border-radius: 8px; object-fit: cover;">
            </div>
            <p>I believe that the best work comes from a balance of technical skill and creative vision.</p>
        `,
        "VOGRO": `
            <h3 style="margin-top: 0;">VoGro: Mobile Gardening App 🥕</h3>
            <p>VoGro is a concept for a mobile application designed to help city dwellers manage and track their small-space gardens. The design focuses on intuitive plant management and community sharing.</p>
            <div style="text-align: center;">
                <img src="/images/vogro_mockup_1.png" alt="VoGro mobile app screenshot" style="width: 60%; height: auto; border-radius: 8px; margin: 10px 0;">
            </div>
            <p>Key features include a personalized watering schedule, pest identification tool, and a social feed to share harvests.</p>
        `,
        "BANK OF TAIWAN": `
            <h3 style="margin-top: 0;">Bank of Taiwan Rebrand & UI/UX 🏦</h3>
            <p>A comprehensive redesign of the Bank of Taiwan's digital presence, focusing on simplifying complex banking flows and modernizing the overall aesthetic. This project involved extensive user research.</p>
            <ul style="padding-left: 20px;">
                <li>**Goal:** Improve accessibility and user trust.</li>
                <li>**Outcome:** A cleaner, more efficient mobile and web experience.</li>
            </ul>
        `,
        "CANADIAN HYPERLOOP CONFERENCE": `
            <h3 style="margin-top: 0;">Canadian Hyperloop Conference Branding 🚄</h3>
            <p>I developed the full visual identity for the annual Canadian Hyperloop Conference, including the logo, website design, and promotional materials. The design needed to be sleek, modern, and high-tech.</p>
            <p>The core concept was to convey speed and future-forward transportation.</p>
        `,
        "WEBGALLERY": `
            <h3 style="margin-top: 0;">Interactive Web Gallery Portfolio 🎨</h3>
            <p>This is a custom-built, interactive online portfolio to showcase my fine art and digital illustration work. It features dynamic sorting and high-resolution viewing of pieces.</p>
            <p>It's a testament to front-end development skills combined with artistic presentation.</p>
        `
    };

    // ⭐ List of all 5 project keys for static navigation (unchanged) ⭐
    const PROJECT_TITLES = [
        "ABOUT ME",
        "VOGRO",
        "BANK OF TAIWAN",
        "CANADIAN HYPERLOOP CONFERENCE",
        "WEBGALLERY"
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
        "BANK OF TAIWAN": "Bank of Taiwan",
        "CANADIAN HYPERLOOP CONFERENCE": "Canadian Hyperloop Conference",
        "VOGRO": "Vogro",
        "WEBGALLERY": "Web Gallery",
        "ABOUT ME": "About Me"
    };

    // ⭐ Map for Custom Default Window Sizes (UNCHANGED) ⭐
    const WINDOW_SIZE_MAP = {
        "Photoshop": { width: '375px', height: '150px' },
        "Illustrator": { width: '375px', height: '150px' },
        "VS Code": { width: '375px', height: '150px' },
        "Figma": { width: '375px', height: '150px' },
    };
    
    // ⭐ NEW: Variable to track the rotation angle for the Trash icon ⭐
    let trashRotationAngle = 0; 
    
    
    // Helper Functions
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
        document.querySelectorAll('.window:not([style*="display: none"]), .sprawled-hobby-image, #spotify-player-widget').forEach(el => {
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
        setTimeout(() => {
            messageElement.style.opacity = '0';
        }, 1500); 
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

    // closeWindow: Only called by the X button or the nav-link swap logic.
    function closeWindow(title) {
        const windowToClose = openWindowsMap.get(title);
        if (windowToClose) {
            windowToClose.remove();
            // This line ensures the map entry is cleared, but doesn't prevent other instances from existing.
            openWindowsMap.delete(title);
        }
    }

    // ⭐ UPDATED: Toggles the sprawled images for Hobbies with Genie-like animation and persistence ⭐
    function toggleHobbySprawl() {
        const existingImages = document.querySelectorAll('.sprawled-hobby-image');
        const iconRect = getHobbiesIconRect();

        if (!iconRect) {
            existingImages.forEach(img => img.remove());
            return;
        }

        // Custom cubic-bezier for a strong, swoopy acceleration/deceleration (Genie approximation)
        const genieEasing = 'cubic-bezier(0.7, -0.01, 0.4, 1)';
        const transitionDuration = '0.5s';

        if (existingImages.length > 0) {
            // --- CLOSE ANIMATION (Reverse Genie) ---
            existingImages.forEach(img => {
                // Ensure transition is active
                img.style.transition = `left ${transitionDuration} ${genieEasing}, top ${transitionDuration} ${genieEasing}, width ${transitionDuration} ${genieEasing}, height ${transitionDuration} ${genieEasing}, opacity ${transitionDuration} ease-out, transform ${transitionDuration} ease-out, box-shadow 0.1s`;
                
                // Animate to icon's position/size/opacity
                img.style.left = `${iconRect.left}px`;
                img.style.top = `${iconRect.top}px`;
                img.style.width = `${iconRect.width}px`; // Shrink to icon size
                img.style.height = `${iconRect.height}px`; // Shrink to icon size
                img.style.opacity = '0'; // Fade out
                img.style.transform = `rotate(0deg) scale(0.1)`; // Add scale down for better effect

                // Remove the element after the transition is complete
                img.addEventListener('transitionend', function removeAfterTransition(e) {
                    // Only remove on the 'opacity' transition to ensure all properties have finished
                    if (e.propertyName === 'opacity') {
                        img.removeEventListener('transitionend', removeAfterTransition);
                        img.remove();
                    }
                });
            });
            return; // Exit after triggering the close animation
        }

        // --- OPEN ANIMATION (Genie) ---
        HOBBIES_IMAGES.forEach(config => {
            const img = document.createElement('img');
            img.src = config.src;
            img.alt = config.alt;
            img.className = 'sprawled-hobby-image'; 
            
            // Set styles for base setup
            img.style.position = 'absolute';
            img.style.zIndex = getNextZIndex(); 
            img.style.boxShadow = '0 5px 10px rgba(154,160,185,.05), 0 15px 40px rgba(166,173,201,.2)';
            img.style.cursor = 'grab';
            
            // Set initial state (from icon) - NO TRANSITION applied yet
            img.style.left = `${iconRect.left}px`;
            img.style.top = `${iconRect.top}px`;
            img.style.width = `${iconRect.width}px`;
            img.style.height = `${iconRect.height}px`;
            img.style.opacity = '0.1'; 
            img.style.transform = `rotate(0deg) scale(0.1)`; // Start small
            
            // Pass alt text for saving position
            makeMovable(img, config.alt); 

            // Add the image to the DOM
            desktop.appendChild(img);
            
            // Use setTimeout to allow the browser to paint the initial state before transition
            setTimeout(() => {
                // Apply the transition property
                img.style.transition = `left ${transitionDuration} ${genieEasing}, top ${transitionDuration} ${genieEasing}, width ${transitionDuration} ${genieEasing}, height ${transitionDuration} ${genieEasing}, opacity ${transitionDuration} ease-out, transform ${transitionDuration} ease-out, box-shadow 0.1s`;
                
                let finalX, finalY;
                const savedPosition = hobbyImagePositions.get(config.alt);

                if (savedPosition) {
                    // ⭐ Persistence: Use the last known position ⭐
                    finalX = savedPosition.left;
                    finalY = savedPosition.top;
                } else {
                    // Initial sprawl: Calculate final position with small random jitter
                    const randomXOffset = Math.random() * 10;
                    const randomYOffset = Math.random() * 10;
                    finalX = `calc(${config.initial_x}vw + ${randomXOffset}px)`;
                    finalY = `calc(${config.initial_y}vh + ${randomYOffset}px)`;
                }

                // Transition to the final state
                img.style.left = finalX;
                img.style.top = finalY;
                img.style.width = `${config.width}px`;
                img.style.height = `${config.height}px`;
                img.style.opacity = '1'; 
                img.style.transform = `rotate(${config.rotate}deg) scale(1)`;

            }, 20); 
        });
    }

    // ⭐ UPDATED: Movable logic for the new images (now saves position) ⭐
    function makeMovable(element, key) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        
        element.addEventListener('mousedown', (e) => { 
            e.preventDefault(); 
            isDragging = true;
            element.style.zIndex = getNextZIndex();
            element.style.cursor = 'grabbing';
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
            element.style.cursor = 'grab'; 
            element.style.boxShadow = '0 5px 10px rgba(154,160,185,.05), 0 15px 40px rgba(166,173,201,.2)';
            
            // ⭐ CRITICAL: Save the new position back to the map ⭐
            hobbyImagePositions.set(key, {
                left: element.style.left,
                top: element.style.top
            });

            // Re-enable the animation transition after dragging stops (needed for the close animation)
            const genieEasing = 'cubic-bezier(0.7, -0.01, 0.4, 1)';
            const transitionDuration = '0.5s';
            element.style.transition = `left ${transitionDuration} ${genieEasing}, top ${transitionDuration} ${genieEasing}, width ${transitionDuration} ${genieEasing}, height ${transitionDuration} ${genieEasing}, opacity ${transitionDuration} ease-out, transform ${transitionDuration} ease-out, box-shadow 0.1s`;
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
        };
    }
    
    function openNewWindow(title, geometry = {}) {
        const defaultTemplate = windowTemplate; 

        const styledApps = ["Photoshop", "Illustrator", "VS Code", "Figma"];
        const useStyledTemplate = styledApps.includes(title);
        const isProjectFolder = PROJECT_TITLES.includes(title);
        
        const templateToUse = useStyledTemplate ? 
                              document.getElementById('styled-window-template') : 
                              defaultTemplate;
                              
        const newWindow = templateToUse.cloneNode(true);
        newWindow.id = ''; 
        newWindow.style.display = 'flex'; 
        newWindow.style.zIndex = getNextZIndex(); 

        // Store the project key OR app key on the element for identification
        if (isProjectFolder) {
            newWindow.setAttribute('data-project-key', title);
        } else if (SINGLE_INSTANCE_APPS.includes(title)) {
            newWindow.setAttribute('data-app-key', title);
        }
        
        // --- Apply Custom or Default Size ---
        const defaultWidth = '700px';
        const defaultHeight = '500px';
        const customSize = WINDOW_SIZE_MAP[title];

        // Use passed geometry for size if available
        newWindow.style.width = geometry.width || (customSize ? customSize.width : defaultWidth);
        newWindow.style.height = geometry.height || (customSize ? customSize.height : defaultHeight);
        
        // Positioning logic with dynamic offset
        if (geometry.left && geometry.top) {
            // Case 1: Use captured geometry (e.g., from a nav-link swap)
            newWindow.style.top = geometry.top;
            newWindow.style.left = geometry.left;
        } else if (CENTERED_APPS.includes(title)) {
            // Case 2: Center and dynamically offset the window for specified apps
            
            // 1. Temporarily append to DOM to get actual pixel size from vw/vh values
            if (!newWindow.parentElement) {
                desktop.appendChild(newWindow);
            }

            const windowWidth = newWindow.offsetWidth;
            const windowHeight = newWindow.offsetHeight;
            
            // 2. Calculate base center position
            const centerX = (window.innerWidth / 2) - (windowWidth / 2);
            const centerY = (window.innerHeight / 2) - (windowHeight / 2);
            
            // 3. Get the count of other existing, currently open centered apps
            // Since this window is already in the DOM (appended above), we subtract 1
            let offsetCount = getCenteredAppCount() - 1;
            offsetCount = Math.max(0, offsetCount); 

            // 4. Apply base position + offset (using CSS calc for vw/vh units)
            // Offset: +1vw to the right, +1vh down per existing open centered window.
            newWindow.style.left = `calc(${centerX}px + ${offsetCount}vw)`;
            newWindow.style.top = `calc(${centerY}px + ${offsetCount}vh)`;

        } else {
            // Case 3: Fallback to offset logic (non-centered apps)
            const offset = (document.querySelectorAll('.window:not([style*="display: none"])').length % 5) * 20; 
            newWindow.style.top = `calc(15vh + ${offset}px)`;
            newWindow.style.left = `calc(20vw + ${offset}px)`;
        }
        
        const displayTitle = DISPLAY_TITLE_MAP[title] || capitalizeTitle(title);
        newWindow.querySelector('.window-title').textContent = displayTitle;
        
        // Inject Custom Content (existing logic)
        const contentHTML = WINDOW_CONTENT_MAP[title];
        const contentContainer = newWindow.querySelector('.window-content');
        
        if (contentHTML && !useStyledTemplate) {
            contentContainer.innerHTML = contentHTML; 
        } else if (!useStyledTemplate) {
            contentContainer.innerHTML = `<h3 style="margin-top: 0;">${displayTitle}</h3><p>Content for ${displayTitle} is coming soon!</p>`;
        }
        
        // Inject Static Navigation Bar (existing logic)
        const navContainer = newWindow.querySelector('.window-footer-nav');
        
        if (navContainer && isProjectFolder) { 
            const allProjects = PROJECT_TITLES;
            
            let navHTML = '<div class="window-nav-inner" style="display: flex; justify-content: space-around; width: 100%; border-top: 1px solid var(--border-color); padding: 8px 0;">';
            
            allProjects.forEach(projectKey => {
                const navTitle = DISPLAY_TITLE_MAP[projectKey] || capitalizeTitle(projectKey);
                const isActive = projectKey === title;

                // Hardcoded color values to prevent theme change for nav text
                const navStyle = isActive 
                    ? 'color: #000; font-weight: bold; text-decoration: none; font-size: 0.8rem; cursor: pointer; transition: color 0.1s;' 
                    : 'color: #007aff; text-decoration: none; font-size: 0.8rem; cursor: pointer; transition: color 0.1s;';
                    
                navHTML += `<a href="#" class="nav-project-link" data-target-key="${projectKey}" 
                             style="${navStyle}">
                             ${navTitle}
                            </a>`;
            });
            
            navHTML += '</div>';
            navContainer.innerHTML = navHTML;
            
            // Nav Click handler logic: Bring to front or perform the close/open swap.
            navContainer.querySelectorAll('.nav-project-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetKey = e.target.getAttribute('data-target-key');
                    
                    if (!targetKey) return;

                    // 1. Prioritize: Check if a window for the target project is already open.
                    if (bringWindowsToFront(targetKey) > 0) {
                        // Windows were found and brought to front. We do NOT close the current window.
                        return;
                    }
                    
                    // 2. Fallback (No target window open): Perform the close/open swap
                    
                    // Prevent swapping to the current content
                    if (targetKey === title) return;

                    const currentWindow = newWindow; 
                    
                    // 2a. Capture the geometry of the current window.
                    const geometry = {
                        width: currentWindow.style.width,
                        height: currentWindow.style.height,
                        left: currentWindow.style.left,
                        top: currentWindow.style.top
                    };
                    
                    // 2b. Remove the current window from the DOM
                    currentWindow.remove();
                    
                    // 2c. Remove the reference from the map ONLY IF it is the one currently mapped to the title.
                    if (openWindowsMap.get(title) === currentWindow) {
                        openWindowsMap.delete(title); 
                    }
                    
                    // 2d. Open a brand NEW window with the target content and the captured geometry.
                    openNewWindow(targetKey, geometry); 
                });
                // Hardcoded hover color value to prevent theme change
                link.addEventListener('mouseover', (e) => { 
                    if (e.target.getAttribute('data-target-key') !== title) {
                        e.target.style.color = '#3399ff'; // Fixed hyperlink hover color
                    }
                });
                link.addEventListener('mouseout', (e) => { 
                    if (e.target.getAttribute('data-target-key') !== title) {
                        e.target.style.color = '#007aff'; // Fixed hyperlink color
                    } else {
                        e.target.style.color = '#000'; // Fixed text color
                    }
                });
            });
        }

        // Set Background Image (for styled apps - existing logic)
        if (useStyledTemplate) {
            // FIX: Convert the Title ("VS Code", "Photoshop") to the actual asset filename (e.g., "vscode.png")
            // This handles both the lowercasing and the removal of the space.
            let finalImageFileName = `${title.toLowerCase().replace(/\s/g, '')}.png`; 

            // FIX: Correct the folder casing from 'dock icons' to 'Dock Icons' (matching index.html)
            const imageURL = `/images/Dock Icons/${finalImageFileName}`; 
            
            const appContentContainer = newWindow.querySelector('.application-content');
            
            if (appContentContainer) {
                appContentContainer.style.backgroundImage = `url('${imageURL}')`;
                appContentContainer.style.backgroundRepeat = 'no-repeat'; 
                appContentContainer.style.backgroundPosition = '1vw 1vw'; 
                appContentContainer.style.backgroundSize = '2vw 2vw';      
            }
        }

        // Attach closing functionality (existing logic)
        newWindow.querySelector('.window-close-btn').addEventListener('click', () => {
            closeWindow(title);
        });

        newWindow.addEventListener('mousedown', () => {
            newWindow.style.zIndex = getNextZIndex();
        });

        // Initialize dragging and resizing (existing logic)
        makeWindowDraggable(newWindow);
        makeWindowResizable(newWindow);
        
        // Track the instance by its title key. This is a reference to the *latest* instance of this title.
        openWindowsMap.set(title, newWindow); 
        
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
            win.style.cursor = 'grabbing';
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
            win.style.cursor = 'move'; 
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
        };
        
        const content = win.querySelector('.window-content');
        if (content) {
            content.style.cursor = 'move';
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
                    
                    if (trashImage) {
                        // Apply the rotation via CSS transform
                        trashImage.style.transition = 'transform 0.3s ease-out'; // Add a smooth transition
                        trashImage.style.transform = `rotate(${trashRotationAngle}deg)`;
                        
                        // --- NEW: Check for 360 degree completion ---
                        if (trashRotationAngle % 360 === 0) {
                            showRotationMessage();
                        }
                    }
                    return; // Stop execution here
                }
                
                if (SINGLE_INSTANCE_APPS.includes(windowTitle)) {
                    // Check if an instance exists and bring it to front
                    const existingWindowsCount = bringWindowsToFront(windowTitle);
                    
                    if (existingWindowsCount === 0) {
                        // No window found, open a new one
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
            }
            
            const projectTitleElement = folder.querySelector('.ProjectText');
            const windowTitle = projectTitleElement.innerText.replace(/\s+/g, ' ').trim();
            
            // Logic: Check for existing windows.
            const existingWindowsCount = bringWindowsToFront(windowTitle);
            
            if (existingWindowsCount === 0) {
                // No windows found for this project, open a new one.
                openNewWindow(windowTitle);
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
    
    preloadHobbyImages();
});