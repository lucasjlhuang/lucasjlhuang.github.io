// slideshow.js
let slideshowInterval;
let autoScrollInterval;

// slideshow.js

function initSlideshow() {
    let slideIndex = 0;
    let cycleCount = 0;
    const slides = document.getElementsByClassName("mySlides");
    // Use a more specific selector to find the container inside the window
    const dotContainer = document.querySelector(".window-about-me #dotContainer"); 
    const container = document.querySelector(".about-slideshow");
    const textColumn = document.querySelector(".about-me-text");

    if (slides.length === 0 || !container) return;

    // --- GENERATE DOTS ---
    if (dotContainer) {
        dotContainer.innerHTML = ""; // Clear old dots
        for (let i = 0; i < slides.length; i++) {
            const span = document.createElement("span");
            span.classList.add("dot");
            dotContainer.appendChild(span);
        }
        console.log("Dots generated:", slides.length);
    } else {
        console.error("Could not find dotContainer!");
    }

    const dots = document.getElementsByClassName("dot");
    // ... rest of your script

    // --- 2. RESET STATE ---
    clearInterval(autoScrollInterval);
    clearTimeout(slideshowInterval);
    if (textColumn) {
        textColumn.classList.remove("visible");
        textColumn.scrollTop = 0;
    }

    function updateDisplay() {
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
            if (dots[i]) dots[i].classList.remove("active");
        }
        slides[slideIndex - 1].style.display = "block";
        if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");
    }

    function startAutoScroll() {
        setTimeout(() => {
            autoScrollInterval = setInterval(() => {
                textColumn.scrollTop += .5;
                if (textColumn.scrollTop + textColumn.clientHeight >= textColumn.scrollHeight) {
                    clearInterval(autoScrollInterval);
                }
            }, 30);
        }, 1000);
    }

    // Stop scroll if user interacts
    if (textColumn) {
        textColumn.onwheel = () => clearInterval(autoScrollInterval);
        textColumn.onmousedown = () => clearInterval(autoScrollInterval);
    }

    function showSlides() {
    slideIndex++;
    
    // 1. Keep the flicker going through the images
    if (slideIndex > slides.length) {
        slideIndex = 1;
        cycleCount++;
    }

    updateDisplay();

    if (cycleCount < 1) {
        // Continue flickering fast
        slideshowInterval = setTimeout(showSlides, 100); 
    } else {
        // --- 2. THE RANDOMIZATION STEP ---
        // Flicker is done. Now, pick a truly random slide to land on.
        slideIndex = Math.floor(Math.random() * slides.length) + 1;
        
        // Update the display one last time to show the random slide
        updateDisplay();

        // 3. Show text and start scroll
        if (textColumn) {
            textColumn.classList.add("visible");
            startAutoScroll();
        }
    }
}

    // Start logic after window animation
    setTimeout(showSlides, 400);

    // Manual Click
    container.onclick = () => {
        slideIndex++;
        if (slideIndex > slides.length) slideIndex = 1;
        updateDisplay();
    };
}