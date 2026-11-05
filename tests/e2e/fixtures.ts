import { test as base, expect, type Page } from "@playwright/test";

/**
 * Shared page setup:
 * - `/__l5e/*` assets (hero video, poster, PDFs) are served by the Lovable CDN in production, not by Vite dev;
 *   they are answered empty so the dev server's 404s don't count as page errors.
 * - wa.me is answered locally so WhatsApp links can be opened and inspected without leaving the test.
 * - Any console error or uncaught exception fails the test.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page, context }, provide) => {
    const errors: string[] = [];
    await context.route("**/__l5e/**", (route) => route.fulfill({ status: 200, body: "" }));
    await context.route("https://wa.me/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>WhatsApp</title>" }),
    );
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    await provide(page);
    expect(errors, "console errors / exceptions").toEqual([]);
  },
});
export { expect };

/**
 * Navigates and waits for React hydration: native popovers work before it, React handlers do not.
 * The quote dialog is on every page, so its fiber key marks a hydrated tree.
 */
export async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => {
    const dialog = document.querySelector("#quote-dialog");
    return !!dialog && Object.keys(dialog).some((key) => key.startsWith("__reactFiber"));
  });
  // Passive effects (event listeners) flush right after the hydration commit.
  await page.waitForTimeout(300);
}

/** Scrolls the whole page in viewport steps so every scroll-triggered reveal has run, then returns to the top. */
export async function revealAll(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()?.height ?? 800;
  for (let y = 0; y < height; y += Math.round(step * 0.6)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

export const customer = {
  name: "Maria Teste da Silva",
  cpf: "52998224725",
  cpfMasked: "529.982.247-25",
  phone: "38998645200",
  phoneMasked: "(38) 99864-5200",
  cep: "39400000",
  cepMasked: "39400-000",
  number: "120",
  complement: "Apto 302",
  email: "maria@example.com",
};

/** Fills step 03 with a valid customer. */
export async function fillCustomer(page: Page, withEmail = true) {
  const dialog = page.locator("#quote-dialog");
  await dialog.locator("#quote-name").fill(customer.name);
  await dialog.locator("#quote-document").fill(customer.cpf);
  await dialog.locator("#quote-phone").fill(customer.phone);
  if (withEmail) await dialog.locator("#quote-email").fill(customer.email);
  await dialog.locator("#quote-cep").fill(customer.cep);
  await dialog.locator("#quote-number").fill(customer.number);
  await dialog.locator("#quote-complement").fill(customer.complement);
  await dialog.locator("#quote-consent").check();
}
