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
import { isArrayBuffer, isDataView } from './helpers';

export default class Cursor {
  private _view: DataView;
  private _position = 0;
  private _littleEndian = true;

  constructor(arg: ArrayBuffer | DataView | number) {
    if (isArrayBuffer(arg)) {
      this._view = new DataView(arg);
    } else if (isDataView(arg)) {
      this._view = arg;
    } else {
      this._view = new DataView(new ArrayBuffer(arg as number));
    }
  }

  /**
   * @type {boolean} Little Endian
   */
  get LE(): boolean {
    return this._littleEndian;
  }

  set LE(value: boolean) {
    this._littleEndian = value;
  }
  /**
   * @type {boolean} Big Endian
   */
  get BE(): boolean {
    return !this._littleEndian;
  }

  set BE(value: boolean) {
    this._littleEndian = !value;
  }

  /**
   * @type {number} The number of bytes left until the end of the internal DataView.
   */
  get bytesLeft(): number {
    return this._view.byteLength - this._position;
  }

  /**
   * @type {number} The current position of the cursor.
   */
  get position(): number {
    return this._position;
  }

  set position(position: number) {
    if (!Number.isInteger(position)) {
      panic('Cursor#setPosition argument must be an integer');
    }
    if (position > this._view.byteLength || position < 0) {
      panic('Cursor position is outside the bounds of the interior DataView');
    }
    this._position = position;
  }

  /**
   * @type {number} The internal buffer's byteLength.
   */
  get byteLength(): number {
    return this._view.byteLength;
  }

  /**
   * @type {DataView} A reference to the internal DataView.
   */
  get view(): DataView {
    return this._view;
  }

  /**
   * @param {number} [begin] Default is 0, inclusive.
   * @param {number} [end] Default is the current cursor position, exclusive.
   * @returns {Uint8Array} A new view of the internal ArrayBuffer.
   */
  toUint8Array(begin = 0, end = this._position): Uint8Array {
    return new Uint8Array(this._view.buffer, this._view.byteOffset + begin, end);
  }

  /**
   * @param {number} [begin] Default is 0, inclusive.
   * @param {number} [end] Default is the current cursor position, exclusive.
   * @returns {DataView} A new view of the internal ArrayBuffer.
   */
  toDataView(begin = 0, end = this._position): DataView {
    return new DataView(this._view.buffer, this._view.byteOffset + begin, end);
  }

  /**
   * @param {number} [begin] Default is 0, inclusive.
   * @param {number} [end] Default is the current cursor position, exclusive.
   * @returns {Cursor} Contents of the Cursor are copied into a new ArrayBuffer.
   */
  slice(begin = 0, end = this._position): Cursor {
    // Use ArrayBuffer#slice to create a copy of the buffer.
    // Need to use the view's byteOffset, because it doesn't necessary begin at
    // the beginning of the ArrayBuffer.
    const cursor = new Cursor(
      this._view.buffer.slice(this._view.byteOffset + begin, this._view.byteOffset + end)
    );
    cursor.LE = this.LE;
    return cursor;
  }

  /**
   * @param {number} byteCount The number of bytes to skip.
   * @returns {Cursor} this
   */
  skip(byteCount: number): this {
    this._position += byteCount;
    return this;
  }

  /**
   * Read an 8 bit unsigned integer from the internal buffer.
   * @returns {number} uint8
   */
  readUint8(): number {
    const value = this._view.getUint8(this._position);
    this._position += 1;
    return value;
  }

  /**
   * Read a 16 bit unsigned integer from the internal buffer.
   * @returns {number} uint16
   */
  readUint16(): number {
    const value = this._view.getUint16(this._position, this._littleEndian);
    this._position += 2;
    return value;
  }

  /**
   * Read a 32 bit unsigned integer from the internal buffer.
   * @returns {number} uint32
   */
  readUint32(): number {
    const value = this._view.getUint32(this._position, this._littleEndian);
    this._position += 4;
    return value;
  }

  /**
   * Read a 64 bit unsigned integer from the internal buffer.
   * @returns {number} uint64
   */
  readUint64(): number {
    const { _position: position, _littleEndian: isLittleEndian } = this;
    const left = this._view.getUint32(position, isLittleEndian);
    const right = this._view.getUint32(position + 4, isLittleEndian);

    // combine the two 32-bit values
    const value = isLittleEndian ? left + right * 2 ** 32 : 2 ** 32 * left + right;

    if (!Number.isSafeInteger(value)) {
      panic(`${value} exceeds MAX_SAFE_INTEGER`);
    }

    this._position += 8;
    return value;
  }

  /**
   * Read a 32 bit floating point number from the internal buffer.
   * @returns {number} float32
   */
  readFloat32(): number {
    const value = this._view.getFloat32(this._position, this._littleEndian);
    this._position += 4;
    return value;
  }

  /**
   * Read a 64 bit floating point number from the internal buffer.
   * @returns {number} float64
   */
  readFloat64(): number {
    const value = this._view.getFloat64(this._position, this._littleEndian);
    this._position += 8;
    return value;
  }

  /**
   * Write a 8 bit unsigned integer to the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeUint8(value: number): number {
    this._view.setUint8(this._position, value);
    return (this._position += 1);
  }

  /**
   * Write a 16 bit unsigned integer to the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeUint16(value: number): number {
    this._view.setUint16(this._position, value, this._littleEndian);
    return (this._position += 2);
  }

  /**
   * Write a 32 bit unsigned integer to the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeUint32(value: number): number {
    this._view.setUint32(this._position, value, this._littleEndian);
    return (this._position += 4);
  }

  /**
   * Write a 64 bit unsigned integer to the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeUint64(value: number): number {
    this._view.setBigUint64(this._position, BigInt(value), this._littleEndian);
    return (this._position += 8);
  }

  /**
   * Write a 32 bit floating point number from the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeFloat32(value: number): number {
    this._view.setFloat32(this._position, value, this._littleEndian);
    return (this._position += 4);
  }

  /**
   * Write a 64 bit floating point number to the internal buffer.
   * @param {number} value
   * @returns {number} The position of the cursor after the operation.
   */
  writeFloat64(value: number): number {
    this._view.setFloat64(this._position, value, this._littleEndian);
    return (this._position += 8);
  }

  /**
   * Write a typed number from the internal buffer.
   * @param {NumberType} type The number type of `value`.
   * @param {number} value The value to be written to the buffer.
   * @returns {this}
   */
  write(type: NumberType, value: number): this {
    type.write.call(this._view, this._position, value, this._littleEndian);
    this._position += type.byteLength;
    return this;
  }

  /**
   * Read a typed number from the internal buffer.
   * @param {NumberType} type The number type to read from the buffer.
   * @returns {number} The value read from the buffer.
   */
  read(type: NumberType): number {
    const value = type.read.call(this._view, this._position, this._littleEndian);
    this._position += type.byteLength;
    return value;
  }
}

function panic(msg = 'An error occurred'): never {
  throw new Error(`[Cursor Error] ${msg}`);
}
