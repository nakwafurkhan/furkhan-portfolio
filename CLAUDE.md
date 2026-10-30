# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio for Furkhan Nakwa: a single-page Next.js 16 (App Router, React 19) site whose centrepiece is a WebGL particle cloud that morphs face → globe → India as you scroll.

## Commands

```bash
npm run dev          # dev server on :3000 (also .claude/launch.json "portfolio-dev")
npm run build        # production build; must pass before pushing
npm run lint         # ESLint (next core-web-vitals + typescript)
npx tsc --noEmit     # type check
npm run particles    # regenerate public/particles.bin + public/noise.png (~50s)
npm run test:e2e     # Playwright smoke test against `npm run dev`
```

Run the smoke test against a production build instead (faster, closer to real):

```bash
npm run build && python3 .claude/skills/webapp-testing/scripts/with_server.py --server "npx next start -p 3001" --port 3001 --timeout 60 -- python3 tests/e2e/smoke.py http://localhost:3001
```

`tests/e2e/smoke.py` runs desktop (1440×900), mobile (375×812) and reduced-motion passes, screenshots every section to `tests/e2e/out/` (gitignored), and fails on console errors, horizontal overflow or wrong contact links. Headless Chromium uses SwiftShader for WebGL. Look at the screenshots, not just the PASS lines: layout overlap between text and the particle cloud isn't asserted.

## Architecture

**Content** is all in `src/content/site.ts`. Sections (`src/sections/Sections.tsx`) only read from it.

**Particle data pipeline.** `scripts/build-particles.mjs` turns `assets/portrait.jpg` (gitignored, along with `assets/Profile.pdf`) plus `world-atlas` geometry into `public/particles.bin`. The file's binary layout is documented at the top of the script and parsed by `src/lib/particles.ts`; change both together. Every shape has the same point count, so particle *i* has one target per shape. Each cloud is sorted top-to-bottom before writing so morphs sweep rather than scramble. The face uses brightness-weighted (stipple) sampling, with the white wall removed by an edge flood-fill. Rerun `npm run particles` after changing the photo or the script, and commit the regenerated `.bin`.

**Scroll → shader.** `src/lib/loop.ts` is the single `requestAnimationFrame` loop shared by Lenis (`SmoothScroll`), `ParticleScene`, `Cursor` and the work-list preview. `ParticleScene` reads `enterProgress()` of the section ids `#statement`, `#world`, `#india`, `#learning` and `#work` every frame. Those values become `uMorph1` (face→globe), `uMorph2` (globe→India), the cloud's x-position and `uFade`. **Renaming or removing those section ids breaks the morph.** Shaders are in `ParticleScene/shaders.ts`: per-particle `aSeed` staggers the morph, the far globe hemisphere is faded, and India is dimmed because additive blending saturates it.

**Preloader handshake.** `<body data-preloading="true">` is set in `layout.tsx`. `ParticleScene` dispatches `particles:progress` and `particles:ready`. `Preloader` counts real bytes, plays the full-name collapse, then sets `data-preloading="false"` and fires `preloader:done`, which unlocks Lenis, starts the particle formation intro and arms `TextReveal`. Any new component that should wait for the intro must check `document.body.dataset.preloading` *and* listen for `preloader:done`. StrictMode remounts in dev, so the event may already have fired.

**Reduced motion / touch.** Every animated component checks `prefers-reduced-motion`. Touch devices get half the particles, no custom cursor and no hover preview. Portrait viewports keep the cloud centred in the upper half and drop the section copy below it (`.center` in `sections.module.scss`).

## Design rules

`docs/design.md` is the source of truth for tokens (also mirrored as CSS variables in `src/app/globals.scss`), type scale, layout and principles. It was written with the `frontend-design` skill (`.claude/skills/frontend-design`). Use that skill for UI changes, and update `docs/design.md` before changing tokens. Key constraints: the particle cloud is the only loud element; text sits beside the cloud, never on it; `TextReveal` is used only on the hero name, statement and email; sentence case, no ALL-CAPS labels.

Use the `webapp-testing` skill (`.claude/skills/webapp-testing`) for browser verification. Run its `with_server.py` with `--help` instead of reading its source.

## Gotchas

- Next 16 `cacheComponents` is on: no `new Date()` or other non-deterministic values in server components during prerender (the footer year is a constant in `site.ts`).
- `create-next-app` refuses to run in a non-empty directory. The scaffold was generated elsewhere and merged in.
- npm installs and `git push` can fail on networks that intercept TLS (a Sophos firewall was seen with `self signed certificate in certificate chain`). Switch networks rather than disabling certificate checks.
