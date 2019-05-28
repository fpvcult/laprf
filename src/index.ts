/**
 * Author: John Hooks <bitmachina@outlook.com>
 * URL: https://github.com/fpvcult/laprf
 * Version: 0.1.0
 *
 * This file is part of @fpvcult/laprf.s
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

import { Binary } from "@bitmachina/binary";
import { u8, u16 } from "@bitmachina/binary/lib/NumberType";
import * as RecordType from "./RecordType";
import * as Serial from "./Serial";
import { Msg } from "./Util";

export const MAX_RECORD_LEN = 1024;
export const MAX_SLOTS = 8;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

export interface IRecord {
  type: string;
  fields: Serial.RecordFields;
}

/**
 * A class to serialize/deserialize LapRF protocol packets.
 */
export default class LapRF extends Binary {
  constructor() {
    super(MAX_RECORD_LEN * 8);
  }

  /**
   * Serialize an object implementing [[IRecord]] into a binary LapRF record.
   * @param record An object to serialize into a LapRF record.
   */
  encode(record: IRecord): Buffer {
    const recordType = RecordType.get(record.type);

    if (recordType !== undefined) {
      this.startRecord(recordType.signature);
      Serial.encode(record.fields, this, recordType.schema);
      return this.finishRecord();
    } else {
      throw new Error(Msg.unknownRecordType(record.type));
    }
  }

  /**
   * Deserialize a LapRF packet into an array of objects implementing [[IRecord]].
   * @param packet A packet received from a LapRF to deserialize.
   * @returns An array of JavaScript objects conforming to the IRecord interface.
   */
  decode(packet: Buffer): IRecord[] {
    const decoded: IRecord[] = [];

    try {
      const records = this.splitRecords(packet);

      for (let i = 0, len = records.length; i < len; i++) {
        this.unescape(records[i]); // Escaped contents are stored in the internal buffer

        if (verifyRecord(this.toBuffer())) {
          const length = this.byteOffset;
          this.byteOffset = 5; // Seek to the the record signature
          const signature = this.read(u16);
          const recordType = RecordType.get(signature);

          if (recordType !== undefined) {
            const fields: Serial.RecordFields = [];
            const binaryFields = this.slice(this.byteOffset, length - 1);
            const success = Serial.decode(
              binaryFields,
              fields,
              recordType.schema
            );

            if (success) {
              decoded.push({ type: recordType.name, fields });
            } else {
              console.warn(`Unable to decode record type '${recordType.name}'`);
            }
          } else {
            console.warn(Msg.unknownRecordType(signature));
          }
        }
      }
    } catch (error) {
      if (error instanceof RangeError) {
        console.log("Something horrible went wrong!");
      } else {
        throw error;
      }
    }

    return decoded;
  }

  /**
   * Initialize the serialization of a LapRF record.
   * @param recordType The [[RecordType]] of the record to initialize.
   */
  private startRecord(signature: number): void {
    this.byteOffset = 0; // Reset the internal buffer
    this.write(u8, SOR);
    this.write(u16, 0); // Length placeholder
    this.write(u16, 0); // CRC placeholder
    this.write(u16, signature);
  }

  /**
   * Finish the serialization of a LapRF record.
   * @returns A Buffer containing the completed, escaped record.
   */
  private finishRecord(): Buffer {
    this.write(u8, EOR);
    const length = this.byteOffset;
    const record = Buffer.from(this.toBuffer()); // Copy
    record.writeUInt16LE(length, 1);
    const crc = Serial.Crc.compute(record);
    record.writeUInt16LE(crc, 3);
    return this.escape(record);
  }

  /**
   * Escape a LapRF record.
   * @param record The record to escape.
   * @returns A buffer containing the escaped contents of the `record`.
   */
  private escape(record: Buffer): Buffer {
    let byte: number;
    this.byteOffset = 0; // Reset the buffer
    for (let i = 0, len = record.length; i < len; i++) {
      byte = record.readUInt8(i);
      if (
        (byte === ESC || byte === SOR || byte === EOR) &&
        i !== 0 &&
        i !== len - 1
      ) {
        this.write(u8, ESC);
        this.write(u8, byte + ESC_OFFSET);
      } else {
        this.write(u8, byte);
      }
    }
    return Buffer.from(this.toBuffer());
  }

  private splitRecords(packet: Buffer): Buffer[] {
    const records: Buffer[] = [];
    let offset = 0;
    while (true) {
      const sor = packet.indexOf(SOR, offset);
      if (sor > -1) {
        offset = packet.indexOf(EOR, sor) + 1;
        if (offset > -1) {
          records.push(packet.slice(sor, offset));
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return records;
  }

  /**
   * Unescaped a LapRF packet and store the contents in the internal buffer.
   * @param record Raw record received from a LapRF.
   */
  private unescape(record: Buffer): void {
    let byte: number;
    let escaped = false;
    this.byteOffset = 0; // Reset the buffer
    for (let i = 0, len = record.length; i < len; i++) {
      byte = record.readUInt8(i);
      if (escaped) {
        escaped = false;
        this.write(u8, byte - ESC_OFFSET);
      } else {
        switch (byte) {
          case EOR:
            this.write(u8, byte);
            return;
          case ESC:
            escaped = true;
            break;
          default:
            this.write(u8, byte);
        }
      }
    }
    throw new Error("Unable to unescape the record");
  }
}

/**
 * Verify a LapRF record for length and perform a cyclic redundancy check (CRC).
 * WARNING: The `record` is modified in order to verify the CRC.
 * @param record A LapRF record to verify.
 * @returns Whether or not the `record` has been verified.
 */
function verifyRecord(record: Buffer): boolean {
  const length = record.readInt16LE(1);
  if (record.length !== length) console.warn("Record length mismatch");
  if (record.length < 8 || record.length > MAX_RECORD_LEN) return false;

  const crcRecord = record.readUInt16LE(3);
  record.writeUInt16LE(0, 3); // Must zero the CRC before computing
  const crcComputed = Serial.Crc.compute(record);

  if (crcRecord === crcComputed) {
    return true;
  }

  console.warn(`CRC mismatch`);
  return false;
}
