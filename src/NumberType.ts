interface ReadNumber {
  (this: DataView, byteOffset: number, littleEndian?: boolean): number;
}

interface WriteNumber {
  (this: DataView, byteOffset: number, value: number, littleEndian?: boolean): void;
}

export type ByteLength = 1 | 2 | 4 | 8;

/**
 * An interface to help build serial protocol schemas.
 */
export interface NumberType {
  readonly byteLength: ByteLength;
  readonly read: ReadNumber;
  readonly write: WriteNumber;
}

/**
 * An Unsigned 8 Bit Integer
 */
export const u8: NumberType = {
  byteLength: 1,
  read: DataView.prototype.getUint8,
  write: DataView.prototype.setUint8,
};

/**
 * An Signed 8 Bit Integer
 */
export const i8: NumberType = {
  byteLength: 1,
  read: DataView.prototype.getInt8,
  write: DataView.prototype.setInt8,
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
 * An Signed 16 Bit Integer
 */
export const i16: NumberType = {
  byteLength: 2,
  read: DataView.prototype.getInt16,
  write: DataView.prototype.setInt16,
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
 * An Signed 32 Bit Integer
 */
export const i32: NumberType = {
  byteLength: 4,
  read: DataView.prototype.getInt32,
  write: DataView.prototype.setInt32,
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
      console.warn(number, "exceeds MAX_SAFE_INTEGER.");
    }
    return number;
  },

  /* writeUInt64LE */
  write(byteOffset, value, littleEndian) {
    return this.setBigUint64(byteOffset, BigInt(value), littleEndian);
  },
};

/**
 * An Signed 64 Bit Integer
 *
 * Consider using BigInt.
 */
export const i64: NumberType = {
  byteLength: 8,

  /* readUInt64LE */
  read(byteOffset, littleEndian) {
    return Number(this.getBigInt64(byteOffset, littleEndian));
  },

  /* writeUInt64LE */
  write(byteOffset, value, littleEndian) {
    return this.setBigInt64(byteOffset, BigInt(value), littleEndian);
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
