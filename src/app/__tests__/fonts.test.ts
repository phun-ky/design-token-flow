import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DesignTokenFontFace } from '../../tokens';
import { loadFonts } from '../fonts';

class FakeFontFace {
  constructor(
    public family: string,
    public source: string,
    public descriptors: Record<string, string>
  ) {
    if (descriptors.weight === 'invalid') throw new SyntaxError('weight');
  }
}

const fontSet = () => {
  const faces: FakeFontFace[] = [];

  return { faces, set: { add: (face: FakeFontFace) => faces.push(face) } };
};
const face = (
  family: string,
  descriptors: Record<string, string> = {}
): DesignTokenFontFace => ({
  id: family,
  family,
  source: `url("./fonts/${family}.woff2") format("woff2")`,
  descriptors: { display: 'swap', ...descriptors }
});
const load = (
  faces: DesignTokenFontFace[],
  set: ReturnType<typeof fontSet>['set']
) =>
  loadFonts(faces, {
    fonts: set as unknown as FontFaceSet,
    FontFaceClass: FakeFontFace as unknown as typeof FontFace
  });

describe('loadFonts', () => {
  it('adds a FontFace per face, with its source and descriptors', () => {
    const { faces, set } = fontSet();
    const added = load([face('A', { weight: '100 700' }), face('B')], set);

    assert.equal(added.length, 2);
    assert.deepEqual(
      faces.map((f) => [f.family, f.source, f.descriptors]),
      [
        [
          'A',
          'url("./fonts/A.woff2") format("woff2")',
          { display: 'swap', weight: '100 700' }
        ],
        ['B', 'url("./fonts/B.woff2") format("woff2")', { display: 'swap' }]
      ]
    );
  });

  it('adds each face once per font set', () => {
    const first = fontSet();
    const second = fontSet();

    load([face('A'), face('A')], first.set);
    assert.equal(load([face('A'), face('C')], first.set).length, 1);
    assert.deepEqual(
      first.faces.map((f) => f.family),
      ['A', 'C']
    );
    assert.equal(load([face('A')], second.set).length, 1);
  });

  it('skips a face the browser rejects, and keeps the rest', () => {
    const { faces, set } = fontSet();

    load([face('Bad', { weight: 'invalid' }), face('Good')], set);
    assert.deepEqual(
      faces.map((f) => f.family),
      ['Good']
    );
  });
});
