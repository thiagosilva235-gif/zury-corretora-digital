import {
  customer,
  expect,
  expectNoHorizontalOverflow,
  fillCustomer,
  gotoReady,
  revealAll,
  test,
} from "./fixtures";

const catalog = [
  ["VEÍCULOS", ["Automóveis", "Frotas", "Motos", "Caminhões"]],
  ["VIDA E SAÚDE", ["Seguros de vida", "Planos de saúde", "Odontológicos", "Seguro viagem"]],
  ["CRÉDITO", ["Consórcios", "Financiamentos", "Empréstimos", "Seguro prestamista"]],
  ["PATRIMÔNIO", ["Residenciais", "Empresariais", "Aeronáuticos"]],
  [
    "AGRONEGÓCIO",
    ["Seguros agrícolas", "Safras", "Pecuários", "Equipamentos agrícolas", "Corretagem de grãos"],
  ],
  [
    "RESPONSABILIDADE CIVIL",
    [
      "RC Geral",
      "RC Profissional",
      "RC Obras e Engenharia",
      "RC Agropecuária",
      "RC Hospitalar e Clínicas",
    ],
  ],
] as const;

test.beforeEach(async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator(".hero h1")).toBeVisible();
});

test.describe("Nossas soluções", () => {
  test("shows exactly 6 areas and 25 solutions, in order, with updated counters", async ({
    page,
  }) => {
    const section = page.locator("#servicos");
    const entries = section.locator(".catalog-entry");
    await expect(entries).toHaveCount(6);
    for (const [index, [title, items]] of catalog.entries()) {
      const entry = entries.nth(index);
      await expect(entry.locator(".catalog-title")).toHaveText(title);
      await expect(entry.locator(".catalog-item-label")).toHaveText([...items]);
      await expect(entry.locator(".catalog-count")).toHaveCount(0);
    }
    await expect(section.locator(".catalog-item")).toHaveCount(25);
    await expect(section.locator(".solutions-figures dd")).toHaveText(["06", "25"]);
    await expect(page.locator(".hero-proof")).toContainText(/06 áreas\s+e\s+25 soluções/i);
    // Each solution reads as a link: bullet, no numeric index, a visible underline at rest.
    const first = section.locator(".catalog-item").first();
    await expect(first).not.toContainText(/\d\.\d{2}/);
    await expect(first).toContainText("•");
    const underline = await first.locator(".catalog-item-label").evaluate((node) => {
      const css = getComputedStyle(node);
      return { line: css.textDecorationLine, bg: css.backgroundSize };
    });
    expect(underline.line.includes("underline") || !/^0(px)?\s/.test(underline.bg)).toBe(true);
  });

  test("keeps one SOLICITAR COTAÇÃO action and no per-card quote buttons", async ({ page }) => {
    const section = page.locator("#servicos");
    await expect(section.locator(".catalog-entry .quote-trigger")).toHaveCount(0);
    const triggers = section.locator(".quote-trigger");
    await expect(triggers).toHaveCount(1);
    await expect(triggers).toHaveText("SOLICITAR COTAÇÃO");
    await expect(section).not.toContainText(/SELECIONE UMA SOLUÇÃO/i);
    const names = await section.locator(".catalog-title, .catalog-item-label").allTextContents();
    for (const removed of [
      "BENS",
      "RURAL",
      "AUTOMOTIVO",
      "AÉREO E MARÍTIMO",
      "TRANSPORTE",
      "Hangares",
    ])
      expect(names.map((name) => name.trim())).not.toContain(removed);
  });

  test("lays out as 3 × 2 uniform cards on desktop and a swipe carousel on phones", async ({
    page,
    isMobile,
  }) => {
    await revealAll(page);
    const entries = page.locator("#servicos .catalog-entry");
    const boxes = await entries.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.top + scrollY),
          w: rect.width,
          h: rect.height,
        };
      }),
    );
    if (!isMobile) {
      expect(boxes[0]!.y).toBe(boxes[1]!.y);
      expect(boxes[1]!.y).toBe(boxes[2]!.y);
      expect(boxes[3]!.y).toBe(boxes[4]!.y);
      expect(boxes[4]!.y).toBe(boxes[5]!.y);
      expect(boxes[3]!.y).toBeGreaterThan(boxes[0]!.y);
      for (const box of boxes) {
        expect(Math.abs(box.w - boxes[0]!.w)).toBeLessThan(1);
        expect(Math.abs(box.h - boxes[0]!.h)).toBeLessThan(1);
      }
      await expect(page.locator("#servicos .catalog-dots")).toBeHidden();
    } else {
      const track = page.locator("#servicos .service-catalog");
      const metrics = await track.evaluate((node) => ({
        scroll: node.scrollWidth,
        client: node.clientWidth,
        snap: getComputedStyle(node).scrollSnapType,
      }));
      expect(metrics.scroll).toBeGreaterThan(metrics.client);
      expect(metrics.snap).toContain("x");
      for (const box of boxes) expect(box.y).toBe(boxes[0]!.y);
      const viewport = page.viewportSize()!.width;
      expect(boxes[0]!.w).toBeLessThan(viewport);
      const dots = page.locator("#servicos .catalog-dots button");
      await expect(dots).toHaveCount(6);
      await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");
      await dots.nth(3).click();
      await expect(dots.nth(3)).toHaveAttribute("aria-current", "true");
      expect(await track.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
    await expectNoHorizontalOverflow(page);
  });

  test("each solution opens the quote dialog at step 03 with area and solution preselected", async ({
    page,
  }) => {
    const item = page.getByRole("button", {
      name: "Solicitar cotação: Seguro viagem, VIDA E SAÚDE",
    });
    await item.click();
    const dialog = page.locator("#quote-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("form")).toHaveAttribute("data-step", "3");
    await expect(dialog.locator(".quote-selection")).toContainText("VIDA E SAÚDE");
    await expect(dialog.locator(".quote-selection")).toContainText("Seguro viagem");
    await expect(dialog.locator("#quote-name")).toBeFocused();
  });

  test("solutions are reachable and activatable from the keyboard", async ({ page }) => {
    const item = page.getByRole("button", {
      name: "Solicitar cotação: RC Geral, RESPONSABILIDADE CIVIL",
    });
    await item.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#quote-dialog form")).toHaveAttribute("data-step", "3");
  });
});

