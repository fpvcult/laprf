/**
 * Copyright (C) 2021 copyright-holder John Hooks <bitmachina@outlook.com>
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
 * along with @fpvcult/laprf.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import type { NumberType } from './types';
import { SOR, EOR, MAX_RECORD_LEN } from './const';
import Cursor from './Cursor';
import * as Crc from './Crc';
import { u8, u16 } from './Numbers';
import { escape } from './helpers';

export class Encoder {
  private cursor: Cursor;
  /**
   * Initialize the serialization of a LapRF record.
   * @param {number} signature The [[RecordType]] of the record to initialize.
   */
  constructor(signature: number) {
    this.cursor = new Cursor(MAX_RECORD_LEN);
    this.cursor.LE = true;

    // Start LapRF record.
    this.cursor.write(u8, SOR);
    this.cursor.write(u16, 0); // byte length
    this.cursor.write(u16, 0); // crc
    this.cursor.write(u16, signature);
  }

  /**
   * Finish the serialization of a LapRF record.
   * @param {Bytes} record
   * @returns {Uint8Array} A byte array containing the completed, escaped record.
   */
  finishRecord(): Uint8Array {
    this.cursor.write(u8, EOR);
    const buffer = this.cursor.toDataView();
    buffer.setUint16(1, buffer.byteLength, true);
    buffer.setUint16(3, Crc.compute(buffer), true);
    return new Uint8Array(escape(this.cursor.toUint8Array()));
  }

  /**
   * Encode a LapRF record field.
   * @param {number} signature The field signature.
   * @param {NumberType} type The `NumberType` of `value`
   * @param {number} value The field data.
   * @returns {undefined}
   */
  encodeField(signature: number, type: NumberType, value: number): Encoder {
    this.cursor.writeUint8(signature);
    this.cursor.writeUint8(type.byteLength);
    this.cursor.write(type, value);
    return this;
  }

  /**
   * Write a typed number from the internal buffer.
   *
   * @param {NumberType} type The number type of `value`.
   * @param {number} value The value to be written to the buffer.
   * @returns {this}
   */
  write(type: NumberType, value: number): this {
    this.cursor.write(type, value);
    return this;
  }
}
