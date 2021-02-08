export type Maybe<T> = T | undefined;

interface ReadNumber {
  (this: DataView, byteOffset: number, littleEndian?: boolean): number;
}

interface WriteNumber {
  (this: DataView, byteOffset: number, value: number, littleEndian?: boolean): void;
}

export type ByteLength = 1 | 2 | 4 | 8;

/**
 * An interface to help build serial protocol schemas.
 */
export interface NumberType {
  readonly byteLength: ByteLength;
  readonly read: ReadNumber;
  readonly write: WriteNumber;
}

export type SlotId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface StatusSlot {
  slotId: SlotId;
  lastRssi: number;
}

export type StatusSlots = Record<SlotId, { lastRssi: number }>;

export interface RfSetupRecord {
  type: 'rfSetup';
  slotId: SlotId;
  enabled: number;
  channel: number;
  band: number;
  threshold: number;
  gain: number;
  frequency: number;
}

export interface RssiRecord {
  type: 'rssi';
  slotId: SlotId;
  minRssi: number;
  maxRssi: number;
  meanRssi: number;
}

export interface SettingsRecord {
  type: 'settings';
  updatePeriod: number;
  saveSettings: number;
  minLapTime: number;
}

export interface PassingRecord {
  type: 'passing';
  slotId: SlotId;
  rtcTime: number;
  decoderId: number;
  passingNumber: number;
  peakHeight: number;
  flags: number;
}

export interface StatusRecord {
  type: 'status';
  flags: number;
  gateState: number;
  batteryVoltage: number;
  detectionCount: number;
  slots: StatusSlots;
}

export interface TimeRecord {
  type: 'time';
  rtcTime: number;
  timeRtcTime: number;
}

export type DeviceRecord =
  | RfSetupRecord
  | RssiRecord
  | SettingsRecord
  | PassingRecord
  | StatusRecord
  | TimeRecord;

export interface Channel {
  readonly band: number;
  readonly channel: number;
  readonly frequency: number;
  readonly name: string;
}

export interface SetSlotInput {
  slotId: SlotId;
  channelName: string;
  gain: number;
  threshold: number;
  enabled: boolean;
}
