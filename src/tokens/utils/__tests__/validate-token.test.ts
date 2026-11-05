import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { flattenTokens, fontFamilyToCss } from '../design-tokens';
import { validateTokenValue } from '../validate-token';

const srgb = (hex = '#0054f0') => ({
  colorSpace: 'srgb',
  components: [0, 0.33, 0.94],
  hex
});
const px = (value: unknown = 1, unit: unknown = 'px') => ({ value, unit });
const ms = (value: unknown = 100, unit: unknown = 'ms') => ({ value, unit });
const shadow = {
  color: srgb(),
  offsetX: px(),
  offsetY: px(),
  blur: px(),
  spread: px()
};
const typography = {
  fontFamily: ['IBM Plex Sans', 'sans-serif'],
  fontSize: px(1, 'rem'),
  fontWeight: 400,
  letterSpacing: px(0),
  lineHeight: 1.5
};

/** Asserts the error class, and that the message names the token and field */
const rejects = (
  $type: unknown,
  value: unknown,
  ErrorType: typeof TypeError | typeof RangeError,
  field: string
) =>
  assert.throws(
    () => validateTokenValue('group.token', $type, value),
    (error: Error) => {
      assert.equal(error.constructor, ErrorType, error.message);
      assert.match(error.message, /^Invalid token "group\.token" \(/);
      assert.ok(
        error.message.includes(`): ${field} must be `),
        `expected field ${field} in: ${error.message}`
      );

      return true;
    }
  );

describe('validateTokenValue', () => {
  it('accepts every value shape the spec allows', () => {
    const valid: [string, unknown][] = [
      ['color', srgb()],
      ['color', { colorSpace: 'srgb', components: [1, 'none', 0], alpha: 0.5 }],
      ['color', { colorSpace: 'hsl', components: [359.9, 100, 0] }],
      ['color', { colorSpace: 'lab', components: [50, -160, 160] }],
      ['color', { colorSpace: 'oklch', components: [1, 0.4, 0] }],
      ['color', { colorSpace: 'xyz-d50', components: [0, 1, 0.5] }],
      ['dimension', px(-0.5, 'rem')],
      ['duration', ms(0.2, 's')],
      ['fontFamily', 'IBM Plex Sans'],
      ['fontFamily', ['IBM Plex Sans', "O'Neil Sans", 'sans-serif']],
      ['fontWeight', 1],
      ['fontWeight', 1000],
      ['fontWeight', 'semi-bold'],
      ['cubicBezier', [0, -2, 1, 3]],
      ['number', -1.5],
      ['strokeStyle', 'dashed'],
      ['strokeStyle', { dashArray: [px(2), px(4)], lineCap: 'round' }],
      ['border', { color: srgb(), width: px(), style: 'solid' }],
      [
        'transition',
        { duration: ms(), delay: ms(0), timingFunction: [0.5, 0, 1, 1] }
      ],
      ['shadow', shadow],
      ['shadow', [shadow, { ...shadow, inset: true }]],
      [
        'gradient',
        [
          { color: srgb(), position: -0.5 },
          { color: srgb(), position: 1.5 }
        ]
      ],
      ['typography', typography],
      ['typography', { ...typography, fontWeight: 'bold' }]
    ];

    valid.forEach(([$type, value]) =>
      assert.doesNotThrow(
        () => validateTokenValue('group.token', $type, value),
        `${$type} ${JSON.stringify(value)}`
      )
    );
  });

  it('rejects a $type that is not a string or not in the spec', () => {
    rejects(undefined, 1, TypeError, '$type');
    rejects('size', 1, RangeError, '$type');
    // Not an own property of the checks, even though objects have it
    rejects('toString', 1, RangeError, '$type');
  });

  it('rejects colors with the wrong shape or out of range', () => {
    rejects('color', '#0054f0', TypeError, '$value');
    rejects(
      'color',
      { ...srgb(), colorSpace: 1 },
      TypeError,
      '$value.colorSpace'
    );
    rejects(
      'color',
      { ...srgb(), colorSpace: 'rgb' },
      RangeError,
      '$value.colorSpace'
    );
    rejects(
      'color',
      { ...srgb(), components: [0, 0] },
      TypeError,
      '$value.components'
    );
    rejects(
      'color',
      { ...srgb(), components: [0, '1', 0] },
      TypeError,
      '$value.components[1]'
    );
    rejects(
      'color',
      { ...srgb(), components: [0, NaN, 0] },
      TypeError,
      '$value.components[1]'
    );
    rejects(
      'color',
      { ...srgb(), components: [0, 0, 1.1] },
      RangeError,
      '$value.components[2]'
    );
    rejects(
      'color',
      { colorSpace: 'hsl', components: [360, 0, 0] },
      RangeError,
      '$value.components[0]'
    );
    rejects(
      'color',
      { colorSpace: 'oklch', components: [0.5, -0.1, 0] },
      RangeError,
      '$value.components[1]'
    );
    rejects('color', { ...srgb(), alpha: 2 }, RangeError, '$value.alpha');
    rejects('color', { ...srgb(), hex: 255 }, TypeError, '$value.hex');
    rejects('color', srgb('#05f'), RangeError, '$value.hex');
  });

  it('rejects dimensions and durations with the wrong value or unit', () => {
    rejects('dimension', '1px', TypeError, '$value');
    rejects('dimension', px('1'), TypeError, '$value.value');
    rejects('dimension', px(Infinity), TypeError, '$value.value');
    rejects('dimension', px(1, 'em'), RangeError, '$value.unit');
    rejects('dimension', px(1, 2), TypeError, '$value.unit');
    rejects('duration', ms(1, 'px'), RangeError, '$value.unit');
  });

  it('rejects font families and weights outside the spec', () => {
    rejects('fontFamily', [], TypeError, '$value');
    rejects('fontFamily', ' ', TypeError, '$value');
    rejects('fontFamily', ['Sans', 3], TypeError, '$value[1]');
    rejects('fontFamily', ['Sans\n; x: y'], RangeError, '$value[0]');
    rejects('fontWeight', 0, RangeError, '$value');
    rejects('fontWeight', 1001, RangeError, '$value');
    rejects('fontWeight', 'boldest', RangeError, '$value');
    rejects('fontWeight', true, TypeError, '$value');
  });

  it('rejects numbers, curves and stroke styles with the wrong shape', () => {
    rejects('number', '1', TypeError, '$value');
    rejects('cubicBezier', [0, 0, 1], TypeError, '$value');
    rejects('cubicBezier', [1.5, 0, 1, 1], RangeError, '$value[0]');
    rejects('cubicBezier', [0, 0, -0.1, 1], RangeError, '$value[2]');
    rejects('strokeStyle', 'wavy', RangeError, '$value');
    rejects('strokeStyle', 1, TypeError, '$value');
    rejects(
      'strokeStyle',
      { dashArray: [], lineCap: 'round' },
      TypeError,
      '$value.dashArray'
    );
    rejects(
      'strokeStyle',
      { dashArray: [px('2')], lineCap: 'round' },
      TypeError,
      '$value.dashArray[0].value'
    );
    rejects(
      'strokeStyle',
      { dashArray: [px()], lineCap: 'flat' },
      RangeError,
      '$value.lineCap'
    );
  });

  it('checks every part of a composite value', () => {
    rejects(
      'border',
      { color: srgb(), width: px(), style: 'wavy' },
      RangeError,
      '$value.style'
    );
    rejects(
      'border',
      { color: srgb('#000; x'), width: px(), style: 'solid' },
      RangeError,
      '$value.color.hex'
    );
    rejects(
      'transition',
      { duration: ms(), delay: ms(), timingFunction: 'ease' },
      TypeError,
      '$value.timingFunction'
    );
    rejects('shadow', [], TypeError, '$value');
    rejects(
      'shadow',
      [shadow, { ...shadow, blur: px(1, 'pt') }],
      RangeError,
      '$value[1].blur.unit'
    );
    rejects('shadow', { ...shadow, inset: 'yes' }, TypeError, '$value.inset');
    rejects(
      'gradient',
      [{ color: srgb(), position: '50%' }],
      TypeError,
      '$value[0].position'
    );
    rejects('gradient', {}, TypeError, '$value');
    rejects(
      'typography',
      { ...typography, letterSpacing: undefined },
      TypeError,
      '$value.letterSpacing'
    );
    rejects(
      'typography',
      { ...typography, lineHeight: '1.5' },
      TypeError,
      '$value.lineHeight'
    );
  });

  it('shortens long values in the message', () => {
    assert.throws(
      () => validateTokenValue('a', 'number', 'x'.repeat(100)),
      /got "x{56}\.\.\.$/
    );
    assert.throws(
      () => validateTokenValue('a', 'number', undefined),
      /got nothing$/
    );
  });
});

describe('flattenTokens with invalid values', () => {
  it('rejects a hex that adds CSS declarations, naming the token', () => {
    assert.throws(
      () =>
        flattenTokens({
          color: {
            $type: 'color',
            cta: {
              $value: srgb(
                '#000; background-image: url(https://example.invalid/leak.png)'
              )
            }
          }
        }),
      {
        name: 'RangeError',
        message:
          'Invalid token "color.cta" (color): $value.hex must be a 6 digit hex color like #0054f0, got "#000; background-image: url(https://example.invalid/leak...'
      }
    );
  });

  it('rejects a dimension value that adds CSS declarations', () => {
    assert.throws(
      () =>
        flattenTokens({
          size: {
            $type: 'dimension',
            radius: {
              $value: px('1px; background-image: url(https://example.invalid/)')
            }
          }
        }),
      {
        name: 'TypeError',
        message:
          /^Invalid token "size\.radius" \(dimension\): \$value\.value must be a number/
      }
    );
  });

  it('checks values that come through aliases and references', () => {
    assert.throws(
      () =>
        flattenTokens({
          size: { $type: 'dimension', bad: { $value: px(1, 'pt') } },
          border: {
            $type: 'border',
            thin: {
              $value: { color: srgb(), width: '{size.bad}', style: 'solid' }
            }
          }
        }),
      // The referenced token is invalid itself, and is reported first
      {
        name: 'RangeError',
        message: /"size\.bad" \(dimension\): \$value\.unit/
      }
    );
    assert.throws(
      () =>
        flattenTokens({
          color: { $type: 'color', blue: { $value: srgb() } },
          size: {
            $type: 'dimension',
            // A pointer into the color's components gives a number, not a dimension
            odd: { $value: { $ref: '#/color/blue/$value/components/1' } }
          }
        }),
      {
        name: 'TypeError',
        message: /"size\.odd" \(dimension\): \$value must be/
      }
    );
  });
});

describe('fontFamilyToCss escaping', () => {
  it('escapes quotes, backslashes and control characters', () => {
    assert.equal(
      fontFamilyToCss(['a"b\\c', 'd\ne;\tf', 'sans-serif']),
      '"a\\"b\\\\c", "d\\a e;\\9 f", sans-serif'
    );
  });
});
