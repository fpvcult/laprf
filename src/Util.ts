/**
 * Author: John Hooks
 * URL: https://github.com/johnhooks/laprf
 * Version: 0.1.0
 *
 * This file is part of LapRFJavaScript.
 *
 * LapRFJavaScript is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LapRFJavaScript is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LapRFJavaScript.  If not, see <http://www.gnu.org/licenses/>.
 */

import { u8, u16, u32, u64, Binary } from "./Binary";

export namespace Crc {
  const crc16_table: Uint16Array = (function() {
    const length = 256;
    const table = new Uint16Array(length);
    let remainder = 0;

    for (let i = 0; i < length; i++) {
      remainder = (i << 8) & 0xff00;
      for (let j = 8; j > 0; j--) {
        if ((remainder & 0x8000) === 0x8000) {
          remainder = ((remainder << 1) & 0xffff) ^ 0x8005;
        } else {
          remainder = (remainder << 1) & 0xffff;
        }
      }
      table[i] = remainder;
    }
    return table;
  })();

  function reflect(input: number, nbits: number): number {
    let shift: number = input;
    let output = 0;
    for (let i = 0; i < nbits; i++) {
      if ((shift & 0x01) === 0x01) {
        output |= 1 << (nbits - 1 - i);
      }
      shift = shift >> 1;
    }
    return output;
  }

  export function compute(bytes: Buffer): number {
    let remainder = 0;

    bytes.forEach(byte => {
      let a = reflect(byte, 8);
      a &= 0xff;
      let b = (remainder >> 8) & 0xff;
      let c = (remainder << 8) & 0xffff;
      let data = a ^ b;
      remainder = crc16_table[data] ^ c;
    });

    return reflect(remainder, 16);
  }
}