test.describe("Como funciona", () => {
  test("presents exactly three steps, horizontal on desktop and a carousel on phones", async ({
    page,
    isMobile,
  }) => {
    await revealAll(page);
    const section = page.locator("#como-funciona");
    const steps = section.locator(".process-step");
    await expect(steps).toHaveCount(3);
    await expect(steps.locator(".bento-title")).toHaveText([
      "ESCOLHA UMA SOLUÇÃO",
      "PREENCHA OS DADOS",
      "Receba a cotação",
    ]);
    await expect(page.locator("body")).not.toContainText(/COMPARE AS SEGURADORAS/i);
    await expect(section).not.toContainText(/SUPORTE 24 HORAS|ACOMPANHAMENTO ATÉ A RESOLUÇÃO/);
    await expect(section.locator(".bento-card")).toHaveCount(3);

    const boxes = await steps.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          top: Math.round(rect.top + scrollY),
          left: rect.left,
          right: rect.right,
          w: rect.width,
        };
      }),
    );
    // Both layouts keep the steps on one row: side by side on desktop, a swipe track on phones.
    expect(Math.abs(boxes[0]!.top - boxes[1]!.top)).toBeLessThanOrEqual(4);
    expect(Math.abs(boxes[1]!.top - boxes[2]!.top)).toBeLessThanOrEqual(4);
    expect(boxes[0]!.right).toBeLessThanOrEqual(boxes[1]!.left);
    expect(boxes[1]!.right).toBeLessThanOrEqual(boxes[2]!.left);
    if (isMobile) {
      expect(boxes[0]!.w).toBeLessThan(page.viewportSize()!.width);
      const dots = section.locator('[aria-current="true"]');
      await expect(dots).toHaveCount(1);
    }
    // Copy never overflows its card.
    const clipped = await steps.evaluateAll(
      (nodes) =>
        nodes.filter((node) => {
          const card = node.getBoundingClientRect();
          const copy = node.querySelector(".bento-copy")!.getBoundingClientRect();
          return copy.top < card.top || copy.bottom > card.bottom + 0.5;
        }).length,
    );
    expect(clipped).toBe(0);
    await expectNoHorizontalOverflow(page);
  });
});

