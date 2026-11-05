import { getTheme, setTheme } from './theme';

// The Design Token Flow wave mark
const LOGO =
  '<svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false"><path fill="currentColor" d="M940.923 497.702q-9.705-11.742-19.401-22.465-9.705-10.217-19.915-19.409-9.704-8.678-20.427-16.85-9.705-7.66-20.933-14.806-11.75-7.146-25.023-13.273-12.255-6.128-25.529-10.218-12.768-4.082-26.041-6.633-13.282-2.558-27.069-3.064-12.254-1.026-25.015 0-12.768 1.02-25.023 3.57-12.255 2.045-24.51 5.622-13.273 3.569-26.555 7.659-12.255 4.082-24.51 9.191-13.273 5.101-26.041 10.723-11.742 4.596-22.978 9.697-12.255 5.622-23.997 11.75-10.21 4.595-19.914 10.21-10.723 5.108-20.933 10.722-11.236 5.615-21.446 11.237-10.723 5.614-20.428 11.741-9.191 5.615-17.87 10.723l-18.381 10.21q-9.192 5.11-18.383 9.705-8.686 4.595-17.877 9.19l-18.382 9.192q-8.678 4.083-17.87 8.173l-18.382 8.164q-9.704 4.09-18.895 8.173-12.76 5.614-25.529 10.21-12.255 4.595-24.51 8.172l-19.4 6.128q-13.788 3.577-28.088 6.64-13.786 2.551-28.086 4.083-13.274 1.532-26.548 2.045-13.281.505-26.555 0-10.723-.513-21.446-2.045-12.255-2.045-24.51-4.596-14.3-3.577-28.592-8.172-11.75-4.083-23.491-9.697 2.045 1.532 4.082 3.57 11.75 9.704 25.023 17.363 13.787 7.66 28.593 13.787 15.832 6.127 32.169 10.21 14.3 3.063 29.619 5.622 15.318 2.037 31.656 3.063 15.318 1.02 30.637 0 16.345-1.026 32.682-3.063 11.742-1.027 22.978-3.064 12.255-2.045 24.51-3.577 19.914-3.577 39.316-8.172 13.786-2.551 27.068-6.128 11.228-2.55 21.446-5.101 11.228-2.558 21.951-5.622l35.747-10.21q17.363-5.109 34.214-9.704 16.85-4.596 33.188-8.678 10.723-3.064 21.446-5.615 10.21-2.558 20.933-5.622 9.704-2.55 19.914-5.1 10.218-2.046 19.914-4.596l19.409-4.09 18.382-4.083q9.192-2.045 17.87-4.082 9.19-1.532 17.869-3.577 12.255-2.55 25.023-4.596 12.255-2.045 23.997-4.082 7.659-1.027 15.831-2.558 14.806-2.038 30.125-3.064 11.236-1.019 22.472-1.532 14.806-.505 29.611 0 11.236 0 21.96.513 14.805 1.019 29.105 2.55 14.3 2.046 28.592 4.596 13.787 2.045 27.574 5.622 17.363 4.083 34.214 9.697-7.146-11.229-15.319-21.952-7.659-10.723-15.318-20.427z"/></svg>';
const SUN =
  '<svg class="app-theme-switch-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></g></svg>';
const MOON =
  '<svg class="app-theme-switch-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

/**
 * The site's pages, in menu order. Links leave out `.html`: GitHub Pages, the
 * Vite dev server and `vite preview` all serve `playground.html` at `playground`.
 */
export const PAGES = [
  { id: 'flow', label: 'Flow', href: './' },
  { id: 'playground', label: 'Playground', href: './playground' }
] as const;

export type PageId = (typeof PAGES)[number]['id'];

/**
 * Which page a path belongs to. The site can be served from any sub path, so
 * only the last segment counts; anything that is not the playground is the
 * flow view (including `/` and `/index.html`). Both `playground` and
 * `playground.html` are the playground.
 *
 * @param {string} pathname A URL path, such as `location.pathname`
 * @returns {PageId} The page's id
 */
export const getPageId = (pathname: string): PageId => {
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);

  return /^playground(\.html)?$/.test(last) ? 'playground' : 'flow';
};

/**
 * Adds the global header to the top of the page: the site title and the menu,
 * with a link to each page and the light/dark switch.
 *
 * @param {string} [pathname] The current path, to mark the current page
 * @returns {HTMLElement} The header element
 */
export const mountHeader = (
  pathname: string = location.pathname
): HTMLElement => {
  const current = getPageId(pathname);
  const links = PAGES.map(
    ({ id, label, href }) =>
      `<a class="app-header-link" href="${href}"${id === current ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('');
  const header = document.createElement('header');

  header.className = 'app-header';
  header.innerHTML = `
    <a class="app-header-title" href="./">
      <span class="app-header-logo">${LOGO}</span>
      <span class="app-header-name">Design Token Flow</span>
    </a>
    <nav class="app-header-menu" aria-label="Site">
      <div class="app-header-links">${links}</div>
      <button type="button" class="app-theme-switch" role="switch" aria-label="Dark theme">
        <span class="app-theme-switch-knob">${SUN}${MOON}</span>
      </button>
    </nav>
  `;

  const toggle = header.querySelector('.app-theme-switch') as HTMLButtonElement;
  const sync = () => {
    const isDark = getTheme() === 'dark';

    toggle.setAttribute('aria-checked', String(isDark));
    toggle.title = `Switch to ${isDark ? 'light' : 'dark'} theme`;
  };

  toggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    sync();
  });
  sync();
  document.body.prepend(header);

  return header;
};
