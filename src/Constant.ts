/**
 * Auther: John Hooks
 * URL: https://github.com/johnhooks/laprf
 * Version: 0.1.0
 *
 * This file is part of LapRFJavaScript.
 *
 * LapRFJavaScript is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LapRFJavaScript is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LapRFJavaScript.  If not, see <http://www.gnu.org/licenses/>.
 */

export const DEBUG: boolean = true;

export enum NumberType {
  u8,
  u16,
  u32,
  u64,
  f32,
  f64
}

export const u8 = NumberType.u8;
export const u16 = NumberType.u16;
export const u32 = NumberType.u32;
export const u64 = NumberType.u64;
export const f32 = NumberType.f32;
export const f64 = NumberType.f64;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

export enum RecordType {
  rssi = 0xda01,
  rfSetup = 0xda02,
  stateControl = 0xda04,
  settings = 0xda07,
  descriptor = 0xda08,
  passing = 0xda09,
  status = 0xda0a,
  time = 0xda0c,
  error = 0xffff
}

export enum RFSetupField {
  slotIndex = 0x01,
  enabled = 0x20,
  channel = 0x21,
  band = 0x22,
  threshold = 0x23,
  gain = 0x24,
  frequency = 0x25
}

export enum RssiField {
  slotIndex = 0x01,
  minRssi = 0x20,
  maxRssi = 0x21,
  meanRssi = 0x22,
  unknown1 = 0x23,
  customRate = 0x24,
  packetRate = 0x25,
  unknown2 = 0x26
}

export enum StateControlField {
  gateState = 0x20
}

export enum SettingsField {
  statusInterval = 0x22,
  minLapTime = 0x26
}

// DescriptorField

export enum PassingField {
  slotIndex = 0x01,
  rtcTime = 0x02,
  decoderId = 0x20,
  passingNumber = 0x21,
  peakHeight = 0x22,
  flags = 0x23
}

export enum StatusField {
  slotIndex = 0x01,
  flags = 0x03,
  batteryVoltage = 0x21,
  lastRSSI = 0x22,
  gateState = 0x23,
  detectionCount = 0x24
}

export enum TimeField {
  rtcTime = 0x02,
  timeRtcTime = 0x20
}

// ErrorField

export enum GateState {
  idle = 0x00,
  active = 0x01,
  crashed = 0x02,
  shutdown = 0xfe // Reset?
}

export type FieldSignature =
  | RFSetupField
  | RssiField
  | PassingField
  | SettingsField
  | StateControlField
  | StatusField
  | TimeField;

// ErrorFieldMap
// DescriptorField

export const RssiFieldMap = new Map([
  [RssiField.slotIndex, u8],
  [RssiField.minRssi, f32],
  [RssiField.maxRssi, f32],
  [RssiField.meanRssi, f32],
  [RssiField.unknown1, u32],
  [RssiField.unknown2, u32]
  // RssiField.customRate
  // RssiField.packetRate
]);

export const RFSetupFieldMap = new Map([
  [RFSetupField.slotIndex, u8],
  [RFSetupField.enabled, u16],
  [RFSetupField.channel, u16],
  [RFSetupField.band, u16],
  [RFSetupField.gain, u16],
  [RFSetupField.frequency, u16],
  [RFSetupField.threshold, f32]
]);

export const StateControlFieldMap = new Map([
  [StateControlField.gateState, u8]
]);

export const SettingsFieldMap = new Map([
  [SettingsField.minLapTime, u32]
  // SettingsField.statusInterval
]);

export const PassingFieldMap = new Map([
  [PassingField.slotIndex, u8],
  [PassingField.rtcTime, u64],
  [PassingField.decoderId, u32],
  [PassingField.passingNumber, u32],
  [PassingField.peakHeight, u16],
  [PassingField.flags, u16]
]);

export const StatusFieldMap = new Map([
  [StatusField.slotIndex, u8],
  [StatusField.flags, u16],
  [StatusField.batteryVoltage, u16],
  [StatusField.lastRSSI, f32],
  [StatusField.gateState, u8],
  [StatusField.detectionCount, u32]
]);

export const TimeFieldMap = new Map([
  [TimeField.rtcTime, u64],
  [TimeField.timeRtcTime, u64]
]);

export interface IRecord {
  type: RecordType;
  fields: IField[];
}

export interface IField {
  signature: FieldSignature; // TODO make this a string.
  data: number;
}

export type Ok<T> = { value: T };
export type Err<T extends Error> = { error: T };

export type Result<T, E extends Error> = Ok<T> | Err<E>;
