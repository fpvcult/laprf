/// <reference types="jest" />

import { escape, unescape, splitRecords, convert } from '../src/helpers';
import { SOR, EOR, ESC, ESC_OFFSET } from '../src/const';
import { toBytes } from './util';

describe('unescape', () => {
  test('removes escapes', () => {
    const expected = Uint8Array.from([SOR, ESC, EOR]);
    const escaped = unescape(Uint8Array.from([SOR, ESC, ESC + ESC_OFFSET, EOR]));
    expect(convert(escaped, Uint8Array)).toEqual(expected);
  });
});

describe('escape', () => {
  test('places escapes', () => {
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

describe('splitRecords', () => {
  test('separates multiple records from a packet', () => {
    const expected = 4;
    const records = splitRecords(convert(toBytes("5a2500065d02da01010120020100220201002102020024023a00230400808944250280165b5a2500a62602da01010220020100220201002102080024023a002304008089442502f8165b5a2500b78902da01010320020000220203002102020024023c00230400007b44250235165b5a2500cf6602da01010420020000220201002102080024023c00230400007b442502ae165b"), DataView)); // prettier-ignore
    expect(records.length).toEqual(expected);
  });
});
