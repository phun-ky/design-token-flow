import '../src/styles/index.css';
import './playground.css';

import { Arclace } from '@phun-ky/arclace';

import { loadFonts } from '../src/app/fonts';
import { mountHeader } from '../src/app/header';
import bundledTokens from '../src/assets/data/design-tokens.tokens.json';
import {
  createDesignTokenElement,
  DTCGDocument,
  FlatDesignToken,
  flattenTokens,
  getDesignTokenKind,
  getFontFaces,
  renderDesignToken,
  toCssValue
} from '../src/tokens';

import showcaseTokens from './showcase.tokens.json';

type Preset = 'showcase' | 'bundled' | 'custom';

const PRESETS: Record<Exclude<Preset, 'custom'>, unknown> = {
  showcase: showcaseTokens,
  bundled: bundledTokens
};
const STORAGE_KEY = 'dtf-demo';
const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;
const sourceEl = $<HTMLTextAreaElement>('#source');
const presetEl = $<HTMLSelectElement>('#preset');
const prefixEl = $<HTMLInputElement>('#prefix');
const filterEl = $<HTMLInputElement>('#filter');
const errorEl = $<HTMLParagraphElement>('#error');
const groupsEl = $<HTMLDivElement>('#groups');
const countEl = $<HTMLSpanElement>('#count');
const detailsEl = $<HTMLElement>('#details');
// Arclace adds its SVG overlay to #groups, so the pills are rendered into a list next to it
const arclace = new Arclace({
  container: groupsEl,
  defaults: {
    arrow: 'end',
    strokeWidth: 1.5,
    className: 'dtf-line demo-relation'
  }
});
const listEl = document.createElement('div');

groupsEl.append(listEl);

let tokens: FlatDesignToken[] = [];
let selectedId: string | null = null;

// Per-viewer convenience only: remember the preset and the last edited JSON
const storage = {
  read(): { preset?: Preset; custom?: string } {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  },
  write(patch: Record<string, string>) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...storage.read(), ...patch })
      );
    } catch {
      /* storage unavailable */
    }
  }
};
const escape = (value: string) =>
  value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
const json = (value: unknown) => escape(JSON.stringify(value, null, 2));
const showError = (message?: string) => {
  errorEl.hidden = !message;
  errorEl.textContent = message ?? '';
};
const parse = () => {
  try {
    tokens = flattenTokens(JSON.parse(sourceEl.value) as DTCGDocument);
    // Fonts the tokens describe; the Content Security Policy only allows
    // files from the site itself
    loadFonts(getFontFaces(tokens));
    showError();
  } catch (error) {
    tokens = [];
    showError((error as Error).message);
  }

  render();
};
const render = () => {
  const query = filterEl.value.trim().toLowerCase();
  const prefix = prefixEl.value;
  const visible = tokens.filter(
    (token) =>
      !query ||
      token.name.toLowerCase().includes(query) ||
      token.$type.toLowerCase().includes(query)
  );
  const groups = new Map<string, FlatDesignToken[]>();

  visible.forEach((token) => {
    const key =
      token.path.slice(0, Math.min(2, token.path.length - 1)).join(' / ') ||
      '(root)';

    groups.set(key, [...(groups.get(key) ?? []), token]);
  });

  countEl.textContent = `${visible.length} of ${tokens.length}`;
  listEl.replaceChildren(
    ...[...groups].map(([name, groupTokens]) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const list = document.createElement('div');

      section.className = 'demo-group';
      heading.textContent = name;
      list.className = 'tokens';
      groupTokens.forEach((token) => {
        let pill: HTMLElement;

        try {
          pill = createDesignTokenElement(token, { prefix });
        } catch (error) {
          pill = document.createElement('span');
          pill.className = 'demo-pill-error';
          pill.textContent = `${token.name}: ${(error as Error).message}`;
        }

        pill.tabIndex = 0;
        pill.dataset.demoId = token.id;
        list.append(pill);
      });
      section.append(heading, list);

      return section;
    })
  );

  highlight(selectedId);
};
const byId = (id: string | null) => tokens.find((token) => token.id === id);
const highlight = (id: string | null) => {
  const token = byId(id);
  const related = new Set([
    ...(token?.ancestors ?? []),
    ...(token?.descendants ?? [])
  ]);

  listEl.querySelectorAll<HTMLElement>('[data-demo-id]').forEach((pill) => {
    pill.classList.toggle('is-selected', pill.dataset.demoId === id);
    pill.classList.toggle(
      'is-related',
      related.has(pill.dataset.demoId as string)
    );
  });

  // Arrows point from the referenced token to the token that references it
  const pillFor = (tokenId: string) =>
    listEl.querySelector<HTMLElement>(
      `[data-demo-id="${CSS.escape(tokenId)}"]`
    );
  const pill = token ? pillFor(token.id) : null;

  arclace.clear();

  if (!token || !pill) return;

  token.ancestors.forEach((ancestorId) => {
    const ancestor = pillFor(ancestorId);

    if (ancestor) arclace.connect(ancestor, pill);
  });
  token.descendants.forEach((descendantId) => {
    const descendant = pillFor(descendantId);

    if (descendant) arclace.connect(pill, descendant);
  });
};
const relationButtons = (ids: string[]) =>
  ids.length
    ? ids
        .map(
          (id) =>
            `<button type="button" class="demo-link" data-select="${escape(id)}">${escape(id)}</button>`
        )
        .join(' ')
    : '<span class="demo-muted">none</span>';
