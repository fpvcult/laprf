import { NumberType, u8, u16, u32, u64, f32, f64 } from "./Const";

export class BufferReader {
  constructor(private buffer: Buffer, private byteOffset: number = 0) {}

  public get cursor(): number {
    return this.buffer.readUInt8(this.byteOffset);
  }

  public advance(byteLength: number) {
    this.byteOffset += byteLength;
    if (!(this.byteOffset < this.buffer.length)) {
      throw new RangeError("Attempt to advance beyond buffer range");
    }
  }

  public read(type: number): number {
    let result: number;
    switch (type) {
      case u8:
        result = this.buffer.readUInt8(this.byteOffset);
        this.byteOffset += 1;
        break;
      case u16:
        result = this.buffer.readUInt16LE(this.byteOffset);
        this.byteOffset += 2;
        break;
      case u32:
        result = this.buffer.readInt32LE(this.byteOffset);
        this.byteOffset += 4;
        break;
      case f32:
        result = this.buffer.readFloatLE(this.byteOffset);
        this.byteOffset += 4;
        break;
      case u64: // TODO: Consider using BigInt
        const left = this.buffer.readUInt32LE(0);
        const right = this.buffer.readUInt32LE(4);
        const number = left + right * 2 ** 32; // combine the two 32-bit values
        if (!Number.isSafeInteger(number)) {
          console.warn(number, "exceeds MAX_SAFE_INTEGER.");
        }
        result = number;
        this.byteOffset += 8;
        break;
      case f64:
        result = this.buffer.readDoubleLE(this.byteOffset);
        this.byteOffset += 8;
        break;
    }
    return result;
  }
}
