/**
 * Maybe a value.
 * @public
 */
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

/**
 * LapRF slot index type.
 * @public
 */
export type SlotIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * A status record type mapping {@link SlotIndex} to `lastRssi`.
 * @public
 */
export type StatusSlots = Record<SlotIndex, { lastRssi: number }>;

/**
 * A decoded LapRF rfSetup record.
 * @public
 */
export interface RfSetupRecord {
  /**
   * Record type.
   */
  type: 'rfSetup';
  /**
   * Slot index of the record.
   */
  slotIndex: SlotIndex;
  /**
   * RfSetup enabled boolean flag.
   */
  enabled: number;
  /**
   * RfSetup channel index config.
   */
  channel: ChannelIndex;
  /**
   * RfSetup setup band index config.
   */
  band: BandIndex;
  /**
   * RfSetup threshold config.
   */
  threshold: number;
  /**
   * RfSetup gain config.
   */
  gain: number;
  /**
   * RfSetup frequency config.
   */
  frequency: number;
}

/**
 * A decoded LapRF RSSI record.
 * @public
 */
export interface RssiRecord {
  /**
   * Record type.
   */
  type: 'rssi';
  /**
   * Slot index of the record.
   */
  slotIndex: SlotIndex;
  /**
   * Minimum RSSI reading.
   */
  minRssi: number;
  /**
   * Max RSSI reading.
   */
  maxRssi: number;
  /**
   * Mean RSSI reading.
   */
  meanRssi: number;
}

/**
 * A decoded LapRF settings record.
 * @public
 */
export interface SettingsRecord {
  /**
   * Record type.
   */
  type: 'settings';
  /**
   * Status update period config.
   */
  updatePeriod: number;
  /**
   * Save settings flag.
   */
  saveSettings: number;
  /**
   * Minimum lap time config.
   */
  minLapTime: number;
}

/**
 * A decoded LapRF passing record.
 * @public
 */
export interface PassingRecord {
  /**
   * Record type.
   */
  type: 'passing';
  /**
   * Slot index of the record.
   */
  slotIndex: SlotIndex;
  /**
   * The real time clock time of the passing event.
   */
  rtcTime: number;
  /**
   * Id of the decoded.
   */
  decoderId: number;
  /**
   * The number of this passing record.
   */
  passingNumber: number;
  /**
   * Hight of the RSSI reading from the passing event.
   */
  peakHeight: number;
  /**
   * Flags.
   */
  flags: number;
}

/**
 * A decoded LapRF status record.
 * @public
 */
export interface StatusRecord {
  /**
   * Record type.
   */
  type: 'status';
  /**
   * Flags.
   */
  flags: number;
  /**
   * The gate state.
   */
  gateState: number;
  /**
   * The LapRF device's battery voltage reading.
   */
  batteryVoltage: number;
  /**
   * The number of detected passing events.
   */
  detectionCount: number;
  /**
   * The latest RSSI readings for each slot.
   */
  slots: StatusSlots;
}

/**
 * A decoded LapRF time record.
 * @public
 */
export interface TimeRecord {
  /**
   * Record type.
   */
  type: 'time';
  /**
   * Real time clock time.
   */
  rtcTime: number;
  /**
   * Time real time clock time.
   * @remarks
   * Unsure how this is different than rtcTime.
   */
  timeRtcTime: number;
}

/**
 * LapRF record type.
 * @public
 */
export type DeviceRecord =
  | RfSetupRecord
  | RssiRecord
  | SettingsRecord
  | PassingRecord
  | StatusRecord
  | TimeRecord;

/**
 * Channel of band A type.
 * @public
 */
export type BandA = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8';

/**
 * Channel of band B type.
 * @public
 */
export type BandB = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8';

/**
 * Channel of band E type.
 * @public
 */
export type BandE = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';

/**
 * Channel of band F type.
 * @public
 */
export type BandF = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';

/**
 * Channel of RaceBand type.
 * @public
 */
export type BandR = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8';

/**
 * FPV radio frequency channel name type.
 * @public
 */
export type ChannelName = BandA | BandB | BandE | BandF | BandR;

/**
 * FPV radio frequency band index type.
 * @public
 */
export type BandIndex = 1 | 2 | 3 | 4 | 5;

/**
 * FPV radio frequency channel index type.
 * @public
 */
export type ChannelIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * FPV radio frequency channel interface.
 * @public
 */
export interface Channel {
  /**
   * The band index of the Channel.
   */
  readonly band: BandIndex;
  /**
   * The channel index of the Channel.
   */
  readonly channel: ChannelIndex;
  /**
   * The frequency number of the Channel.
   */
  readonly frequency: number;
  /**
   * A two character channel name for the Channel.
   */
  readonly name: ChannelName;
}

/**
 * LapRF rfSetup slot interface.
 * @public
 */
export interface RfSetupSlotInput {
  /**
   * Index of the slot to configure.
   */
  slotIndex: SlotIndex;
  /**
   * Band index config.
   */
  band: BandIndex;
  /**
   * Channel index config.
   */
  channel: ChannelIndex;
  /**
   * RX gain config.
   */
  gain: number;
  /**
   * Passing threshold config.
   */
  threshold: number;
  /**
   * Slot enabled input flag.
   */
  enabled: boolean;
}
