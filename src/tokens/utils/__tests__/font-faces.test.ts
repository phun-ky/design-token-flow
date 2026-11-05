import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DTCGDocument } from '../../types/tokens';
import { DTF_EXTENSION_KEY, flattenTokens } from '../design-tokens';
import { getFontFaces } from '../font-faces';

const faces = (doc: DTCGDocument) => getFontFaces(flattenTokens(doc));

describe('getFontFaces', () => {
  it('reads the files and descriptors of a font family token', () => {
    assert.deepEqual(
      faces({
        font: {
          var: {
            $type: 'fontFamily',
            $value: 'IBM Plex Sans Var',
            $extensions: {
              [DTF_EXTENSION_KEY]: {
                files: { woff2: './fonts/IBM Plex Sans Var-Roman.woff2' },
                'font-face': { weight: '100 700', style: 'normal' }
              }
            }
          }
        }
      }),
      [
        {
          id: 'font-var',
          family: 'IBM Plex Sans Var',
          source:
            'url("./fonts/IBM%20Plex%20Sans%20Var-Roman.woff2") format("woff2")',
          descriptors: { display: 'swap', weight: '100 700', style: 'normal' }
        }
      ]
    );
  });

  it('lists formats in the order browsers should try them', () => {
    const [face] = faces({
      sans: {
        $type: 'fontFamily',
        $value: 'Sans',
        $extensions: {
          [DTF_EXTENSION_KEY]: {
            files: {
              eot: 'a.eot',
              ttf: 'a.ttf',
              woff: 'a.woff',
              otf: 'a.otf',
              woff2: 'a.woff2',
              svg: 'a.svg'
            }
          }
        }
      }
    });

    assert.equal(
      face.source,
      [
        'url("a.woff2") format("woff2")',
        'url("a.woff") format("woff")',
        'url("a.ttf") format("truetype")',
        'url("a.otf") format("opentype")',
        'url("a.eot") format("embedded-opentype")'
      ].join(', ')
    );
  });

  it('keeps a quote in a path from closing the url', () => {
    const [face] = faces({
      sans: {
        $type: 'fontFamily',
        $value: 'Sans',
        $extensions: {
          [DTF_EXTENSION_KEY]: { files: { woff2: 'a") x("b.woff2' } }
        }
      }
    });

    assert.equal(face.source, 'url("a%22)%20x(%22b.woff2") format("woff2")');
  });

  it('uses the first family of a list, and lets display be overridden', () => {
    const [face] = faces({
      sans: {
        $type: 'fontFamily',
        $value: ['Sans', 'Arial'],
        $extensions: {
          [DTF_EXTENSION_KEY]: {
            files: { woff2: 'a.woff2' },
            'font-face': { display: 'block', weight: 700, unknown: 'x' }
          }
        }
      }
    });

    assert.equal(face.family, 'Sans');
    assert.deepEqual(face.descriptors, { display: 'block' });
  });

  it('skips tokens without files, other types and aliases', () => {
    assert.deepEqual(
      faces({
        plain: { $type: 'fontFamily', $value: 'Plain' },
        nothing: {
          $type: 'fontFamily',
          $value: 'Nothing',
          $extensions: { [DTF_EXTENSION_KEY]: { files: { svg: 'a.svg' } } }
        },
        asset: {
          $type: 'fontFamily',
          $value: 'Asset',
          $extensions: { [DTF_EXTENSION_KEY]: { files: { woff2: 'a.woff2' } } }
        },
        alias: { $type: 'fontFamily', $value: '{asset}' },
        size: {
          $type: 'dimension',
          $value: { value: 1, unit: 'rem' },
          $extensions: { [DTF_EXTENSION_KEY]: { files: { woff2: 'a.woff2' } } }
        }
      }).map((face) => face.id),
      ['asset']
    );
  });
});
