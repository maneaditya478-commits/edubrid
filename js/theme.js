(function() {
    const THEME_KEY = 'edubridge_theme';
    const DARK_COLOR = '#0f172a';
    const LIGHT_COLOR = '#764ba2';

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.body.classList.toggle('theme-dark', isDark);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.textContent = isDark ? '☀️' : '🌙';
        }

        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', isDark ? DARK_COLOR : LIGHT_COLOR);
        }

        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    }

    function initTheme() {
        const saved = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(saved);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
                applyTheme(next);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', initTheme);

    // Expose for other scripts if needed
    window.applyTheme = applyTheme;
})();