test("Companhias has a visible section title", async ({ page }) => {
  await expect(page.locator(".companies h2")).toHaveText("COMPANHIAS");
  await expect(page.locator(".companies h2")).toBeVisible();
});

test("the EXPERIÊNCIA, AGILIDADE E SOLIDEZ card is gone and nothing else is", async ({ page }) => {
  await expect(page.locator(".velaris-statement")).toHaveCount(0);
  await expect(page.locator("main h2", { hasText: /AGILIDADE\.\s*SOLIDEZ/ })).toHaveCount(0);
  for (const id of [
    "#servicos",
    "#como-funciona",
    "#sobre",
    "#indicacoes",
    "#beneficios",
    "#cotacao",
  ])
    await expect(page.locator(id)).toHaveCount(1);
  await expect(page.locator(".stats-band")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("A ZURY EM NÚMEROS");
});

test("referral cards show the individual code as one unbroken run of 12 dots", async ({ page }) => {
  const masks = page.locator("#indicacoes .member-code-mask");
  await expect(masks).toHaveCount(2);
  await expect(masks).toHaveText(["••••••••••••", "••••••••••••"]);
  await revealAll(page);
  for (const mask of await masks.all()) {
    const metrics = await mask.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        whiteSpace: style.whiteSpace,
        lines: node.getClientRects().length,
        height: node.getBoundingClientRect().height,
        fontSize: parseFloat(style.fontSize),
      };
    });
    expect(metrics.whiteSpace).toBe("nowrap");
    expect(metrics.height).toBeLessThan(metrics.fontSize * 2);
  }
});

