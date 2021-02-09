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

import { NumberType } from './types';

/**
 * An Unsigned 8 Bit Integer
 */
export const u8: NumberType = {
  byteLength: 1,
  read: DataView.prototype.getUint8,
  write: DataView.prototype.setUint8,
};

/**
 * An Unsigned 16 Bit Integer
 */
export const u16: NumberType = {
  byteLength: 2,
  read: DataView.prototype.getUint16,
  write: DataView.prototype.setUint16,
};

/**
 * An Unsigned 32 Bit Integer
 */
export const u32: NumberType = {
  byteLength: 4,
  read: DataView.prototype.getUint32,
  write: DataView.prototype.setUint32,
};

/**
 * An Unsigned 64 Bit Integer
 *
 * Consider using BigInt.
 */
export const u64: NumberType = {
  byteLength: 8,

  /* readUInt64LE */
  read(byteOffset, littleEndian) {
    const left = this.getUint32(byteOffset, littleEndian);
    const right = this.getUint32(byteOffset + 4, littleEndian);

    // combine the two 32-bit values
    const number = littleEndian ? left + right * 2 ** 32 : 2 ** 32 * left + right;

    if (!Number.isSafeInteger(number)) {
      console.warn(number, 'exceeds MAX_SAFE_INTEGER.');
    }
    return number;
  },

  /* writeUInt64LE */
  write(byteOffset, value, littleEndian) {
    return this.setBigUint64(byteOffset, BigInt(value), littleEndian);
  },
};

/**
 * A 32 Bit Floating Point Number
 */
export const f32: NumberType = {
  byteLength: 4,
  read: DataView.prototype.getFloat32,
  write: DataView.prototype.setFloat32,
};

/**
 * A 64 Bit Floating Point Number
 */
export const f64: NumberType = {
  byteLength: 8,
  read: DataView.prototype.getFloat64,
  write: DataView.prototype.setFloat64,
};
