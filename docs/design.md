# Design plan

Written with the `frontend-design` skill before any UI code. Change this file first, then the code.

## Brief
- **Subject:** Furkhan Nakwa, a student from India who learns fast and builds things.
- **Audience:** recruiters, internship leads and collaborators who open the link from LinkedIn or a résumé, usually for under a minute.
- **Primary job:** leave them remembering one image (the particle face) and one way to reach him (the email).

## Tokens

### Color
| Name | Hex | Role |
|---|---|---|
| Graphite | `#222124` | Page background (requested) |
| Bone | `#ECE8E1` | Primary text, particle base color |
| Ash | `#8D8992` | Secondary text, years, footer |
| Seam | `#36343A` | Hairlines, project row dividers, focus ring offset |
| Lamp | `#F4D9B0` | Particle glow only, the warm light on the face. Never used for UI text or buttons. |

### Type
One family: **Inter Tight** (requested), with weight and size doing all the work.

| Role | Size | Weight / tracking / leading |
|---|---|---|
| Name (hero, preloader) | `clamp(3.5rem, 11vw, 11rem)` | 500, `-0.045em`, 0.9 |
| Statement | `clamp(1.75rem, 3.6vw, 3rem)` | 400, `-0.02em`, 1.12, max 22ch per line |
| Section line (World, India, Contact) | `clamp(1.25rem, 2.2vw, 1.75rem)` | 400, `-0.01em` |
| Body | `1rem` | 400, 1.55, max 60ch |
| Small (years, footer) | `0.8125rem` | 400, `0.01em`, Ash |

Everything is sentence case: no ALL-CAPS labels and no eyebrows above headings.

### Layout
Text is left-aligned, with a 12-column grid, `clamp(16px, 4vw, 48px)` gutters and a full-bleed fixed particle canvas behind everything.

```
HERO (100vh)                     STATEMENT (100vh)
┌──────────────────────────┐     ┌──────────────────────────┐
│                          │     │ I'm a student with a     │
│        · · ░▓▓░ · ·       │     │ restless mind. I learn   │
│       · ░▓▓▓▓▓▓░ ·        │     │ it, I build it, ...      │
│        · ░▓▓▓▓░ ·         │     │            ·░▓▓░·  (face │
│ Furkhan                  │     │            drifts right) │
│ Nakwa      Student &     │     │                          │
│            aspiring dev  │     │                          │
└──────────────────────────┘     └──────────────────────────┘

WORLD (100vh)                    INDIA (100vh)
┌──────────────────────────┐     ┌──────────────────────────┐
│                          │     │                ▓▓        │
│          ◯ globe         │     │               ▓▓▓▓       │
│        (spinning)        │     │                ▓▓▓       │
│ Working globally,        │     │                 ▓        │
│ available everywhere     │     │ Based in India           │
└──────────────────────────┘     └──────────────────────────┘

HOW I WORK (~120vh)              WORK (list, particles slide off left)
┌──────────────────────────┐     ┌──────────────────────────┐
│ Persistent by nature,    │     │ Selected work            │
│ fast by habit. ...       │     │ ──────────────────────── │
│                          │     │ Project One        2026  │
│                          │     │ ──────────────────────── │
│                          │     │ Project Two        2026  │ ← hover: image
└──────────────────────────┘     └──────────────────────────┘    follows cursor

CONTACT (100vh)                  FOOTER
┌──────────────────────────┐     ┌──────────────────────────┐
│ Get in touch             │     │ hey there!               │
│ furkhannakwa@gmail.com   │     │ Furkhan Yahya Ali Nakwa, │
│ or reach out on LinkedIn │     │ © 2026     No cookies.   │
└──────────────────────────┘     └──────────────────────────┘
```

## Principles
1. **The face is the loud element.** Everything else is quiet: one weight change, no cards, no gradients, no shadows.
2. **Text sits beside the particles, not on top of them.** The cloud and the text trade places as you scroll.
3. **One orchestrated moment.** The full name collapses to "Furkhan Nakwa" at the end of the preloader. After that, only three text reveals: the hero name, the statement and the email. Every other line just appears.
4. **Motion only where it means something.** Particles follow the scroll, the cursor follows the mouse, and the email breaks apart on hover because it's the action. Reduced motion shows the final states.
5. **Floor:** works at 375px, visible focus rings (Bone, 2px, offset on Seam), contrast ≥ 4.5:1 (Ash on Graphite 4.67:1, Bone on Graphite 13.1:1).

## Review against generic defaults
I checked the first draft against the skill's list of generic tells. Changes from it:
- **Near-black with one neon accent** (tell 2): the background is requested, but the first draft gave links an orange accent. **Removed.** The only warm color is Lamp, and only inside the particle glow, so the warmth reads as light on a face rather than brand chrome.
- **ALL-CAPS eyebrow labels** (tell 5): the reference uses "SOME SELECTED WORKS" and "GET IN TOUCH". **Changed** to sentence case, set at section-line size, not as tiny labels.
- **Middle-dot meta strings** (tell 5): the first draft joined footer items with `·`. **Changed** to separate lines.
- **Fade-and-slide on every section:** the first draft revealed every line. **Cut down** to three reveals (principle 3).
- **Numbered project rows (01 / 02):** the projects aren't a sequence. **Removed**, and the year is shown instead.
