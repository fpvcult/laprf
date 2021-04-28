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

import type { Channel, ChannelName, BandIndex, ChannelIndex } from './types';

const bandOrder = 'FREBA';

const bands: { [key: string]: number[] } = {
  A: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  B: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  E: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  F: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  R: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
};

interface IndexOf<T> {
  [key: string]: T;
  [index: number]: T;
}

const ordered: Channel[] = [];
const byNameOrIndex: IndexOf<Channel> = {};
const byFrequency: IndexOf<Array<Channel>> = {};

const order = bandOrder.split('');

for (let i = 0; i < order.length; i++) {
  const bandName = order[i];
  const frequencies = bands[bandName];

  for (let j = 0; j < frequencies.length; j++) {
    const band = i + 1;
    const channel = j + 1;
    const index = i * 8 + j;
    const frequency = frequencies[j];
    const name = (bandName + channel) as ChannelName;
    const current = { band, channel, frequency, name };
    ordered.push(current);
    byNameOrIndex[name] = byNameOrIndex[index] = current;
    byFrequency[frequency] = byFrequency[frequency] || [];
    byFrequency[frequency].push(current);
  }
}

export class Frequency {
  static get(name: ChannelName): Channel | undefined;
  static get(band: BandIndex, channel: ChannelIndex): Channel | undefined;
  static get(arg1: string | number, arg2?: number): Channel | undefined {
    if (typeof arg1 === 'string') {
      const val = byNameOrIndex[arg1.toUpperCase()];
      return val;
    } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      const index = (arg1 - 1) * 8 + (arg2 - 1);
      return byNameOrIndex[index];
    }
    return undefined;
  }

  static getByFrequency(frequency: number): Channel | Channel[] | undefined {
    const channels = byFrequency[frequency];
    if (channels !== undefined && channels.length === 1) return channels[0];
    return channels;
  }

  static getAll(): Channel[] {
    return [...ordered];
  }
}
