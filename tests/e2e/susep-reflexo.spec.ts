import { expect, gotoReady, test } from "./fixtures";

test("reflexo acompanha o cursor nas duas direções sem ultrapassar o card", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "O efeito acompanha cursor de mouse no desktop.");
  await gotoReady(page, "/");
  const badge = page.locator(".award-badge");
  await badge.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = (await badge.boundingBox())!;
  const positions: number[] = [];
  for (const position of [0.05, 0.25, 0.5, 0.75, 0.95, 0.75, 0.5, 0.25, 0.05]) {
    await page.mouse.move(box.x + box.width * position, box.y + box.height / 2);
    await expect(badge).toHaveAttribute("data-pointer-active", "true");
    await page.waitForTimeout(260);
    const center = await badge.evaluate((node) => {
      const parent = node.getBoundingClientRect();
      const light = node.querySelector(".award-badge-shine")!.getBoundingClientRect();
      return (light.left + light.width / 2 - parent.left) / parent.width;
    });
    expect(Math.abs(center - position)).toBeLessThan(0.06);
    positions.push(center);
  }
  expect(positions.slice(0, 5)).toEqual([...positions.slice(0, 5)].sort((a, b) => a - b));
  expect(positions.slice(4)).toEqual([...positions.slice(4)].sort((a, b) => b - a));
  const shine = badge.locator(".award-badge-shine");
  const lastTransform = await shine.evaluate((node) => (node as HTMLElement).style.transform);
  await page.mouse.move(box.x - 20, box.y + box.height / 2);
  await expect(badge).not.toHaveAttribute("data-pointer-active", "true");
  await expect(shine).toHaveCSS("opacity", "0");
  expect(await shine.evaluate((node) => (node as HTMLElement).style.transform)).toBe(lastTransform);
  await expect(badge).toHaveAttribute("href", /certidao-corretora-susep\.pdf$/);
});

test("feixe de cotação é mais visível e continua sincronizado", async ({ page, isMobile }) => {
  await gotoReady(page, "/");
  const navbar = page.locator(isMobile ? ".header-quote" : ".desktop-quote");
  const hero = page.locator(".hero-actions > .quote-trigger");
  for (const control of [navbar, hero]) {
    const trace = control.locator(".silver-trace--green");
    await expect(trace).toHaveCSS("padding-top", "1.8px");
    const after = await trace.evaluate((node) => {
      const css = getComputedStyle(node, "::after");
      return { duration: css.animationDuration, path: css.animationName };
    });
    expect(after).toEqual({ duration: "3.6s", path: "silver-trace-loop" });
  }
  const phases = await page
    .locator(".silver-trace--green.silver-trace--loop")
    .evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        node
          .getAnimations({ subtree: true })
          .filter((animation) => (animation as CSSAnimation).animationName === "silver-trace-loop")
          .map((animation) => Number(animation.currentTime) % 3600),
      ),
    );
  const first = phases[0]!;
  expect(
    Math.max(...phases.map((phase) => Math.abs(((phase - first + 5400) % 3600) - 1800))),
  ).toBeLessThan(35);
  await hero.click();
  await expect(page.locator("#quote-dialog")).toBeVisible();
});

test("contatos de Thiago apontam para o novo número no site e no cartão", async ({ page }) => {
  for (const [path, minimum] of [
    ["/", 4],
    ["/cartao", 2],
  ] as const) {
    await gotoReady(page, path);
    const links = page.locator('a[href^="https://wa.me/5538999608455"]');
    expect(await links.count()).toBeGreaterThanOrEqual(minimum);
    await expect(page.locator('a[href*="5538998645200"]')).toHaveCount(0);
  }
});
