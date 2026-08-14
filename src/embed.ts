/**
 * Embed plumbing. The host page owns the iframe's height and cannot measure
 * our content across origins, so we tell it — and it may ignore us, which is
 * why the layout has to be sound at whatever height it ends up with.
 *
 * No cookies, no storage. Third-party context makes both unreliable, and they
 * would drag the host site into a privacy review it did not sign up for.
 */

const MESSAGE_TYPE = "ontario-ai-map:height";

export const reportHeightToParent = (): (() => void) => {
  // Not framed: nothing to report, and no reason to post to ourselves.
  if (window.parent === window) return () => {};

  let lastReported = -1;

  const report = (): void => {
    const height = Math.ceil(
      document.documentElement.getBoundingClientRect().height,
    );
    // Sub-pixel jitter would otherwise post on every animation frame.
    if (Math.abs(height - lastReported) < 2) return;
    lastReported = height;

    // The host's origin is not known at build time and the payload carries no
    // user data, so "*" is the honest target here.
    window.parent.postMessage({ type: MESSAGE_TYPE, height }, "*");
  };

  const observer = new ResizeObserver(report);
  observer.observe(document.documentElement);
  window.addEventListener("load", report);
  report();

  return () => observer.disconnect();
};
