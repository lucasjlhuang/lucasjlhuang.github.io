function makeMovable(folder, header) {
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    
    // Set initial grab cursor for the header
    header.style.cursor = 'move';

    function startDrag(e) {
        // Prevent text selection and default touch actions (like scrolling)
        e.preventDefault(); 
        isDragging = true;
        
        folder.classList.add('is-dragging'); 
        
        // CRITICAL: Switch position to absolute when dragging starts
        if (folder.style.position !== 'absolute') {
            const rect = folder.getBoundingClientRect();
            folder.style.position = 'absolute';
            folder.style.left = rect.left + 'px';
            folder.style.top = rect.top + 'px';
            // Remove auto-margins set by body alignment
            folder.style.margin = '0'; 
        }

        // Get client coordinates (supports both mouse and touch)
        const clientX = e.clientX || (e.touches?.[0]?.clientX || 0);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || 0);

        // Calculate the offset from the click/touch point to the top-left of the element
        offset = {
            x: clientX - folder.getBoundingClientRect().left,
            y: clientY - folder.getBoundingClientRect().top
        };
        header.style.cursor = 'grabbing';
    }

    function onDrag(e) {
        if (!isDragging) return;
        
        // Get client coordinates (supports both mouse and touch)
        const clientX = e.clientX || (e.touches?.[0]?.clientX || null);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || null);

        if (clientX !== null && clientY !== null) {
            // Update the element's position
            folder.style.left = (clientX - offset.x) + 'px';
            folder.style.top = (clientY - offset.y) + 'px';
        }
    }

    function endDrag() {
        if (isDragging) {
            isDragging = false;
            
            folder.classList.remove('is-dragging'); 
            
            header.style.cursor = 'move'; // Reset cursor
        }
    }

    // Attach listeners to the specific header and global document
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);

    // Touch support for mobile devices
    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
}


document.addEventListener('DOMContentLoaded', () => {
    // Select ALL headers
    const headers = document.querySelectorAll('.projectfolderheader');
    
    // Apply the drag logic to every folder/header pair
    headers.forEach(header => {
        const folder = header.closest('.projectfolder');
        if (folder) {
            makeMovable(folder, header);
        }
    });
});