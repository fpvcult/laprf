import { Binary, Schema, u8, u16 } from '@bitmachina/binary';
import { Record, RecordField } from './types.d';
import * as RecordType from './RecordType';
import * as Msg from './Msg';
import * as Crc from './Crc';
import { MAX_RECORD_LEN, SOR, EOR, ESC, ESC_OFFSET } from './const';

/**
 * A class to serialize/deserialize LapRF protocol packets.
 */
export default class Serial extends Binary {
  constructor() {
    super(MAX_RECORD_LEN * 8);
  }

  /**
   * Serialize an object implementing [[IRecord]] into a binary LapRF record.
   * @param record An object to serialize into a LapRF record.
   */
  encode(record: Record): Buffer {
    const schema = RecordType.get(record.type);

    if (schema !== undefined) {
      this.startRecord(schema.signature);
      encode(record.fields, this, schema);
      return this.finishRecord();
    }
    throw new Error(Msg.unknownRecordType(record.type));
  }

  /**
   * Deserialize a LapRF packet into an array of objects implementing [[IRecord]].
   * @param packet A packet received from a LapRF to deserialize.
   * @returns An array of JavaScript objects conforming to the IRecord interface.
   */
  decode(packet: Buffer): Record[] {
    const decoded: Record[] = [];

    try {
      const records = splitRecords(packet);

      for (let i = 0, len = records.length; i < len; i++) {
        this.unescape(records[i]); // Escaped contents are stored in the internal buffer

        if (verifyRecord(this.toBuffer())) {
          const length = this.byteOffset;
          this.byteOffset = 5; // Seek to the the record signature
          const signature = this.read(u16);
          const schema = RecordType.get(signature);

          if (schema !== undefined) {
            const fields: Array<RecordField> = [];
            const binaryFields = this.slice(this.byteOffset, length - 1);
            const success = decode(binaryFields, fields, schema);

            if (success) {
              decoded.push({ type: schema.name, fields });
            } else {
              console.warn(`Unable to decode record type '${schema.name}'`);
            }
          } else {
            console.warn(Msg.unknownRecordType(signature));
          }
        }
      }
    } catch (error) {
      if (error instanceof RangeError) {
        console.log('Something horrible went wrong!');
      } else {
        throw error;
      }
    }

    return decoded;
  }

  // TODO: Remove hard coded field signatures for `rctTime'
  requestRtcTime(): Buffer {
    this.startRecord(RecordType.Signature.time);
    this.write(u8, 0x02); // `rtcTime'
    this.write(u8, 0x00);
    return this.finishRecord();
  }

  // TODO: Requesting all slots is not working
  // TODO: Remove hard coded field signatures for `slotIndex'
  requestRfSetup(slotIndex?: number): Buffer {
    this.startRecord(RecordType.Signature.rfSetup);

    if (typeof slotIndex === 'number') {
      this.write(u8, 0x01); // `slotIndex'
      this.write(u8, slotIndex);
    } else {
      for (let i = 1; i <= 8; i++) {
        this.write(u8, 0x01); // `slotIndex'
        this.write(u8, i);
      }
    }

    return this.finishRecord();
  }

  /**
   * Initialize the serialization of a LapRF record.
   * @param recordType The [[RecordType]] of the record to initialize.
   */
  private startRecord(signature: number): void {
    this.byteOffset = 0; // Reset the internal buffer
    this.write(u8, SOR);
    this.write(u16, 0); // Length placeholder
    this.write(u16, 0); // CRC placeholder
    this.write(u16, signature);
  }

  /**
   * Finish the serialization of a LapRF record.
   * @returns A Buffer containing the completed, escaped record.
   */
  private finishRecord(): Buffer {
    this.write(u8, EOR);
    const length = this.byteOffset;
    const record = Buffer.from(this.toBuffer()); // Copy
    record.writeUInt16LE(length, 1);
    const crc = Crc.compute(record);
    record.writeUInt16LE(crc, 3);
    return this.escape(record);
  }

