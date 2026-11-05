interface HtmlNode {
  name?: string;
  open?: string;
  close?: string;
  text?: string;
  children: HtmlNode[];
}

// A tag, or the text between tags; attribute values from renderDesignToken
// are escaped, so they hold no ">"
const TOKEN = /<\/?[a-zA-Z][^>]*>|[^<]+/g;
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr'
]);
// Elements whose content is kept on one line, as written
const INLINE_ELEMENTS = new Set(['code', 'pre']);
const parse = (html: string): HtmlNode[] => {
  const root: HtmlNode = { children: [] };
  const stack = [root];

  for (const [token] of html.matchAll(TOKEN)) {
    const parent = stack[stack.length - 1];

    if (token.startsWith('</')) {
      const node = stack.length > 1 ? stack.pop() : undefined;

      if (node) node.close = token;
    } else if (token.startsWith('<')) {
      const name = (/^<([a-zA-Z][\w-]*)/.exec(token) as RegExpExecArray)[1];
      const node: HtmlNode = {
        name: name.toLowerCase(),
        open: token,
        children: []
      };

      parent.children.push(node);

      if (!VOID_ELEMENTS.has(node.name as string) && !token.endsWith('/>'))
        stack.push(node);
    } else {
      parent.children.push({ text: token, children: [] });
    }
  }

  return root.children;
};
const inline = (node: HtmlNode): string =>
  node.text ??
  `${node.open}${node.children.map(inline).join('')}${node.close ?? ''}`;
const print = (node: HtmlNode, depth: number, indent: string): string[] => {
  const pad = indent.repeat(depth);

  if (node.text !== undefined) {
    const text = node.text.trim();

    return text ? [pad + text] : [];
  }

  const hasElements = node.children.some((child) => child.text === undefined);

  if (!hasElements || INLINE_ELEMENTS.has(node.name as string))
    return [pad + inline(node)];

  return [
    pad + node.open,
    ...node.children.flatMap((child) => print(child, depth + 1, indent)),
    ...(node.close ? [pad + node.close] : [])
  ];
};

/**
 * Pretty prints HTML for reading: an element with child elements gets one
 * line per child, indented; an element with only text, and `<code>` or
 * `<pre>` with all their content, stay on one line as written. Whitespace
 * around text is trimmed, so use the original HTML to copy or render.
 *
 * @param {string} html HTML, such as the output of `renderDesignToken()`
 * @param {string} [indent] One level of indentation, two spaces by default
 * @returns {string} The HTML on indented lines
 */
export const formatHtml = (html: string, indent = '  '): string =>
  parse(html)
    .flatMap((node) => print(node, 0, indent))
    .join('\n');
