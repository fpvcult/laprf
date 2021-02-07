/// <reference types="jest" />

import { escape, unescape } from "./helpers";
import { SOR, EOR, ESC, ESC_OFFSET } from "./const";

describe("unescape", () => {
  test("removes escapes", () => {
    const expected = Uint8Array.from([SOR, ESC, EOR]);
    const escaped = unescape(Uint8Array.from([SOR, ESC, ESC + ESC_OFFSET, EOR]));
    expect(escaped).toEqual(expected.buffer);
  });
});

describe("escape", () => {
  test("places escapes", () => {
    const expected = Uint8Array.from([
      SOR,
      ESC,
      ESC + ESC_OFFSET,
      ESC,
      SOR + ESC_OFFSET,
      ESC,
      EOR + ESC_OFFSET,
      EOR,
    ]);
    const escaped = escape(Uint8Array.from([SOR, ESC, SOR, EOR, EOR]));
    expect(escaped).toEqual(expected.buffer);
  });
});
