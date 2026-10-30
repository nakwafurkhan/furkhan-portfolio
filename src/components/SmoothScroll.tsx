"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { onFrame, prefersReducedMotion } from "@/lib/loop";

// Lenis smooth scrolling, driven by the shared frame loop. Scroll stays locked
// while the preloader is up.
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09 });
    if (document.body.dataset.preloading === "true") lenis.stop();
    const unlock = () => lenis.start();
    window.addEventListener("preloader:done", unlock, { once: true });
    const stop = onFrame((time) => lenis.raf(time));
    return () => {
      stop();
      window.removeEventListener("preloader:done", unlock);
      lenis.destroy();
    };
  }, []);
  return null;
}
