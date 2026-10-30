"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

// Renders text as masked words (`mode="words"`) or blurred letters (`mode="chars"`)
// and adds .is-visible once it scrolls into view after the preloader finishes.
// Styles live in src/app/globals.scss. Use sparingly: see docs/design.md.

type Props = {
  text: string;
  mode?: "words" | "chars";
  as?: ElementType;
  className?: string;
  delay?: number; // seconds
};

export default function TextReveal({ text, mode = "words", as = "p", className, delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    const observe = () => io.observe(el);
    if (document.body.dataset.preloading === "true") {
      window.addEventListener("preloader:done", observe, { once: true });
    } else {
      observe();
    }
    return () => {
      window.removeEventListener("preloader:done", observe);
      io.disconnect();
    };
  }, []);

  const pieces =
    mode === "chars"
      ? // Letters are grouped per word so lines only break between words.
        text.split(" ").flatMap((word, w, words) => {
          const offset = words.slice(0, w).join(" ").length + (w > 0 ? 1 : 0);
          return [
            w > 0 ? " " : null,
            <span key={w} className="reveal-chars-word">
              {Array.from(word).map((c, i) => (
                <span key={i} className="reveal-char" style={{ "--i": offset + i } as React.CSSProperties}>
                  {c}
                </span>
              ))}
            </span>,
          ];
        })
      : text.split(/\s+/).flatMap((w, i) => [
          i > 0 ? " " : null,
          <span key={i} className="reveal-mask">
            <span className="reveal-word" style={{ "--i": i } as React.CSSProperties}>
              {w}
            </span>
          </span>,
        ]);

  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={[className, "reveal", visible && "is-visible"].filter(Boolean).join(" ")}
      style={{ "--delay": `${delay}s` } as React.CSSProperties}
      aria-label={text}
    >
      <span aria-hidden="true">{pieces}</span>
    </Tag>
  );
}
