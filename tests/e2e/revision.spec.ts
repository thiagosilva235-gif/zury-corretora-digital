import { test, expect } from "@playwright/test";

test("benefícios não apresentam navegação manual", async ({ page }) => {
  await page.goto("/");
  const sec = page.locator("#beneficios");
  await expect(
    sec.getByRole("button", { name: /parceiro anterior|próximo parceiro/i }),
  ).toHaveCount(0);
  await expect(sec.getByText("ZAPP")).toHaveCount(2);
});
test("cartão abre contatos diretos de WhatsApp sem e-mail no menu", async ({ page }) => {
  await page.goto("/cartao");
  await page
    .getByRole("button", { name: /whatsapp/i })
    .first()
    .click();
  const panel = page.locator("#card-contact-channels");
  await expect(panel.getByRole("link", { name: /Thiago/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Valdir/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Joana/i })).toBeVisible();
  await expect(panel.getByRole("link", { name: /e-mail/i })).toHaveCount(0);
});
