/// <reference types="jest" />

import { Decoder } from '../src/Decoder';
import * as mock from './mock';

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
    const decoded = new Decoder(mock.data.rx.rfSetupRecordSingle).decode();
    expect(decoded).toEqual(expected);
  });

  test('decode SettingsRecord', () => {
    const expected = { type: 'settings', minLapTime: 6000 };
    const decoded = new Decoder(mock.data.rx.settingsRecord).decode();
    expect(decoded).toEqual(expected);
  });

  test('decode PassingRecord', () => {
    const expected = {
      type: 'passing',
      decoderId: 3932228,
      slotId: 2,
      passingNumber: 1,
      rtcTime: 79937000,
      peakHeight: 2298,
      flags: 0,
    };
    const decoded = new Decoder(mock.data.rx.passingRecord).decode();
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
    const decoded = new Decoder(mock.data.rx.statusRecord).decode();
    expect(decoded).toEqual(expected);
  });

  test('decode TimeRecord', () => {
    const expected = { type: 'time', rtcTime: 7247516000 };
    const decoded = new Decoder(mock.data.rx.timeRecord).decode();
    expect(decoded).toEqual(expected);
  });
});
