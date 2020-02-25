import { NumberType } from '@bitmachina/binary';

export interface Data {
  type: NumberType;
  value: number;
}

export class Builder {
  private byteLength = 0;
  private data: Array<Data> = [];

  write(type: NumberType, value: number): Builder {
    this.data.push({ type, value });
    this.byteLength += type.byteLength;
    return this;
  }

  toBytes(): Array<number> {
    const bytes: Array<number> = [];
    const buffer = Buffer.alloc(8);

    for (let i = 0, len = this.data.length; i < len; i++) {
      const { type, value } = this.data[i];
      type.write.call(buffer, value, 0);
      for (let j = 0, len = type.byteLength; j < len; j++) {
        bytes.push(buffer.readUInt8(j));
      }
    }

    return bytes;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.byteLength);
    let byteOffset = 0;

    for (let i = 0, len = this.data.length; i < len; i++) {
      const { type, value } = this.data[i];
      type.write.call(buffer, value, byteOffset);
      byteOffset += type.byteLength;
    }

    return buffer;
  }
}
