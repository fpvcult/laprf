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
   * @param signature - The [[RecordType]] of the record to initialize.
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
   * @param record - The record to finish.
   * @returns A byte array containing the completed, escaped record.
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
   * @param signature - The field signature.
   * @param type - The `NumberType` of `value`
   * @param  value - The field data.
   * @returns The Encoder
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
   * @param type - The number type of `value`.
   * @param value - The value to be written to the buffer.
   * @returns The Encoder
   */
  write(type: NumberType, value: number): this {
    this.cursor.write(type, value);
    return this;
  }
}
