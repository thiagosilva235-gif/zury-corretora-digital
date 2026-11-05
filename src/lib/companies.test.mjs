import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { companyLogos } from "./content.ts";

test("all 37 supplied company marks have unique accessible names and original PNG dimensions", async () => {
  assert.equal(companyLogos.length, 37);
  assert.equal(new Set(companyLogos.map((logo) => logo.id)).size, 37);
  for (const logo of companyLogos) {
    const bytes = await readFile(new URL(`../../public${logo.src}`, import.meta.url));
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), logo.width);
    assert.equal(bytes.readUInt32BE(20), logo.height);
    assert.ok(logo.displayWidth >= 80 && logo.displayWidth <= 220);
  }
});
