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

import { Transform, TransformOptions } from "stream";
import { SOR, EOR, ESC, ESC_OFFSET } from "./Const";

import * as Debug from "./Debug";

interface IUnescapedRecord {
  record: Buffer;
  byteOffset: number;
}

export const enum ErrorCode {
  MissingSOR,
  MissingEOR
}

export class UnescapeError extends Error {
  constructor(readonly code: ErrorCode) {
    super("An error occured while usescaping a packet");
    Object.setPrototypeOf(this, UnescapeError.prototype);
  }
}

export default class Unescape extends Transform {
  private recordCount: number = 0;
  private packetCount: number = 0;

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(raw: Buffer, encoding: BufferEncoding, done: Function) {
    let packet = Buffer.isBuffer(raw) ? raw : new Buffer(raw, encoding);
    let unescaped: IUnescapedRecord;
    let byteOffset = 0;
    Debug.log(`Raw Packet Length: ${packet.length}`);
    try {
      loop: while (true) {
        unescaped = this.collectRecord(packet, byteOffset);
        this.push(unescaped.record);
        byteOffset = unescaped.byteOffset;
        this.recordCount++;
        Debug.log(`Record Length: ${unescape.length}`);
        Debug.log(`Total Record Count: ${this.recordCount}`);
      }
    } catch (error) {
      switch (error.code) {
        case ErrorCode.MissingEOR:
          Debug.log("Never found EOR after finding SOR");
          break;
        case ErrorCode.MissingSOR:
          // The ethernet packets do not include more than one record
          // at a time. I don't know if the bluetooth LapRF will.
          break;
      }
    }
    this.packetCount++;
    Debug.log(`Total Packet Count: ${this.packetCount}`);
    done();
  }

  /**
   * Collect and unescape LapRF Record from `packet`
   * @param packet Raw data packet received from LapRF
   * @param byteOffset Current buffer offset
   */
  private collectRecord(packet: Buffer, byteOffset: number): IUnescapedRecord {
    let byte: number;
    let escaped: boolean = false;
    const record = [];

    let start = packet.indexOf(SOR, byteOffset);

    if (start > -1) {
      // Found the Start Of Record
      let byteOffset = start;
      let length = packet.length;
      for (; byteOffset < length; byteOffset++) {
        byte = packet.readUInt8(byteOffset);
        if (escaped) {
          escaped = false;
          record.push(byte - ESC_OFFSET);
        } else {
          switch (byte) {
            case EOR: // Found the End Of Record
              record.push(byte);
              byteOffset++;
              return { record: Buffer.from(record), byteOffset };
            case ESC:
              escaped = true;
              break;
            default:
              record.push(byte);
          }
        }
      }
      // Never found the End Of Record
      throw new UnescapeError(ErrorCode.MissingEOR);
    }
    // Never found the Start Of Record
    throw new UnescapeError(ErrorCode.MissingSOR);
  }
}
