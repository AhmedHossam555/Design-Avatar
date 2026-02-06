/**
 * Theme Management System
 * Handles dark/light theme toggling with localStorage persistence
 * and system preference detection
 */

(function initThemeSystem() {
  'use strict';

  // Configuration
  const CONFIG = {
    storageKey: 'avatar-theme-preference',
    themeAttribute: 'data-theme',
    themes: {
      DARK: 'dark',
      LIGHT: 'light'
    },
    metaThemeColor: {
      dark: '#060641',
      light: '#f5f7fa'
    }
  };

  // Cache DOM references
  const root = document.documentElement;

  /**
   * Detects user's system theme preference
   * @returns {string} 'dark' or 'light'
   */
  function getSystemThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return CONFIG.themes.DARK;
    }
    return CONFIG.themes.LIGHT;
  }

  /**
   * Retrieves stored theme preference from localStorage
   * @returns {string|null} Stored theme or null
   */
  function getStoredTheme() {
    try {
      return localStorage.getItem(CONFIG.storageKey);
    } catch (error) {
      console.warn('Unable to access localStorage:', error);
      return null;
    }
  }

  /**
   * Stores theme preference in localStorage
   * @param {string} theme - Theme to store
   */
  function storeTheme(theme) {
    try {
      localStorage.setItem(CONFIG.storageKey, theme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }

  /**
   * Updates the theme color meta tag for mobile browsers
   * @param {string} theme - Current theme
   */
  function updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        CONFIG.metaThemeColor[theme] || CONFIG.metaThemeColor.dark
      );
    }
  }

  /**
   * Updates ARIA attributes for theme toggle button
   * @param {string} theme - Current theme
   */
  function updateThemeButtonAria(theme) {
    const themeButton = document.querySelector('.hero__theme-toggle');
    if (themeButton) {
      const isDark = theme === CONFIG.themes.DARK;
      themeButton.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeButton.setAttribute(
        'aria-label',
        `Switch to ${isDark ? 'light' : 'dark'} theme`
      );
    }
  }

  /**
   * Applies theme to the document
   * @param {string} theme - Theme to apply
   * @param {boolean} skipTransition - Skip transition animation
   */
  function applyTheme(theme, skipTransition = false) {
    // Optionally disable transitions for initial load
    if (skipTransition) {
      root.style.transition = 'none';
    }

    // Set theme attribute
    root.setAttribute(CONFIG.themeAttribute, theme);

    // Update meta theme color
    updateMetaThemeColor(theme);

    // Update button ARIA attributes
    updateThemeButtonAria(theme);

    // Store preference
    storeTheme(theme);

    // Re-enable transitions
    if (skipTransition) {
      // Force reflow
      root.offsetHeight;
      root.style.transition = '';
    }

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme }
    }));
  }

  /**
   * Initializes theme on page load
   */
  function initializeTheme() {
    const storedTheme = getStoredTheme();
    const systemTheme = getSystemThemePreference();
    const initialTheme = storedTheme || systemTheme;

    // Apply theme without transition on initial load
    applyTheme(initialTheme, true);
  }

  /**
   * Toggles between dark and light themes
   */
  function toggleTheme() {
    const currentTheme = root.getAttribute(CONFIG.themeAttribute);
    const newTheme = currentTheme === CONFIG.themes.DARK 
      ? CONFIG.themes.LIGHT 
      : CONFIG.themes.DARK;

    applyTheme(newTheme, false);
  }

  /**
   * Listens for system theme changes
   */
  function watchSystemThemeChanges() {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Modern browsers
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', (event) => {
        // Only apply if user hasn't set a manual preference
        if (!getStoredTheme()) {
          const newTheme = event.matches ? CONFIG.themes.DARK : CONFIG.themes.LIGHT;
          applyTheme(newTheme, false);
        }
      });
    }
    // Legacy browsers
    else if (darkModeQuery.addListener) {
      darkModeQuery.addListener((event) => {
        if (!getStoredTheme()) {
          const newTheme = event.matches ? CONFIG.themes.DARK : CONFIG.themes.LIGHT;
          applyTheme(newTheme, false);
        }
      });
    }
  }

  /**
   * Keyboard shortcut handler (Ctrl/Cmd + Shift + D)
   */
  function handleKeyboardShortcut(event) {
    // Ctrl/Cmd + Shift + D to toggle theme
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      toggleTheme();
    }
  }

  // Initialize theme system
  initializeTheme();
  watchSystemThemeChanges();

  // Add keyboard shortcut
  document.addEventListener('keydown', handleKeyboardShortcut);

  // Expose toggleTheme globally for button onclick
  window.toggleTheme = toggleTheme;

  // Expose theme utilities for external use
  window.themeSystem = {
    getCurrentTheme: () => root.getAttribute(CONFIG.themeAttribute),
    setTheme: (theme) => {
      if (Object.values(CONFIG.themes).includes(theme)) {
        applyTheme(theme, false);
      }
    },
    resetToSystemTheme: () => {
      localStorage.removeItem(CONFIG.storageKey);
      applyTheme(getSystemThemePreference(), false);
    }
  };

})();