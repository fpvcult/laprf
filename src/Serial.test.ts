/// <reference types="jest" />

import Serial from './Serial';
import { SOR, EOR, ESC, ESC_OFFSET } from './const';

const serial: any = new Serial(); // eslint-disable-line @typescript-eslint/no-explicit-any

describe('Serial#unescape', () => {
  test('removes escapes', () => {
    const expected = Buffer.from([SOR, ESC, EOR]);
    serial.unescape(Buffer.from([SOR, ESC, ESC + ESC_OFFSET, EOR]));
    const escaped = serial.toBuffer();
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
    const escaped = serial.escape(Buffer.from([SOR, ESC, SOR, EOR, EOR]));
    expect(escaped).toEqual(expected);
  });
});
