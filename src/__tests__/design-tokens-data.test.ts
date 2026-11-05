import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { flattenTokens, toCssValue } from '../tokens';

describe('bundled token file', () => {
  it('parses as DTCG 2025.10 and resolves every token', () => {
    const doc = JSON.parse(
      readFileSync(
        new URL('../assets/data/design-tokens.tokens.json', import.meta.url),
        'utf8'
      )
    );
    const tokens = flattenTokens(doc);
    const byId = Object.fromEntries(tokens.map((token) => [token.id, token]));

    assert.equal(tokens.length, 201);
    assert.equal(toCssValue(byId['color-cta']), '#0054f0');
    assert.deepEqual(byId['color-cta'].ancestors, ['color-accent-blue']);
    assert.equal(toCssValue(byId['size-breakpoint-min-md']), '75rem');
    assert.equal(byId['font-family-sans'].$type, 'fontFamily');
    assert.equal(toCssValue(byId['font-family-sans']), '"IBM Plex Sans"');
    assert.deepEqual(byId['font-family-sans-bold-italic'].ancestors, [
      'asset-font-ibm-plex-sans-bold-italic-name'
    ]);
    assert.deepEqual(
      tokens
        .filter((token) => token.$type === 'fontWeight')
        .map((t) => t.$value),
      [100, 200, 300, 400, 450, 500, 600, 700]
    );
    tokens.forEach((token) =>
      assert.doesNotThrow(() => toCssValue(token), token.name)
    );
  });
});