const select = (id: string | null) => {
  const token = byId(id);

  selectedId = token ? token.id : null;
  highlight(selectedId);

  if (!token) return;

  let html: string;
  let css: string;

  try {
    html = renderDesignToken(token, { prefix: prefixEl.value });
    css = toCssValue(token);
  } catch (error) {
    html = css = `Error: ${(error as Error).message}`;
  }

  detailsEl.innerHTML = `
    <h2>${escape(token.name)}</h2>
    <dl class="demo-dl">
      <dt>id</dt><dd><code>${escape(token.id)}</code></dd>
      <dt>$type</dt><dd><code>${escape(token.$type)}</code></dd>
      <dt>Pill variant</dt><dd><code>${escape(getDesignTokenKind(token))}</code></dd>
      <dt>CSS value</dt><dd><code>${escape(css)}</code></dd>
      ${token.$description ? `<dt>$description</dt><dd>${escape(token.$description)}</dd>` : ''}
      ${token.$deprecated ? `<dt>$deprecated</dt><dd>${escape(String(token.$deprecated))}</dd>` : ''}
      <dt>Ancestors</dt><dd>${relationButtons(token.ancestors)}</dd>
      <dt>Descendants</dt><dd>${relationButtons(token.descendants)}</dd>
    </dl>
    <h3>$value</h3>
    <pre>${json(token.$value)}</pre>
    ${token.aliasOf || token.ancestors.length ? `<h3>Resolved value</h3><pre>${json(token.value)}</pre>` : ''}
    ${token.$extensions ? `<h3>$extensions</h3><pre>${json(token.$extensions)}</pre>` : ''}
    <h3>renderDesignToken() <button type="button" class="demo-link" id="copy">copy</button></h3>
    <pre class="demo-html">${escape(html)}</pre>
  `;

  detailsEl.querySelector('#copy')?.addEventListener('click', (event) => {
    navigator.clipboard?.writeText(html).then(() => {
      (event.target as HTMLElement).textContent = 'copied';
    });
  });
};
const loadPreset = (preset: Preset) => {
  const saved = storage.read();

  sourceEl.value =
    preset === 'custom'
      ? (saved.custom ?? JSON.stringify(PRESETS.showcase, null, 2))
      : JSON.stringify(PRESETS[preset], null, 2);
  presetEl.value = preset;
  storage.write({ preset });
  parse();
};

let parseTimer: number | undefined;

sourceEl.addEventListener('input', () => {
  presetEl.value = 'custom';
  storage.write({ preset: 'custom', custom: sourceEl.value });
  window.clearTimeout(parseTimer);
  parseTimer = window.setTimeout(parse, 250);
});
presetEl.addEventListener('change', () => loadPreset(presetEl.value as Preset));
prefixEl.addEventListener('input', () => {
  render();
  select(selectedId);
});
filterEl.addEventListener('input', render);

const selectFromEvent = (event: Event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-demo-id], [data-select]'
  );

  if (target) select(target.dataset.demoId ?? target.dataset.select ?? null);
};

groupsEl.addEventListener('click', selectFromEvent);
groupsEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectFromEvent(event);
  }
});
detailsEl.addEventListener('click', selectFromEvent);

let hoveredId: string | null = null;

groupsEl.addEventListener('mouseover', (event) => {
  const pill = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-demo-id]'
  );

  // mouseover also fires for the pill's children, only redraw when the pill changes
  if (!pill || pill.dataset.demoId === hoveredId) return;

  hoveredId = pill.dataset.demoId as string;
  highlight(hoveredId);
});
groupsEl.addEventListener('mouseleave', () => {
  hoveredId = null;
  highlight(selectedId);
});

mountHeader();
loadPreset(storage.read().preset ?? 'showcase');
