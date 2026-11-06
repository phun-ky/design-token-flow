/** Position and scale of the canvas content inside its viewport */
export interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/**
 * Zoom levels are relative to 100%, the scale at which the content fills the
 * page's width (see `fitWidthState`): from 10% to 400% of it.
 */
export const MIN_SCALE = 0.1;

export const MAX_SCALE = 4;

/** The levels the − and + buttons step through, relative to 100% */
export const ZOOM_STEPS = [
  0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4
];

export const clampScale = (scale: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

/**
 * Zooms to `scale`, keeping the content under `point` (viewport coordinates) in place.
 * The scale is kept within `MIN_SCALE` and `MAX_SCALE` times `base`, the 100% scale.
 */
export const zoomAt = (
  state: ZoomState,
  scale: number,
  point: Point,
  base = 1
): ZoomState => {
  const next = clampScale(scale / base) * base;
  const ratio = next / state.scale;

  return {
    scale: next,
    x: point.x - (point.x - state.x) * ratio,
    y: point.y - (point.y - state.y) * ratio
  };
};

/**
 * The next zoom step up (`direction` 1) or down (-1) from `scale`.
 */
export const stepScale = (scale: number, direction: 1 | -1): number => {
  const epsilon = 0.001;

  return direction > 0
    ? (ZOOM_STEPS.find((step) => step > scale + epsilon) ?? MAX_SCALE)
    : ([...ZOOM_STEPS].reverse().find((step) => step < scale - epsilon) ??
        MIN_SCALE);
};

/** How far a line of a line-based wheel delta pans, in pixels */
const WHEEL_LINE = 16;

/** What a wheel event on the canvas does */
export type WheelAction =
  { type: 'pan'; x: number; y: number } | { type: 'zoom'; delta: number };

/**
 * The canvas action for a wheel event, as in design and map tools: the wheel
 * and two-finger scrolling pan, Shift and the wheel pan sideways, and Ctrl or
 * Cmd and the wheel zoom. Browsers send a trackpad pinch as Ctrl and the wheel,
 * so a pinch zooms too.
 *
 * @param {Pick<WheelEvent, 'deltaX' | 'deltaY' | 'deltaMode' | 'shiftKey' | 'ctrlKey' | 'metaKey'>} event The wheel event
 * @param {number} pageHeight How far a page-based delta pans, in pixels
 * @returns {WheelAction} A pan by `x` and `y` pixels, or a zoom by `delta`
 */
export const wheelAction = (
  event: Pick<
    WheelEvent,
    'deltaX' | 'deltaY' | 'deltaMode' | 'shiftKey' | 'ctrlKey' | 'metaKey'
  >,
  pageHeight: number
): WheelAction => {
  if (event.ctrlKey || event.metaKey)
    return { type: 'zoom', delta: event.deltaY || event.deltaX };

  const unit =
    event.deltaMode === 1 ? WHEEL_LINE : event.deltaMode === 2 ? pageHeight : 1;
  // Some browsers send Shift and the wheel as vertical: pan sideways anyway
  const [dx, dy] =
    event.shiftKey && event.deltaX === 0
      ? [event.deltaY, 0]
      : [event.deltaX, event.deltaY];

  // The view moves the way the wheel turns, so the content moves the other way
  return { type: 'pan', x: -dx * unit, y: -dy * unit };
};

/**
 * Zoom factor for a wheel event's delta. Pixel, line and page deltas give about the
 * same factor per mouse wheel notch, and trackpads zoom smoothly.
 */
export const wheelFactor = (delta: number, deltaMode = 0): number => {
  const perUnit = deltaMode === 1 ? 0.05 : deltaMode === 2 ? 1 : 0.0015;

  return Math.exp(-delta * perUnit);
};

/**
 * The state that fits `content` inside `viewport` with `padding` on every side, centered.
 */
export const fitState = (
  content: Size,
  viewport: Size,
  padding = 32
): ZoomState => {
  const scale = clampScale(
    Math.min(
      (viewport.width - padding * 2) / content.width,
      (viewport.height - padding * 2) / content.height
    )
  );

  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2
  };
};

/**
 * The state at which `content` fills the width of `viewport`, top aligned: the
 * 100% zoom level. Content narrower than the viewport is not enlarged.
 */
