import 'global-jsdom/register';

// Node has its own CustomEvent, which global-jsdom leaves in place, and jsdom
// only dispatches its own events; a browser has just the one
globalThis.CustomEvent = window.CustomEvent;

import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { PAGES, getPageId, mountHeader } from '../header';

describe('getPageId', () => {
  it('finds the playground from the last path segment', () => {
    assert.equal(getPageId('/playground.html'), 'playground');
    assert.equal(getPageId('/design-token-flow/playground.html'), 'playground');
    assert.equal(getPageId('/design-token-flow/playground'), 'playground');
  });

  it('treats every other path as the flow view', () => {
    assert.equal(getPageId('/'), 'flow');
    assert.equal(getPageId(''), 'flow');
    assert.equal(getPageId('/design-token-flow/'), 'flow');
    assert.equal(getPageId('/design-token-flow/index.html'), 'flow');
    assert.equal(getPageId('/playground.html/other'), 'flow');
    assert.equal(getPageId('/my-playground.html'), 'flow');
  });
});

describe('mountHeader', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('links every page, relative to the current folder', () => {
    const header = mountHeader('/design-token-flow/');
    const links = [...header.querySelectorAll('.app-header-link')];

    assert.deepEqual(
      links.map((link) => [link.textContent, link.getAttribute('href')]),
      PAGES.map(({ label, href }) => [label, href])
    );
    assert.equal(document.body.firstElementChild, header);
  });

  it('marks only the current page', () => {
    const header = mountHeader('/design-token-flow/playground.html');
    const current = header.querySelectorAll('[aria-current="page"]');

    assert.equal(current.length, 1);
    assert.equal(current[0].textContent, 'Playground');
  });

  it('reads the current page from the location by default', () => {
    const header = mountHeader();

    assert.equal(
      header.querySelector('[aria-current="page"]')?.textContent,
      getPageId(location.pathname) === 'playground' ? 'Playground' : 'Flow'
    );
  });

  it('keeps the theme switch in the menu', () => {
    const header = mountHeader('/');
    const toggle = header.querySelector('.app-header-menu .app-theme-switch');

    assert.ok(toggle);
    assert.equal(toggle.getAttribute('role'), 'switch');
  });

  it('switches the theme and reports the new state', () => {
    const header = mountHeader('/');
    const toggle = header.querySelector(
      '.app-theme-switch'
    ) as HTMLButtonElement;
    const root = document.documentElement;
    const wasDark = toggle.getAttribute('aria-checked') === 'true';

    toggle.click();

    assert.equal(toggle.getAttribute('aria-checked'), String(!wasDark));
    assert.equal(root.classList.contains('theme--light'), wasDark);
    assert.equal(toggle.title, `Switch to ${wasDark ? 'dark' : 'light'} theme`);

    toggle.click();

    assert.equal(toggle.getAttribute('aria-checked'), String(wasDark));
    assert.equal(root.classList.contains('theme--light'), !wasDark);
  });
});
