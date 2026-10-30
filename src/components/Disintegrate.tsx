"use client";

import { useRef, type ReactNode } from "react";
import styles from "./Disintegrate.module.scss";

type Props = {
  href: string;
  children: string;
  className?: string;
  external?: boolean;
};

type Particle = { x: number; y: number; vx: number; vy: number; delay: number; life: number };

const DURATION = 900;
const SPREAD = 160; // px the canvas extends left of the text for particles to fly into

// A link whose text breaks into particles that blow left on hover, then re-forms.
// Respects reduced motion (plain link) and only runs on hover-capable pointers.
export default function Disintegrate({ href, children, className, external }: Props) {
  const text = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const running = useRef(false);

  const play = () => {
    const t = text.current, c = canvas.current;
    if (!t || !c || running.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    running.current = true;

    const rect = t.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = rect.width + SPREAD, h = rect.height + 40;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;

    // Rasterise the text once to find which pixels are ink.
    const style = getComputedStyle(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = style.color;
    ctx.fillText(children, SPREAD, h / 2);
    const img = ctx.getImageData(0, 0, c.width, c.height);

    const particles: Particle[] = [];
    const step = Math.max(2, Math.round(2 * dpr));
    for (let y = 0; y < c.height; y += step) {
      for (let x = Math.round(SPREAD * dpr); x < c.width; x += step) {
        if (img.data[(y * c.width + x) * 4 + 3] < 128) continue;
        const px = x / dpr, py = y / dpr;
        particles.push({
          x: px,
          y: py,
          vx: -(60 + Math.random() * 140),
          vy: (Math.random() - 0.5) * 50,
          // Left edge goes first, matching the direction of travel.
          delay: ((px - SPREAD) / rect.width) * 0.35 + Math.random() * 0.1,
          life: 0.45 + Math.random() * 0.25,
        });
      }
    }

    t.dataset.state = "gone";
    const start = performance.now();
    const color = style.color;
    const tick = (now: number) => {
      const p = (now - start) / DURATION;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const q of particles) {
        const local = Math.max(0, (p - q.delay) / q.life);
        if (local >= 1) continue;
        const e = local * local;
        ctx.globalAlpha = 1 - local;
        ctx.fillRect(q.x + q.vx * e, q.y + q.vy * e, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
      if (p > 0.55) t.dataset.state = "returning";
      if (p < 1) requestAnimationFrame(tick);
      else {
        ctx.clearRect(0, 0, w, h);
        t.dataset.state = "";
        running.current = false;
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <a
      href={href}
      className={`${styles.link} ${className ?? ""}`}
      onMouseEnter={play}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" style={{ left: -SPREAD }} />
      <span ref={text} className={styles.text}>
        {children as ReactNode}
      </span>
    </a>
  );
}
