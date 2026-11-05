import { expect, expectNoHorizontalOverflow, gotoReady, test } from "./fixtures";

test("cartão tem fundo em toda a tela, botões retangulares e WhatsApp abaixo do site", async ({
  page,
}) => {
  await gotoReady(page, "/cartao");
  await expect(page.locator("body")).not.toContainText("Fale com a ZURY.");
  await expect(page.locator("body")).not.toContainText("Escolha com quem conversar.");
  const controls = page.locator(".card-channels .card-control");
  await expect(controls.nth(0)).toContainText("Site institucional");
  await expect(controls.nth(1)).toContainText("WhatsApp");
  const site = await controls.nth(0).boundingBox();
  const whatsapp = await controls.nth(1).boundingBox();
  expect(whatsapp!.y).toBeGreaterThanOrEqual(site!.y + site!.height + 8);
  for (const control of await page.locator(".card-control, .card-quote-cta").all()) {
    await expect(control).toHaveCSS("border-radius", "4px");
  }
  const atmosphere = page.locator(".card-atmosphere");
  await expect(atmosphere).toHaveCSS("position", "fixed");
  await expect(atmosphere).toHaveCSS("background-size", "cover");
  await expect(page.locator(".card-silver-logo")).toHaveCount(0);
  await expect(atmosphere).toHaveCSS("background-image", /card-hero-shield-frame/);
  for (const bottom of [false, true]) {
    if (bottom) await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const box = await atmosphere.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBe(0);
    expect(box!.y).toBe(0);
    expect(box!.width).toBe(viewport.width);
    expect(box!.height).toBeGreaterThanOrEqual(viewport.height);
  }
  await expectNoHorizontalOverflow(page);
});

test("navbar compacta começa no topo e usa o fundo da página", async ({ page, isMobile }) => {
  test.skip(!isMobile, "navbar compacta");
  await gotoReady(page, "/");
  const nav = page.locator(".header-mobile");
  expect((await nav.boundingBox())!.y).toBe(0);
  const background = await page
    .locator("body")
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  await expect(nav).toHaveCSS("background-color", background);
});

test("feixes externos seguem a mesma fase e continuam alinhados ao voltar de outra seção", async ({
  page,
}) => {
  await gotoReady(page, "/");
  const phaseSpread = () =>
    page.locator(".silver-trace--green.silver-trace--loop").evaluateAll((nodes) => {
      const phases = nodes.flatMap((node) =>
        node
          .getAnimations({ subtree: true })
          .filter((a) => (a as CSSAnimation).animationName === "silver-trace-loop")
          .map((a) => Number(a.currentTime) % 3600),
      );
      const first = phases[0]!;
      return Math.max(...phases.map((phase) => Math.abs(((phase - first + 5400) % 3600) - 1800)));
    });
  expect(await phaseSpread()).toBeLessThan(35);
  await page.locator("#indicacoes").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  expect(await phaseSpread()).toBeLessThan(35);
  const cta = page.locator(".referral-cta").first();
  const ring = cta.locator(".silver-trace--green");
  const a = await cta.boundingBox();
  const b = await ring.boundingBox();
  expect(b!.x).toBeLessThan(a!.x);
  expect(b!.y).toBeLessThan(a!.y);
  await expect(ring).toHaveCSS("padding-top", "1.25px");
});

test("corretagem de grãos abre a cotação já na área e solução corretas", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator(".catalog-title")).toHaveText([
    "VEÍCULOS",
    "VIDA E SAÚDE",
    "CRÉDITO",
    "PATRIMÔNIO",
    "AGRONEGÓCIO",
    "RESPONSABILIDADE CIVIL",
  ]);
  await expect(page.locator(".catalog-item-label")).not.toContainText(["Transporte de cargas"]);
  const grain = page.getByRole("button", { name: /Corretagem de grãos/ });
  // The mobile catalog uses a horizontal snap rail.
  await grain.scrollIntoViewIfNeeded();
  await grain.click();
  const dialog = page.locator("#quote-dialog");
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "3");
  await expect(dialog).toContainText("AGRONEGÓCIO");
  await expect(dialog).toContainText("Corretagem de grãos");
});
