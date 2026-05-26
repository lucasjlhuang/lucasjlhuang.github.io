function makeMovable(folder, header) {
    let isDragging = false;
    let hasDragged  = false; // true only if the mouse actually moved during drag
    let offset = { x: 0, y: 0 };

    // Cursor is handled entirely by cursors.css

    function startDrag(e) {
        if (e.target.closest('.window')) return;
        e.preventDefault();
        isDragging = true;
        hasDragged  = false;

        folder.classList.add('is-dragging');

        const rect = folder.getBoundingClientRect();
        // Use setProperty('important') so drag positions beat any CSS !important rules
        folder.style.setProperty('position', 'absolute', 'important');
        folder.style.setProperty('left', rect.left + 'px', 'important');
        folder.style.setProperty('top',  rect.top  + 'px', 'important');
        folder.style.margin = '0';

        const clientX = e.clientX || (e.touches?.[0]?.clientX || 0);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || 0);

        offset = {
            x: clientX - folder.getBoundingClientRect().left,
            y: clientY - folder.getBoundingClientRect().top,
        };
        document.body.classList.add('is-dragging');
    }

    function onDrag(e) {
        if (!isDragging) return;
        hasDragged = true;

        const clientX = e.clientX || (e.touches?.[0]?.clientX || null);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || null);

        if (clientX !== null && clientY !== null) {
            folder.style.setProperty('left', (clientX - offset.x) + 'px', 'important');
            folder.style.setProperty('top',  (clientY - offset.y) + 'px', 'important');
        }
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        folder.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging');

        // If the mouse actually moved, swallow the next click so external
        // links don't open after a drag on system-static folders (or any folder)
        if (hasDragged) {
            folder.addEventListener('click', e => e.preventDefault(), { once: true, capture: true });
        }
        hasDragged = false;
    }

    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup',   endDrag);

    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', onDrag,   { passive: false });
    document.addEventListener('touchend',  endDrag);
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