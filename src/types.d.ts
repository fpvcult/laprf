export interface RfSetupEvent {
  type: 'rfSetup';
  slotIndex: number;
  enabled: number;
  channel: number;
  band: number;
  threshold: number;
  gain: number;
  frequency: number;
}

export interface SettingsEvent {
  type: 'settings';
  updatePeriod: number;
  saveSettings: number;
  minLapTime: number;
}

export interface PassingEvent {
  type: 'passing';
  slotIndex: number;
  rtcTime: number;
  decoderId: number;
  passingNumber: number;
  peakHeight: number;
  flags: number;
}

export interface StatusEvent {
  type: 'status';
  flags: number;
  gateState: number;
  batteryVoltage: number;
  detectionCount: number;
  slots: {
    slotIndex: number;
    lastRssi: number;
  };
}

export interface TimeEvent {
  type: 'time';
  rtcTime: number;
  timeRtcTime: number;
}

export type TimerEvent = RfSetupEvent | SettingsEvent | PassingEvent | StatusEvent | TimeEvent;

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

export declare function decode(packet: Buffer): Array<TimerEvent>;
export declare function getRtcTime(): Buffer;
export declare function getMinLapTime(): Buffer;
export declare function setMinLapTime(milliseconds: number): Buffer;
export declare function getRfSetup(slotIndex?: number): Buffer;
export declare function setRfSetup(settings: SetSlotInput): Buffer;
