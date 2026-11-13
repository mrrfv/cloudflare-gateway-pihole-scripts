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

test("validates DNS syntax and length boundaries", () => {
  const maximum = ["a".repeat(63), "b".repeat(63), "c".repeat(63), "d".repeat(61)].join(".");
  for (const domain of ["example.com", "sub.example.com", "a--b.com", "example.xn--p1ai", maximum]) {
    assert.equal(isValidDomain(domain), true, domain);
  }
  for (const domain of ["xn--.com", "a..com", "-example.com", "example-.com", "example.com/path", "a".repeat(64) + ".com", maximum + "a", "EXAMPLE.COM", "bücher.de", "example.com.", "*.example.com", "example.123", "example.com\n", null]) {
    assert.equal(isValidDomain(domain), false, String(domain));
  }
});