export const fitWidthState = (content: Size, viewport: Size): ZoomState => {
  if (content.width <= 0) return { scale: 1, x: 0, y: 0 };

  const scale = Math.min(1, viewport.width / content.width);

  return { scale, x: (viewport.width - content.width * scale) / 2, y: 0 };
};

/** What a key press on the focused canvas does */
export type CanvasKeyAction =
  | { type: 'pan'; x: number; y: number }
  | { type: 'zoomIn' | 'zoomOut' | 'reset' | 'fit' };

/** How far an arrow key pans, in pixels on screen; with Shift */
export const PAN_STEP = 40;

export const PAN_STEP_LARGE = 200;

const ARROWS: Record<string, [number, number]> = {
  // The view moves the arrow's way, so the content moves the other way
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1]
};
const ZOOM_KEYS: Record<string, Exclude<CanvasKeyAction['type'], 'pan'>> = {
  '+': 'zoomIn',
  '=': 'zoomIn',
  '-': 'zoomOut',
  '0': 'reset',
  f: 'fit',
  F: 'fit'
};

/**
 * The canvas action for a key press: arrow keys pan (further with Shift), `+`
 * or `=` zoom in, `-` zooms out, `0` resets to 100%, `F` fits to screen. Keys
 * with Ctrl, Cmd or Alt are left to the browser.
 *
 * @param {Pick<KeyboardEvent, 'key' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>} event The key press
 * @returns {CanvasKeyAction | null} The action, or null for any other key
 */
export const canvasKeyAction = (
  event: Pick<
    KeyboardEvent,
    'key' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'
  >
): CanvasKeyAction | null => {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  const arrow = Object.hasOwn(ARROWS, event.key)
    ? ARROWS[event.key]
    : undefined;

  if (arrow) {
    const step = event.shiftKey ? PAN_STEP_LARGE : PAN_STEP;

    return { type: 'pan', x: arrow[0] * step, y: arrow[1] * step };
  }

  const type = Object.hasOwn(ZOOM_KEYS, event.key)
    ? ZOOM_KEYS[event.key]
    : undefined;

  return type ? { type } : null;
};

export interface ZoomController {
  readonly state: ZoomState;
  /** The zoom level shown, relative to 100% (the page's width) */
  readonly level: number;
  zoomIn(): void;
  zoomOut(): void;
  reset(): void;
  fit(): void;
}

/**
 * Makes `content` a zoomable, pannable canvas inside `viewport`:
 *
 * - it starts at 100%: the content fills the viewport's width
 * - the wheel pans (with Shift sideways), and Ctrl or Cmd with the wheel, or
 *   a trackpad pinch, zooms around the pointer; see `wheelAction`
 * - dragging pans
 * - when the viewport has focus, the keys from `canvasKeyAction` pan and zoom
 * - while the view is untouched (as loaded, or reset), it fits the width again
 *   when the content or viewport changes size, such as when fonts load or the
 *   window is resized; otherwise only the level changes
 *
 * @param {HTMLElement} viewport - The visible area, clipping the content
 * @param {HTMLElement} content - The element that is scaled and moved
 * @param {(state: ZoomState, level: number) => void} [onChange] - Called after every change
 * @returns {ZoomController} Methods for the zoom buttons
 */
