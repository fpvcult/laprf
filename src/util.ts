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

import {
  NumberType,
  u8,
  u16,
  u32,
  u64,
  f32,
  f64,
  Result,
  Ok,
  Err
} from "./Constant";

export function isOk<T, E extends Error>(
  result: Ok<T> | Err<E>
): result is Ok<T> {
  return (<Ok<T>>result).value !== undefined;
}

export function isErr<T, E extends Error>(
  result: Ok<T> | Err<E>
): result is Err<E> {
  return (<Err<E>>result).error !== undefined;
}

export function value<T, E extends Error>(result: Result<T, E>): T {
  if (<Ok<T>>result) {
    return (<Ok<T>>result).value;
  } else {
    throw (<Err<E>>result).error;
  }
}

export class Reader {
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

  public read(type: number): number {
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
        const left = this.buffer.readUInt32LE(0);
        const right = this.buffer.readUInt32LE(4);
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
    }
    return result;
  }
}

export function verifyNumber(type: NumberType, size: number): boolean {
  switch (type) {
    case u8:
      if (size === 1) return true;
      break;
    case u16:
      if (size === 2) return true;
      break;
    case u32:
    case f32:
      if (size === 4) return true;
      break;
    case u64:
    case f64:
      if (size === 8) return true;
      break;
  }
  return false;
}
