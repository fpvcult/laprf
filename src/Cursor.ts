import type { NumberType } from './types';
import { isArrayBuffer, isDataView } from './helpers';

/**
 * Cursor to keep track of position while writing or reading from a buffer.
 */
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
   * Configure cursor to read and write Little Endian
   */
  get LE(): boolean {
    return this._littleEndian;
  }

  set LE(value: boolean) {
    this._littleEndian = value;
  }
  /**
   * Configure cursor to read and write Big Endian
   */
  get BE(): boolean {
    return !this._littleEndian;
  }

  set BE(value: boolean) {
    this._littleEndian = !value;
  }

  /**
   * The number of bytes left until the end of the internal DataView.
   */
  get bytesLeft(): number {
    return this._view.byteLength - this._position;
  }

  /**
   * The current position of the cursor.
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
   * The internal buffer's byteLength.
   */
  get byteLength(): number {
    return this._view.byteLength;
  }

  /**
   * A reference to the internal DataView.
   */
  get view(): DataView {
    return this._view;
  }

  /**
   * @param begin - Default is 0, inclusive.
   * @param number - Default is the current cursor position, exclusive.
   * @returns A new view of the internal ArrayBuffer.
   */
  toUint8Array(begin = 0, end = this._position): Uint8Array {
    return new Uint8Array(this._view.buffer, this._view.byteOffset + begin, end);
  }

  /**
   * @param begin - Default is 0, inclusive.
   * @param end - Default is the current cursor position, exclusive.
   * @returns {DataView} A new view of the internal ArrayBuffer.
   */
  toDataView(begin = 0, end = this._position): DataView {
    return new DataView(this._view.buffer, this._view.byteOffset + begin, end);
  }

  /**
   * @param begin - Default is 0, inclusive.
   * @param end - Default is the current cursor position, exclusive.
   * @returns Contents of the Cursor are copied into a new ArrayBuffer.
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
   * @param byteCount - The number of bytes to skip.
   * @returns this
   */
  skip(byteCount: number): this {
    this._position += byteCount;
    return this;
  }

  /**
   * Read an 8 bit unsigned integer from the internal buffer.
   * @returns uint8
   */
  readUint8(): number {
    const value = this._view.getUint8(this._position);
    this._position += 1;
    return value;
  }

  /**
   * Read a 16 bit unsigned integer from the internal buffer.
   * @returns uint16
   */
  readUint16(): number {
    const value = this._view.getUint16(this._position, this._littleEndian);
    this._position += 2;
    return value;
  }

  /**
   * Read a 32 bit unsigned integer from the internal buffer.
   * @returns uint32
   */
  readUint32(): number {
    const value = this._view.getUint32(this._position, this._littleEndian);
    this._position += 4;
    return value;
  }

  /**
   * Read a 64 bit unsigned integer from the internal buffer.
   * @returns uint64
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
   * @returns float32
   */
  readFloat32(): number {
    const value = this._view.getFloat32(this._position, this._littleEndian);
    this._position += 4;
    return value;
  }

  /**
   * Read a 64 bit floating point number from the internal buffer.
   * @returns float64
   */
  readFloat64(): number {
    const value = this._view.getFloat64(this._position, this._littleEndian);
    this._position += 8;
    return value;
  }

  /**
   * Write a 8 bit unsigned integer to the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns The position of the cursor after the operation.
   */
  writeUint8(value: number): number {
    this._view.setUint8(this._position, value);
    return (this._position += 1);
  }

  /**
   * Write a 16 bit unsigned integer to the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns - The position of the cursor after the operation.
   */
  writeUint16(value: number): number {
    this._view.setUint16(this._position, value, this._littleEndian);
    return (this._position += 2);
  }

  /**
   * Write a 32 bit unsigned integer to the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns The position of the cursor after the operation.
   */
  writeUint32(value: number): number {
    this._view.setUint32(this._position, value, this._littleEndian);
    return (this._position += 4);
  }

  /**
   * Write a 64 bit unsigned integer to the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns The position of the cursor after the operation.
   */
  writeUint64(value: number): number {
    this._view.setBigUint64(this._position, BigInt(value), this._littleEndian);
    return (this._position += 8);
  }

  /**
   * Write a 32 bit floating point number from the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns The position of the cursor after the operation.
   */
  writeFloat32(value: number): number {
    this._view.setFloat32(this._position, value, this._littleEndian);
    return (this._position += 4);
  }

  /**
   * Write a 64 bit floating point number to the internal buffer.
   * @param value - The value to write to the buffer.
   * @returns The position of the cursor after the operation.
   */
  writeFloat64(value: number): number {
    this._view.setFloat64(this._position, value, this._littleEndian);
    return (this._position += 8);
  }

  /**
   * Write a typed number from the internal buffer.
   * @param type - The number type of `value`.
   * @param value - The value to be written to the buffer.
   * @returns
   */
  write(type: NumberType, value: number): this {
    type.write.call(this._view, this._position, value, this._littleEndian);
    this._position += type.byteLength;
    return this;
  }

  /**
   * Read a typed number from the internal buffer.
   * @param type - The number type to read from the buffer.
   * @returns The value read from the buffer.
   */
  read(type: NumberType): number {
    const value = type.read.call(this._view, this._position, this._littleEndian);
    this._position += type.byteLength;
    return value;
  }
}

function panic(msg = 'An error occurred'): never {
  throw new Error(`[laprf-cursor] ${msg}`);
}
