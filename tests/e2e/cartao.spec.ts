import { expect, expectNoHorizontalOverflow, fillCustomer, gotoReady, test } from "./fixtures";

const channels = [
  ["Site institucional", "/"],
  ["Instagram", "https://www.instagram.com/zury_corretora/"],
  ["TikTok", "https://www.tiktok.com/@zury_corretora"],
  ["Facebook", "https://www.facebook.com/share/19zFT3sdGr/?mibextid=wwXIfr"],
  ["E-mail", "mailto:contato@zurycorretora.com"],
  ["Nos avalie", "https://share.google/AnNgzLmPy4lMNqHO9"],
] as const;

test.beforeEach(async ({ page }) => {
  await gotoReady(page, "/cartao");
  await expect(page.locator(".card-intro h1")).toBeVisible();
});

test("headline is in capitals and the old intro sentence is gone", async ({ page }) => {
  await expect(page.locator(".card-intro h1")).toHaveCSS("text-transform", "uppercase");
  await expect(page.locator("body")).not.toContainText(
    "Seu próximo passo começa com uma conversa.",
  );
  await expect(page.locator("body")).not.toContainText("Facebook: endereço oficial");
});

test("channel buttons follow the requested order and destinations", async ({ page }) => {
  const links = page.locator(".card-channels .card-channel");
  await expect(links).toHaveCount(channels.length);
  for (const [index, [label, href]] of channels.entries()) {
    await expect(
      links
        .nth(index)
        .locator(
          ":scope > span:not(.sr-only):not(.silver-trace):not(.liquid-metal):not(.card-instagram-icon)",
        ),
    ).toHaveText(label);
    await expect(links.nth(index)).toHaveAttribute("href", href);
    if (href.startsWith("https:"))
      await expect(links.nth(index)).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(page.locator("body")).not.toContainText("Avaliações no Google");
  // Same capsule as its neighbours.
  const heights = await links.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  );
  for (const height of heights) expect(Math.abs(height - heights[0]!)).toBeLessThan(1);
});

test("COTAR AGORA is the main site's glowing graphite CTA and opens the shared quote dialog", async ({
  page,
  isMobile,
}) => {
  const cta = page.locator(".card-quote-cta");
  await expect(cta).toHaveText("COTAR AGORA");
  const style = await cta.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      background: css.backgroundImage,
      radius: css.borderRadius,
      color: css.color,
      weight: css.fontWeight,
      glow: node
        .getAnimations({ subtree: true })
        .some(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "silver-trace-loop" &&
            animation.effect?.getTiming().iterations === Infinity,
        ),
    };
  });
  expect(style.background).toContain("linear-gradient(rgb(16, 17, 18), rgb(3, 4, 5))");
  expect(parseFloat(style.radius)).toBe(4);
  expect(style.glow).toBe(true);
  // Secondary buttons share the CTA's face, ink and shape, without the continuous glow.
  for (const control of await page.locator(".card-control").all()) {
    const face = await control.evaluate((node) => {
      const css = getComputedStyle(node);
      return { background: css.backgroundImage, color: css.color, radius: css.borderRadius };
    });
    expect(face.background).toBe(style.background);
    expect(face.color).toBe(style.color);
  }

  await cta.click();
  const dialog = page.locator("#quote-dialog");
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
  const next = dialog.getByRole("button", { name: "AVANÇAR" });
  await dialog.locator('label.quote-option:has(input[value="01"])').click();
  await next.click();
  await expect(dialog.locator('input[name="quote-solution"]')).toHaveCount(3);
  await dialog.locator('label.quote-option:has(input[value="Residenciais"])').click();
  await next.click();
  await next.click();
  await expect(dialog.locator("#quote-cep")).toHaveAttribute("aria-invalid", "true");
  await fillCustomer(page, false);
  await next.click();
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "4");
  const href = await dialog
    .getByRole("link", { name: /ENVIAR PELO WHATSAPP/ })
    .getAttribute("href");
  const message = new URL(href!).searchParams.get("text") ?? "";
  expect(message).toContain("*Área:* PATRIMÔNIO");
  expect(message).toContain("*Solução:* Residenciais");
  expect(message).not.toContain("*E-mail:*");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(cta).toBeFocused();

  if (!isMobile) {
    // Same face, type and glow as the header's COTAR AGORA on the home page.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const header = await page.locator(".desktop-quote").evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        background: css.backgroundImage,
        color: css.color,
        radius: css.borderRadius,
        weight: css.fontWeight,
        glow: node
          .getAnimations({ subtree: true })
          .some(
            (animation) =>
              animation instanceof CSSAnimation &&
              animation.animationName === "silver-trace-loop" &&
              animation.effect?.getTiming().iterations === Infinity,
          ),
      };
    });
    expect(header).toEqual(style);
  }
});

