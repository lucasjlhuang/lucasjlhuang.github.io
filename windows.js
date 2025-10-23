document.addEventListener('DOMContentLoaded', () => {
    // Select both dock items and project folders
    const dockItems = document.querySelectorAll('.dock li a');
    const projectFolders = document.querySelectorAll('.projectfolder');
    
    const windowTemplate = document.getElementById('window-template');
    const desktop = document.querySelector('.desktop');
    
    // Map to track currently open windows
    const openWindowsMap = new Map(); 

    // /window.js (near the top with WINDOW_CONTENT_MAP)

    // ⭐ New Map for custom display titles
    const DISPLAY_TITLE_MAP = {
        // Dock Icons: Key is the original data-label, Value is the desired display text
        "Photoshop": "Adobe Photoshop", 
        "Illustrator": "Adobe Illustrator",
        "VS Code": "Visual Studio Code",
        "Why me?": "Why me?",
        "Trash": "Trash",
        "Figma": "Figma",
        
        // Project Folders: Key is the cleaned project text
        "BANK OF TAIWAN": "Bank of Taiwan",
        "CANADIAN HYPERLOOP CONFERENCE": "Canadian Hyperloop Conference",
        "VOGRO": "Vogro",
        "WEB GALLERY": "Web Gallery",
        "ABOUT ME": "About Me"
    };

    // ⭐ NEW: Map for Custom Default Window Sizes (Width x Height) ⭐
    const WINDOW_SIZE_MAP = {
        "Photoshop": { width: '20vw', height: '5vh' },
        "Illustrator": { width: '20vw', height: '10vh' },
        "VS Code": { width: '20vw', height: '10vh' },
        "Figma": { width: '20vw', height: '10vh' },
        "Trash": { width: '20vw', height: '30vh' },
        "Why me?": { width: '35vw', height: '45vh' },
        "Hobbies": { width: '60vw', height: '20vh' }
        // Add specific sizes for other titles here
        // Titles not listed will use the generic default size below.
    };
    
    
    // Helper Functions
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
        let maxZ = 1001; 
        document.querySelectorAll('.window:not([style*="display: none"])').forEach(win => {
            const z = parseInt(win.style.zIndex);
            if (!isNaN(z) && z > maxZ) {
                maxZ = z;
            }
        });
        return maxZ + 1;
    }

    function toggleWindow(title) {
        if (openWindowsMap.has(title)) {
            closeWindow(title);
        } else {
            openNewWindow(title);
        }
    }

    function closeWindow(title) {
        const windowToClose = openWindowsMap.get(title);
        if (windowToClose) {
            windowToClose.remove();
            openWindowsMap.delete(title);
        }
    }
    
    function openNewWindow(title) {
    const defaultTemplate = windowTemplate; // The standard template

    // ⭐ 1. Define the titles for the new styled windows ⭐
    const styledApps = ["Photoshop", "Illustrator", "VS Code", "Figma"];
    const useStyledTemplate = styledApps.includes(title);
    
    // Select the correct template to clone
    const templateToUse = useStyledTemplate ? 
                          document.getElementById('styled-window-template') : 
                          defaultTemplate;
                          
    const newWindow = templateToUse.cloneNode(true);
    newWindow.id = ''; 
    newWindow.style.display = 'flex'; 
    newWindow.style.zIndex = getNextZIndex(); 

    // --- Apply Custom or Default Size (from previous step) ---
    const defaultWidth = '700px';
    const defaultHeight = '500px';
    const customSize = WINDOW_SIZE_MAP[title];

    newWindow.style.width = customSize ? customSize.width : defaultWidth;
    newWindow.style.height = customSize ? customSize.height : defaultHeight;

    // Positioning logic
    const offset = (openWindowsMap.size % 5) * 20;
    newWindow.style.top = `calc(15vh + ${offset}px)`;
    newWindow.style.left = `calc(20vw + ${offset}px)`;

    // Get the display title
    const displayTitle = DISPLAY_TITLE_MAP[title] || capitalizeTitle(title);
    newWindow.querySelector('.window-title').textContent = displayTitle;
    
    // ⭐ 2. Set Repeating Background Image ⭐
   // ⭐ 5. Set Background Image (for styled apps) ⭐
        if (useStyledTemplate) {
            // Construct the image URL based on the window title (e.g., Photoshop -> /images/Photoshop.png)
            const imageURL = `/images/dock icons/${title}.png`; // ASSUMES YOUR IMAGES ARE NAMED LIKE THE TITLE
            // The content container for styled windows has the class 'application-content'
            const appContentContainer = newWindow.querySelector('.application-content');
            
            if (appContentContainer) {
                appContentContainer.style.backgroundImage = `url('${imageURL}')`;
                
                // ⭐ CHANGES START HERE ⭐
                appContentContainer.style.backgroundRepeat = 'no-repeat'; // Prevents repetition
                appContentContainer.style.backgroundPosition = '1vw 1vw'; // Positions the image to the top-left
                appContentContainer.style.backgroundSize = '2vw 2vw';      // Use the image's original size
                // ⭐ CHANGES END HERE ⭐
            }
        }


    // 3. Attach closing functionality (find the button wherever it is)
    // The selector works for BOTH templates!
    newWindow.querySelector('.window-close-btn').addEventListener('click', () => {
        closeWindow(title);
    });

    // ... (rest of the function remains the same) ...
    newWindow.addEventListener('mousedown', () => {
        newWindow.style.zIndex = getNextZIndex();
    });

    // Initialize dragging and resizing
    makeWindowDraggable(newWindow);
    makeWindowResizable(newWindow);

    desktop.appendChild(newWindow);
    openWindowsMap.set(title, newWindow); 
}

    // Window dragging logic (now applied to the whole window, not just the header)
    function makeWindowDraggable(win) {
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        win.addEventListener('mousedown', (e) => { // Listener is on the whole window 'win'
            
            // Exclude the close button, resize handles, and interactive content
            if (e.target.classList.contains('window-close-btn') || 
                e.target.classList.contains('window-resize-handle') || 
                e.target.closest('.window-resize-handle')
            ) {
                return;
            }

            // CRITICAL: Exclude interactive elements (links, buttons, form fields) inside the content.
            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
            if (interactiveTags.includes(e.target.tagName) || e.target.closest('a, button, input, textarea, select')) {
                return;
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
        
        // Set default cursor for the window content area
        const content = win.querySelector('.window-content');
        if (content) {
            content.style.cursor = 'move';
        }
    }
    
    // Window resizing logic (includes the final, aggressive fix)
    function makeWindowResizable(win) {
        const handles = win.querySelectorAll('.window-resize-handle');
        const minWidth = parseInt(getComputedStyle(win).minWidth) || 250;
        const minHeight = parseInt(getComputedStyle(win).minHeight) || 200;

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
                        // Side handles (for a complete implementation, uncomment these)
                        // case 'left':
                        //     newWidth = startWidth - diffX;
                        //     newX = startLeft + diffX;
                        //     break;
                        // case 'right':
                        //     newWidth = startWidth + diffX;
                        //     break;
                        // case 'top':
                        //     newHeight = startHeight - diffY;
                        //     newY = startTop + diffY;
                        //     break;
                        // case 'bottom':
                        //     newHeight = startHeight + diffY;
                        //     break;
                        default:
                            // Handle single side resizing here if needed, otherwise default to ignoring it
                            break;
                    }

                    // 1. Width Logic (Handles Left Resizing and minWidth constraint)
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

                    // 2. Height Logic (Handles Top Resizing and minHeight constraint)
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


    // --- 1. Handle Dock Item Clicks (Existing Logic) ---
    dockItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Only targets items with href="#"
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
                const listItem = item.closest('li');
                const windowTitle = listItem.getAttribute('data-label');
                toggleWindow(windowTitle);
            }
        });
    });

    // --- 2. Handle Project Folder Clicks (Existing Logic) ---
   // Project Folder Toggles (Click logic)
    projectFolders.forEach(folder => {
        let isMoving = false; 
        let startX = 0;
        let startY = 0;
        // ⭐ INCREASED THRESHOLD: Must move more than 10px to be considered a drag ⭐
        const DRAG_THRESHOLD = 10; 

        folder.addEventListener('mousedown', (e) => {
            // Stop propagation to prevent interference, but allow it to bubble up to the document
            e.stopPropagation();
            
            isMoving = false;
            startX = e.clientX;
            startY = e.clientY;
            
            // Start checking for movement when mouse is down
            document.addEventListener('mousemove', checkMovement);
        });

        const checkMovement = (e) => {
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);

            if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
                isMoving = true;
                // Once movement is confirmed, stop checking movement
                document.removeEventListener('mousemove', checkMovement); 
            }
        };

        // Attach a simple handler to the document's mouseup to clean up the checkMovement listener
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', checkMovement);
            // NOTE: isMoving is reset inside the 'click' handler below.
        });
        
        folder.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (isMoving) {
                // If movement (drag) was detected, block the window from opening.
                isMoving = false; // ⭐ CRITICAL: Reset the flag for the next interaction
                return;
            }
            
            // Only runs if isMoving is false (a true click)
            const projectTitleElement = folder.querySelector('.ProjectText');
            const windowTitle = projectTitleElement.innerText.replace(/\s+/g, ' ').trim();
            
            toggleWindow(windowTitle);
        });
    });
});