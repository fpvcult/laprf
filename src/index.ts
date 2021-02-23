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

export type {
  SlotId,
  RfSetupRecord,
  RssiRecord,
  PassingRecord,
  SettingsRecord,
  StatusRecord,
  TimeRecord,
  DeviceRecord,
  Channel,
  RfSetupSlotInput,
} from './types';

export { SLOT_IDS } from './const';

export { Frequency } from './Frequency';
export { Protocol } from './Protocol';
