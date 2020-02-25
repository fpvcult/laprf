/// <reference types="jest" />

import * as Serial from './Serial';
import { SOR, EOR, ESC, ESC_OFFSET } from './const';

describe('Serial#unescape', () => {
  test('removes escapes', () => {
    const expected = Buffer.from([SOR, ESC, EOR]);
    const escaped = Serial.unescape(Buffer.from([SOR, ESC, ESC + ESC_OFFSET, EOR]));
    expect(escaped).toEqual(expected);
  });
});

describe('Serial#escape', () => {
  test('places escapes', () => {
    const expected = Buffer.from([
      SOR,
      ESC,
      ESC + ESC_OFFSET,
      ESC,
      SOR + ESC_OFFSET,
      ESC,
      EOR + ESC_OFFSET,
      EOR,
    ]);
    const escaped = Serial.escape(Buffer.from([SOR, ESC, SOR, EOR, EOR]));
    expect(escaped).toEqual(expected);
  });
});
