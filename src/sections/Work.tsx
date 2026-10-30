"use client";

import { useEffect, useRef, useState } from "react";
import { onFrame } from "@/lib/loop";
import styles from "./Work.module.scss";

type Project = { title: string; year: string; href: string; image: string };

// Project rows; on hover a preview image eases after the cursor.
export default function Work({ projects }: { projects: readonly Project[] }) {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const target = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const stop = onFrame(() => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      if (preview.current) preview.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    });
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <ul className={styles.list} onMouseLeave={() => setActive(null)}>
        {projects.map((p, i) => (
          <li key={p.title}>
            <a
              href={p.href}
              className={styles.row}
              data-dim={active !== null && active !== i}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <span className={styles.title}>{p.title}</span>
              <span className={styles.year}>{p.year}</span>
            </a>
          </li>
        ))}
      </ul>
      <div ref={preview} className={styles.preview} data-visible={active !== null} aria-hidden="true">
        {projects.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.title} src={p.image} alt="" data-active={active === i} />
        ))}
      </div>
    </>
  );
}
