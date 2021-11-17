// Copyright (C) 2021 copyright-holder John Hooks <bitmachina\@outlook.com>. All rights reserved.
// This file is part of \@fpvcult/laprf.
//
// \@fpvcult/laprf is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// \@fpvcult/laprf is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with \@fpvcult/laprf.  If not, see <https://www.gnu.org/licenses/>.

/**
 * A library for encoding and decoding LapRF records.
 *
 * @remarks
 * The `laprf` defines the static classes {@link Protocol} and {@link Frequency},
 * which are used to encode and decode messages to an ImmersionRC LapRF device.
 *
 * @packageDocumentation
 */

export type {
  SlotIndex,
  RfSetupRecord,
  RssiRecord,
  PassingRecord,
  SettingsRecord,
  StatusRecord,
  TimeRecord,
  DeviceRecord,
  BandA,
  BandB,
  BandE,
  BandF,
  BandR,
  Channel,
  ChannelName,
  ChannelIndex,
  Maybe,
  BandIndex,
  RfSetupSlotInput,
  StatusSlots,
} from './types';

export { SLOT_INDEXES, BAND_INDEXES, CHANNEL_INDEXES } from './const';

export { Frequency } from './Frequency';
export { Protocol } from './Protocol';
