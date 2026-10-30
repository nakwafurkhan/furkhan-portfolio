"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { onFrame, prefersReducedMotion } from "@/lib/loop";
import { PARTICLES_PROGRESS, PARTICLES_READY } from "./ParticleScene/ParticleScene";
import styles from "./Preloader.module.scss";

type Phase = "count" | "name" | "collapse" | "exit" | "done";

// Counts 0→100% as fonts and particles.bin load, then the one orchestrated moment:
// the full name blurs in, the middle names fold away, and "Furkhan Nakwa" remains.
// Clears body[data-preloading] and fires "preloader:done" when it leaves.
export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("count");
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let fonts = 0, particles = 0, ready = false;
    let shown = 0;
    const started = performance.now();
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    document.fonts.ready.then(() => (fonts = 1));
    const onProgress = (e: Event) => (particles = (e as CustomEvent<number>).detail);
    const onReady = () => {
      particles = 1;
      ready = true;
    };
    window.addEventListener(PARTICLES_PROGRESS, onProgress);
    window.addEventListener(PARTICLES_READY, onReady);

    const finish = () => {
      document.body.dataset.preloading = "false";
      window.dispatchEvent(new Event("preloader:done"));
    };

    const stop = onFrame(() => {
      // Never faster than ~1.2s so the count reads as a count, not a flash.
      const minTime = Math.min((performance.now() - started) / 1200, 1);
      const target = Math.min(fonts * 0.15 + particles * 0.85, minTime) * 100;
      shown += (target - shown) * 0.12;
      if (target >= 100 && 100 - shown < 0.5) shown = 100;
      if (counter.current) counter.current.textContent = `${Math.floor(shown)}%`;

      if (shown === 100 && ready && fonts) {
        stop();
        if (reduced) {
          setPhase("done");
          finish();
          return;
        }
        setPhase("name");
        later(() => setPhase("collapse"), 1500);
        later(() => setPhase("exit"), 2700);
        later(finish, 2900);
        later(() => setPhase("done"), 3700);
      }
    });

    return () => {
      stop();
      timers.forEach(clearTimeout);
      window.removeEventListener(PARTICLES_PROGRESS, onProgress);
      window.removeEventListener(PARTICLES_READY, onReady);
    };
  }, []);

  if (phase === "done") return null;

  const words = site.fullName.split(" ");
  const middle = new Set<string>(site.middleNames);
  let charIndex = 0;

  return (
    <div className={styles.preloader} data-phase={phase} role="status" aria-label="Loading">
      <span ref={counter} className={styles.count}>
        0%
      </span>
      <p className={styles.name} aria-hidden="true">
        {words.map((word, w) => (
          <span key={w} className={middle.has(word) ? styles.middle : styles.keep}>
            {w > 0 && " "}
            {Array.from(word).map((c) => (
              <span key={charIndex} className={styles.char} style={{ "--i": charIndex++ } as React.CSSProperties}>
                {c}
              </span>
            ))}
          </span>
        ))}
      </p>
    </div>
  );
}
