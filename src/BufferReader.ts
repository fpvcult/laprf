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

import { u8, u16, u32, u64, f32, f64, NumberType } from "./Const";

export class BufferReader {
  constructor(private buffer: Buffer, private byteOffset: number = 0) {}

  public get cursor(): number {
    return this.buffer.readUInt8(this.byteOffset);
  }

  public advance(byteLength: number) {
    this.byteOffset += byteLength;
    if (!(this.byteOffset < this.buffer.length)) {
      throw new RangeError("Attempt to advance beyond buffer range");
    }
  }

  public read(type: NumberType): number {
    let result: number;
    switch (type) {
      case u8:
        result = this.buffer.readUInt8(this.byteOffset);
        this.byteOffset += 1;
        break;
      case u16:
        result = this.buffer.readUInt16LE(this.byteOffset);
        this.byteOffset += 2;
        break;
      case u32:
        result = this.buffer.readInt32LE(this.byteOffset);
        this.byteOffset += 4;
        break;
      case f32:
        result = this.buffer.readFloatLE(this.byteOffset);
        this.byteOffset += 4;
        break;
      case u64:
        const left = this.buffer.readUInt32LE(this.byteOffset);
        const right = this.buffer.readUInt32LE(this.byteOffset + 4);
        const number = left + right * 2 ** 32; // combine the two 32-bit values
        if (!Number.isSafeInteger(number)) {
          console.warn(number, "exceeds MAX_SAFE_INTEGER.");
        }
        result = number;
        this.byteOffset += 8;
        break;
      case f64:
        result = this.buffer.readDoubleLE(this.byteOffset);
        this.byteOffset += 8;
        break;
      default:
        // Just here for Typescript, all cases of NumberType have been handled
        throw new Error("This can never happen!");
    }
    return result;
  }
}
