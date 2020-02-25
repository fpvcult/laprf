import { Binary, NumberType, u8, u16, u32, f32, u64 } from '@bitmachina/binary';

import {
  TimerEvent,
  RfSetupEvent,
  SettingsEvent,
  PassingEvent,
  StatusEvent,
  TimeEvent,
} from './types.d';
import { Schema } from './Schema';
import { Builder } from './Builder';
import { RecordType, ErrorCode, SOR, EOR, ESC, ESC_OFFSET } from './const';
import * as Crc from './Crc';
import * as Debug from './Debug';
import { DecodeError } from './Util';

const rfSetup = new Schema<RfSetupEvent>({
  type: 'rfSetup',
  slotIndex: [0x01, u8],
  enabled: [0x20, u16],
  channel: [0x21, u16],
  band: [0x22, u16],
  threshold: [0x23, f32],
  gain: [0x24, u16],
  frequency: [0x25, u16],
});

const settings = new Schema<SettingsEvent>({
  type: 'settings',
  updatePeriod: [0x22, u16],
  saveSettings: [0x25, u8],
  minLapTime: [0x26, u32],
});

const passing = new Schema<PassingEvent>({
  type: 'passing',
  slotIndex: [0x01, u8],
  rtcTime: [0x02, u64],
  decoderId: [0x20, u32],
  passingNumber: [0x21, u32],
  peakHeight: [0x22, u16],
  flags: [0x23, u16],
});

const status = new Schema<StatusEvent>({
  type: 'status',
  flags: [0x03, u16],
  batteryVoltage: [0x21, u16],
  gateState: [0x23, u8],
  detectionCount: [0x24, u32],
  slots: {
    slotIndex: [0x01, u8],
    lastRssi: [0x22, f32],
  },
});

const time = new Schema<TimeEvent>({
  type: 'time',
  rtcTime: [0x02, u64],
  timeRtcTime: [0x20, u64],
});

/**
 * Decode a LapRF packet.
 * @param {Buffer} buffer The LapRF packet to decode.
 * @returns {TimerEvent[]} The decoded `TimerEvents`.
 */
