document.addEventListener('DOMContentLoaded', () => {
    
    
    // Select both dock items and project folders
    const dockItems = document.querySelectorAll('.dock li a');
    const projectFolders = document.querySelectorAll('.projectfolder');
    
    const windowTemplate = document.getElementById('window-template');
    const desktop = document.querySelector('.desktop');
    
    // Map to track currently open windows (used by 'closeWindow' and for initial offset calculations)
    // IMPORTANT: openWindowsMap now stores { windowElement, folderRect } for project windows
    const openWindowsMap = new Map(); 

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
                return projectText && projectText.innerText.replace(/\s+/g, ' ').trim() !== "ABOUT ME";
            });

            targetFolders.forEach(folder => {
                folder.addEventListener('mouseenter', () => {
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
        // Source, dimensions (doubled), and upright rotation
        // Initial position (initial_x in vw, initial_y in vh) - Used if no saved position exists
        { src: "images/Hobbies/MAJ.png", alt: "Mahjong", width: 360, height: 450, initial_x: 10, initial_y: 15, rotate: 0 },
        { src: "images/Hobbies/Warhammer.png", alt: "Warhammer", width: 240, height: 360, initial_x: 70, initial_y: 45, rotate: 0 },
        { src: "/images/Hobbies/Guitar.png", alt: "Electric Guitar", width: 260, height: 400, initial_x: 55, initial_y: 10, rotate: 0 }, 
        { src: "images/Hobbies/Travel.png", alt: "Travel", width: 360, height: 320, initial_x: 80, initial_y: 20, rotate: 0 }, 
        { src: "/images/Hobbies/MTG.png", alt: "MTG", width: 260, height: 320, initial_x: 5, initial_y: 50, rotate: 0 }, 
        { src: "/images/Hobbies/Lifedrawing.png", alt: "Life Drawing", width: 280, height: 280, initial_x: 50, initial_y: 60, rotate: 0 }, 
    ];


    // ⭐ List of all 5 project keys for static navigation (unchanged) ⭐
    const PROJECT_TITLES = [
        "ABOUT ME",
        "VOGRO",
        "BANK OF TAIWAN",
        "CANADIAN HYPERLOOP CONFERENCE",
        "BETTERMIND"
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
        "HESS": "HESS Education",
        "ABOUT ME": "About Me",
        "BETTERMIND": "Bettermind"
    };

    // ⭐ Map for Custom Default Window Sizes (UNCHANGED) ⭐
    const WINDOW_SIZE_MAP = {
        "Photoshop": { width: '375px', height: '150px' },
        "Illustrator": { width: '375px', height: '150px' },
        "VS Code": { width: '375px', height: '150px' },
        "Figma": { width: '375px', height: '150px' },
        
        "ABOUT ME:": { width: '600px', height: '400px' },
        
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

    // UPDATED: Toggles the sprawled images for Hobbies with Genie-like animation and persistence
    function toggleHobbySprawl() {
        const existingImages = document.querySelectorAll('.sprawled-hobby-image');
        const iconRect = getHobbiesIconRect();

        if (!iconRect) {
            existingImages.forEach(img => img.remove());
            return;
        }

        // Custom cubic-bezier for a strong, swoopy acceleration/deceleration (Genie approximation)
        const genieEasing = GENIE_EASING;
        const transitionDuration = TRANSITION_DURATION;

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
    
        // Start the random growth sequence
        // 1. Grab all folders and convert to an Array
        const folders = Array.from(document.querySelectorAll('.projectfolder'));

        // 2. Fisher-Yates Shuffle Algorithm (shuffles the order of the array)
        for (let i = folders.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [folders[i], folders[j]] = [folders[j], folders[i]];
        }

        // 3. Trigger the growth with a consistent rhythm
        // Even though the timing is 200ms every time, the ORDER is random
        setTimeout(() => {
            folders.forEach((folder, index) => {
                setTimeout(() => {
                    folder.classList.add('appear');
                }, index * 200); // Change 200 to 100 for faster or 300 for slower rhythm
            });
        }, 200); // Initial 0.5s delay before the first one pops
    
    
    // UPDATED: Movable logic for the new images (now saves position)
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
            element.style.transition = `left ${TRANSITION_DURATION} ${GENIE_EASING}, top ${TRANSITION_DURATION} ${GENIE_EASING}, width ${TRANSITION_DURATION} ${GENIE_EASING}, height ${TRANSITION_DURATION} ${GENIE_EASING}, opacity ${TRANSITION_DURATION} ease-out, transform ${TRANSITION_DURATION} ease-out, box-shadow 0.1s`;
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
        };
    }
    
    // ⭐ MODIFIED: openNewWindow now applies coloring and a color transition to title and content.
    function openNewWindow(title, geometry = {}, folderElement = null) {
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
            // Case B: Center and dynamically offset the window for specified apps
            const windowWidth = newWindow.offsetWidth;
            const windowHeight = newWindow.offsetHeight;
            const centerX = (window.innerWidth / 2) - (windowWidth / 2);
            const centerY = (window.innerHeight / 2) - (windowHeight / 2);
            let offsetCount = getCenteredAppCount() - 1;
            offsetCount = Math.max(0, offsetCount); 
            // Corrected offset to use pixels consistently
            const offset = offsetCount * 20; 

            targetX = `calc(${centerX}px + ${offset}px)`;
            targetY = `calc(${centerY}px + ${offset}px)`;
        } else {
            // ⭐ Case C: New Random Default Position (for Genie Final Destination & Standard Opens) ⭐
            // X: 30% to 50%
            // Y: 10% to 30%
            const randomX = Math.random() * 35 + 5; // 30.0 to 49.99...
            const randomY = Math.random() * 15 + 5; // 10.0 to 29.99...
            
            targetX = `${randomX}vw`;
            targetY = `${randomY}vh`;
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
                
                // After the transition, remove overflow:hidden so content displays correctly
                newWindow.addEventListener('transitionend', function removeOverflow(e) {
                    if (e.propertyName === 'opacity') {
                        newWindow.style.overflow = 'hidden';
                        newWindow.removeEventListener('transitionend', removeOverflow);
                        // Reset transition to 'none' so dragging/resizing isn.t sluggish.
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
        }
        
       // --- Content & Title Injection ---
    const displayTitle = DISPLAY_TITLE_MAP[title] || capitalizeTitle(title);
    const titleElement = newWindow.querySelector('.window-title');
    titleElement.textContent = displayTitle;
    
    // 1. Generate the filename (e.g., "BANK OF TAIWAN" -> "bank-of-taiwan.html")
    const safeTitle = title.toLowerCase().replace(/\s+/g, '-');
    const fileName = `projects/${safeTitle}.html`;
    
    const contentContainer = newWindow.querySelector('.window-content');

    // --- Transition Styles ---
    const colorTransition = 'color 0.8s ease-in-out';
    titleElement.style.transition = colorTransition;
    contentContainer.style.transition = colorTransition;

    const currentColor = getCurrentTextColor();
    titleElement.style.color = currentColor;
    contentContainer.style.color = currentColor;

    // 2. Fetch external content if it's NOT a styled app (like Photoshop)
    if (!useStyledTemplate) {
        // Show a temporary loading state
        contentContainer.innerHTML = `<div class="loading-state" style="padding: 20px; opacity: 0.5;">Loading ${displayTitle}...</div>`;

       /* windows.js - Inside openNewWindow() fetch block */

fetch(fileName)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Could not find ${fileName}`);
        }
        return response.text();
    })
    .then(html => {
        // Inject the fetched HTML into the window
        contentContainer.innerHTML = html;
        
        // ⭐ NEW: Trigger Slide-Up Animation for Project Content
        // We check if it's a project folder and NOT the "About Me" window
        if (isProjectFolder && title !== "ABOUT ME") {
            const mainContent = contentContainer.querySelector('main');
            if (mainContent) {
                // We use a small timeout (50ms) to ensure the browser 
                // recognizes the initial hidden state before animating.
                setTimeout(() => {
                    mainContent.classList.add('visible');
                }, 50);
            }
        }
        
        if (title === "ABOUT ME") {
            initSlideshow();
        }
    })
            .catch(err => {
                console.error("Fetch error:", err);
                contentContainer.innerHTML = `
                    <div style="padding: 20px; color: #ff3b30;">
                        <h3 style="margin-top: 0;">Update Needed</h3>
                        <p>Unable to load <strong>${fileName}</strong>.</p>
                        <p><small>Error: ${err.message}</small></p>
                    </div>`;
            });
    }
    
    
        
        // --- Static Navigation Bar (existing logic) ---
        const navContainer = newWindow.querySelector('.window-footer-nav');
        
        if (navContainer && isProjectFolder) { 
            const allProjects = PROJECT_TITLES;
            
            // ⭐ NEW/UPDATED: Define the common transition for size/font change ⭐
            const navTransition = 'color 0.1s, font-size 0.3s, transform 0.3s'; // Transition for smooth magnification effect

            let navHTML = '<div class="window-nav-inner" style="display: flex; justify-content: space-around; width: 100%; border-top: 1px solid var(--border-color); padding: 15px 0px 12px 0;">';
            
            allProjects.forEach(projectKey => {
                const navTitle = DISPLAY_TITLE_MAP[projectKey] || capitalizeTitle(projectKey);
                const isActive = projectKey === title;

                // ⭐ CORRECTED ACTIVE LINK STYLES: Now includes !important for guaranteed size/scale match ⭐
// ⭐ CORRECTED ACTIVE LINK STYLES: Now guarantees size and scale match with !important flags ⭐
                const activeStyle = `text-decoration: none; color: #3399ff; font-family: 'SFBold'; font-size: 1.1rem !important; cursor: default; transform: scale(1.1) !important; transition: ${navTransition};`;                
                // ⭐ INACTIVE LINK STYLES: Normal size, normal font (Base style, will be overridden on hover) ⭐
                const inactiveStyle = `color: #007aff; font-weight: normal; font-family: sans-serif; text-decoration: none; font-size: 0.8rem; cursor: pointer; transform: scale(1.0); transition: ${navTransition};`;

                const navStyle = isActive ? activeStyle : inactiveStyle;
                    
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
                    
                    // 2b. Get the desktop folder element for the *target* project (where the OLD window will collapse to).
                    const targetFolderElement = getProjectFolderElement(targetKey);

                    // 2c. Close the current window (which contains the OLD content)
                    //     Set bypassAnimation to TRUE to instantly remove the old window without animation.
                    closeWindow(title, true, targetFolderElement); 
                    
                    // 2d. Open a brand NEW window with the target content
                    //     - Pass the captured geometry to open instantly in the same spot.
                    //     - Pass folderElement = null (default) to skip the open Genie animation.
                    openNewWindow(targetKey, geometry); 
                });
                
                // ⭐ UPDATED: Apply SFBold and Magnification on Mouseover (for INACTIVE links only) ⭐
                link.addEventListener('mouseover', (e) => { 
                    const targetKey = e.target.getAttribute('data-target-key');
                    
                    if (targetKey !== title) { // Only apply to inactive links
                        // Apply color and magnification/boldness
                        e.target.style.color = '#3399ff'; // Fixed hyperlink hover color
                        e.target.style.fontWeight = 'bold'; 
                        e.target.style.fontFamily = '"SFBold", sans-serif'; 
                        e.target.style.fontSize = '1.1rem'; 
                        e.target.style.transform = 'scale(1.1)'; 
                    }
                });

                // ⭐ UPDATED: Remove Magnification on Mouseout (for INACTIVE links only) ⭐
                link.addEventListener('mouseout', (e) => { 
                    const targetKey = e.target.getAttribute('data-target-key');
                    
                    if (targetKey !== title) { // Only apply to inactive links
                        // Revert to inactive style
                        e.target.style.color = '#007aff'; // Fixed hyperlink color
                        e.target.style.fontWeight = 'normal';
                        e.target.style.fontFamily = 'sans-serif'; // Revert to generic sans-serif
                        e.target.style.fontSize = '0.8rem'; 
                        e.target.style.transform = 'scale(1.0)';
                    }
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
                appContentContainer.style.backgroundPosition = '1vw 1vw'; 
                appContentContainer.style.backgroundSize = '2vw 2vw';      
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
}

    // Start observing the body element for attribute changes (specifically 'class')
    observer.observe(document.body, { attributes: true });
    // ⭐ END MutationObserver Setup ⭐
    
    preloadHobbyImages();
});