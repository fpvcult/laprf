/**
 * Auther: John Hooks
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

import { Transform, TransformOptions } from "stream";
import * as Debug from "./Debug";

export default class Verify extends Transform {
  private crcMismatchCount: number = 0;

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(record: Buffer, encoding: BufferEncoding, done: Function) {
    if (record.length < 8) {
      done();
    }
    // SOR has already been found;
    const length = record.readInt16LE(1);
    Debug.log(`Record Length Entry: ${length}`);
    const crcRecord = record.readUInt16LE(3);
    record.writeUInt16LE(0, 3); // Zero the CRC before computing
    const crcComputed = compute(record);
    if (crcRecord === crcComputed) {
      Debug.log("CRC verified");
      Debug.log(`CRC mismatch count: ${this.crcMismatchCount}`);
      this.push(record);
      done();
    } else {
      this.crcMismatchCount++;
      Debug.log(`CRC mismatch  rx: ${crcRecord}  calc: ${crcComputed}`);
      done();
    }
  }
}

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
