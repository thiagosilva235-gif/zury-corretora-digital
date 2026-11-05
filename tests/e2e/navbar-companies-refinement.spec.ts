import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures";

test("navbar ocupa toda a largura e faz fade conforme a direção da rolagem", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, "/");
  const header = page.locator(".site-header");
  const bar = page.locator(isMobile ? ".header-mobile" : ".header-desktop");
  const box = await bar.boundingBox();
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(box!.x).toBe(0);
  expect(Math.abs(box!.width - width)).toBeLessThanOrEqual(1);
  if (isMobile) await page.evaluate(() => window.scrollBy({ top: 500, behavior: "instant" }));
  else await page.mouse.wheel(0, 500);
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect(header).toHaveCSS("opacity", "0");
  await expect(header).toHaveAttribute("inert", "");
  if (isMobile) await page.evaluate(() => window.scrollBy({ top: -180, behavior: "instant" }));
  else await page.mouse.wheel(0, -180);
  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect(header).toHaveCSS("opacity", "1");
  await bar.getByRole("button", { name: "COTAR AGORA" }).click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
});

test("companhias têm título centralizado e logos sem placas de fundo", async ({ page }) => {
  await gotoReady(page, "/");
  const heading = page.locator("#companies-title");
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveCSS("text-align", "center");
  const headingBox = await heading.boundingBox();
  const sectionBox = await page.locator("#companhias").boundingBox();
  expect(
    Math.abs(headingBox!.x + headingBox!.width / 2 - sectionBox!.x - sectionBox!.width / 2),
  ).toBeLessThanOrEqual(1);
  for (const item of await page.locator(".logo-cloud-item").all()) {
    await expect(item).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(item).toHaveCSS("box-shadow", "none");
  }
});

test("reflexo do título fica nas letras e botões claros usam o mesmo metalizado", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, "/");
  const light = page.locator(".hero-text-shine");
  await expect(light).toHaveAttribute("aria-hidden", "true");
  await expect(light).toHaveCSS("background-clip", "text");
  const textStyle = await light.evaluate((node) => {
    const css = getComputedStyle(node);
    return [css.backgroundImage, css.animationDuration, css.animationTimingFunction];
  });
  const logoStyle = await page
    .locator(
      isMobile ? ".header-mobile .brand-shine-light" : ".desktop-brand-mark .brand-shine-light",
    )
    .evaluate((node) => {
      const css = getComputedStyle(node, "::before");
      return [css.backgroundImage, css.animationDuration, css.animationTimingFunction];
    });
  if (!isMobile) expect(textStyle[0]).toBe(logoStyle[0]);
  expect(textStyle[1]).toBe(logoStyle[1]);
  expect(textStyle[2]).toBe("linear");
  await expect(light).toHaveCSS("animation-delay", "0s");
  const face = await page
    .locator(".hero .btn-primary")
    .evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(face).toContain("linear-gradient");
  expect(face).toContain("rgb(255, 255, 255)");
  for (const button of await page.locator(".referral-cta").all())
    await expect(button).toHaveCSS("background-image", face);
  await expect(page.locator(".floating-whatsapp-button")).toHaveCSS("border-radius", "50%");
});
