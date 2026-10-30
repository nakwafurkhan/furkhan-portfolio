// One requestAnimationFrame loop shared by Lenis, the particle scene and the cursor,
// so they all read the same scroll position on the same frame.

type Tick = (time: number, dt: number) => void;

const ticks = new Set<Tick>();
let frame = 0;
let last = 0;

function run(time: number) {
  const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
  last = time;
  for (const tick of ticks) tick(time, dt);
  frame = requestAnimationFrame(run);
}

export function onFrame(tick: Tick) {
  ticks.add(tick);
  if (!frame) frame = requestAnimationFrame(run);
  return () => {
    ticks.delete(tick);
    if (!ticks.size) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// 0 when the element's top reaches the bottom of the viewport, 1 when it reaches the top.
export function enterProgress(el: Element | null) {
  if (!el) return 0;
  const { top } = el.getBoundingClientRect();
  return clamp01(1 - top / window.innerHeight);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
