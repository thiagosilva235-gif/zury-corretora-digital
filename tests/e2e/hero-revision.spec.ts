import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures";

test("mensagem e chamada principal aparecem ao abrir o site", async ({ page }) => {
  await gotoReady(page, "/");
  const hero = page.locator(".hero");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("SUA VIDA");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("A ESCOLHA É ZURY");
  await expect(hero.getByRole("button", { name: "COTAR AGORA" })).toBeVisible();
  await expect(hero.getByRole("heading", { level: 1 })).toBeInViewport();
});

test("vídeo responde ao rolar e retornar ao início", async ({ page }) => {
  await gotoReady(page, "/");
  const video = page.locator(".hero-video");
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState))
    .toBeGreaterThanOrEqual(2);
  const initial = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
  await page.evaluate(() =>
    window.scrollTo({ top: window.innerHeight * 0.45, behavior: "instant" }),
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(initial + 0.5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeLessThan(0.2);
});

test("vídeo termina no quadro da referência e responde após sair da hero", async ({ page }) => {
  await gotoReady(page, "/");
  const video = page.locator(".hero-video");
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState))
    .toBeGreaterThanOrEqual(2);
  const duration = await video.evaluate((el: HTMLVideoElement) => el.duration);
  expect(duration).toBeCloseTo(4.625, 2);
  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(".hero-scroll")!;
    window.scrollTo({ top: hero.offsetHeight - innerHeight, behavior: "instant" });
  });
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(duration - 0.08);
  await page.evaluate(() => window.scrollTo({ top: 4000, behavior: "instant" }));
  await expect(video).not.toBeInViewport();
  await page.evaluate(() => window.scrollTo({ top: innerHeight * 0.2, behavior: "instant" }));
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeLessThan(duration * 0.5);
  await expect
    .poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime))
    .toBeGreaterThan(0.5);
});

test("pôster permanece disponível quando o vídeo não carrega", async ({ page }) => {
  await page.route("**/hero/hero-shield-*-v2.mp4", (route) => route.abort());
  await gotoReady(page, "/");
  const video = page.locator(".hero-video");
  await expect(video).not.toHaveClass(/is-ready/);
  const sticky = page.locator(".hero-video-sticky");
  await expect(sticky).toHaveCSS("background-image", /hero-shield-poster/);
  const poster = await video.getAttribute("poster");
  expect((await page.request.get(poster!)).status()).toBe(200);
});

test("quadros decodificados mudam na descida e voltam ao início", async ({ page }) => {
  await gotoReady(page, "/");
  await page.waitForFunction(() => {
    const video = document.querySelector<HTMLVideoElement>(".hero-video");
    return !!video && video.readyState >= 2 && !video.seeking && video.currentTime < 0.15;
  });
  const pixels = () =>
    page.locator(".hero-video").evaluate((video: HTMLVideoElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 80;
      const context = canvas.getContext("2d")!;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return Array.from(
        context.getImageData(0, 0, canvas.width, canvas.height).data.filter((_, i) => i % 4 === 0),
      );
    });
  const start = await pixels();
  await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(".hero-scroll")!;
    window.scrollTo({ top: (hero.offsetHeight - innerHeight) / 2, behavior: "instant" });
  });
  await expect
    .poll(async () => {
      const frame = await pixels();
      return frame.reduce((sum, value, i) => sum + Math.abs(value - start[i]!), 0) / frame.length;
    })
    .toBeGreaterThan(5);
  await page.evaluate(() => window.scrollTo({ top: 4000, behavior: "instant" }));
  await expect(page.locator(".hero-video")).not.toBeInViewport();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect
    .poll(async () => {
      const frame = await pixels();
      return frame.reduce((sum, value, i) => sum + Math.abs(value - start[i]!), 0) / frame.length;
    })
    .toBeLessThan(2);
});
