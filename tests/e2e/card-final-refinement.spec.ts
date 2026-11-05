import { expect, expectNoHorizontalOverflow, gotoReady, test } from "./fixtures";

test("título do cartão mantém as duas linhas alinhadas e legíveis", async ({ page, isMobile }) => {
  for (const width of isMobile ? [320, 390] : [1440]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page, "/cartao");
    const lines = page.locator(".card-title-line");
    await expect(lines).toHaveCount(2);
    const first = await lines.nth(0).boundingBox();
    const second = await lines.nth(1).boundingBox();
    expect(Math.abs(first!.x - second!.x)).toBeLessThan(1);
    expect(second!.y).toBeGreaterThan(first!.y);
    expect(first!.x).toBeGreaterThanOrEqual(0);
    expect(first!.x + first!.width).toBeLessThanOrEqual(width);
    expect(second!.x + second!.width).toBeLessThanOrEqual(width);
    await expectNoHorizontalOverflow(page);
  }
});

test("controles do cartão e modal mantêm funções sem setas", async ({ page }) => {
  await gotoReady(page, "/cartao");
  await expect(
    page.locator(".card-control .lucide-arrow-up-right, .card-control .lucide-chevron-down"),
  ).toHaveCount(0);
  await page.locator(".card-whatsapp").click();
  await expect(page.locator("#card-contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".card-quote-cta").click();
  const dialog = page.locator("#quote-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".quote-actions .lucide-arrow-right")).toBeHidden();
  await dialog.locator('label.quote-option:has(input[value="01"])').click();
  await dialog.getByRole("button", { name: "AVANÇAR" }).click();
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "2");
  await expect(dialog.locator(".quote-actions .lucide-arrow-left")).toBeHidden();
  await dialog.getByRole("button", { name: "VOLTAR" }).click();
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
});

test("logo do cartão compartilha o reflexo da navbar", async ({ page, isMobile }) => {
  await gotoReady(page, "/cartao");
  const shine = (selector: string) =>
    page.locator(selector).evaluate((node) => {
      const css = getComputedStyle(node, "::before");
      return [
        css.backgroundImage,
        css.animationName,
        css.animationDuration,
        css.animationTimingFunction,
      ];
    });
  const cardShine = await shine(".card-brand .brand-shine-light");
  await gotoReady(page, "/");
  const navShine = await shine(
    isMobile ? ".header-mobile .brand-shine-light" : ".desktop-brand-mark .brand-shine-light",
  );
  expect(cardShine).toEqual(navShine);
  expect(cardShine[2]).toBe("3.4s");
});
