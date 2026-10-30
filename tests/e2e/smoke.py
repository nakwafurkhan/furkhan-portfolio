"""Smoke test for the portfolio, following the webapp-testing skill.

Run with `npm run test:e2e` (starts `npm run dev` through with_server.py), or against a
server you already have running: `python3 tests/e2e/smoke.py [base_url]`.

Screenshots land in tests/e2e/out/ (gitignored). Exits non-zero on any failed check.
"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

SECTIONS = ["hero", "statement", "world", "india", "learning", "how", "work", "contact"]
# SwiftShader lets headless Chromium render WebGL without a GPU.
GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

failures: list[str] = []


def check(ok: bool, msg: str):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok:
        failures.append(msg)


def run(p, name: str, width: int, height: int, reduced: bool = False):
    browser = p.chromium.launch(headless=True, args=GL_ARGS)
    context = browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce" if reduced else "no-preference",
        is_mobile=width < 768,
        has_touch=width < 768,
    )
    page = context.new_page()
    errors: list[str] = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(OUT / f"{name}-0-preloader.png"))

    # Preloader: counter + name sequence, then body[data-preloading] flips to false.
    page.wait_for_function("document.body.dataset.preloading === 'false'", timeout=60000)
    check(True, f"[{name}] preloader finished")
    page.wait_for_timeout(3500)  # let the particle formation intro finish

    has_canvas = page.evaluate("!!document.querySelector('canvas') && document.querySelectorAll('canvas').length >= 1")
    check(has_canvas, f"[{name}] particle canvas exists")
    gl_ok = page.evaluate(
        """() => { const c = [...document.querySelectorAll('canvas')].find(c => c.width > 300);
                   return !!c && c.width > 0 && c.height > 0; }"""
    )
    check(gl_ok, f"[{name}] particle canvas has size")

    title = page.title()
    check("Furkhan Nakwa" in title, f"[{name}] title is '{title}'")

    for i, sid in enumerate(SECTIONS, start=1):
        page.evaluate(f"document.getElementById('{sid}').scrollIntoView({{block: 'start'}})")
        page.wait_for_timeout(1600)
        page.screenshot(path=str(OUT / f"{name}-{i}-{sid}.png"))

    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check(overflow <= 1, f"[{name}] no horizontal overflow ({overflow}px)")

    # Scroll back to the top: the morph must reverse to the face.
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(2000)
    page.screenshot(path=str(OUT / f"{name}-9-back-to-top.png"))

    email = page.get_by_role("link", name="furkhannakwa@gmail.com")
    check(email.count() == 1 and email.get_attribute("href") == "mailto:furkhannakwa@gmail.com", f"[{name}] email link")
    linkedin = page.get_by_role("link", name="LinkedIn")
    check(linkedin.get_attribute("href") == "https://www.linkedin.com/in/nakwafurkhan/", f"[{name}] LinkedIn link")

    real_errors = [e for e in errors if "Download the React DevTools" not in e]
    check(not real_errors, f"[{name}] no console errors" + (f": {real_errors[:3]}" if real_errors else ""))

    browser.close()


with sync_playwright() as p:
    run(p, "desktop", 1440, 900)
    run(p, "mobile", 375, 812)
    run(p, "reduced", 1440, 900, reduced=True)

print(f"\nScreenshots: {OUT}")
if failures:
    print(f"{len(failures)} check(s) failed")
    sys.exit(1)
print("All checks passed")
