import { Channel } from './types.d';
import { IndexOf } from './Util';

const bands: { [key: string]: number[] } = {
  A: [5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725],
  B: [5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866],
  E: [5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945],
  F: [5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880],
  R: [5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917],
};

const byNameOrIndex: IndexOf<Channel> = {};
const byFrequency: IndexOf<Array<Channel>> = {};
const names: string[] = [];

const order = 'FREBA'.split('');

for (let i = 0; i < order.length; i++) {
  const bandName = order[i];
  const frequencies = bands[bandName];

  for (let j = 0; j < frequencies.length; j++) {
    const band = i + 1;
    const channel = j + 1;
    const index = i * 8 + j;
    const frequency = frequencies[j];
    const name = bandName + channel;
    const current = { band, channel, frequency, name };
    byNameOrIndex[name] = byNameOrIndex[index] = current;
    byFrequency[frequency] = byFrequency[frequency] || [];
    byFrequency[frequency].push(current);
    names.push(name);
  }
}

export function get(name: string): Channel | undefined;
export function get(band: number, channel: number): Channel | undefined;
export function get(arg1: string | number, arg2?: number): Channel | undefined {
  if (typeof arg1 === 'string') {
    return byNameOrIndex[arg1.toUpperCase()];
  } else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    const index = (arg1 - 1) * 8 + (arg2 - 1);
    return byNameOrIndex[index];
  }
  return undefined;
}

export function getByFrequency(frequency: number): Channel | Channel[] | undefined {
  const channels = byFrequency[frequency];
  if (channels !== undefined && channels.length === 1) return channels[0];
  return channels;
}
