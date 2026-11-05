import type { DesignTokenFontFace } from '../tokens';

export interface LoadFontsOptions {
  /** Where the faces are added; the page's fonts by default */
  fonts?: FontFaceSet;
  /** The FontFace constructor, replaceable in tests */
  FontFaceClass?: typeof FontFace;
}

// Faces already added, per font set, so rendering again adds nothing twice
const added = new WeakMap<FontFaceSet, Set<string>>();

/**
 * Adds the font faces that tokens describe to the page, with the CSS Font
 * Loading API. Nothing is downloaded here: the browser fetches a face when text
 * on the page first uses its family. A face whose descriptors are invalid (for
 * example from token JSON pasted into the playground) is skipped.
 *
 * @param {DesignTokenFontFace[]} faces Faces from `getFontFaces`
 * @param {LoadFontsOptions} [options] The font set and constructor to use
 * @returns {FontFace[]} The faces added by this call
 */
export const loadFonts = (
  faces: DesignTokenFontFace[],
  { fonts = document.fonts, FontFaceClass = FontFace }: LoadFontsOptions = {}
): FontFace[] => {
  const keys = added.get(fonts) ?? new Set<string>();

  added.set(fonts, keys);

  return faces.flatMap(({ family, source, descriptors }) => {
    const key = JSON.stringify([family, source, descriptors]);

    if (keys.has(key)) return [];

    let face: FontFace;

    try {
      face = new FontFaceClass(
        family,
        source,
        descriptors as ConstructorParameters<typeof FontFace>[2]
      );
    } catch {
      return [];
    }

    fonts.add(face);
    keys.add(key);

    return [face];
  });
};
