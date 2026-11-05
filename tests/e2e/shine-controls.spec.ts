import { test, expect, gotoReady, expectNoHorizontalOverflow } from "./fixtures";

async function clock(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const logo = [...document.querySelectorAll(".site-header .brand-shine-light")]
      .flatMap((n) => n.getAnimations({ subtree: true }))
      .find((a) => "animationName" in a && a.animationName === "brand-shine")!;
    const text = document
      .querySelector(".hero-text-shine")!
      .getAnimations()
      .find((a) => "animationName" in a && a.animationName === "brand-text-shine")!;
    return {
      now: Number(document.timeline.currentTime),
      logoStart: Number(logo.startTime),
      textStart: Number(text.startTime),
      logoTime: Number(logo.currentTime),
      textTime: Number(text.currentTime),
      position: getComputedStyle(document.querySelector(".hero-text-shine")!).backgroundPositionX,
    };
  });
}

test("entrada única e reflexo sincronizado no início fim e duas repetições", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const state = window as unknown as { entries: { name: string; time: number; end: boolean }[] };
    state.entries = [];
    for (const name of ["animationstart", "animationend"])
      document.addEventListener(name, (event) => {
        const e = event as AnimationEvent;
        if (e.animationName === "hero-line-entry")
          state.entries.push({
            name: e.animationName,
            time: document.timeline.currentTime as number,
            end: name === "animationend",
          });
      });
  });
  await gotoReady(page, "/");
  await expect(page.locator(".zury-site")).toHaveAttribute("data-shine-ready", "true");
  await expect(page.locator(".zury-site")).toHaveAttribute("data-hero-entered", "true");
  const initial = await clock(page);
  const entries = await page.evaluate(
    () => (window as unknown as { entries: { end: boolean; time: number }[] }).entries,
  );
  expect(entries.filter((e) => !e.end)).toHaveLength(4);
  expect(entries.filter((e) => e.end)).toHaveLength(4);
  expect(initial.textStart).toBeGreaterThanOrEqual(
    Math.max(...entries.filter((e) => e.end).map((e) => e.time)) - 35,
  );
  expect(Math.abs((initial.textStart - initial.logoStart) % 3400)).toBeLessThan(1);
  for (const offset of [60, 1950, 3460, 6860]) {
    // Wait for animation time, not wall time: a busy/background browser may defer animation frames.
    await page.waitForFunction(
      (target) => Number(document.timeline.currentTime) >= target,
      initial.textStart + offset,
    );
    if (offset === 1950) await expect.poll(async () => (await clock(page)).position).toBe("200%");
    const state = await clock(page);
    const gap = Math.abs(((state.logoTime - state.textTime + 5100) % 3400) - 1700);
    expect(gap).toBeLessThan(25);
  }
  const width = page.viewportSize()!.width;
  await page.setViewportSize({ width: width >= 1100 ? 390 : 1440, height: 900 });
  await expect
    .poll(async () => {
      const s = await clock(page);
      return Math.abs(((s.logoTime - s.textTime + 5100) % 3400) - 1700);
    })
    .toBeLessThan(25);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { entries: { end: boolean }[] }).entries.filter((e) => !e.end).length,
    ),
  ).toBe(4);
  await page.screenshot({ path: `qa/shine-controls-2026-11-05/${info.project.name}-sweep.png` });
});

