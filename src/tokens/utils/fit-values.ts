interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * The width of the widest line in a list of client rects of inline content
 * (from `Range.getClientRects()`). Rects whose middles are within 2 px are on
 * the same line.
 *
 * @param {Iterable<Box>} rects Rects of the content's line fragments
 * @returns {number} The widest line's width, 0 for no content
 */
export const widestLine = (rects: Iterable<Box>): number => {
  const lines: { middle: number; left: number; right: number }[] = [];

  for (const rect of rects) {
    if (rect.right <= rect.left) continue;

    const middle = (rect.top + rect.bottom) / 2;
    const line = lines.find((item) => Math.abs(item.middle - middle) <= 2);

    if (line) {
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
    } else {
      lines.push({ middle, left: rect.left, right: rect.right });
    }
  }

  return Math.max(0, ...lines.map((line) => line.right - line.left));
};

/**
 * Narrows pill values that wrap onto more lines to their widest line. A box
 * with wrapped text keeps the width it had available, so a value that wraps
 * at the pill's maximum width leaves empty space; CSS can't shrink it. Values
 * on one line are left alone. Call it after rendering pills, and again when
 * fonts have loaded, since they change the widths. Works on scaled (zoomed)
 * content too.
 *
 * @param {Document | Element} [root] Where to look for pills, the whole document by default
 */
export const fitWrappedValues = (root: Document | Element = document): void => {
  root.querySelectorAll<HTMLElement>('.design-token code').forEach((code) => {
    code.style.removeProperty('inline-size');

    if (!code.querySelector('.part')) return;

    const range = document.createRange();

    range.selectNodeContents(code);

    const rects = [...range.getClientRects()];
    const middles = new Set(
      rects.map((rect) => Math.round((rect.top + rect.bottom) / 4))
    );
    const box = code.getBoundingClientRect();

    // On one line, or not laid out
    if (middles.size < 2 || !box.width || !code.offsetWidth) return;

    // The client rects are scaled when the pill is (a zoomed canvas)
    const scale = box.width / code.offsetWidth;
    const style = getComputedStyle(code);
    const edges = [
      style.paddingLeft,
      style.paddingRight,
      style.borderLeftWidth,
      style.borderRightWidth
    ].reduce((sum, value) => sum + (parseFloat(value) || 0), 0);

    code.style.inlineSize = `${Math.ceil(widestLine(rects) / scale + edges) + 1}px`;
  });
};
