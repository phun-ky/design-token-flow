import { createHighlighterCore, type ThemeRegistrationAny } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// The code themes of phun-ky's other docs sites (from Arclace's docs, whose
// light theme meets 4.5:1 on its own background)
import darkTheme from '../assets/shiki/accessible-aa-dark-shiki.json';
import lightTheme from '../assets/shiki/accessible-aa-light-shiki.json';

export type CodeLanguage = 'json' | 'html';

export interface ColorizeOptions {
  /** Added to the `<pre>`'s classes */
  className?: string;
  /**
   * Whether the `<pre>` is a Tab stop (`tabindex="0"`), so long code can be
   * scrolled with a keyboard; true by default. Turn it off for a copy that is
   * hidden from assistive technology.
   */
  focusable?: boolean;
}

/** Highlights code as HTML: a Shiki `<pre>` */
export type Colorize = (
  code: string,
  lang: CodeLanguage,
  options?: ColorizeOptions
) => string;

const THEMES = { light: lightTheme.name, dark: darkTheme.name };

/**
 * Loads Shiki with the JSON and HTML grammars and both themes. It uses the
 * JavaScript regular expression engine, which needs no WebAssembly, so the
 * Content Security Policy needs no change. Highlighting is synchronous once
 * this has resolved.
 *
 * The output carries both themes as CSS variables (`--shiki-light`,
 * `--shiki-dark`); the playground's CSS picks one with the light/dark switch.
 *
 * @returns {Promise<Colorize>} The highlighter
 */
export const loadHighlighter = async (): Promise<Colorize> => {
  const highlighter = await createHighlighterCore({
    themes: [
      lightTheme as unknown as ThemeRegistrationAny,
      darkTheme as unknown as ThemeRegistrationAny
    ],
    langs: [
      import('shiki/dist/langs/json.mjs'),
      import('shiki/dist/langs/html.mjs')
    ],
    engine: createJavaScriptRegexEngine()
  });

  return (code, lang, { className, focusable = true } = {}) => {
    const html = highlighter.codeToHtml(code, {
      lang,
      themes: THEMES,
      defaultColor: false,
      ...(!focusable && { tabindex: false })
    });

    return className
      ? html.replace('<pre class="shiki', `<pre class="${className} shiki`)
      : html;
  };
};
