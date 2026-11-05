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

export const MIN_SCALE = 0.1;

export const MAX_SCALE = 4;

/** The levels the − and + buttons step through */
export const ZOOM_STEPS = [
  0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4
];

export const clampScale = (scale: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

/**
 * Zooms to `scale`, keeping the content under `point` (viewport coordinates) in place.
 */
export const zoomAt = (
  state: ZoomState,
  scale: number,
  point: Point
): ZoomState => {
  const next = clampScale(scale);
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

export interface ZoomController {
  readonly state: ZoomState;
  zoomIn(): void;
  zoomOut(): void;
  reset(): void;
  fit(): void;
}

/**
 * Makes `content` a zoomable, pannable canvas inside `viewport`:
 *
 * - wheel zooms around the pointer, with Shift around the center of the viewport
 * - dragging pans
 *
 * @param {HTMLElement} viewport - The visible area, clipping the content
 * @param {HTMLElement} content - The element that is scaled and moved
 * @param {(state: ZoomState) => void} [onChange] - Called after every change
 * @returns {ZoomController} Methods for the zoom buttons
 */
export const createZoom = (
  viewport: HTMLElement,
  content: HTMLElement,
  onChange?: (state: ZoomState) => void
): ZoomController => {
  let state: ZoomState = { scale: 1, x: 0, y: 0 };

  const apply = (next: ZoomState) => {
    state = next;
    content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    onChange?.(state);
  };
  const center = (): Point => ({
    x: viewport.clientWidth / 2,
    y: viewport.clientHeight / 2
  });

  viewport.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();

      // Browsers turn Shift + wheel into horizontal scrolling, so read whichever axis moved
      const delta = event.deltaY || event.deltaX;
      const rect = viewport.getBoundingClientRect();
      const point = event.shiftKey
        ? center()
        : { x: event.clientX - rect.left, y: event.clientY - rect.top };

      apply(
        zoomAt(state, state.scale * wheelFactor(delta, event.deltaMode), point)
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

  apply(state);

  return {
    get state() {
      return state;
    },
    zoomIn: () => apply(zoomAt(state, stepScale(state.scale, 1), center())),
    zoomOut: () => apply(zoomAt(state, stepScale(state.scale, -1), center())),
    reset: () => apply(zoomAt(state, 1, center())),
    fit: () =>
      apply(
        fitState(
          { width: content.offsetWidth, height: content.offsetHeight },
          { width: viewport.clientWidth, height: viewport.clientHeight }
        )
      )
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
 * Adds the zoom pane (bottom right): zoom out, the zoom level (click to reset to 100%),
 * zoom in, and fit to the viewport.
 *
 * @param {(onChange: (state: ZoomState) => void) => ZoomController} connect - Creates the
 *   zoom controller with the pane's update function
 * @returns {HTMLElement} The pane
 */
export const mountZoomControls = (
  connect: (onChange: (state: ZoomState) => void) => ZoomController
): HTMLElement => {
  const pane = document.createElement('div');

  pane.className = 'zoom-controls';
  pane.setAttribute('role', 'toolbar');
  pane.setAttribute('aria-label', 'Zoom');
  pane.innerHTML = `
    <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">${icon('out')}</button>
    <button type="button" data-zoom="reset" class="zoom-value" title="Reset to 100%">100%</button>
    <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">${icon('in')}</button>
    <span class="zoom-divider" aria-hidden="true"></span>
    <button type="button" data-zoom="fit" aria-label="Fit to screen" title="Fit to screen">${icon('fit')}</button>
  `;

  const value = pane.querySelector('.zoom-value') as HTMLButtonElement;
  const controller = connect((state) => {
    const percent = `${Math.round(state.scale * 100)}%`;

    value.textContent = percent;
    value.setAttribute('aria-label', `Zoom level ${percent}, reset to 100%`);
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
