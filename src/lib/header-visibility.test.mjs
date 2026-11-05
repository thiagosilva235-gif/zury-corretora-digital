import test from "node:test";
import assert from "node:assert/strict";
import { headerShouldHide } from "./header-visibility.ts";

test("navbar desaparece ao descer e reaparece ao subir", () => {
  assert.equal(headerShouldHide(false, 100, 140, false), true);
  assert.equal(headerShouldHide(true, 140, 110, false), false);
});
test("navbar continua acessível no topo e durante interação", () => {
  assert.equal(headerShouldHide(true, 110, 0, false), false);
  assert.equal(headerShouldHide(false, 100, 150, true), false);
});
test("pequenas oscilações não alternam a navbar", () => {
  assert.equal(headerShouldHide(true, 150, 149, false), true);
  assert.equal(headerShouldHide(false, 150, 151, false), false);
});