export function decode(buffer: Buffer): Array<TimerEvent> {
  const timerEvents: Array<TimerEvent> = [];

  const buffers = splitRecords(buffer);

  for (let i = 0, len = buffers.length; i < len; i++) {
    try {
      const record = unescape(buffers[i]);
      const length = record.readInt16LE(1);

      if (record.length !== length) {
        const msg = `Invalid record length of ${record.length} expected ${length}`;
        throw new DecodeError(ErrorCode.InvalidRecord, msg);
      }

      if (record.length < 8) {
        const msg = `Invalid record length of ${record.length}`;
        throw new DecodeError(ErrorCode.InvalidRecord, msg);
      }

      Debug.log(`Record Length Entry: ${length}`);

      const timerEvent = decodeRecord(Crc.verify(record));

      timerEvents.push(timerEvent);
    } catch (error) {
      if (error instanceof RangeError) {
        throw new DecodeError(ErrorCode.RangeError);
      } else if (error instanceof DecodeError) {
        Debug.error(`Error ${error.code}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  return timerEvents;
}

/**
 * Initialize the serialization of a LapRF record.
 * @param {number} signature The [[RecordType]] of the record to initialize.
 * @returns {Builder} A buffer builder.
 */
export function startRecord(signature: number): Builder {
  return new Builder()
    .write(u8, SOR)
    .write(u16, 0) // Length placeholder
    .write(u16, 0) // CRC placeholder
    .write(u16, signature);
}

/**
 * Finish the serialization of a LapRF record.
 * @param {Builder} record
 * @returns {Buffer} A Buffer containing the completed, escaped record.
 */
export function finishRecord(record: Builder): Buffer {
  record.write(u8, EOR);
  const buffer = record.toBuffer();
  const length = buffer.byteLength;
  buffer.writeUInt16LE(length, 1);
  buffer.writeUInt16LE(Crc.compute(buffer), 3);
  return escape(buffer);
}

/**
 * Escape a LapRF record.
 * @param {Buffer} record The record to escape.
 * @returns {Buffer} The `record` with content escaped.
 */
export function escape(record: Buffer): Buffer {
  const bytes: Array<number> = [];

  let byte: number;

  for (let i = 0, len = record.length; i < len; i++) {
    byte = record.readUInt8(i);
    if ((byte === ESC || byte === SOR || byte === EOR) && i !== 0 && i !== len - 1) {
      bytes.push(ESC);
      bytes.push(byte + ESC_OFFSET);
    } else {
      bytes.push(byte);
    }
  }

  return Buffer.from(bytes);
}

/**
 * Unescaped a LapRF packet.
 * @param {Buffer} record Raw record received from a LapRF.
 * @returns {Buffer} The `record` with content unescaped.
 */
export function unescape(record: Buffer): Buffer {
  const bytes: Array<number> = [];

  let byte: number;
  let escaped = false;

  for (let i = 0, len = record.length; i < len; i++) {
    byte = record.readUInt8(i);
    if (escaped) {
      escaped = false;
      bytes.push(byte - ESC_OFFSET);
    } else {
      switch (byte) {
        case EOR:
          bytes.push(byte);
          return Buffer.from(bytes);
        case ESC:
          escaped = true;
          break;
        default:
          bytes.push(byte);
      }
    }
  }

  throw new DecodeError(ErrorCode.InvalidRecord, 'Failed to unescape record');
}

/**
 * Encode a LapRF record field.
 * @param {Builder} record The record on to which to insert the field.
 * @param {number} signature The field signature.
 * @param {NumberType} type The `NumberType` of `value`
 * @param {number} value The field data.
 * @returns {undefined}
 */
export function encodeField(
  record: Builder,
  signature: number,
  type: NumberType,
  value: number
): void {
  record.write(u8, signature);
  record.write(u8, type.byteLength);
  record.write(type, value);
}

/**
 * Decode a LapRF record.
 * @param {Buffer} buffer The LapRF record to decode.
 * @returns {TimerEvent} The decoded `TimerEvent`.
 */
function decodeRecord(buffer: Buffer): TimerEvent {
  const recordType = buffer.readUInt16LE(5);
  const record = new Binary(buffer, 7); // Begin after record type field

  switch (recordType) {
    case RecordType.error:
      throw new DecodeError(ErrorCode.DeviceError);
    case RecordType.descriptor:
      // Record Type: 0xda08, Unknown Signature: 0x20, Size: 4
      // Record Type: 0xda08, Unknown Signature: 0x21, Size: 1
      throw new DecodeError(ErrorCode.UnknownRecordType);
    case RecordType.passing:
      return passing.decode(record);
    case RecordType.rfSetup:
      return rfSetup.decode(record);
    case RecordType.settings:
      return settings.decode(record);
    case RecordType.status:
      return status.decode(record);
    case RecordType.time:
      return time.decode(record);
    default: {
      const msg = `Unknown RecordType 0x${recordType.toString(16)}`;
      if (Debug.isWarning()) {
        console.warn(msg);
        decodeUnknown(record);
      }
      throw new DecodeError(ErrorCode.UnknownRecordType, msg);
    }
  }
}

/**
 * Split a LapRF packet into individual records.
 * @param {Buffer} packet An unescaped packet.
 * @returns {Buffer[]} The records contained in the `packet`.
 */
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

function decodeRawUInt(source: Binary): number | undefined {
  const size = source.read(u8);
  switch (size) {
    case 1:
      return source.read(u8);
    case 2:
      return source.read(u16);
    case 4:
      return source.read(u32);
    case 8:
      return source.read(u64);
    default:
      return undefined;
  }
}

function decodeUnknown(source: Binary): void {
  loop: while (true) {
    const signature = source.read(u8);
    if (signature === EOR) break loop;
    const result = decodeRawUInt(source);
    if (result !== undefined) {
      console.warn(`  Signature 0x${signature.toString(16)}: ${result}`);
    } else {
      console.error('Size mismatch while decoding unknown record type');
      break loop;
    }
  }
}
