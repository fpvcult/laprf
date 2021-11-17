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
    const band = (i + 1) as BandIndex;
    const channel = (j + 1) as ChannelIndex;
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

/**
 * FPV radio frequency lookup singleton.
 * @public
 */
export class Frequency {
  /**
   * Lookup {@link Channel} by {@link ChannelName}.
   * @param name - A two character channel name.
   */
  static get(name: ChannelName): Channel;
  /**
   * Lookup {@link Channel} by {@link BandIndex} and {@link ChannelIndex}.
   * @param band - The band index of the channel.
   * @param channel - The channel index of the channel.
   */
  static get(band: BandIndex, channel: ChannelIndex): Channel;
  static get(arg1: ChannelName | BandIndex, arg2?: ChannelIndex): Channel {
    if (typeof arg1 === 'string') {
      const val = byNameOrIndex[arg1.toUpperCase()];
      return val;
    } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      return Frequency.getByIndexes(arg1, arg2);
    }
    throw new Error(`[laprf-freq] Invalid arguments, provided: ${arg1}, ${arg2}`);
  }

  /**
   * Lookup a channel by indexes.
   * @param band - The band index.
   * @param channel - The channel index.
   * @returns A single Channel.
   */
  static getByIndexes(band: BandIndex, channel: ChannelIndex): Channel {
    const index = (band - 1) * 8 + (channel - 1);
    return byNameOrIndex[index];
  }

  /**
   * Lookup a channel by indexes.
   * @param frequency - The radio channel frequency.
   * @returns A single Channel, a list of Channels or undefined.
   */
  static getByFrequency(frequency: number): Channel | Channel[] | undefined {
    const channels = byFrequency[frequency];
    if (channels !== undefined && channels.length === 1) return channels[0];
    return channels;
  }

  /**
   * Get a list of all Channels.
   * @returns A list of all Channels.
   */
  static getAll(): Channel[] {
    return [...ordered];
  }
}
