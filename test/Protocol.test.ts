/// <reference types="jest" />

import { Protocol } from '../src/Protocol';
import { toBytes } from './util';

const GET_RTC_TIME_RECORD = toBytes('5a0a0096e30cda02005b');
const GET_MIN_LAP_TIME_RECORD = toBytes('5a0e00e07a07da2604000000005b');
const GET_RF_SETUP_RECORD_ALL = toBytes('5a2000e01e02da0101010101020101030101040101050101060101070101085b'); // prettier-ignore
const GET_RF_SETUP_RECORD_SINGLE = toBytes('5a0b00195c9a02da0101015b');

describe('Protocol', () => {
  test('getRtcTime', () => {
    const expected = GET_RTC_TIME_RECORD;
    const decoded = Protocol.getRtcTime();
    expect(decoded).toEqual(expected);
  });

  test('getMinLapTime', () => {
    const expected = GET_MIN_LAP_TIME_RECORD;
    const decoded = Protocol.getMinLapTime();
    expect(decoded).toEqual(expected);
  });

  test('getRfSetup', () => {
    const expected = GET_RF_SETUP_RECORD_ALL;
    const decoded = Protocol.getRfSetup();
    expect(decoded).toEqual(expected);
  });
  test('getRfSetup single slotIndex', () => {
    const expected = GET_RF_SETUP_RECORD_SINGLE;
    const decoded = Protocol.getRfSetup(1);
    expect(decoded).toEqual(expected);
  });
});
