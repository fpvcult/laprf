import { Transform, TransformOptions } from "stream";

import {
  u8,
  u16,
  SOR,
  EOR,
  ESC,
  ESC_OFFSET,
  ErrorCode,
  RecordType,
  IField
} from "./Const";
import { LapRFError, Crc } from "./Util";
import { RecordReader } from "./RecordReader";
import { lookup, isFieldDescriptor } from "./Signature";

import * as Debug from "./Debug";

interface IUnescapedRecord {
  record: Buffer;
  byteOffset: number;
}

export class Unescape extends Transform {
  private recordCount: number = 0;
  private packetCount: number = 0;

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(raw: Buffer, encoding: BufferEncoding, done: Function) {
    let packet = Buffer.isBuffer(raw) ? raw : new Buffer(raw, encoding);
    let unescaped: IUnescapedRecord;
    let byteOffset = 0;
    Debug.log(`Raw Packet Length: ${packet.length}`);
    try {
      loop: while (true) {
        unescaped = this.collectRecord(packet, byteOffset);
        this.push(unescaped.record);
        byteOffset = unescaped.byteOffset;
        this.recordCount++;
        Debug.log(`Record Length: ${unescape.length}`);
        Debug.log(`Total Record Count: ${this.recordCount}`);
      }
    } catch (error) {
      switch (error.code) {
        case ErrorCode.MissingEOR:
          Debug.log("Never found EOR after finding SOR");
          break;
        case ErrorCode.MissingSOR:
          // The ethernet packets do not include more than one record
          // at a time. I don't know if the bluetooth LapRF will.
          break;
      }
    }
    this.packetCount++;
    Debug.log(`Total Packet Count: ${this.packetCount}`);
    done();
  }

  /**
   * Collect and unescape LapRF Record from `packet`
   * @param packet Raw data packet received from LapRF
   * @param byteOffset Current buffer offset
   */
  private collectRecord(packet: Buffer, byteOffset: number): IUnescapedRecord {
    let byte: number;
    let escaped: boolean = false;
    const record = [];

    let start = packet.indexOf(SOR, byteOffset);

    if (start > -1) {
      // Found the Start Of Record
      let byteOffset = start;
      let length = packet.length;
      for (; byteOffset < length; byteOffset++) {
        byte = packet.readUInt8(byteOffset);
        if (escaped) {
          escaped = false;
          record.push(byte - ESC_OFFSET);
        } else {
          switch (byte) {
            case EOR: // Found the End Of Record
              record.push(byte);
              byteOffset++;
              return { record: Buffer.from(record), byteOffset };
            case ESC:
              escaped = true;
              break;
            default:
              record.push(byte);
          }
        }
      }
      // Never found the End Of Record
      throw new LapRFError(ErrorCode.MissingEOR);
    }
    // Never found the Start Of Record
    throw new LapRFError(ErrorCode.MissingSOR);
  }
}

export class Verify extends Transform {
  private crcMismatchCount: number = 0;

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(record: Buffer, _encoding: BufferEncoding, done: Function) {
    if (record.length < 8) {
      done();
    }
    // SOR has already been found;
    const length = record.readInt16LE(1);
    Debug.log(`Record Length Entry: ${length}`);
    const crcRecord = record.readUInt16LE(3);
    record.writeUInt16LE(0, 3); // Zero the CRC before computing
    const crcComputed = Crc.compute(record);
    if (crcRecord === crcComputed) {
      Debug.log("CRC verified");
      Debug.log(`CRC mismatch count: ${this.crcMismatchCount}`);
      this.push(record);
      done();
    } else {
      this.crcMismatchCount++;
      Debug.log(`CRC mismatch  rx: ${crcRecord}  calc: ${crcComputed}`);
      done();
    }
  }
}

export class Decode extends Transform {
  constructor(options: TransformOptions = { objectMode: true }) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(raw: Buffer, _encoding: BufferEncoding, done: Function) {
    try {
      const fields: IField[] = [];
      const record = new RecordReader(raw, 5); // Begin before recordType field
      const recordType = record.read(u16);
      if (recordType in RecordType) {
        Debug.log(`RecordType: ${RecordType[recordType]}`);
        loop: while (true) {
          const signature = record.read(u8);
          if (signature === EOR) break loop;
          let descriptor = lookup(recordType, signature);
          if (isFieldDescriptor(descriptor)) {
            const { name, dataType } = descriptor;
            const data = record.decodeData(dataType);
            Debug.log(`${name}: ${data}`);
            fields.push({ type: name, data });
          } else {
            record.decodeUnknown(signature);
          }
        }
      } else {
        const message = `Unknown RecordType 0x${recordType.toString(16)}`;
        throw new LapRFError(ErrorCode.UnknownRecordType, message);
      }
      // TODO: Maybe stream JSON...
      // this.push(JSON.stringify({ type: RecordType[recordType], fields }));
      this.push({ type: RecordType[recordType], fields });
    } catch (error) {
      if (error instanceof RangeError) {
        // Hit the of the buffer unexpectedly
        Debug.warn(error.message);
      } else if (error instanceof LapRFError) {
        switch (error.code) {
          // Possibly handle the issues here.
          default:
            Debug.warn(error.message);
        }
      }
    }
    done();
  }
}
