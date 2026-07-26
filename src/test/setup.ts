import '@testing-library/jest-dom/vitest';

/**
 * jsdom implements no layout, and with it no ResizeObserver. Components that size
 * themselves from their container (the hand fan works out its card overlap this way)
 * would otherwise throw on render.
 *
 * The stub never fires: with no layout there is nothing to observe, and the component
 * falls back to its own default. Sizing behaviour is verified in the browser instead.
 */
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
