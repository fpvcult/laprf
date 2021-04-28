/// <reference types="jest" />

import { Protocol } from '../src/Protocol';
import * as mock from './mock';

describe('Protocol', () => {
  test('getRtcTime', () => {
    const expected = mock.data.tx.getRtcTime;
    const decoded = Protocol.getRtcTime();
    expect(decoded).toEqual(expected);
  });

  test('getMinLapTime', () => {
    const expected = mock.data.tx.getMinLapTime;
    const decoded = Protocol.getMinLapTime();
    expect(decoded).toEqual(expected);
  });

  test('setMinLapTime', () => {
    const expected = mock.data.tx.setMinLapTime;
    const decoded = Protocol.setMinLapTime(5000);
    expect(decoded).toEqual(expected);
  });

  test('setStatusInterval', () => {
    const expected = mock.data.tx.setStatusInterval;
    const decoded = Protocol.setStatusInterval(500);
    expect(decoded).toEqual(expected);
  });

  test('getRfSetup', () => {
    const expected = mock.data.tx.getRfSetupAll;
    const decoded = Protocol.getRfSetup();
    expect(decoded).toEqual(expected);
  });

  test('getRfSetup single slotIndex', () => {
    const expected = mock.data.tx.getRfSetupSingle;
    const decoded = Protocol.getRfSetup(1);
    expect(decoded).toEqual(expected);
  });

  test('setRfSetup', () => {
    const expected = mock.data.tx.setRfSetupSingle;
    const decoded = Protocol.setRfSetup({
      slotId: 1,
      enabled: true,
      channelName: 'E2',
      gain: 51,
      threshold: 900,
    });
    expect(decoded).toEqual(expected);
  });
});
