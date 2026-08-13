#!/usr/bin/env python3
"""Screenshot-Regression für alle Social-Media-Templates.

Rendert /dev/templates, schiesst pro Template ein Element-Screenshot und
vergleicht es pixelweise mit dem Baseline-Bild.

    python3 tests/visual/run.py           # prüfen (exit 1 bei Abweichung)
    python3 tests/visual/run.py --update  # Baselines neu setzen

Ergebnisse: tests/visual/baseline/, tests/visual/current/, tests/visual/diff/
"""
import asyncio
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("VISUAL_BASE_URL", "http://localhost:8080")
ROOT = Path(__file__).resolve().parent
BASELINE, CURRENT, DIFF = ROOT / "baseline", ROOT / "current", ROOT / "diff"
# Toleranz: Anteil abweichender Pixel, ab dem ein Template als Regression gilt
THRESHOLD = float(os.environ.get("VISUAL_THRESHOLD", "0.001"))


async def capture() -> list[str]:
    for d in (BASELINE, CURRENT, DIFF):
        d.mkdir(parents=True, exist_ok=True)
    names: list[str] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800},
                                        device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(f"{BASE_URL}/dev/templates", wait_until="domcontentloaded")
        await page.wait_for_selector("[data-gallery-ready]")
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(600)  # Webfonts + clip-path settle
        for el in await page.query_selector_all("[data-shot]"):
            name = await el.get_attribute("data-shot")
            await el.screenshot(path=str(CURRENT / f"{name}.png"))
            names.append(name)
        await browser.close()
    return names


def compare(name: str) -> tuple[str, float]:
    base_p, cur_p = BASELINE / f"{name}.png", CURRENT / f"{name}.png"
    if not base_p.exists():
        return "new", 1.0
    base, cur = Image.open(base_p).convert("RGB"), Image.open(cur_p).convert("RGB")
    if base.size != cur.size:
        return "size", 1.0
    diff = ImageChops.difference(base, cur)
    changed = sum(1 for px in diff.getdata() if px != (0, 0, 0))
    ratio = changed / (base.size[0] * base.size[1])
    if ratio > THRESHOLD:
        diff.point(lambda v: min(255, v * 8)).save(DIFF / f"{name}.png")
        return "diff", ratio
    return "ok", ratio


def main() -> int:
    update = "--update" in sys.argv
    names = asyncio.run(capture())
    if update:
        for n in names:
            Image.open(CURRENT / f"{n}.png").save(BASELINE / f"{n}.png")
        print(f"Baselines aktualisiert: {len(names)} Templates")
        return 0

    failed = []
    for n in sorted(names):
        status, ratio = compare(n)
        print(f"{'OK  ' if status == 'ok' else 'FAIL'} {n:28s} {status} ({ratio:.4%})")
        if status != "ok":
            failed.append(n)
    if failed:
        print(f"\n{len(failed)} Abweichung(en). Diffs unter tests/visual/diff/. "
              f"Wenn gewollt: python3 tests/visual/run.py --update")
        return 1
    print(f"\nAlle {len(names)} Templates unverändert.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
