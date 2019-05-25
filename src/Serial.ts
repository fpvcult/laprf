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

import {
  SOR,
  EOR,
  ESC,
  ESC_OFFSET,
  IRecord,
  IField,
  MAX_RECORD_LEN,
  RecordType
} from "./Const";
import { u8, u16, NumberType, Binary } from "./Binary";
import { Crc } from "./Util";
import * as Debug from "./Debug";
import * as Schema from "./Schema";
import { SizeError, RecordTypeError, SerialError } from "./Errors";

/**
 * A class to serialize/deserialize LapRF protocol packets.
 */
export class Serial extends Binary {
  constructor() {
    super(MAX_RECORD_LEN * 8);
  }

  /**
   * Serialize a JavaScript object into a LapRF record.
   *
   * @param record A JavaScript object to serialize into a LapRF record.
   */
  serialize(record: IRecord): Buffer {
    const recordType = Schema.findRecordTypeByName(record.type);
    if (Schema.isRecordDescriptor(recordType)) {
      this.startRecord(recordType.code);
      record.fields.forEach(field => {
        const fieldType = Schema.findFieldTypeByName(
          recordType.name,
          field.type
        );
        if (Schema.isFieldDescriptor(fieldType)) {
          this.writeField(fieldType.numberType, fieldType.code, field.data);
        } else {
          Debug.warn(`Unrecongized Field Type: ${field.type}`);
        }
      });
    } else {
      throw new RecordTypeError(record.type);
    }
    return this.finishRecord();
  }

  /**
   * Deserialize a LapRF packet into an array of JavaScript objects.
   *
   * @param packet A packet received from a LapRF to deserialize.
   * @returns An array of JavaScript objects conforming to the IRecord interface.
   */
  deserialize(packet: Buffer): IRecord[] {
    const records = this.unescapePacket(packet).filter(varifyRecord);
    const deserialized: IRecord[] = [];
    records.forEach(record => {
      const result = this.deserializeRecord(record);
      if (result !== undefined) deserialized.push(result);
    });
    return deserialized;
  }

  /**
   * Initialize the serialization of a LapRF record.
   *
   * @param recordType The [[RecordType]] of the record to initialize.
   */
  private startRecord(recordType: RecordType): void {
    this.byteOffset = 0; // reset the buffer
    this.write(u8, SOR);
    this.write(u16, 0); // Length placeholder
    this.write(u16, 0); // CRC placeholder
    this.write(u16, recordType);
  }

  /**
   * Finish serializing a LapRF record.
   *
   * @returns A Buffer containing the completed, escaped record.
   */
  private finishRecord(): Buffer {
    this.write(u8, EOR);
    const length = this.byteOffset;
    const packet = Buffer.from(this.slice()); // Copy... will need buffer for escaping
    packet.writeUInt16LE(length, 1);
    const crc = Crc.compute(packet);
    packet.writeUInt16LE(crc, 3);
    return this.escapeRecord(packet);
  }

  /**
   * Serialize a field of a LapRF record.
   *
   * @param type The [[NumberType]] to use to write the `data` into the field.
   * @param signature The protocol signature of the field.
   * @param data The data of the field.
   */
  private writeField(type: NumberType, signature: number, data: number): void {
    this.write(u8, signature);
    this.write(u8, type.byteLength);
    this.write(type, data);
  }

  /**
   * Escape a LapRF record.
   *
   * @param record The record to escape.
   * @returns The escaped contents of `record`.
   */
  private escapeRecord(record: Buffer): Buffer {
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
    return Buffer.from(this.slice());
  }

  /**
   * Unescaped a LapRF packet.
   *
   * @param packet Raw packet received from LapRF, may contain multiple records
   * @returns An array of buffers containing unescaped records.
   */
  private unescapePacket(packet: Buffer): Buffer[] {
    let byte: number;
    let escaped = false;
    let collecting = false;
    let records: Buffer[] = [];
    this.byteOffset = 0; // Reset the buffer
    for (let i = 0, len = packet.length; i < len; i++) {
      byte = packet.readUInt8(i);
      if (!collecting && byte === SOR) {
        collecting = true;
      }
      if (collecting) {
        if (escaped) {
          escaped = false;
          this.write(u8, byte - ESC_OFFSET);
        }
        switch (byte) {
          case EOR:
            collecting = false;
            this.write(u8, byte);
            records.push(Buffer.from(this.slice()));
            this.byteOffset = 0; // Reset the buffer
            break;
          case ESC:
            escaped = true;
            break;
          default:
            this.write(u8, byte);
        }
      }
    }
    return records;
  }

  private deserializeRecord(raw: Buffer): IRecord | undefined {
    try {
      const fields: IField[] = [];

      // Setup the internal buffer to read the record, starting at the record type field
      this.byteOffset = 0;
      this.copy(raw, 5, raw.length);
      const recordType = this.read(u16);

      if (recordType in RecordType) {
        loop: while (true) {
          const signature = this.read(u8);
          if (signature === EOR) break loop;

          const size = this.read(u8);
          let fieldType = Schema.findFieldTypeByCode(recordType, signature);

          if (Schema.isFieldDescriptor(fieldType)) {
            if (fieldType.numberType.byteLength === size) {
              // `signature` and `size` are valid, read the data from the buffer
              const data = this.read(fieldType.numberType);
              fields.push({ type: fieldType.name, data });
            } else {
              // `signature` is valid, `size` is invalid
              throw new SizeError(recordType, signature, size);
            }
          } else {
            // `signature` is invalid
            if (isValidSize(size)) {
              // `size` is valid, but will not attempt parse the data of an unknown signature
              this.byteOffset = this.byteOffset + size;
              Debug.warn(Debug.Msg.unknowSignature(recordType, signature));
            } else {
              // `size` is also invalid
              throw new SizeError(recordType, signature, size, false);
            }
          }
        }
      } else {
        throw new RecordTypeError(recordType);
      }
      return { type: RecordType[recordType], fields };
    } catch (error) {
      if (error instanceof RangeError) {
        throw new SerialError("Reached the end of packet unexpectedly");
      } else if (error.prototype instanceof SerialError) {
        Debug.warn(error.message);
      } else {
        throw error;
      }
    }
    return undefined;
  }
}

/**
 * Varify a LapRF record.
 * WARNING: The `record` is modified in order to verify the CRC.
 *
 * @param record A LapRF record to verify.
 * @returns Whether or not the `record` can be verified.
 */
function varifyRecord(record: Buffer): boolean {
  if (record.length < 8 || record.length > MAX_RECORD_LEN) {
    return false;
  }
  // const length = record.readInt16LE(1);
  const crcRecord = record.readUInt16LE(3);
  record.writeUInt16LE(0, 3); // Must zero the CRC before computing
  const crcComputed = Crc.compute(record);
  if (crcRecord === crcComputed) {
    return true;
  }
  Debug.warn(`CRC mismatch  rx: ${crcRecord}  calc: ${crcComputed}`);
  return false;
}

function isValidSize(size: number): boolean {
  return size === 1 || size === 2 || size === 4 || size === 8;
}
