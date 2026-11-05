import 'global-jsdom/register';

// Node has its own CustomEvent, which global-jsdom leaves in place, and jsdom
// only dispatches its own events; a browser has just the one
globalThis.CustomEvent = window.CustomEvent;

import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { THEME_STORAGE_KEY, getTheme, setTheme } from '../theme';

describe('theme', () => {
  afterEach(() => {
    mock.restoreAll();
    document.documentElement.classList.remove('theme--light');
    localStorage.clear();
  });

  it('is dark unless the light class is set', () => {
    assert.equal(getTheme(), 'dark');
    document.documentElement.classList.add('theme--light');
    assert.equal(getTheme(), 'light');
  });

  it('applies, stores and announces the theme', () => {
    const seen: string[] = [];
    const onChange = (event: Event) =>
      seen.push((event as CustomEvent<string>).detail);

    document.addEventListener('dtf:themechange', onChange);
    setTheme('light');
    assert.equal(getTheme(), 'light');
    assert.equal(localStorage.getItem(THEME_STORAGE_KEY), 'light');
    setTheme('dark');
    assert.equal(getTheme(), 'dark');
    assert.equal(localStorage.getItem(THEME_STORAGE_KEY), 'dark');
    document.removeEventListener('dtf:themechange', onChange);
    assert.deepEqual(seen, ['light', 'dark']);
  });

  it('still applies the theme when storage throws', () => {
    mock.method(Storage.prototype, 'setItem', () => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    assert.doesNotThrow(() => setTheme('light'));
    assert.equal(getTheme(), 'light');
  });
});
