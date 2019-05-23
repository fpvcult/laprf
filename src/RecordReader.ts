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

import { NumberType, u8, u16, u32, u64, f32, f64, ErrorCode } from "./Const";
import { LapRFError } from "./Util";
import { BufferReader } from "./BufferReader";
import * as Debug from "./Debug";

export class RecordReader extends BufferReader {
  constructor(buffer: Buffer, byteOffset: number = 0) {
    super(buffer, byteOffset);
  }

  public decodeData(type: NumberType): number {
    const size = this.read(u8);
    if (verifyNumber(type, size)) return this.read(type);
    const msg = `Unknown field data size ${size}`;
    throw new LapRFError(ErrorCode.SizeError, msg);
  }

  public skipField(): void {
    const size = this.read(u8);
    if (size === 1 || size === 2 || size === 4 || size === 8) {
      this.advance(size);
    } else {
      throw new LapRFError(ErrorCode.SizeError);
    }
  }

  public decodeUnknown(signature: number): number {
    const size = this.read(u8);
    let data: number;
    switch (size) {
      case 1:
        data = this.read(u8);
        break;
      case 2:
        data = this.read(u16);
        break;
      case 4:
        data = this.read(u32);
        break;
      case 8:
        data = this.read(u64);
        break;
      default:
        const msg = `Unknown field data size ${size}`;
        throw new LapRFError(ErrorCode.SizeError, msg);
    }
    Debug.log(`Signature 0x${signature.toString(16)}: ${data}`);
    return data;
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
