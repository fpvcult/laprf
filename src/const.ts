import type { SlotIndex, BandIndex, ChannelIndex } from './types';

export const MAX_RECORD_LEN = 1024;
export const MAX_SLOTS = 8;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

/**
 * An array of all LapRF slot indexes.
 * @public
 */
export const SLOT_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8] as SlotIndex[];

/**
 * An array of all LapRF radio frequency band indexes.
 * @public
 */
export const BAND_INDEXES = [1, 2, 3, 4, 5] as BandIndex[];

/**
 * An array of all LapRF radio frequency channel indexes.
 * @public
 */
export const CHANNEL_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8] as ChannelIndex[];

/**
 * LapRF record types.
 * @public
 */
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

/**
 * RfSetup record field keys.
 * @public
 */
export const enum RfSetupField {
  slotIndex = 0x01,
  enabled = 0x20,
  channel = 0x21,
  band = 0x22,
  threshold = 0x23,
  gain = 0x24,
  frequency = 0x25,
}

/**
 * Rssi record field keys.
 * @public
 */
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

/**
 * Passing record field keys.
 * @public
 */
export const enum PassingField {
  slotIndex = 0x01,
  rtcTime = 0x02,
  decoderId = 0x20,
  passingNumber = 0x21,
  peakHeight = 0x22,
  flags = 0x23,
}

/**
 * Settings record field keys.
 * @public
 */
export const enum SettingsField {
  statusInterval = 0x22,
  saveSettings = 0x25,
  minLapTime = 0x26,
}

/**
 * State Control record field keys.
 * @public
 */
export const enum StateControlField {
  gateState = 0x20,
}

/**
 * Status record field keys.
 * @public
 */
export const enum StatusField {
  slotIndex = 0x01,
  flags = 0x03,
  batteryVoltage = 0x21,
  lastRssi = 0x22,
  gateState = 0x23,
  detectionCount = 0x24,
}

/**
 * Time record field keys
 * @public
 */
export const enum TimeField {
  rtcTime = 0x02,
  timeRtcTime = 0x20,
}
