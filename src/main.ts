'use strict';

import { Arclace } from '@phun-ky/arclace';

import { mountHeader } from './app/header';
import { createZoom, mountZoomControls } from './app/zoom';
import tokens from './assets/data/design-tokens.tokens.json';
import DesignToken from './classes/DesignToken';
import { FlowLane, layoutTokens, LooseLane, TokenGroup } from './layout/layout-tokens';
import { DTCGDocument, FlatDesignToken, flattenTokens } from './tokens';
import * as node from './utils/node';

/** Column heading for an alias depth: 0 is literal values */
const columnLabel = (depth: number): string => (depth === 0 ? 'Values' : `Alias level ${depth}`);
const DTF = function (this: typeof DTF, raw_tokens: DTCGDocument) {
  this._raw_tokens = raw_tokens;
  this._tokens = <DesignToken[]>[];
  this._init();
};

DTF.prototype._process_tokens = function (this: typeof DTF) {
  this._tokens.forEach((token: DesignToken) => {
    token.process();
  });
};

DTF.prototype._create_token = function (this: typeof DTF, token: FlatDesignToken): HTMLElement {
  const _design_token = new DesignToken(token);

  this._tokens.push(_design_token);

  return _design_token.el;
};

DTF.prototype._create_group = function (this: typeof DTF, group: TokenGroup): HTMLElement {
  const _group_el = node.create({ type: 'section', classNames: 'token-group' });
  const _list_el = node.create({ type: 'div', classNames: 'token-group-list' });

  group.tokens.forEach((token) => _list_el.appendChild(this._create_token(token)));
  _group_el.append(node.create({ type: 'h4', classNames: 'token-group-label', textContent: group.label }), _list_el);

  return _group_el;
};

/**
 * Inheritance: one stack of tokens per alias depth, most derived on the left, values on
 * the right. Every stack uses the same gap between tokens. Stacks are filled lane by lane
 * (inheritance tree by tree), so each token sits near the tokens it inherits from.
 */
DTF.prototype._create_flow = function (this: typeof DTF, lanes: FlowLane[], columnCount: number): HTMLElement {
  const _section_el = node.create({ type: 'section', classNames: 'flow' });
  const _header_el = node.create({ type: 'div', classNames: 'flow-row flow-header' });
  const _columns_el = node.create({ type: 'div', classNames: 'flow-row' });

  _section_el.setAttribute('aria-label', 'Inheritance');
  // The header and the stacks use the section's columns (subgrid), so they line up
  _section_el.style.setProperty('--flow-columns', String(columnCount));

  Array.from({ length: columnCount }, (_, column) => {
    const _column_el = node.create({ type: 'div', classNames: 'flow-column' });

    _header_el.appendChild(
      node.create({ type: 'span', classNames: 'column-label', textContent: columnLabel(columnCount - 1 - column) })
    );
    lanes.forEach((lane) => lane.columns[column].forEach((token) => _column_el.appendChild(this._create_token(token))));
    _columns_el.appendChild(_column_el);
  });

  _section_el.append(
    node.create({ type: 'h2', classNames: 'section-label', textContent: 'Inheritance' }),
    _header_el,
    _columns_el
  );

  return _section_el;
};

/**
 * Tokens without any alias relation, in wrapped groups per type.
 */
DTF.prototype._create_loose = function (this: typeof DTF, lanes: LooseLane[]): HTMLElement {
  const _section_el = node.create({ type: 'section', classNames: 'loose' });

  _section_el.appendChild(node.create({ type: 'h2', classNames: 'section-label', textContent: 'Unconnected' }));
  lanes.forEach((lane) => {
    const _lane_el = node.create({ type: 'section', classNames: 'lane-loose' });
    const _groups_el = node.create({ type: 'div', classNames: 'lane-groups' });

    _lane_el.dataset.lane = lane.key;
    lane.groups.forEach((group) => _groups_el.appendChild(this._create_group(group)));
    _lane_el.append(node.create({ type: 'h3', classNames: 'lane-label', textContent: lane.label }), _groups_el);
    _section_el.appendChild(_lane_el);
  });

  return _section_el;
};

DTF.prototype._setup_tokens = function (this: typeof DTF) {
  if (!this._raw_tokens) return;

  const { columnCount, flow, loose } = layoutTokens(flattenTokens(this._raw_tokens));

  if (flow.length) this._container_el.appendChild(this._create_flow(flow, columnCount));

  if (loose.length) this._container_el.appendChild(this._create_loose(loose));
};

/**
 * Moves each stack of aliases vertically, as a whole, so its tokens line up on average
 * with the tokens they inherit from. Gaps inside a stack stay the same. Runs from the
 * values outwards, so every stack aligns with already placed ancestors, and keeps each
 * stack within the rows the columns share.
 */
DTF.prototype._align_columns = function (this: typeof DTF) {
  const _row_el = this._container_el.querySelector('.flow-row:not(.flow-header)') as HTMLElement | null;

  if (!_row_el) return;

  const _by_id = new Map<string, HTMLElement>(this._tokens.map((token: DesignToken) => [token.id, token.el]));
  const _center = (el: HTMLElement) => {
    const _rect = el.getBoundingClientRect();

    return _rect.top + _rect.height / 2;
  };
  const _mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const _columns = [..._row_el.children] as HTMLElement[];

  _columns
    .slice(0, -1)
    .reverse()
    .forEach((column) => {
      const _pills = [...column.children] as HTMLElement[];
      const _ancestor_centers = _pills.flatMap((pill) =>
        (pill.dataset.ancestors ?? '')
          .split(',')
          .map((id) => _by_id.get(id))
          .filter((el): el is HTMLElement => !!el)
          .map(_center)
      );

      if (!_pills.length || !_ancestor_centers.length) return;

      const _row = _row_el.getBoundingClientRect();
      const _rect = column.getBoundingClientRect();
      const _offset = _mean(_ancestor_centers) - _mean(_pills.map(_center));
      const _clamped = Math.min(Math.max(_offset, _row.top - _rect.top), _row.bottom - _rect.bottom);

      column.style.transform = `translateY(${_clamped}px)`;
    });
};

/**
 * Draws a line from every rendered token to each rendered token it references.
 * Arclace keeps the lines in sync with resizes, scrolling and DOM changes.
 */
DTF.prototype._connect_tokens = function (this: typeof DTF) {
  const _by_id = new Map<string, DesignToken>(this._tokens.map((token: DesignToken) => [token.id, token]));

  this._tokens.forEach((token: DesignToken) => {
    token.token.ancestors.forEach((ancestor_id) => {
      const _start_token = _by_id.get(ancestor_id);

      if (!_start_token) return;

      this._arclace.connect(_start_token.el, token.el, {
        id: `${ancestor_id}--${token.id}`,
        className: 'dtf-line'
      });
      _start_token.el.classList.add('is-connected');
      token.el.classList.add('is-connected');
    });
  });
};

DTF.prototype._init = function (this: typeof DTF) {
  this._container_el = document.querySelector('.container');
  this._setup_tokens();
  this._align_columns();
  this._arclace = new Arclace({
    container: this._container_el,
    // Lines start at the ancestor, which is always in a column to the right of the token using it
    defaults: { strokeWidth: 1.5, startSide: 'left', endSide: 'right' }
  });
  this._connect_tokens();
  this._process_tokens();
};

mountHeader();
new DTF(tokens as DTCGDocument);

// The canvas: wheel zooms around the pointer (Shift: around the center), dragging pans
mountZoomControls((onChange) =>
  createZoom(document.querySelector('.app-viewport') as HTMLElement, document.querySelector('.container') as HTMLElement, onChange)
);
