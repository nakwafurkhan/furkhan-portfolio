"use client";

import { useEffect, useRef } from "react";
import { onFrame } from "@/lib/loop";
import styles from "./Cursor.module.scss";

const TRAIL_MS = 150;

// A dot that eases toward the pointer, plus a tapered ribbon of the last 150ms
// of movement drawn on a full-screen canvas. Mouse/trackpad only.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = dot.current, c = canvas.current;
    if (!finePointer || reduced || !d || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    document.documentElement.classList.add("has-custom-cursor");
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let seen = false;
    const trail: { x: number; y: number; t: number }[] = [];

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      d.dataset.visible = "true";
    };
    const onOver = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest("a, button, [data-cursor]");
      d.dataset.hover = hit ? "true" : "false";
    };
    const onLeave = () => (d.dataset.visible = "false");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const stop = onFrame((now) => {
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      d.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      const last = trail[trail.length - 1];
      if (seen && (!last || Math.hypot(pos.x - last.x, pos.y - last.y) > 1.5)) {
        trail.push({ x: pos.x, y: pos.y, t: now });
      }
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (trail.length < 3) return;

      // Offset each point sideways along the path normal; width grows with recency.
      const left: { x: number; y: number }[] = [];
      const right: { x: number; y: number }[] = [];
      for (let i = 0; i < trail.length; i++) {
        const a = trail[Math.max(0, i - 1)], b = trail[Math.min(trail.length - 1, i + 1)];
        let nx = b.x - a.x, ny = b.y - a.y;
        const len = Math.hypot(nx, ny) || 1;
        nx /= len;
        ny /= len;
        const age = 1 - (now - trail[i].t) / TRAIL_MS;
        const w = (1 + 6 * Math.max(0, age)) / 2;
        left.push({ x: trail[i].x - ny * w, y: trail[i].y + nx * w });
        right.push({ x: trail[i].x + ny * w, y: trail[i].y - nx * w });
      }
      const head = trail[trail.length - 1], tail = trail[0];
      const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
      grad.addColorStop(0, "rgba(236, 232, 225, 0)");
      grad.addColorStop(1, "rgba(244, 217, 176, 0.55)");
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (const p of left) ctx.lineTo(p.x, p.y);
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(244, 217, 176, 0.6)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    return () => {
      stop();
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} className={styles.trail} aria-hidden="true" />
      <div ref={dot} className={styles.dot} aria-hidden="true" data-visible="false" />
    </>
  );
}
