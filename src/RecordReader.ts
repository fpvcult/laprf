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

import { Binary, NumberType, u8, u16, u32, u64 } from "./Binary";
import { ErrorCode } from "./Const";
import { LapRFError } from "./Util";
import * as Debug from "./Debug";

export class RecordReader extends Binary {
  constructor(buffer: Buffer, byteOffset: number = 0) {
    super(buffer, byteOffset);
  }

  public decodeData(type: NumberType): number {
    const size = this.read(u8);
    if (type.byteLength === size) return this.read(type);
    throw new LapRFError(
      ErrorCode.SizeError,
      `Unrecognized field data size ${size}`
    );
  }

  public skipField(): void {
    const size = this.read(u8);
    if (size === 1 || size === 2 || size === 4 || size === 8) {
      this.byteOffset = this.byteOffset + size;
    } else {
      throw new LapRFError(
        ErrorCode.SizeError,
        `Unrecognized field data size ${size}`
      );
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
    Debug.log(`Unknown Signature 0x${signature.toString(16)}: ${data}`);
    return data;
  }
}
