import { test, expect, gotoReady, expectNoHorizontalOverflow } from "./fixtures";

const layouts = [
  { name: "ultrawide", width: 2560, height: 1080, file: "ultrawide.webp" },
  { name: "desktop", width: 1440, height: 900, file: "desktop.webp" },
  { name: "tablet-landscape", width: 1024, height: 768, file: "tablet-landscape.webp" },
  { name: "tablet-portrait", width: 820, height: 1180, file: "tablet-portrait.webp" },
  { name: "mobile", width: 390, height: 844, file: "mobile.webp" },
  { name: "small-mobile", width: 320, height: 568, file: "mobile.webp" },
  { name: "phone-landscape", width: 844, height: 390, file: "tablet-landscape.webp" },
];
for (const layout of layouts) {
  test(`fundo e composição ${layout.name}`, async ({ page }, info) => {
    await page.setViewportSize({ width: layout.width, height: layout.height });
    const loaded: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/backgrounds/digital-card/"))
        loaded.push(request.url().split("/").pop()!);
    });
    await gotoReady(page, "/cartao");
    const bg = page.locator(".card-atmosphere img");
    await expect
      .poll(() =>
        bg.evaluate(
          (img: HTMLImageElement, file) =>
            img.complete && img.naturalWidth > 0 && img.currentSrc.endsWith(file),
          layout.file,
        ),
      )
      .toBe(true);
    expect([...new Set(loaded)]).toEqual([layout.file]);
    await expect(bg).toHaveCSS("object-fit", "cover");
    await expect(bg).toHaveCSS("object-position", "50% 50%");
    await expect(bg).toHaveCSS("filter", "none");
    const cover = await bg.boundingBox();
    expect(cover!.x).toBe(0);
    expect(cover!.y).toBe(0);
    expect(cover!.width).toBe(layout.width);
    expect(cover!.height).toBeGreaterThanOrEqual(layout.height);
    await expectNoHorizontalOverflow(page);
    for (const control of await page.locator(".card-control").all()) {
      const alignment = await control.evaluate((node) => {
        const label = node.querySelector(
          "span:not(.silver-trace):not(.card-instagram-icon):not(.sr-only)",
        )!;
        const a = node.getBoundingClientRect(),
          b = label.getBoundingClientRect();
        const icon = node.querySelector("svg, img, .card-instagram-icon")!.getBoundingClientRect();
        return {
          x: Math.abs(a.x + a.width / 2 - (icon.left + b.right) / 2),
          y: Math.abs(a.y + a.height / 2 - b.y - b.height / 2),
          height: a.height,
        };
      });
      expect(alignment.x).toBeLessThan(1);
      expect(alignment.y).toBeLessThan(1);
      expect(alignment.height).toBeGreaterThanOrEqual(44);
    }
    const logo = page.locator(".card-brand");
    await expect(logo.locator("img")).toHaveAttribute("src", "/brand/zury-assinatura-enviada.png");
    const reflection = await logo.locator(".brand-shine-light").evaluate((node) => {
      const css = getComputedStyle(node, "::before");
      return {
        name: css.animationName,
        duration: css.animationDuration,
        band: css.backgroundImage,
      };
    });
    expect(reflection.name).toBe("brand-shine");
    expect(reflection.duration).toBe("3.4s");
    await expect(page.locator(".card-word-track")).toHaveCSS("animation-duration", "7.8s");
    await page.screenshot({
      path: `qa/card-refresh-2026-11-05/${info.project.name}-${layout.name}.png`,
    });
    if (layout.name === "desktop" || layout.name === "mobile") {
      await page.locator(".card-footer").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `qa/card-refresh-2026-11-05/${info.project.name}-${layout.name}-footer.png`,
      });
      expect((await bg.boundingBox())!.y).toBe(0);
    }
  });
}

test("orientação e resize trocam a fonte sem repetir o fundo", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await gotoReady(page, "/cartao");
  for (const layout of [layouts[2]!, layouts[0]!, layouts[1]!, layouts[4]!, layouts[3]!]) {
    await page.setViewportSize({ width: layout.width, height: layout.height });
    await expect
      .poll(() =>
        page
          .locator(".card-atmosphere img")
          .evaluate(
            (img: HTMLImageElement, file) => img.complete && img.currentSrc.endsWith(file),
            layout.file,
          ),
      )
      .toBe(true);
    await expectNoHorizontalOverflow(page);
  }
});

test("rodapé mantém dados legais e navega para as três seções reais", async ({ page }) => {
  await gotoReady(page, "/cartao");
  const footer = page.locator(".card-footer");
  await expect(footer.locator(".official-logo")).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "SOBRE", exact: true })).toHaveCount(0);
  await expect(
    footer.locator(
      'a[href^="mailto:"],a[href*="instagram"],a[href*="tiktok"],a[href*="share.google"]',
    ),
  ).toHaveCount(0);
  await expect(footer.getByRole("link", { name: /WhatsApp da ZURY/ })).toHaveCount(0);
  await expect(footer.locator(".card-footer-legal")).toContainText("CNPJ");
  await expect(footer.locator(".card-footer-legal")).toContainText("SUSEP");
  await expect(footer.getByRole("link", { name: "SOLUÇÕES", exact: true })).toHaveAttribute(
    "href",
    "/#servicos",
  );
  await expect(footer.getByRole("link", { name: "DIFERENCIAIS", exact: true })).toHaveAttribute(
    "href",
    "/#sobre",
  );
  for (const [label, id] of [
    ["COMPANHIAS", "companhias"],
    ["INDICAÇÕES", "indicacoes"],
    ["BENEFÍCIOS", "beneficios"],
  ]) {
    await gotoReady(page, "/cartao");
    const link = page.locator(".card-footer-nav").getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", `/#${id}`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    // Let the new document finish its lazy module imports before the next navigation.
    await page.waitForLoadState("networkidle");
  }
});

test("textos longos foco toque e movimento reduzido mantêm o cartão utilizável", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page, "/cartao");
  await expect(page.locator(".card-title-lines")).toBeHidden();
  await expect(page.locator(".card-reduced-title")).toBeVisible();
  await expect(page.locator(".card-reduced-title")).toContainText("vida, família e empresa");
  await expect(page.locator(".card-word-track")).toHaveCSS("animation-name", "none");
  expect(
    await page
      .locator(".brand-shine-light")
      .evaluate((n) => getComputedStyle(n, "::before").animationName),
  ).toBe("none");
  const label = page
    .locator(".card-channel")
    .first()
    .locator("span:not(.silver-trace):not(.sr-only)");
  await label.evaluate((n) => {
    n.textContent = "SITE INSTITUCIONAL DA ZURY CORRETORA E ATENDIMENTO ESPECIALIZADO";
  });
  await expectNoHorizontalOverflow(page);
  const target = page.locator(".card-whatsapp");
  await target.focus();
  await expect(target).toBeFocused();
  await expect(target).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator("#card-contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".card-quote-cta").click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".card-quote-cta")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".card-title-lines")).toBeVisible();
  await expect(page.locator(".card-reduced-title")).toBeHidden();
});

test("toque abre contatos e cotação no cartão mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "perfil de toque necessário");
  await gotoReady(page, "/cartao");
  await page.locator(".card-whatsapp").tap();
  const menu = page.locator("#card-contact-channels");
  await expect(menu).toBeVisible();
  await expect(menu.locator('a[href^="https://wa.me/"]')).toHaveCount(3);
  await menu.getByRole("button", { name: "Fechar contatos" }).tap();
  await expect(menu).toBeHidden();
  await page.locator(".card-quote-cta").tap();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expectNoHorizontalOverflow(page);
});
