import { Schema, u8, u16, u32, f32, u64 } from '@bitmachina/binary';
import { Index } from './Util';

export enum Signature {
  rssi = 0xda01,
  rfSetup = 0xda02,
  stateControl = 0xda04,
  settings = 0xda07,
  descriptor = 0xda08,
  passing = 0xda09,
  status = 0xda0a,
  time = 0xda0c,
  error = 0xffff,
}

export const Rssi = new Schema(Signature.rssi, 'rssi', [
  [0x01, u8, 'slotIndex'],
  [0x20, f32, 'minRssi'],
  [0x21, f32, 'maxRssi'],
  [0x22, f32, 'meanRssi'],
  [0x23, u32, 'unknown1'],
  [0x24, u8, 'customRate'],
  [0x25, u32, 'packetRate'],
  [0x26, u32, 'unknown2'],
]);

export const RfSetup = new Schema(Signature.rfSetup, 'rfSetup', [
  [0x01, u8, 'slotIndex'],
  [0x20, u16, 'enabled'],
  [0x21, u16, 'channel'],
  [0x22, u16, 'band'],
  [0x23, f32, 'threshold'],
  [0x24, u16, 'gain'],
  [0x25, u16, 'frequency'],
]);

export const StateControl = new Schema(Signature.stateControl, 'stateControl', [
  [0x20, u8, 'gateState'],
]);

export const Settings = new Schema(Signature.settings, 'settings', [
  [0x22, u16, 'updatePeriod'], // milliseconds between status update messages
  [0x25, u8, 'saveSettings'], // save settings in EEPROM
  [0x26, u32, 'minLapTime'], // minimum lap time, in milliseconds
]);

export const Passing = new Schema(Signature.passing, 'passing', [
  [0x01, u8, 'slotIndex'],
  [0x02, u64, 'rtcTime'],
  [0x20, u32, 'decoderId'],
  [0x21, u32, 'passingNumber'],
  [0x22, u16, 'peakHeight'],
  [0x23, u16, 'flags'],
]);

export const Status = new Schema(Signature.status, 'status', [
  [0x01, u8, 'slotIndex'],
  [0x03, u16, 'flags'],
  [0x21, u16, 'batteryVoltage'],
  [0x22, f32, 'lastRssi'],
  [0x23, u8, 'gateState'],
  [0x24, u32, 'detectionCount'],
]);

export const Time = new Schema(Signature.time, 'time', [
  [0x02, u64, 'rtcTime'],
  [0x20, u64, 'timeRtcTime'],
]);

const recordTypes = new Index<Schema>();

export function get(key: string | number): Schema | undefined {
  return recordTypes.get(key);
}

[Rssi, RfSetup, StateControl, Settings, Passing, Status, Time].forEach(schema => {
  const { signature, name } = schema;
  recordTypes.set(signature, name, schema);
});
