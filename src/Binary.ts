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

interface IReadNumber {
  (byteOffset: number): number;
}

interface IWriteNumber {
  (value: number, byteOffset: number): number;
}

/**
 * A class to help build serial protocol schemas.
 */
export class NumberType {
  constructor(
    readonly byteLength: number,
    readonly read: IReadNumber,
    readonly write: IWriteNumber
  ) {}
}

/**
 * An Unsigned 8 Bit Integer
 */
export const u8 = new NumberType(
  1,
  Buffer.prototype.readUInt8,
  Buffer.prototype.writeUInt8
);

/**
 * An Unsigned 16 Bit Integer
 */
export const u16 = new NumberType(
  2,
  Buffer.prototype.readUInt16LE,
  Buffer.prototype.writeUInt16LE
);

/**
 * An Unsigned 32 Bit Integer
 */
export const u32 = new NumberType(
  4,
  Buffer.prototype.readUInt32LE,
  Buffer.prototype.writeUInt32LE
);

/**
 * An Unsigned 64 Bit Integer
 *
 * Consider using BigInt.
 */
export const u64 = new NumberType(
  8,

  function readUInt64LE(this: Buffer, byteOffset: number): number {
    const left = this.readUInt32LE(byteOffset);
    const right = this.readUInt32LE(byteOffset + 4);
    const number = left + right * 2 ** 32; // combine the two 32-bit values
    if (!Number.isSafeInteger(number)) {
      console.warn(number, "exceeds MAX_SAFE_INTEGER.");
    }
    return number;
  },
  function writeUInt64LE(
    this: Buffer,
    value: number,
    byteOffset: number
  ): number {
    return this.writeBigUInt64LE(BigInt(value), byteOffset);
  }
);

/**
 * A 32 Bit Floating Point Number
 */
export const f32 = new NumberType(
  4,
  Buffer.prototype.readFloatLE,
  Buffer.prototype.writeFloatLE
);

/**
 * A 64 Bit Floating Point Number
 */
export const f64 = new NumberType(
  8,
  Buffer.prototype.readDoubleLE,
  Buffer.prototype.writeDoubleLE
);

/**
 * A Node.js Buffer wrapper.
 *
 * Intended for serializing/deserializing data using a predefined schema.
 */
export class Binary {
  private _buffer: Buffer;
  private _byteOffset: number;

  /**
   *
   * @param buffer Either a Buffer or the byte length of the buffer to create
   * @param byteOffset Optionally, if a buffer was provided, a point to start in that buffer.
   */
  constructor(buffer: Buffer | number, byteOffset: number = 0) {
    if (buffer instanceof Buffer) {
      if (!(byteOffset < buffer.length) || byteOffset < 0) {
        throw new RangeError(
          "Provide byteOffset is not within the range of the buffer"
        );
      }
      this._buffer = buffer.slice(byteOffset, buffer.length); // Create a new view
      this._byteOffset = 0;
    } else {
      this._buffer = Buffer.alloc(buffer);
      this._byteOffset = 0;
    }
  }

  /**
   * @returns The length of the wrapped buffer.
   */
  get length(): number {
    return this._buffer.length;
  }

  /**
   * @returns The current read/write byte position in the wrapped buffer.
   */
  get byteOffset(): number {
    return this._byteOffset;
  }

  /**
   * Set the read/write byte position of the wrapped buffer to `value`.
   */
  set byteOffset(value: number) {
    this._byteOffset = value;
    if (!(this._byteOffset < this._buffer.length) || this._byteOffset < 0) {
      throw new RangeError("Attempt to seek beyond buffer range");
    }
  }

  /**
   * @returns The raw buffer.
   */
  get raw(): Buffer {
    return this._buffer;
  }

  /**
   * @returns A buffer view upto the current `byteOffset`.
   */
  slice(): Buffer {
    return this._buffer.slice(0, this._byteOffset);
  }

  /**
   *
   * @param source The buffer from which to copy.
   * @param sourceStart The offset within `source` from which to begin copying.
   * @param sourceEnd The offset within `source` from which to stop copying (not inclucive).
   * @returns The current offset of the wrapped buffer.
   */
  copy(source: Buffer, sourceStart: number, sourceEnd: number) {
    return (this._byteOffset += source.copy(
      this._buffer,
      this._byteOffset,
      sourceStart,
      sourceEnd
    ));
  }

  /**
   *
   * @param type The [[NumberType]] of `value`.
   * @param value The value to be written to the buffer
   * @returns The current offset of the buffer after the write
   */
  write(type: NumberType, value: number): number {
    this._byteOffset = type.write.call(this._buffer, value, this._byteOffset);
    return this._byteOffset;
  }

  /**
   *
   * @param type The [[NumberType]] to read from the buffer.
   * @returns The value read from the buffer.
   */
  read(type: NumberType) {
    const value = type.read.call(this._buffer, this._byteOffset);
    this._byteOffset += type.byteLength;
    return value;
  }
}
