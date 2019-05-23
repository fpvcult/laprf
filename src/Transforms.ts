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

import { Transform, TransformOptions } from "stream";

import { u8, u16, u32, u64, Binary } from "./Binary";
import {
  SOR,
  EOR,
  ESC,
  ESC_OFFSET,
  ErrorCode,
  RecordType,
  IField,
  MAX_RECORD_LEN
} from "./Const";
import { LapRFError, Crc, readRaw } from "./Util";
import { lookup, isFieldDescriptor } from "./Signature";

import * as Debug from "./Debug";
import { sign } from "crypto";

interface IUnpackagedRecord {
  record: Buffer;
  byteOffset: number;
}

/**
 * Split packets received from a LapRF into individual unescaped records.
 */
export class Unpackage extends Transform {
  /**
   * A reusable buffer for assembling seperated, unescaped LapRF records.
   *
   * NOTE: Probably way more than necessary... but its only 8kB
   */
  private buffer = new Binary(MAX_RECORD_LEN * 8);
  private recordCount: number = 0;
  private packetCount: number = 0;

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(raw: Buffer, encoding: BufferEncoding, done: Function) {
    let packet = Buffer.isBuffer(raw) ? raw : new Buffer(raw, encoding);
    let unescaped: IUnpackagedRecord;
    let byteOffset = 0;
    Debug.log(`Raw Packet Length: ${packet.length}`);
    try {
      loop: while (true) {
        unescaped = this.collectRecord(packet, byteOffset);
        this.push(unescaped.record); // Push each unpackaged record
        byteOffset = unescaped.byteOffset;
        this.recordCount++;
        Debug.log(`Record Length: ${unescaped.record.length}`);
        Debug.log(`Total Record Count: ${this.recordCount}`);
      }
    } catch (error) {
      switch (error.code) {
        case ErrorCode.MissingEOR:
          Debug.warn("Never found EOR after finding SOR");
          break;
        case ErrorCode.MissingSOR:
          if (byteOffset === 0) {
            Debug.warn("Received a packet with no record");
          }
          // Else the all of the records have been collected from the packet.
          // The error was just to break out of the `loop`.
          break;
      }
    }
    this.packetCount++;
    Debug.log(`Total Packet Count: ${this.packetCount}`);
    done();
  }

  /**
   * Collect and unescape a LapRF Record from `packet`
   * @param packet Raw data packet received from a LapRF.
   * @param byteOffset Current offset within  the raw `packet`.
   */
  private collectRecord(packet: Buffer, byteOffset: number): IUnpackagedRecord {
    let byte: number;
    let escaped: boolean = false;
    byteOffset = packet.indexOf(SOR, byteOffset); // Find the Start Of Record
    this.buffer.byteOffset = 0; // Reset the record building buffer

    if (byteOffset > -1) {
      // Found the Start Of Record
      for (let len = packet.length; byteOffset < len; byteOffset++) {
        byte = packet.readUInt8(byteOffset);
        if (escaped) {
          escaped = false;
          this.buffer.write(u8, byte - ESC_OFFSET);
        } else {
          switch (byte) {
            case EOR: // Found the End Of Record
              this.buffer.write(u8, byte);
              byteOffset++;
              return { record: Buffer.from(this.buffer.raw), byteOffset };
            case ESC:
              escaped = true;
              break;
            default:
              this.buffer.write(u8, byte);
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

/**
 * Package a chunk of records into a packet to be sent to a LapRF.
 */
export class Package extends Transform {
  /**
   * Reusable buffer used to build an escaped LapRF packet.
   *
   * NOTE: Probably way more than necessary... but its only 8kB
   */
  private buffer = Buffer.alloc(MAX_RECORD_LEN * 8);

  constructor(options: TransformOptions = {}) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, done: Function) {
    let byte: number;
    let byteOffset = 0;
    for (let i = 0, len = chunk.length; i < len; i++) {
      byte = chunk.readUInt8(i);
      if (
        (byte === ESC || byte === SOR || byte === EOR) &&
        i !== 0 &&
        i !== len - 1
      ) {
        this.buffer.writeUInt8(ESC, byteOffset++);
        this.buffer.writeUInt8(byte + ESC_OFFSET, byteOffset++);
      } else {
        this.buffer.writeUInt8(byte, byteOffset++);
      }
    }
    // TODO: Figure out if it is acceptable to push a view of the buffer instead of a copy.
    this.push(Buffer.from(this.buffer.slice(0, byteOffset)));
    done();
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
    Debug.log(`Record Length Field: ${length}`);
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
      Debug.warn(`CRC mismatch  rx: ${crcRecord}  calc: ${crcComputed}`);
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
      const binary = new Binary(raw, 5); // Begin before recordType field
      const recordType = binary.read(u16);
      if (recordType in RecordType) {
        Debug.log(`RecordType: ${RecordType[recordType]}`);
        loop: while (true) {
          const signature = binary.read(u8);
          if (signature === EOR) break loop;
          const size = binary.read(u8);
          let descriptor = lookup(recordType, signature);
          if (isFieldDescriptor(descriptor)) {
            const { name, numberType } = descriptor;
            if (numberType.byteLength === size) {
              const data = binary.read(numberType);
              Debug.log(`${name}: ${data}`);
              fields.push({ type: name, data });
            } else {
              throw new LapRFError(
                ErrorCode.SizeError,
                `[0x${recordType} 0x${signature}] Unrecognized size field: ${size}`
              );
            }
          } else {
            let data = readRaw(binary, size);
            if (typeof data === "string") {
              const r = recordType.toString(16);
              const s = signature.toString(16);
              throw new LapRFError(
                ErrorCode.SizeError,
                `[0x${r}] Unrecognized signature 0x${s}, ${data}`
              );
            }
            Debug.log(
              `Unrecognized Signature 0x${signature.toString(16)}: ${data}`
            );
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
          // Possibly handle the issues here...
          default:
            Debug.warn(error.message);
        }
      }
    }
    done();
  }
}
