export interface StatusSlot {
  slotIndex: number;
  lastRssi: number;
}

export interface RfSetupRecord {
  type: 'rfSetup';
  slotIndex: number;
  enabled: number;
  channel: number;
  band: number;
  threshold: number;
  gain: number;
  frequency: number;
}

export interface SettingsRecord {
  type: 'settings';
  updatePeriod: number;
  saveSettings: number;
  minLapTime: number;
}

export interface PassingRecord {
  type: 'passing';
  slotIndex: number;
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
  slots: StatusSlot[];
}

export interface TimeRecord {
  type: 'time';
  rtcTime: number;
  timeRtcTime: number;
}

export type DeviceRecord =
  | RfSetupRecord
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
  slotIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  channelName: string;
  gain: number;
  threshold: number;
  enabled: boolean;
}

export declare function decode(packet: Buffer): Array<DeviceRecord>;
export declare function getRtcTime(): Buffer;
export declare function getMinLapTime(): Buffer;
export declare function setMinLapTime(milliseconds: number): Buffer;
export declare function getRfSetup(slotIndex?: number): Buffer;
export declare function setRfSetup(settings: SetSlotInput): Buffer;

export declare function lookupChannel(name: string): Channel | undefined;
export declare function lookupChannel(band: number, channel: number): Channel | undefined;
export declare function lookupChannel(arg1: string | number, arg2?: number): Channel | undefined;
