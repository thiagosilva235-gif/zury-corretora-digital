import { test, expect, gotoReady, expectNoHorizontalOverflow } from "./fixtures";

async function settledHeading(section: import("@playwright/test").Locator) {
  await expect
    .poll(() =>
      section
        .locator("[data-split]")
        .first()
        .evaluate((heading) =>
          Array.from(heading.querySelectorAll(".heading-line")).every(
            (line) => getComputedStyle(line.parentElement!).overflow === "visible",
          ),
        ),
    )
    .toBe(true);
}

const layouts = [
  { name: "ultrawide", width: 2560, height: 1080, background: "ultrawide.webp" },
  { name: "desktop", width: 1440, height: 900, background: "desktop.webp" },
  { name: "tablet-landscape", width: 1024, height: 768, background: "tablet-landscape.webp" },
  { name: "tablet-portrait", width: 820, height: 1180, background: "tablet-portrait.webp" },
  { name: "mobile", width: 390, height: 844, background: "mobile.webp" },
];
for (const layout of layouts) {
  test(`revisão visual integrada ${layout.name}`, async ({ page }, info) => {
    await page.setViewportSize({ width: layout.width, height: layout.height });
    await gotoReady(page, "/");
    await expect(page.locator(".zury-site")).toHaveAttribute("data-hero-entered", "true");
    const nav = page.locator(layout.width >= 1100 ? ".header-desktop" : ".header-mobile");
    expect((await nav.boundingBox())!.y).toBe(0);
    await expect(page.locator(".hero-line-accent")).toBeVisible();
    await page.screenshot({
      path: `qa/integrated-2026-11-05/${info.project.name}-${layout.name}-hero.png`,
    });
    const process = page.locator("#como-funciona");
    await process.scrollIntoViewIfNeeded();
    await expect(process.locator(".process-card").first()).toHaveCSS("clip-path", "none");
    await expect
      .poll(() =>
        process
          .locator(".process-card")
          .evaluateAll((nodes) =>
            nodes.every((node) => getComputedStyle(node).clipPath === "none"),
          ),
      )
      .toBe(true);
    await settledHeading(process);
    await expect(process.locator(".process-card-quote .bento-title")).toHaveText(
      "Receba a cotação",
    );
    await expect(process.locator(".process-card-quote .bento-description")).toHaveText(
      "Atendimento especializado disponível 24 horas por dia",
    );
    const overflow = await process.locator(".bento-copy").evaluateAll((nodes) =>
      nodes.some((n) => {
        const c = n.parentElement!.getBoundingClientRect(),
          b = n.getBoundingClientRect();
        return (
          b.top < c.top - 0.5 || b.bottom > c.bottom + 0.5 || n.scrollWidth > n.clientWidth + 1
        );
      }),
    );
    expect(overflow).toBe(false);
    await process.screenshot({
      path: `qa/integrated-2026-11-05/${info.project.name}-${layout.name}-process.png`,
    });
    for (const id of ["companhias", "beneficios"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await settledHeading(section);
      const rail = section.locator(".infinite-slider");
      await expect(rail).toHaveAttribute("data-reduced-motion", "false");
      const fit = await rail.evaluate((n) => {
        const track = n.querySelector(".infinite-slider-track")!;
        const groups = n.querySelectorAll(".infinite-slider-group");
        const a = groups[0]!.getBoundingClientRect(),
          b = groups[1]!.getBoundingClientRect(),
          v = n.getBoundingClientRect(),
          gap = parseFloat(getComputedStyle(track).columnGap);
        return {
          width: n.clientWidth,
          group: a.width,
          secondRight: b.right,
          viewportRight: v.right,
          gapError: Math.abs(b.left - a.right - gap),
          groups: groups.length,
        };
      });
      expect(fit.groups).toBe(2);
      expect(fit.group).toBeGreaterThanOrEqual(fit.width);
      expect(fit.gapError).toBeLessThan(1);
      expect(fit.secondRight).toBeGreaterThanOrEqual(fit.viewportRight - 1);
      await section.screenshot({
        path: `qa/integrated-2026-11-05/${info.project.name}-${layout.name}-${id}.png`,
      });
    }
    await expectNoHorizontalOverflow(page);
    await gotoReady(page, "/cartao");
    await expect
      .poll(() =>
        page
          .locator(".card-atmosphere img")
          .evaluate(
            (n: HTMLImageElement, file) => n.complete && n.currentSrc.endsWith(file),
            layout.background,
          ),
      )
      .toBe(true);
    await expect(page.locator(".card-atmosphere img")).toHaveCSS("filter", "none");
    await expect(
      page.locator('.card-footer .official-logo,.card-footer a[href*="wa.me"]'),
    ).toHaveCount(0);
    await expect(page.locator(".card-brand .brand-shine-light")).toBeVisible();
    await page.screenshot({
      path: `qa/integrated-2026-11-05/${info.project.name}-${layout.name}-card.png`,
    });
    await expectNoHorizontalOverflow(page);
  });
}

test("flutuação leve pausa com interação e mantém cópia íntegra com texto a 200%", async ({
  page,
  isMobile,
}, info) => {
  await gotoReady(page, "/");
  const section = page.locator("#como-funciona");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute("data-motion-paused", "false");
  const card = section.locator(".process-step").last();
  await expect(card).toHaveCSS("animation-name", "process-card-float");
  const first = await card.evaluate((n) => getComputedStyle(n).translate);
  await page.waitForTimeout(1400);
  const second = await card.evaluate((n) => getComputedStyle(n).translate);
  expect(second).not.toBe(first);
  if (!isMobile) {
    // An animated card is intentionally never "stable" for locator.hover; move the real pointer instead.
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(card).toHaveCSS("animation-play-state", "paused");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("animation-name", "none");
  await expect(card).toHaveCSS("translate", "none");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.setViewportSize({ width: 320, height: 700 });
  const lastStep = section.getByRole("button", { name: "Etapa 03", exact: true });
  if (isMobile) await lastStep.tap();
  else await lastStep.click();
  await expect(card).toBeInViewport();
  const geometry = await card.evaluate((n) => {
    const c = n.getBoundingClientRect(),
      copy = n.querySelector(".bento-copy")!.getBoundingClientRect(),
      title = n.querySelector(".bento-title")!;
    return {
      top: copy.top - c.top,
      bottom: copy.bottom - c.bottom,
      overflow: title.scrollWidth - title.clientWidth,
      font: parseFloat(getComputedStyle(title).fontSize),
      quoteWordLines: (() => {
        const text = title.firstChild!;
        const start = text.textContent!.indexOf("cotação");
        const word = document.createRange();
        word.setStart(text, start);
        word.setEnd(text, start + "cotação".length);
        return word.getClientRects().length;
      })(),
    };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.bottom).toBeLessThanOrEqual(0.5);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.font).toBeGreaterThanOrEqual(40);
  expect(geometry.quoteWordLines).toBe(1);
  await card.screenshot({
    path: `qa/integrated-2026-11-05/${info.project.name}-process-text-200.png`,
  });
  await expectNoHorizontalOverflow(page);
});

test("carrosséis estáticos e inteiramente acessíveis por teclado com movimento reduzido", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page, "/");
  for (const id of ["companhias", "beneficios"]) {
    const rail = page.locator(`#${id} .infinite-slider`);
    await rail.scrollIntoViewIfNeeded();
    await expect(rail).toHaveAttribute("tabindex", "0");
    await expect(rail).toHaveAttribute("data-reduced-motion", "true");
    await expect(rail.locator('[aria-hidden="true"].infinite-slider-group')).toBeHidden();
    const track = rail.locator(".infinite-slider-track");
    await expect(track).toHaveCSS("transform", "none");
    await rail.focus();
    await expect(rail).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => rail.evaluate((n) => n.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press("End");
    await expect
      .poll(() => rail.evaluate((n) => Math.abs(n.scrollWidth - n.clientWidth - n.scrollLeft)))
      .toBeLessThan(2);
    await page.keyboard.press("Home");
    await expect.poll(() => rail.evaluate((n) => n.scrollLeft)).toBe(0);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const rail = page.locator("#beneficios .infinite-slider");
  await expect(rail).toHaveAttribute("data-reduced-motion", "false");
  await expect
    .poll(() => rail.locator(".infinite-slider-track").evaluate((n) => n.style.transform))
    .not.toBe("");
  await expect.poll(() => rail.evaluate((n) => n.scrollLeft)).toBe(0);
  await expectNoHorizontalOverflow(page);
});

test("trilhos avançam no mesmo ritmo e repetição não cria salto visual", async ({ page }) => {
  await gotoReady(page, "/");
  for (const id of ["companhias", "beneficios"]) {
    const rail = page.locator(`#${id} .infinite-slider`);
    await rail.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    const sample = await rail.evaluate(async (n) => {
      const track = n.querySelector<HTMLElement>(".infinite-slider-track")!;
      const position = () => new DOMMatrixReadOnly(track.style.transform).m41;
      const start = performance.now(),
        x = position();
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { speed: ((position() - x) / (performance.now() - start)) * 1000 };
    });
    expect(sample.speed).toBeGreaterThan(85);
    expect(sample.speed).toBeLessThan(130);
  }
  const rail = page.locator("#beneficios .infinite-slider");
  const seam = await rail.evaluate(
    (n) =>
      new Promise<{ wraps: number; maxStep: number; gapError: number }>((resolve) => {
        const track = n.querySelector<HTMLElement>(".infinite-slider-track")!;
        const groups = n.querySelectorAll<HTMLElement>(".infinite-slider-group");
        const distance =
          groups[0]!.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
        let last = new DOMMatrixReadOnly(track.style.transform).m41,
          maxStep = 0,
          wraps = 0;
        const step = () => {
          const x = new DOMMatrixReadOnly(track.style.transform).m41;
          let dx = x - last;
          if (dx < -distance / 2) {
            wraps++;
            dx += distance;
          }
          maxStep = Math.max(maxStep, Math.abs(dx));
          last = x;
          if (wraps) {
            const a = groups[0]!.getBoundingClientRect(),
              b = groups[1]!.getBoundingClientRect();
            resolve({
              wraps,
              maxStep,
              gapError: Math.abs(b.left - a.right - parseFloat(getComputedStyle(track).columnGap)),
            });
            return;
          }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
  );
  expect(seam.wraps).toBe(1);
  expect(seam.maxStep).toBeLessThanOrEqual(6.1);
  expect(seam.gapError).toBeLessThan(1);
});

test("redimensionar e mudar orientação mantém geometria e direção dos carrosséis", async ({
  page,
}) => {
  await gotoReady(page, "/");
  for (const layout of [layouts[3]!, layouts[2]!, layouts[4]!, layouts[0]!]) {
    await page.setViewportSize({ width: layout.width, height: layout.height });
    for (const id of ["companhias", "beneficios"]) {
      const rail = page.locator(`#${id} .infinite-slider`);
      await rail.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const first = await rail
        .locator(".infinite-slider-track")
        .evaluate((n) => new DOMMatrixReadOnly((n as HTMLElement).style.transform).m41);
      await page.waitForTimeout(100);
      const second = await rail
        .locator(".infinite-slider-track")
        .evaluate((n) => new DOMMatrixReadOnly((n as HTMLElement).style.transform).m41);
      const distance = await rail
        .locator(".infinite-slider-group")
        .first()
        .evaluate((n) => n.getBoundingClientRect().width);
      expect(second - first).toBeGreaterThan(-distance - 35);
      expect(second - first).toBeLessThan(20);
    }
    await expectNoHorizontalOverflow(page);
  }
});

test("uma volta completa real das Companhias mantém a emenda contínua", async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "uma volta longa é verificada uma vez no Chrome desktop",
  );
  test.setTimeout(120000);
  await gotoReady(page, "/");
  const rail = page.locator("#companhias .infinite-slider");
  await rail.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const seam = await rail.evaluate(
    (n) =>
      new Promise<{ wraps: number; maxStep: number; gapError: number; seconds: number }>(
        (resolve) => {
          const track = n.querySelector<HTMLElement>(".infinite-slider-track")!;
          const groups = n.querySelectorAll<HTMLElement>(".infinite-slider-group");
          const distance =
              groups[0]!.getBoundingClientRect().width +
              parseFloat(getComputedStyle(track).columnGap),
            started = performance.now();
          let last = new DOMMatrixReadOnly(track.style.transform).m41,
            maxStep = 0,
            wraps = 0;
          const step = () => {
            const x = new DOMMatrixReadOnly(track.style.transform).m41;
            let dx = x - last;
            if (dx < -distance / 2) {
              wraps++;
              dx += distance;
            }
            maxStep = Math.max(maxStep, Math.abs(dx));
            last = x;
            if (wraps) {
              const a = groups[0]!.getBoundingClientRect(),
                b = groups[1]!.getBoundingClientRect();
              resolve({
                wraps,
                maxStep,
                gapError: Math.abs(
                  b.left - a.right - parseFloat(getComputedStyle(track).columnGap),
                ),
                seconds: (performance.now() - started) / 1000,
              });
              return;
            }
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        },
      ),
  );
  expect(seam.wraps).toBe(1);
  expect(seam.maxStep).toBeLessThanOrEqual(6.1);
  expect(seam.gapError).toBeLessThan(1);
  await test
    .info()
    .attach("companhias-loop", { body: JSON.stringify(seam), contentType: "application/json" });
});
