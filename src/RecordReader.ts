import { NumberType, u8, u16, u32, u64, f32, f64 } from "./Const";
import { BufferReader } from "./BufferReader";
import * as debug from "./Debug";

export const enum ErrorCode {
  SizeError,
  UnknownRecordType,
  UnknownSignatureType
}

export class RecordError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = "An error occured while parsing"
  ) {
    super(message);
    Object.setPrototypeOf(this, RecordError.prototype);
  }
}

export class RecordReader extends BufferReader {
  constructor(buffer: Buffer, byteOffset: number = 0) {
    super(buffer, byteOffset);
  }

  public decodeData(type: NumberType): number {
    const size = this.read(u8);
    if (verifyNumber(type, size)) return this.read(type);
    throw new RecordError(ErrorCode.SizeError);
  }

  public skipField(): void {
    const size = this.read(u8);
    if (size === 1 || size === 2 || size === 4 || size === 8) {
      this.advance(size);
    } else {
      throw new RecordError(ErrorCode.SizeError);
    }
  }

  public decodeUnknown(signature: number): number {
    const size = this.read(u8);
    let data: number;
    switch (size) {
      case 1:
        data = this.read(u8);
        break;
      case 2:
        data = this.read(u16);
        break;
      case 4:
        data = this.read(u32);
        break;
      case 8:
        data = this.read(u64);
        break;
      default:
        const msg = `Unknown field data size ${size}`;
        throw new RecordError(ErrorCode.SizeError, msg);
    }
    debug.log(`Signature 0x${signature.toString(16)}: ${data}`);
    return data;
  }
}

export function verifyNumber(type: NumberType, size: number): boolean {
  switch (type) {
    case u8:
      if (size === 1) return true;
      break;
    case u16:
      if (size === 2) return true;
      break;
    case u32:
    case f32:
      if (size === 4) return true;
      break;
    case u64:
    case f64:
      if (size === 8) return true;
      break;
  }
  return false;
}