test("the WhatsApp button opens the same contacts menu as the home page", async ({ page }) => {
  await expect(page.locator(".card-person")).toHaveCount(0);
  const trigger = page.locator(".card-whatsapp");
  await expect(trigger).toHaveCount(1);
  const menu = page.locator("#card-contact-channels");
  await trigger.click();
  await expect(menu).toBeVisible();
  const links = await menu
    .locator('a[href^="https://wa.me/"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  expect(links).toEqual([
    "https://wa.me/5538999608455",
    "https://wa.me/5538999615862",
    "https://wa.me/5561985638090",
  ]);
  for (const name of ["Thiago", "Valdir", "Joana"]) await expect(menu).toContainText(name);
  const box = await menu.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);

  // Same entries as the home page's contact popover.
  const home = await page.context().newPage();
  await home.goto("/");
  const homeLinks = await home
    .locator('#nav-contact-channels a[href^="https://wa.me/"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  expect(homeLinks).toEqual(links);
  await home.close();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(menu).toBeHidden();
});

test.describe("Silver light trace", () => {
  test("light ring follows each button's radius without reaching the face", async ({ page }) => {
    await expect(page.locator(".liquid-metal")).toHaveCount(0);
    const controls = page.locator(".card-control, .card-quote-cta");
    await expect(controls).toHaveCount(8);
    for (const control of await controls.all()) {
      const fit = await control.evaluate((node) => {
        const ring = node.querySelector<HTMLElement>(".silver-trace")!;
        const a = node.getBoundingClientRect();
        const b = ring.getBoundingClientRect();
        const css = getComputedStyle(ring);
        return {
          fits:
            Math.abs(a.left - b.left - (ring.classList.contains("silver-trace--green") ? 1.5 : 0)) <
              0.2 &&
            Math.abs(a.top - b.top - (ring.classList.contains("silver-trace--green") ? 1.5 : 0)) <
              0.2 &&
            Math.abs(b.width - a.width - (ring.classList.contains("silver-trace--green") ? 3 : 0)) <
              0.2 &&
            Math.abs(
              b.height - a.height - (ring.classList.contains("silver-trace--green") ? 3 : 0),
            ) < 0.2,
          ringRadius: parseFloat(css.borderTopLeftRadius),
          controlRadius: parseFloat(getComputedStyle(node).borderTopLeftRadius),
          padding: css.paddingTop,
          green: ring.classList.contains("silver-trace--green"),
          mask: css.maskComposite || css.webkitMaskComposite,
        };
      });
      expect(fit.fits).toBe(true);
      expect(Math.min(fit.ringRadius, 500)).toBe(
        Math.min(fit.controlRadius + (fit.green ? 1.5 : 0), 500),
      );
      expect(fit.padding).toBe(fit.green ? "1.5px" : "1px");
      expect(fit.mask).toMatch(/exclude|xor/);
    }
  });

  test("the beam loops only on COTAR AGORA; secondary buttons light up on hover", async ({
    page,
    isMobile,
  }) => {
    const running = (selector: string) =>
      page.locator(selector).evaluateAll((nodes) =>
        nodes.map((node) =>
          node
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === "running" && "animationName" in a)
            .map((a) => (a as CSSAnimation).animationName),
        ),
      );
    const cta = (await running(".card-quote-cta .silver-trace"))[0]!;
    expect(cta.some((name) => /loop/.test(name))).toBe(true);
    for (const names of await running(".card-control .silver-trace"))
      expect(names.some((name) => /loop/.test(name))).toBe(false);

    test.skip(isMobile, "hover needs a mouse");
    const channel = page.locator(".card-channel").nth(1);
    const before = await channel.boundingBox();
    await channel.hover();
    await page.waitForTimeout(250);
    const ring = channel.locator(".silver-trace");
    expect(
      Number(await ring.evaluate((node) => getComputedStyle(node, "::before").opacity)),
    ).toBeGreaterThan(0.5);
    expect(await ring.evaluate((node) => getComputedStyle(node, "::after").animationName)).not.toBe(
      "none",
    );
    // Hover never moves or resizes the button.
    expect(await channel.boundingBox()).toEqual(before);
    await expectNoHorizontalOverflow(page);
  });
});
