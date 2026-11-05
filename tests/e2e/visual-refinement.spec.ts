import { test, expect } from "@playwright/test";
import { gotoReady, revealAll, expectNoHorizontalOverflow } from "./fixtures";

test("hero e soluções preservam as ações sem os dados removidos", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator(".hero-badge, .hero-facts")).toHaveCount(0);
  await expect(page.locator(".catalog-count")).toHaveCount(0);
  const hero = page.locator(".hero .quote-trigger");
  await hero.click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  const solutions = page.locator(".solutions-cta .quote-trigger");
  await solutions.click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("benefícios têm a altura de companhias e logos sem placas", async ({ page }) => {
  await gotoReady(page, "/");
  await revealAll(page);
  const companies = await page.locator("#companhias").boundingBox();
  const benefits = await page.locator("#beneficios").boundingBox();
  expect(Math.abs(companies!.height - benefits!.height)).toBeLessThanOrEqual(1);
  await expect(page.locator(".benefit-card, .benefit-plate")).toHaveCount(0);
  await expect(page.locator("#beneficios .partner-logo")).toHaveCount(8);
  await expectNoHorizontalOverflow(page);
});

test("botões das duas páginas compartilham os cantos e o feixe não pulsa", async ({ page }) => {
  for (const path of ["/", "/cartao"]) {
    await gotoReady(page, path);
    const controls = page.locator(
      path === "/"
        ? ".hero-actions .btn, .header-quote, .desktop-quote, .referral-cta, .solutions-cta .btn"
        : ".card-control, .card-quote-cta",
    );
    for (const control of await controls.all()) {
      await expect(control).toHaveCSS("border-radius", "4px");
    }
    const animationNames = await page
      .locator("body")
      .evaluate((el) =>
        el.getAnimations({ subtree: true }).map((a) => (a as CSSAnimation).animationName),
      );
    expect(animationNames).not.toContain("green-cta-glow");
    expect(animationNames).not.toContain("quote-graphite-halo");
    await expect(page.locator(".green-cta > .silver-trace--green").first()).toHaveCount(1);
  }
});

test("rodapé sem faixa vazia e títulos sem máscaras cortando os acentos", async ({ page }) => {
  await gotoReady(page, "/");
  await revealAll(page);
  const footer = page.locator(".site-footer");
  await expect(footer).toHaveCSS("padding-top", "0px");
  const gap = await page.evaluate(() => {
    const cta = document.querySelector("#cotacao")!.getBoundingClientRect();
    const footer = document.querySelector(".footer-panel")!.getBoundingClientRect();
    return footer.top - cta.bottom;
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  const masks = page.locator("[data-split] .heading-line-mask");
  expect(await masks.count()).toBeGreaterThan(0);
  for (const mask of await masks.all()) await expect(mask).toHaveCSS("overflow", "visible");
});

test("hero e navegação cabem no celular estreito", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await gotoReady(page, "/");
  await expectNoHorizontalOverflow(page);
  const bounds = await page.locator(".header-quote").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  const menu = await page.locator(".mobile-menu-toggle").boundingBox();
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(308);
  const hero = page.locator(".hero");
  const lines = await hero.locator(".hero-line").all();
  for (const line of lines) {
    const box = await line.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
});
