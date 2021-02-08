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
    this.cursor.write(u16, 0);
    this.cursor.write(u16, 0);
    this.cursor.write(u16, signature);
  }

  /**
   * Finish the serialization of a LapRF record.
   * @param {Bytes} record
   * @returns {ArrayBuffer} A byte array containing the completed, escaped record.
   */
  finishRecord(): ArrayBuffer {
    this.cursor.write(u8, EOR);
    const buffer = this.cursor.toDataView();
    buffer.setUint16(1, buffer.byteLength, true);
    buffer.setUint16(3, Crc.compute(buffer), true);
    return escape(this.cursor.toUint8Array());
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
