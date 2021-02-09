/// <reference types="jest" />

import { Decoder } from '../src/Decoder';
import { convert } from '../src/helpers';
import { toBytes } from './util';

const RF_SETUP_RECORD = convert(toBytes('5a2500065d02da01010120020100220201002102020024023a00230400808944250280165b'), DataView); // prettier-ignore
const SETTINGS_RECORD = convert(toBytes('5a0e00a40507da2604701700005b'), DataView);
const STATUS_RECORD = convert(toBytes('5a610043c50ada21022d10230101240400000000010101220400404f44010102220400804f44010103220400000000010104220400000000010105220400000000010106220400000000010107220400000000010108220400000000030200005b'), DataView); // prettier-ignore
const TIME_RECORD = convert(toBytes('5a1c00d52b0cda02086051fcaf01000000200800000000000000005b'), DataView); // prettier-ignore

describe('Decoder', () => {
  test('decode RfSetupRecord', () => {
    const expected = {
      type: 'rfSetup',
      slotId: 1,
      enabled: 1,
      band: 1,
      channel: 2,
      gain: 58,
      threshold: 1100,
      frequency: 5760,
    };

    const decoded = new Decoder(RF_SETUP_RECORD).decode();

    expect(decoded).toEqual(expected);
  });

  test('decode SettingsRecord', () => {
    const expected = { type: 'settings', minLapTime: 6000 };

    const decoded = new Decoder(SETTINGS_RECORD).decode();

    expect(decoded).toEqual(expected);
  });

  test('decode StatusRecord', () => {
    const expected = {
      type: 'status',
      batteryVoltage: 4141,
      gateState: 1,
      detectionCount: 0,
      flags: 0,
      slots: {
        '1': { lastRssi: 829 },
        '2': { lastRssi: 830 },
        '3': { lastRssi: 0 },
        '4': { lastRssi: 0 },
        '5': { lastRssi: 0 },
        '6': { lastRssi: 0 },
        '7': { lastRssi: 0 },
        '8': { lastRssi: 0 },
      },
    };

    const decoded = new Decoder(STATUS_RECORD).decode();

    expect(decoded).toEqual(expected);
  });

  test('decode TimeRecord', () => {
    const expected = { type: 'time', rtcTime: 7247516000 };

    const decoded = new Decoder(TIME_RECORD).decode();

    expect(decoded).toEqual(expected);
  });
});
