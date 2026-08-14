/**
 * Deliberately its own module, importing nothing.
 *
 * The WebGL check has to run *before* MapLibre is fetched, so that a browser
 * that cannot draw the map never downloads ~276KB of renderer to end up
 * looking at the table. Keeping this separate is what makes map.ts safe to
 * load dynamically.
 */

export const webglAvailable = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    // Some hardened browser configurations throw rather than returning null.
    return false;
  }
};
