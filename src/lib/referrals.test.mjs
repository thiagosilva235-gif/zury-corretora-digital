import assert from "node:assert/strict";
import test from "node:test";
import * as content from "./content.ts";

test("unvalidated referral offer stays absent from production unless preview is explicitly enabled", () => {
  assert.equal(typeof content.isReferralPreviewEnabled, "function");
  for (const env of [
    {},
    { NODE_ENV: "production" },
    { NODE_ENV: "production", ZURY_REFERRAL_PREVIEW: "false" },
  ]) {
    assert.equal(content.isReferralPreviewEnabled(env), false);
  }
  assert.equal(content.isReferralPreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(
    content.isReferralPreviewEnabled({ NODE_ENV: "production", ZURY_REFERRAL_PREVIEW: "true" }),
    true,
  );
});

test("referral inquiry links use an official contact and preserve each approved message through URL encoding", () => {
  assert.equal(typeof content.referralInquiryHref, "function");
  for (const [id, message] of [
    [
      "affiliate",
      "Olá! Tenho interesse em participar do programa de afiliados da ZURY CORRETORA. Gostaria de saber como funciona.",
    ],
    [
      "commercial",
      "Olá! Tenho interesse em me tornar parceiro comercial da ZURY CORRETORA. Gostaria de conhecer as condições da parceria.",
    ],
  ]) {
    const url = new URL(content.referralInquiryHref(id));
    assert.equal(url.origin + url.pathname, "https://wa.me/5538999608455");
    assert.equal(url.searchParams.get("text"), message);
    assert.equal([...url.searchParams].length, 1);
  }
  assert.throws(() => content.referralInquiryHref("unknown"), RangeError);
});

test("navigation exposes the referral anchor only alongside the enabled section", () => {
  assert.equal(typeof content.navigationForSite, "function");
  assert.deepEqual(content.navigationForSite(false), content.navigation);
  assert.deepEqual(
    content.navigationForSite(true).map(({ href }) => href),
    ["#servicos", "#sobre", "#indicacoes", "#institucional"],
  );
});

test("navigation preserves the approved order and independent commercial gates", () => {
  assert.deepEqual(content.navigationForSite(true, true), [
    { label: "SOLUÇÕES", href: "#servicos" },
    { label: "DIFERENCIAIS", href: "#sobre" },
    { label: "INDICAÇÕES", href: "#indicacoes" },
    { label: "BENEFÍCIOS", href: "#beneficios" },
    { label: "SOBRE", href: "#institucional" },
  ]);
  for (const referrals of [false, true]) {
    for (const benefits of [false, true]) {
      const links = content.navigationForSite(referrals, benefits);
      assert.equal(
        links.some(({ href }) => href === "#indicacoes"),
        referrals,
      );
      assert.equal(
        links.some(({ href }) => href === "#beneficios"),
        benefits,
      );
      assert.equal(new Set(links.map(({ href }) => href)).size, links.length);
    }
  }
});
