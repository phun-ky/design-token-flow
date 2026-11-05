import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { DTCGDocument, flattenTokens } from '../../tokens';
import { FlowLane, layoutTokens } from '../layout-tokens';

const color = (r: number, g: number, b: number) => ({ $value: { colorSpace: 'srgb', components: [r, g, b] } });
const ids = (lane: FlowLane) => lane.columns.map((column) => column.map((token) => token.id));

describe('layoutTokens', () => {
  it('makes one lane per inheritance tree, with values in the last shared column', () => {
    const layout = layoutTokens(
      flattenTokens({
        color: {
          $type: 'color',
          base: { red: color(1, 0, 0), blue: color(0, 0, 1), unused: color(0, 1, 0) },
          accent: { $value: '{color.base.blue}' },
          cta: { $value: '{color.accent}' },
          error: { $value: '{color.base.red}' }
        },
        size: { $type: 'dimension', spacing: { sm: { $value: { value: 4, unit: 'px' } } } }
      } as unknown as DTCGDocument)
    );

    assert.equal(layout.columnCount, 3);
    // Lanes follow the document order of the values: red before blue
    assert.deepEqual(
      layout.flow.map(ids),
      [
        [[], ['color-error'], ['color-base-red']],
        [['color-cta'], ['color-accent'], ['color-base-blue']]
      ]
    );
    assert.equal(layout.flow[1].label, 'color.base.blue');
  });

  it('keeps unconnected tokens separate, grouped by type', () => {
    const { loose } = layoutTokens(
      flattenTokens({
        color: { $type: 'color', base: { red: color(1, 0, 0), blue: color(0, 0, 1) }, accent: { $value: '{color.base.blue}' } },
        size: { $type: 'dimension', spacing: { sm: { $value: { value: 4, unit: 'px' } } } }
      } as unknown as DTCGDocument)
    );

    assert.deepEqual(
      loose.map((lane) => [lane.label, lane.groups.map((group) => group.label), lane.groups.flatMap((group) => group.tokens.map((token) => token.id))]),
      [
        ['color', ['color / base'], ['color-base-red']],
        ['size', ['size / spacing'], ['size-spacing-sm']]
      ]
    );
  });

  it('puts tokens sharing an ancestor in the same lane, across types', () => {
    const { flow } = layoutTokens(
      flattenTokens({
        color: { $type: 'color', blue: color(0, 0, 1), accent: { $value: '{color.blue}' } },
        border: {
          focus: {
            $type: 'border',
            $value: { color: '{color.blue}', width: { value: 1, unit: 'px' }, style: 'solid' }
          }
        }
      } as unknown as DTCGDocument)
    );

    assert.equal(flow.length, 1);
    assert.deepEqual(ids(flow[0]), [['color-accent', 'border-focus'], ['color-blue']]);
  });

  it('orders aliases by the position of the tokens they reference', () => {
    const { flow } = layoutTokens(
      flattenTokens({
        color: {
          $type: 'color',
          a: color(1, 0, 0),
          b: color(0, 0, 1),
          mix: { $value: '{color.b}' },
          text: { $value: '{color.a}' },
          both: { border: { $type: 'border', $value: { color: '{color.a}', width: { value: 1, unit: 'px' }, style: 'solid' } }, other: { $type: 'border', $value: { color: '{color.b}', width: { value: 1, unit: 'px' }, style: 'solid' } } }
        }
      } as unknown as DTCGDocument)
    );

    // Two trees: one from `a`, one from `b`; within each, aliases follow their values
    assert.deepEqual(flow.map(ids), [
      [['color-text', 'color-both-border'], ['color-a']],
      [['color-mix', 'color-both-other'], ['color-b']]
    ]);
  });

  it('lays out the bundled tokens with every token placed once', () => {
    const doc = JSON.parse(readFileSync(new URL('../../assets/data/design-tokens.tokens.json', import.meta.url), 'utf8'));
    const tokens = flattenTokens(doc);
    const { columnCount, flow, loose } = layoutTokens(tokens);
    const placed = [
      ...flow.flatMap((lane) => lane.columns.flat()),
      ...loose.flatMap((lane) => lane.groups.flatMap((group) => group.tokens))
    ];

    assert.equal(placed.length, tokens.length);
    assert.equal(new Set(placed.map((token) => token.id)).size, tokens.length);
    assert.equal(columnCount, 4);

    const buttonLane = flow.find((lane) => lane.columns[0].some((token) => token.id === 'color-background-button-primary'));

    assert.deepEqual(ids(buttonLane as FlowLane), [
      ['color-background-button-primary'],
      ['color-cta'],
      ['color-accent-blue'],
      ['color-base-blue-100']
    ]);
  });
});