test("navbar no topo fade suave e disponível para teclado", async ({ page, isMobile }) => {
  await gotoReady(page, "/");
  const bar = page.locator(isMobile ? ".header-mobile" : ".header-desktop");
  const header = page.locator(".site-header");
  expect((await bar.boundingBox())!.y).toBe(0);
  await expect(header).toHaveCSS("transition-duration", "0.52s, 0s");
  await page.evaluate(() => scrollTo({ top: 500, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-hidden", "true");
  await expect(header).toHaveCSS("opacity", "0");
  await page.keyboard.press("Tab");
  await expect(header).toHaveAttribute("data-hidden", "false");
  await expect(header).toHaveCSS("opacity", "1");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).not.toHaveAttribute("inert", "");
  expect((await bar.boundingBox())!.y).toBe(0);
  await bar.getByRole("button", { name: "COTAR AGORA" }).click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expectNoHorizontalOverflow(page);
});

test("feixes mantêm as espessuras por seção e solicitar cotação compartilha a face grafite", async ({
  page,
  isMobile,
}, info) => {
  await gotoReady(page, "/");
  const rings = await page.locator(".silver-trace--green").evaluateAll((nodes) =>
    nodes.map((n) => ({
      parent: n.parentElement!.className,
      reinforced: n.parentElement!.matches(
        ".desktop-quote, .header-quote, .hero-actions > .quote-trigger",
      ),
      thicker: n.parentElement!.matches(".referral-cta, .cta-marquee-actions > .green-cta"),
      desktopHeroContact: n.parentElement!.matches(".hero-actions > .hero-contact"),
      desktopReinforced: n.parentElement!.matches(".desktop-quote, .hero-actions > .quote-trigger"),
      padding: parseFloat(getComputedStyle(n).paddingTop),
      duration: getComputedStyle(n, "::after").animationDuration,
    })),
  );
  for (const ring of rings) {
    const desktop = info.project.use.viewport && info.project.use.viewport.width >= 1100;
    const expected =
      desktop && ring.desktopReinforced
        ? 2.34
        : ring.thicker || (desktop && ring.desktopHeroContact)
          ? 1.95
          : ring.reinforced
            ? 1.8
            : 1.5;
    expect(ring.padding).toBe(expected);
    expect(ring.duration).toBe("3.6s");
  }
  const navbar = page.locator(isMobile ? ".header-quote" : ".desktop-quote");
  const solution = page.locator(".solutions-quote-cta");
  const face = await navbar.evaluate((n) => getComputedStyle(n).backgroundImage);
  await expect(solution).toHaveCSS("background-image", face);
  await expect(solution).toHaveCSS("border-top-width", "0px");
  const specialist = page.locator(".hero .hero-contact");
  await expect(specialist).toHaveCSS("background-color", "rgba(8, 11, 14, 0.76)");
  await expect(specialist).toHaveCSS("backdrop-filter", "blur(8px)");
  await specialist.click();
  await expect(page.locator("#nav-contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");
  if (!isMobile) {
    await navbar.hover();
    const hoverFace = await navbar.evaluate((n) => getComputedStyle(n).backgroundImage);
    await solution.hover();
    await expect(solution).toHaveCSS("background-image", hoverFace);
    await expect(solution).toHaveCSS("border-top-width", "0px");
  }
  await solution.click();
  await expect(page.locator("#quote-dialog form")).toHaveAttribute("data-step", "1");
  await page.keyboard.press("Escape");
  await expect(solution).toBeFocused();
  await expect(solution).toHaveCSS("outline-style", "solid");
  await page.screenshot({
    path: `qa/shine-controls-2026-11-05/${info.project.name}-solutions.png`,
  });
  await page.locator("#cotacao .hero-contact").click();
  await expect(page.locator("#contact-channels")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("cartão mantém fundos deslocados ícones próximos e rodapé sem WhatsApp", async ({
  page,
}, info) => {
  await gotoReady(page, "/cartao");
  const geometry = await page.locator(".card-atmosphere").evaluate((n) => {
    const image = n.querySelector("img")!;
    return {
      container: n.getBoundingClientRect().height,
      image: image.getBoundingClientRect().height,
      shift: Math.min(96, Math.max(40, innerHeight * 0.08)),
      filter: getComputedStyle(image).filter,
      src: image.currentSrc,
    };
  });
  expect(Math.abs(geometry.image - geometry.container - geometry.shift * 2)).toBeLessThan(2);
  expect(geometry.filter).toBe("none");
  expect(geometry.src).toContain("/backgrounds/digital-card/");
  for (const item of await page.locator(".card-control").all()) {
    const shape = await item.evaluate((n) => {
      const icon = n.querySelector("img,svg,.card-instagram-icon")!.getBoundingClientRect();
      const label = n
        .querySelector("span:not(.silver-trace):not(.card-instagram-icon):not(.sr-only)")!
        .getBoundingClientRect();
      const box = n.getBoundingClientRect();
      return {
        gap: label.left - icon.right,
        y: Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2),
        center: Math.abs((icon.left + label.right) / 2 - box.x - box.width / 2),
      };
    });
    expect(shape.gap).toBeGreaterThanOrEqual(7);
    expect(shape.gap).toBeLessThanOrEqual(11);
    expect(shape.y).toBeLessThan(1);
    expect(shape.center).toBeLessThan(1);
  }
  await expect(page.locator(".card-quote-cta img")).toHaveCount(1);
  await expect(page.locator('.card-footer a[href*="wa.me"]')).toHaveCount(0);
  await expect(page.locator(".card-whatsapp")).toHaveCount(1);
  await page.screenshot({ path: `qa/shine-controls-2026-11-05/${info.project.name}-card.png` });
  await expectNoHorizontalOverflow(page);
});

test("movimento reduzido mantém frase navbar logo e botões em estado estático", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page, "/");
  await expect(page.locator(".hero-line-accent")).toBeVisible();
  await expect(page.locator(".hero-text-shine")).toBeHidden();
  await expect(page.locator(".hero-line").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".site-header")).toHaveCSS("transition-duration", "0s");
  expect(
    await page
      .locator(".hero .silver-trace")
      .first()
      .evaluate((n) => getComputedStyle(n, "::after").animationName),
  ).toBe("none");
  await page.locator(isMobile ? ".header-quote" : ".desktop-quote").click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await gotoReady(page, "/cartao");
  await expect(page.locator(".card-reduced-title")).toBeVisible();
  await expect(page.locator(".card-title-lines")).toBeHidden();
  await page.locator(".card-whatsapp").click();
  await expect(page.locator("#card-contact-channels")).toBeVisible();
});
