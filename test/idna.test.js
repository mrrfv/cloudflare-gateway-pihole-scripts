import test from "node:test";
import assert from "node:assert/strict";
import { isValidDomain } from "../lib/utils.js";

test("rejects malformed Punycode labels", () => {
  assert.equal(isValidDomain("xn--29s7inly9ib.example"), false);
  assert.equal(isValidDomain("xn--0.example"), false);
});

test("accepts valid internationalized and ordinary domain names", () => {
  assert.equal(isValidDomain("xn--bcher-kva.example"), true);
  assert.equal(isValidDomain("ads.example.com"), true);
});