  /**
   * Escape a LapRF record.
   * @param record The record to escape.
   * @returns A buffer containing the escaped contents of the `record`.
   */
  private escape(record: Buffer): Buffer {
    let byte: number;
    this.byteOffset = 0; // Reset the buffer
    for (let i = 0, len = record.length; i < len; i++) {
      byte = record.readUInt8(i);
      if ((byte === ESC || byte === SOR || byte === EOR) && i !== 0 && i !== len - 1) {
        this.write(u8, ESC);
        this.write(u8, byte + ESC_OFFSET);
      } else {
        this.write(u8, byte);
      }
    }
    return Buffer.from(this.toBuffer());
  }

  /**
   * Unescaped a LapRF packet and store the contents in the internal buffer.
   * @param record Raw record received from a LapRF.
   */
  private unescape(record: Buffer): void {
    let byte: number;
    let escaped = false;
    this.byteOffset = 0; // Reset the buffer
    for (let i = 0, len = record.length; i < len; i++) {
      byte = record.readUInt8(i);
      if (escaped) {
        escaped = false;
        this.write(u8, byte - ESC_OFFSET);
      } else {
        switch (byte) {
          case EOR:
            this.write(u8, byte);
            return;
          case ESC:
            escaped = true;
            break;
          default:
            this.write(u8, byte);
        }
      }
    }
    throw new Error('Unable to unescape the record');
  }
}

function splitRecords(packet: Buffer): Buffer[] {
  const records: Buffer[] = [];
  let offset = 0;
  while (true) {
    const sor = packet.indexOf(SOR, offset);
    if (sor > -1) {
      offset = packet.indexOf(EOR, sor) + 1;
      if (offset > -1) {
        records.push(packet.slice(sor, offset));
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return records;
}

/**
 * Verify a LapRF record for length and perform a cyclic redundancy check (CRC).
 * WARNING: The `record` is modified in order to verify the CRC.
 * @param record A LapRF record to verify.
 * @returns Whether or not the `record` has been verified.
 */
function verifyRecord(record: Buffer): boolean {
  const length = record.readInt16LE(1);
  if (record.length !== length) console.warn('Record length mismatch');
  if (record.length < 8 || record.length > MAX_RECORD_LEN) return false;

  const crcRecord = record.readUInt16LE(3);
  record.writeUInt16LE(0, 3); // Must zero the CRC before computing
  const crcComputed = Crc.compute(record);

  if (crcRecord === crcComputed) {
    return true;
  }

  console.warn('CRC mismatch');
  return false;
}

/**
 * Encode an array of [[RecordFields]] into a binary LapRF record.
 * @param source Array of record field data to encode.
 * @param target Target to fill with binary data.
 * @param schema The record type schema to use to encode the data.
 */
function encode<T extends Binary>(source: Array<RecordField>, target: T, schema: Schema): void {
  for (let i = 0, len = source.length; i < len; i++) {
    const [name, data] = source[i];
    const fieldType = schema.get(name);
    if (fieldType !== undefined) {
      const { signature, type } = fieldType;
      target.write(u8, signature);
      target.write(u8, type.byteLength);
      target.write(type, data);
    } else {
      // console.warn(Msg.unknownFieldType(name));
      throw new Error(`Unknown field type '${name}'`);
    }
  }
}

/**
 * Decode a binary LapRF record into an array of [[RecordFields]].
 * @param source Binary LapRF record to decode.
 * @param target Target to fill with record fields.
 * @param schema The record type schema to use to decode the record.
 * @returns Whether or not decoding was successful.
 */
function decode<T extends Binary>(source: T, target: Array<RecordField>, schema: Schema): boolean {
  const { length } = source;

  while (source.byteOffset < length) {
    const signature = source.read(u8);
    const size = source.read(u8);
    const fieldType = schema.get(signature);
    if (fieldType !== undefined) {
      const { name, type } = fieldType;
      if (size === type.byteLength) {
        const data = source.read(type);
        target.push([name, data]);
      } else {
        console.warn(Msg.sizeMismatch(size, type));
        return false;
      }
    } else {
      console.warn(Msg.unknownFieldType(signature));
      return false;
    }
  }
  return true;
}