test.describe("Quote dialog", () => {
  test("general CTA opens at step 01 with nothing selected", async ({ page }) => {
    await page.locator("#servicos .quote-trigger").click();
    const dialog = page.locator("#quote-dialog");
    await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
    await expect(dialog.locator(".quote-progress")).toHaveText(/PASSO 01 DE 04/);
    await expect(dialog.locator('input[name="quote-area"]')).toHaveCount(6);
    await expect(dialog.locator('input[name="quote-area"]:checked')).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "AVANÇAR" })).toBeDisabled();
  });

  test("walks the four steps, validates, masks, keeps data and opens WhatsApp", async ({
    page,
    context,
  }) => {
    await page.locator(".hero-actions .quote-trigger").click();
    const dialog = page.locator("#quote-dialog");
    const form = dialog.locator("form");
    const next = dialog.getByRole("button", { name: "AVANÇAR" });

    // 01 — área
    await dialog.locator('label.quote-option:has(input[value="06"])').click();
    await next.click();
    // 02 — solução: only that area's services
    await expect(form).toHaveAttribute("data-step", "2");
    await expect(dialog.locator('input[name="quote-solution"]')).toHaveCount(5);
    await dialog.getByRole("button", { name: "VOLTAR" }).click();
    await expect(form).toHaveAttribute("data-step", "1");
    await expect(dialog.locator('input[value="06"]')).toBeChecked();
    await next.click();
    await dialog.locator('label.quote-option:has(input[value="RC Profissional"])').click();
    await next.click();

    // 03 — dados: required fields block the step
    await expect(form).toHaveAttribute("data-step", "3");
    // The step effect moves focus (and WebKit's dialog scroll) after the React commit.
    await expect(dialog.locator("#quote-name")).toBeFocused();
    await next.click();
    await expect(form).toHaveAttribute("data-step", "3");
    for (const field of ["name", "document", "phone", "cep", "number", "complement", "consent"])
      await expect(dialog.locator(`#quote-${field}`)).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.locator("#quote-email")).not.toHaveAttribute("aria-invalid", "true");
    await expect(dialog.locator("#quote-name")).toBeFocused();

    // masks and validation
    await dialog.locator("#quote-document").fill("11111111111");
    await dialog.locator("#quote-document").blur();
    await expect(dialog.locator("#quote-document")).toHaveAttribute("aria-invalid", "true");
    await dialog.locator("#quote-document").fill("11222333000181");
    await expect(dialog.locator("#quote-document")).toHaveValue("11.222.333/0001-81");
    await dialog.locator("#quote-phone").fill("1234");
    await dialog.locator("#quote-phone").blur();
    await expect(dialog.locator("#quote-phone")).toHaveAttribute("aria-invalid", "true");
    await fillCustomer(page);
    await expect(dialog.locator("#quote-document")).toHaveValue(customer.cpfMasked);
    await expect(dialog.locator("#quote-phone")).toHaveValue(customer.phoneMasked);
    await expect(dialog.locator("#quote-cep")).toHaveValue(customer.cepMasked);

    // change area: the incompatible solution is cleared, typed data survives
    await dialog.getByRole("button", { name: "Alterar área" }).click();
    await expect(form).toHaveAttribute("data-step", "1");
    await dialog.locator('label.quote-option:has(input[value="02"])').click();
    await next.click();
    await expect(form).toHaveAttribute("data-step", "2");
    await expect(dialog.locator('input[name="quote-solution"]:checked')).toHaveCount(0);
    await dialog.locator('label.quote-option:has(input[value="Seguro viagem"])').click();
    await next.click();
    await expect(dialog.locator("#quote-name")).toHaveValue(customer.name);
    await expect(dialog.locator("#quote-consent")).toBeChecked();
    await next.click();

    // 04 — confirmação
    await expect(form).toHaveAttribute("data-step", "4");
    const review = dialog.locator(".quote-review");
    for (const value of [
      "VIDA E SAÚDE",
      "Seguro viagem",
      customer.name,
      customer.cpfMasked,
      customer.phoneMasked,
      customer.email,
      customer.cepMasked,
      customer.number,
      customer.complement,
    ])
      await expect(review).toContainText(value);
    await dialog.getByRole("button", { name: "VOLTAR" }).click();
    await expect(dialog.locator("#quote-complement")).toHaveValue(customer.complement);
    await next.click();

    const send = dialog.getByRole("link", { name: /ENVIAR PELO WHATSAPP/ });
    await expect(send).toHaveAttribute("target", "_blank");
    const [popup] = await Promise.all([context.waitForEvent("page"), send.click()]);
    const url = new URL(popup.url());
    expect(url.origin + url.pathname).toBe("https://wa.me/5538999608455");
    const message = url.searchParams.get("text") ?? "";
    for (const line of [
      "*Área:* VIDA E SAÚDE",
      "*Solução:* Seguro viagem",
      `*Nome/Razão social:* ${customer.name}`,
      `*CPF/CNPJ:* ${customer.cpfMasked}`,
      `*WhatsApp:* ${customer.phoneMasked}`,
      `*E-mail:* ${customer.email}`,
      `*CEP:* ${customer.cepMasked}`,
      `*Número:* ${customer.number}`,
      `*Complemento:* ${customer.complement}`,
    ])
      expect(message).toContain(line);
    await popup.close();
    // No "sent" confirmation before the customer actually sends it in WhatsApp.
    await expect(dialog).not.toContainText(/enviad[ao]|sucesso/i);
  });

  test("closes with Esc and X, restores focus and scroll, and resets on reopen", async ({
    page,
  }) => {
    const trigger = page.locator("#servicos .quote-trigger");
    await trigger.click();
    // The page is locked while the dialog is open, so this is the position the close must restore.
    const scroll = await page.evaluate(() => scrollY);
    const dialog = page.locator("#quote-dialog");
    await dialog.locator('label.quote-option:has(input[value="04"])').click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(Math.abs((await page.evaluate(() => scrollY)) - scroll)).toBeLessThan(2);
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");

    await trigger.click();
    await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
    await expect(dialog.locator('input[name="quote-area"]:checked')).toHaveCount(0);
    await dialog.getByRole("button", { name: "Fechar cotação" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("never stores the customer's data in browser storage", async ({ page }) => {
    await page.getByRole("button", { name: "Solicitar cotação: Motos, VEÍCULOS" }).click();
    await fillCustomer(page);
    await page.locator("#quote-dialog").getByRole("button", { name: "AVANÇAR" }).click();
    const stored = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    );
    expect(stored).not.toContain(customer.cpfMasked);
    expect(stored).not.toContain(customer.name);
    expect(await page.context().cookies()).toEqual([]);
  });

  test("fits the viewport without horizontal scroll", async ({ page }) => {
    await page.getByRole("button", { name: "Solicitar cotação: Safras, AGRONEGÓCIO" }).click();
    const dialog = page.locator("#quote-dialog");
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(
      await dialog.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(0);
  });
});

test.describe("Navbar", () => {
  test("desktop: Indicações and Benefícios left, logo centred, Redes sociais and a glowing COTAR AGORA right", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop navbar");
    const nav = page.locator(".header-desktop");
    const links = (await nav.locator(".desktop-nav-link").allTextContents()).map((t) => t.trim());
    expect(links).toEqual(expect.arrayContaining(["INDICAÇÕES", "BENEFÍCIOS"]));
    for (const gone of ["CARTÃO DIGITAL", "SOLUÇÕES", "DIFERENCIAIS", "SOBRE"])
      expect(links).not.toContain(gone);

    const logo = await nav.locator(".desktop-brand-link").boundingBox();
    const width = page.viewportSize()!.width;
    expect(Math.abs(logo!.x + logo!.width / 2 - width / 2)).toBeLessThan(4);

    const cta = nav.locator(".desktop-quote");
    const glow = await cta.evaluate((node) =>
      node
        .getAnimations({ subtree: true })
        .some(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "silver-trace-loop" &&
            animation.effect?.getTiming().iterations === Infinity,
        ),
    );
    expect(glow).toBe(true);

    const social = nav.getByRole("button", { name: /REDES SOCIAIS/i });
    await social.click();
    const menu = page.locator("#social-channels");
    await expect(menu).toBeVisible();
    for (const name of ["Instagram", "TikTok", "Facebook"]) await expect(menu).toContainText(name);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("phone: logo left, COTAR AGORA visible, hamburger for the rest", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "phone header");
    const quote = page.locator(".header-quote");
    await expect(quote).toBeVisible();
    const box = await quote.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await quote.click();
    await expect(page.locator("#quote-dialog form")).toHaveAttribute("data-step", "1");
    await page.keyboard.press("Escape");
    const toggle = page.locator(".mobile-menu-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
  });
});

test("only the floating WhatsApp keeps its circular face and travelling green beam", async ({
  page,
}) => {
  const button = page.locator(".floating-whatsapp > button");
  const shape = await button.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const css = getComputedStyle(node);
    const anims = node.getAnimations({ subtree: true }).filter((a) => a.playState === "running");
    return {
      w: rect.width,
      h: rect.height,
      radius: parseFloat(css.borderTopLeftRadius),
      running: anims.length,
    };
  });
  expect(Math.abs(shape.w - shape.h)).toBeLessThan(0.5);
  expect(shape.radius).toBeGreaterThanOrEqual(shape.w / 2);
  expect(shape.running).toBeGreaterThan(0);
});

test("existing calls to action keep working", async ({ page, isMobile }) => {
  const dialog = page.locator("#quote-dialog");
  await page.locator(isMobile ? ".header-quote" : ".desktop-quote").click();
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
  await page.keyboard.press("Escape");

  await page
    .locator(".hero-actions")
    .getByRole("button", { name: "FALE COM UM ESPECIALISTA" })
    .click();
  await expect(page.locator("#nav-contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator(".floating-whatsapp > button").click();
  await expect(page.locator("#floating-whatsapp-contacts a")).toHaveCount(3);
  await page.keyboard.press("Escape");

  for (const cta of await page.locator("#indicacoes .referral-cta").all())
    await expect(cta).toHaveAttribute("href", /^https:\/\/wa\.me\/5538999608455\?text=/);

  await page.locator("#cotacao .hero-contact").click();
  await expect(page.locator("#contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.locator("#cotacao .quote-trigger").click();
  await expect(dialog.locator("form")).toHaveAttribute("data-step", "1");
});

test("full page has no horizontal overflow", async ({ page }) => {
  await revealAll(page);
  await expectNoHorizontalOverflow(page);
});