export const createZoom = (
  viewport: HTMLElement,
  content: HTMLElement,
  onChange?: (state: ZoomState, level: number) => void
): ZoomController => {
  let state: ZoomState = { scale: 1, x: 0, y: 0 };
  // The 100% scale, and whether the view is still the fitted width
  let base = 1;
  let untouched = true;

  const apply = (next: ZoomState, touched = true) => {
    state = next;
    untouched = !touched;
    content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    onChange?.(state, state.scale / base);
  };
  const widthState = () =>
    fitWidthState(
      { width: content.offsetWidth, height: content.offsetHeight },
      { width: viewport.clientWidth, height: viewport.clientHeight }
    );
  const fitWidth = () => {
    const next = widthState();

    base = next.scale;
    apply(next, false);
  };
  const center = (): Point => ({
    x: viewport.clientWidth / 2,
    y: viewport.clientHeight / 2
  });

  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();

      const action = wheelAction(event, viewport.clientHeight);

      if (action.type === 'pan')
        return apply({
          ...state,
          x: state.x + action.x,
          y: state.y + action.y
        });

      const rect = viewport.getBoundingClientRect();

      apply(
        zoomAt(
          state,
          state.scale * wheelFactor(action.delta, event.deltaMode),
          { x: event.clientX - rect.left, y: event.clientY - rect.top },
          base
        )
      );
    },
    { passive: false }
  );

  let drag: { pointerId: number; x: number; y: number } | null = null;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    drag = {
      pointerId: event.pointerId,
      x: event.clientX - state.x,
      y: event.clientY - state.y
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-panning');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    apply({ ...state, x: event.clientX - drag.x, y: event.clientY - drag.y });
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    drag = null;
    viewport.classList.remove('is-panning');
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // Fonts loading change the content's size, and a resized window the
  // viewport's; either changes the scale that fills the width
  const observer = new ResizeObserver(() => {
    if (untouched) return fitWidth();

    base = widthState().scale;
    onChange?.(state, state.scale / base);
  });

  observer.observe(content);
  observer.observe(viewport);

  fitWidth();

  const step = (direction: 1 | -1) =>
    apply(
      zoomAt(
        state,
        stepScale(state.scale / base, direction) * base,
        center(),
        base
      )
    );
  const fit = () =>
    apply(
      fitState(
        { width: content.offsetWidth, height: content.offsetHeight },
        { width: viewport.clientWidth, height: viewport.clientHeight }
      )
    );

  viewport.addEventListener('keydown', (event) => {
    const action = canvasKeyAction(event);

    if (!action) return;

    event.preventDefault();

    if (action.type === 'pan')
      return apply({ ...state, x: state.x + action.x, y: state.y + action.y });

    ({ zoomIn: () => step(1), zoomOut: () => step(-1), reset: fitWidth, fit })[
      action.type
    ]();
  });

  return {
    get state() {
      return state;
    },
    get level() {
      return state.scale / base;
    },
    zoomIn: () => step(1),
    zoomOut: () => step(-1),
    reset: fitWidth,
    fit
  };
};

const ICONS = {
  out: '<path d="M5 12h14"/>',
  in: '<path d="M12 5v14M5 12h14"/>',
  fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'
};
const icon = (name: keyof typeof ICONS) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">${ICONS[name]}</g></svg>`;

/**
 * Adds the zoom pane (bottom right): zoom out, the zoom level (click to reset to 100%,
 * the page's width), zoom in, and fit to the viewport.
 *
 * @param {(onChange: (state: ZoomState, level: number) => void) => ZoomController} connect -
 *   Creates the zoom controller with the pane's update function
 * @returns {HTMLElement} The pane
 */
export const mountZoomControls = (
  connect: (
    onChange: (state: ZoomState, level: number) => void
  ) => ZoomController
): HTMLElement => {
  // A labelled landmark (complementary), holding the toolbar
  const pane = document.createElement('aside');

  pane.setAttribute('aria-label', 'Zoom');
  pane.innerHTML = `
    <div class="zoom-controls" role="toolbar" aria-label="Zoom">
      <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">${icon('out')}</button>
      <button type="button" data-zoom="reset" class="zoom-value" title="Reset to 100%, the page's width">100%</button>
      <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">${icon('in')}</button>
      <span class="zoom-divider" aria-hidden="true"></span>
      <button type="button" data-zoom="fit" aria-label="Fit to screen" title="Fit to screen">${icon('fit')}</button>
    </div>
  `;

  const value = pane.querySelector('.zoom-value') as HTMLButtonElement;
  const controller = connect((_state, level) => {
    const percent = `${Math.round(level * 100)}%`;

    value.textContent = percent;
    value.setAttribute(
      'aria-label',
      `Zoom level ${percent}, reset to 100%, the page's width`
    );
  });
  const actions = {
    out: controller.zoomOut,
    in: controller.zoomIn,
    reset: controller.reset,
    fit: controller.fit
  };

  pane.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-zoom]'
    );

    if (button) actions[button.dataset.zoom as keyof typeof actions]();
  });
  document.body.append(pane);

  return pane;
};
