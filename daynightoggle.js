// script.js

const toggleButton = document.getElementById('mode-toggle');
const body = document.body;
const THEME_KEY = 'portfolio-theme';

// 1. Function to apply the theme
function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
    } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
    }
}

// 2. Load theme on page load (Preference from Local Storage or OS)
document.addEventListener('DOMContentLoaded', () => {
    let savedTheme = localStorage.getItem(THEME_KEY);
    
    // Check for OS preference only if no theme is saved
    if (!savedTheme) {
        // Check if the user's OS prefers dark mode
        const prefersDark = window.matchMedia && 
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
        savedTheme = prefersDark ? 'dark' : 'light';
    }
    
    applyTheme(savedTheme);
});

// 3. Toggle theme on button click
toggleButton.addEventListener('click', () => {
    // Check current mode by looking for the 'dark-mode' class
    const isDarkMode = body.classList.contains('dark-mode');
    
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    // Apply the new theme
    applyTheme(newTheme);
    
    // Save the new theme preference
    localStorage.setItem(THEME_KEY, newTheme);
});