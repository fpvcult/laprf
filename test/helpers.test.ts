/// <reference types="jest" />

import { escape, unescape, splitRecords, convert } from '../src/helpers';
import { SOR, EOR, ESC, ESC_OFFSET } from '../src/const';
import * as mock from './mock';

describe('unescape', () => {
  test('removes escapes', () => {
    const expected = Uint8Array.from([SOR, ESC, EOR]);
    const escaped = unescape(Uint8Array.from([SOR, ESC, ESC + ESC_OFFSET, EOR]));
    expect(convert(escaped, Uint8Array)).toEqual(expected);
  });
});

describe('escape', () => {
  test('places escapes', () => {
    const expected = Uint8Array.from([SOR,ESC,ESC + ESC_OFFSET,ESC,SOR + ESC_OFFSET,ESC,EOR + ESC_OFFSET,EOR]); // prettier-ignore
    const escaped = escape(Uint8Array.from([SOR, ESC, SOR, EOR, EOR]));
    expect(escaped).toEqual(expected.buffer);
  });
});

describe('splitRecords', () => {
  test('separates multiple records from a packet', () => {
    const expected = 4;
    const packet = mock.data.rx.rfSetupRecordMultiple;
    const records = splitRecords(convert(packet, DataView));
    expect(records.length).toEqual(expected);
  });
});
