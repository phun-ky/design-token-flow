export type Theme = 'light' | 'dark';

/**
 * localStorage key for the chosen theme. The inline script in each page's `<head>`
 * reads the same key, so the theme is applied before the first paint.
 */
export const THEME_STORAGE_KEY = 'dtf-theme';

const LIGHT_CLASS = 'theme--light';

export const getTheme = (): Theme => (document.documentElement.classList.contains(LIGHT_CLASS) ? 'light' : 'dark');

/**
 * Applies a theme and remembers it for this browser. Dark is the default styling,
 * light is `:root.theme--light`.
 */
export const setTheme = (theme: Theme): void => {
  document.documentElement.classList.toggle(LIGHT_CLASS, theme === 'light');

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode, blocked site data): the theme still applies
  }

  document.dispatchEvent(new CustomEvent<Theme>('dtf:themechange', { detail: theme }));
};
