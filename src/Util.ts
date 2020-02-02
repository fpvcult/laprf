/**
 * Author: John Hooks <bitmachina@outlook.com>
 * URL: https://github.com/fpvcult/laprf
 * Version: 0.1.0
 *
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
 * along with @fpvcult/laprf.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NumberType } from "@bitmachina/binary";

const indexes = Symbol("indexes");

export interface IndexOf<T> {
  [key: string]: T;
  [index: number]: T;
}

export class Index<T> {
  public [indexes]: IndexOf<T> = {};

  set(signature: number, name: string, item: T) {
    this[indexes][signature] = this[indexes][name] = item;
  }

  get(key: string | number): T | undefined {
    return this[indexes][key];
  }
}

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

export namespace Msg {
  export function unknownRecordType(signature: number | string): string {
    let msg = "Unknown record type: ";
    if (typeof signature === "number") {
      msg += `0x${signature.toString(16)}`;
    } else {
      msg += signature;
    }
    return msg;
  }

  export function unknownFieldType(signature: number | string) {
    let msg = "Unknown field type: ";
    if (typeof signature === "number") {
      msg += `0x${signature.toString(16)}`;
    } else {
      msg += signature;
    }
    return msg;
  }

  export function sizeMismatch(size: number, type: NumberType) {
    `Size Mismatch: recieved ${size}, expected ${type.byteLength}`;
  }
}
