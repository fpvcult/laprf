import type { SlotId } from './types';

export const MAX_RECORD_LEN = 1024;
export const MAX_SLOTS = 8;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

export const SLOT_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as SlotId[];

export const enum RecordType {
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

export const enum RfSetupField {
  slotIndex = 0x01,
  enabled = 0x20,
  channel = 0x21,
  band = 0x22,
  threshold = 0x23,
  gain = 0x24,
  frequency = 0x25,
}

export const enum RssiField {
  slotIndex = 0x01, // uint8
  sampleCount = 0x07, // uint32
  minRssi = 0x20, // f32
  maxRssi = 0x21, // f32
  meanRssi = 0x22, // f32
  unknown1 = 0x23,
  customRate = 0x24,
  packetRate = 0x25,
  unknown2 = 0x26,
}

export const enum PassingField {
  slotIndex = 0x01,
  rtcTime = 0x02,
  decoderId = 0x20,
  passingNumber = 0x21,
  peakHeight = 0x22,
  flags = 0x23,
}

export const enum SettingsField {
  statusInterval = 0x22,
  saveSettings = 0x25,
  minLapTime = 0x26,
}

export const enum StateControlField {
  gateState = 0x20,
}

export const enum StatusField {
  slotIndex = 0x01,
  flags = 0x03,
  batteryVoltage = 0x21,
  lastRssi = 0x22,
  gateState = 0x23,
  detectionCount = 0x24,
}

export const enum TimeField {
  rtcTime = 0x02,
  timeRtcTime = 0x20,
}

export const enum ErrorCode {
  CrcMismatch = 0x100,
  InvalidPacket,
  InvalidRecord,
  MissingSOR,
  MissingEOR,
  SizeError,
  UnknownRecordType,
  UnknownSignatureType,
  DeviceError,
  RangeError,
  InvalidChannelName,
}
