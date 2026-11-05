import { test, expect, type Page } from "@playwright/test";
import { gotoReady } from "./fixtures";

async function position(page: Page, progress: number) {
  await page.evaluate((p) => {
    const wrap = document.querySelector<HTMLElement>(".hero-scroll")!;
    const sticky = document.querySelector<HTMLElement>(".hero-video-sticky")!;
    scrollTo({
      top:
        wrap.getBoundingClientRect().top + scrollY + (wrap.offsetHeight - sticky.offsetHeight) * p,
      behavior: "instant",
    });
  }, progress);
}
async function expectFrame(page: Page, progress: number) {
  // scrollTo rounds to physical CSS pixels; near a frame boundary use the actual scroll fraction.
  const actual = await page.evaluate(() => {
    const wrap = document.querySelector<HTMLElement>(".hero-scroll")!;
    const sticky = document.querySelector<HTMLElement>(".hero-video-sticky")!;
    return (
      (scrollY - (wrap.getBoundingClientRect().top + scrollY)) /
      (wrap.offsetHeight - sticky.offsetHeight)
    );
  });
  expect(actual).toBeCloseTo(progress, 2);
  const time = (Math.round(actual * 110) + 0.5) / 24;
  await expect
    .poll(() =>
      page
        .locator(".hero-video")
        .evaluate(
          (v: HTMLVideoElement, expected) =>
            !v.seeking && v.paused && Math.abs(v.currentTime - expected) < 1 / 24,
          time,
        ),
    )
    .toBe(true);
}

test("prefers-reduced-motion mantém o pôster sem baixar vídeo e reage à preferência", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const media: string[] = [];
  page.on("request", (request) => {
    if (/\/hero\/.*mp4/.test(request.url())) media.push(request.url());
  });
  await gotoReady(page, "/");
  await expect(page.locator(".hero-video")).not.toHaveClass(/is-ready/);
  await position(page, 0.8);
  expect(media).toEqual([]);
  await expect(page.locator(".hero-velaris canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".hero-video")).toHaveClass(/is-ready/);
  await expectFrame(page, 0.8);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-video")).not.toHaveClass(/is-ready/);
  await expect(page.locator(".hero-velaris canvas")).toHaveCount(0);
});

test("erro após carregar volta ao pôster", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator(".hero-video")).toHaveClass(/is-ready/);
  await page.locator(".hero-video").evaluate((v) => v.dispatchEvent(new Event("error")));
  await expect(page.locator(".hero-video")).not.toHaveClass(/is-ready/);
  await expect(page.locator(".hero-video-sticky")).toHaveCSS(
    "background-image",
    /hero-shield-poster/,
  );
});

test("início meio fim reversão rápida resize e retorno de página preservam sincronismo", async ({
  page,
}) => {
  await gotoReady(page, "/");
  for (const progress of [0, 0.5, 1]) {
    await position(page, progress);
    await expectFrame(page, progress);
  }
  for (const progress of [0.1, 0.95, 0.2, 0.8, 0.05, 1, 0.4]) {
    await position(page, progress);
    await page.waitForTimeout(35);
  }
  await expectFrame(page, 0.4);
  await page.evaluate(() => scrollTo({ top: 5000, behavior: "instant" }));
  await position(page, 0.2);
  await expectFrame(page, 0.2);
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.width, height: viewport.height - 110 });
  await position(page, 0.65);
  await expectFrame(page, 0.65);
  await page.evaluate(() =>
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
  );
  await expectFrame(page, 0.65);
  await page.reload();
  await expect(page.locator(".hero-video")).toHaveClass(/is-ready/);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const w = document.querySelector<HTMLElement>(".hero-scroll")!;
        const s = document.querySelector<HTMLElement>(".hero-video-sticky")!;
        const v = document.querySelector<HTMLVideoElement>(".hero-video")!;
        const p = Math.min(
          1,
          Math.max(
            0,
            (scrollY - (w.getBoundingClientRect().top + scrollY)) /
              (w.offsetHeight - s.offsetHeight),
          ),
        );
        return !v.seeking && Math.abs(v.currentTime - (Math.round(p * 110) + 0.5) / 24) < 1 / 24;
      }),
    )
    .toBe(true);
});

test("carregamento lento já no meio da hero usa o quadro solicitado", async ({ page }, info) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/hero/hero-shield-*-v2.mp4", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".hero-video source").first().waitFor({ state: "attached" });
  await page.waitForTimeout(300);
  await expect(page.locator(".hero-video")).not.toHaveClass(/is-ready/);
  await position(page, 0.5);
  release();
  await expect(page.locator(".hero-video")).toHaveClass(/is-ready/);
  await expectFrame(page, 0.5);
  await page.screenshot({ path: `qa/hero-audit-2026-11-05/after-${info.project.name}-middle.png` });
  await position(page, 0);
  await expectFrame(page, 0);
  await page.screenshot({ path: `qa/hero-audit-2026-11-05/after-${info.project.name}-start.png` });
});

test("sem HTTP Range o fallback Blob continua permitindo ida e volta", async ({ page }) => {
  const { readFile } = await import("node:fs/promises");
  await page.route("**/hero/hero-shield-*-v2.mp4", async (route) => {
    const file = new URL(route.request().url()).pathname.split("/").pop()!;
    await route.fulfill({
      status: 200,
      contentType: "video/mp4",
      body: await readFile(`public/hero/${file}`),
    });
  });
  await gotoReady(page, "/");
  await expect
    .poll(() => page.locator(".hero-video").evaluate((v: HTMLVideoElement) => v.currentSrc))
    .toMatch(/^blob:/);
  for (const p of [0, 0.5, 1, 0]) {
    await position(page, p);
    await expectFrame(page, p);
  }
});

test("retoma depois de uma falha real de carregamento", async ({ page }) => {
  await page.route("**/hero/hero-shield-*-v2.mp4", (route) => route.abort());
  await gotoReady(page, "/");
  await expect(page.locator(".hero-video")).not.toHaveClass(/is-ready/);
  await page.unroute("**/hero/hero-shield-*-v2.mp4");
  await page.evaluate(() =>
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
  );
  await expect(page.locator(".hero-video")).toHaveClass(/is-ready/);
  await position(page, 0.5);
  await expectFrame(page, 0.5);
});
