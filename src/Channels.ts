/**
 * Author: John Hooks
 * URL: https://github.com/johnhooks/laprf-serial-protocol
 * Version: 0.1.0
 *
 * This file is part of LapRFSerialProtocol.
 *
 * LapRFSerialProtocol is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LapRFSerialProtocol is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LapRFSerialProtocol.  If not, see <http://www.gnu.org/licenses/>.
 */

export class Channel {
  constructor(
    readonly band: number,
    readonly channel: number,
    readonly frequency: number,
    readonly name: string
  ) {}
}

const channels = genChannels();

export function getChannel(band: number, channel: number) {
  const index = (band - 1) * 8 + (channel - 1);
  if (index > -1 || index < channels.length) {
    return channels[index];
  }
  return undefined;
}

// Not fast... but it shouldn't get called often.
export function getChannelByName(name: string): Channel | undefined {
  return channels.find(channel => channel.name === name);
}

function genChannels() {
  // LapRF Band Codes: F=1, R=2, E=3, B=4, A=5, LowBand=6
  // prettier-ignore
  const frequencies = [
    5740, 5760, 5780, 5800, 5820, 5840, 5860, 5880, // F
    5658, 5695, 5732, 5769, 5806, 5843, 5880, 5917, // Raceband
    5705, 5685, 5665, 5645, 5885, 5905, 5925, 5945, // E
    5733, 5752, 5771, 5790, 5809, 5828, 5847, 5866, // B
    5865, 5845, 5825, 5805, 5785, 5765, 5745, 5725  // A
  ];

  const names = ["F", "R", "E", "B", "A"].map(l => bandNames(l));

  let channels: Channel[] = [];

  for (let b = 0; b < 5; b++) {
    const band = b + 1;
    for (let c = 0; c < 8; c++) {
      const channel = c + 1;
      channels[b * 8 + c] = new Channel(
        band,
        channel,
        frequencies[b * 8 + c],
        names[b][c]
      );
    }
  }

  return channels;
}

function bandNames(l: string) {
  return range(1, 8).map(n => `${l}${n}`);
}

function range(start: number, end: number, step = 1): number[] {
  const acc: number[] = [];

  let n = 0;
  let i = 0;

  while ((n = start + i) <= end) {
    acc.push(n);
    i += step;
  }

  return acc;
}
