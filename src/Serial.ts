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

import { u8, Binary } from "./Binary";
import { Schema } from "./Schema";
import { Msg } from "./Util";

export type RecordFields = Array<[string, number]>;

/**
 * Encode an array of [[RecordFields]] into a binary LapRF record.
 * @param source Array of record field data to encode.
 * @param target Target to fill with binary data.
 * @param schema The record type schema to use to encode the data.
 */
export function encode<T extends Binary>(
  source: RecordFields,
  target: T,
  schema: Schema
): void {
  for (let i = 0, len = source.length; i < len; i++) {
    const [name, data] = source[i];
    const fieldType = schema.get(name);
    if (fieldType !== undefined) {
      const { signature, type } = fieldType;
      target.write(u8, signature);
      target.write(u8, type.byteLength);
      target.write(type, data);
    } else {
      // console.warn(Msg.unknownFieldType(name));
      throw new Error(`Unknown field type '${name}'`);
    }
  }
}

/**
 * Decode a binary LapRF record into an array of [[RecordFields]].
 * @param source Binary LapRF record to decode.
 * @param target Target to fill with record fields.
 * @param schema The record type schema to use to decode the record.
 * @returns Whether or not decoding was successful.
 */
export function decode<T extends Binary>(
  source: T,
  target: RecordFields,
  schema: Schema
): boolean {
  const length = source.length;

  while (source.byteOffset < length) {
    const signature = source.read(u8);
    const size = source.read(u8);
    const fieldType = schema.get(signature);
    if (fieldType !== undefined) {
      const { name, type } = fieldType;
      if (size === type.byteLength) {
        const data = source.read(type);
        target.push([name, data]);
      } else {
        console.warn(Msg.sizeMismatch(size, type));
        return false;
      }
    } else {
      console.warn(Msg.unknownFieldType(signature));
      return false;
    }
  }
  return true;
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
