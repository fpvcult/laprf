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

import type { SlotIndex, BandIndex, ChannelIndex } from './types';

export const MAX_RECORD_LEN = 1024;
export const MAX_SLOTS = 8;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

export const SLOT_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as SlotIndex[];
export const BAND_INDEXES = [1, 2, 3, 4, 5] as BandIndex[];
export const CHANNEL_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8] as ChannelIndex[];

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
