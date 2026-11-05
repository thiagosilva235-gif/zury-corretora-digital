import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as content from "./content.ts";

test("benefit offers are opt-in for production preview and do not inherit referral approval", () => {
  assert.equal(typeof content.isBenefitsPreviewEnabled, "function");
  for (const env of [
    {},
    { NODE_ENV: "production" },
    { NODE_ENV: "production", ZURY_REFERRAL_PREVIEW: "true" },
    { ZURY_BENEFITS_PREVIEW: "false" },
  ]) {
    assert.equal(content.isBenefitsPreviewEnabled(env), false);
  }
  assert.equal(content.isBenefitsPreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(
    content.isBenefitsPreviewEnabled({ NODE_ENV: "production", ZURY_BENEFITS_PREVIEW: "true" }),
    true,
  );
});

test("each partner logo is a real PNG with the declared original dimensions", async () => {
  for (const partner of content.benefitPartners) {
    if (!partner.logo) continue;
    const bytes = await readFile(new URL(`../../public${partner.logo}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), partner.width);
    assert.equal(bytes.readUInt32BE(20), partner.height);
  }
});
