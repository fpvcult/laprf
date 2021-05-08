/**
 * Copyright (C) 2021 copyright-holder John Hooks <bitmachina@outlook.com>
 * This file is part of @fpvcult/laprf.
 *
 * @fpvcult/laprf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @fpvcult/laprf is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @fpvcult/laprf.  If not, see <https://www.gnu.org/licenses/>.
 *
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

export type SlotIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type StatusSlots = Record<SlotIndex, { lastRssi: number }>;

export interface RfSetupRecord {
  type: 'rfSetup';
  slotIndex: SlotIndex;
  enabled: number;
  channel: ChannelIndex;
  band: BandIndex;
  threshold: number;
  gain: number;
  frequency: number;
}

export interface RssiRecord {
  type: 'rssi';
  slotIndex: SlotIndex;
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
  slotIndex: SlotIndex;
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

type BandA = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8';
type BandB = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8';
type BandE = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
type BandF = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';
type BandR = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8';

export type ChannelName = BandA | BandB | BandE | BandF | BandR;
export type BandIndex = 1 | 2 | 3 | 4 | 5;
export type ChannelIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Channel {
  readonly band: BandIndex;
  readonly channel: ChannelIndex;
  readonly frequency: number;
  readonly name: ChannelName;
}

export interface RfSetupSlotInput {
  slotIndex: SlotIndex;
  band: BandIndex;
  channel: ChannelIndex;
  gain: number;
  threshold: number;
  enabled: boolean;
}
