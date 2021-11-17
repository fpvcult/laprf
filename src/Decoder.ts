import type {
  Maybe,
  SlotIndex,
  BandIndex,
  ChannelIndex,
  DeviceRecord,
  RfSetupRecord,
  RssiRecord,
  SettingsRecord,
  PassingRecord,
  StatusRecord,
  TimeRecord,
} from './types';
import Cursor from './Cursor';
import * as Crc from './Crc';
import {
  EOR,
  SLOT_INDEXES,
  BAND_INDEXES,
  CHANNEL_INDEXES,
  RecordType,
  PassingField,
  StatusField,
  RfSetupField,
  RssiField,
  SettingsField,
  TimeField,
} from './const';
import { isUint8Array, isDataView } from './helpers';

export class Decoder {
  private cursor: Cursor;

  /**
   * Initialize a decoder of of a LapRF record.
   * @param buffer - The byte array of the record to decode.
   * @param debug Log debug information.
   */
  constructor(buffer: ArrayBuffer | Uint8Array | DataView, private debug = false) {
    if (isUint8Array(buffer)) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      this.cursor = new Cursor(view);
    } else if (isDataView(buffer)) {
      this.cursor = new Cursor(buffer);
    } else {
      this.cursor = new Cursor(new DataView(buffer));
    }
    this.cursor.LE = true;
  }

  /**
   * Deserialize a LapRF record.
   * @returns Maybe a DeviceRecord.
   */
  decode(): Maybe<DeviceRecord> {
    this.cursor.position = 1; // Skip SOR byte

    const length = this.cursor.readUint16();

    if (this.cursor.byteLength !== length) {
      panic(`Invalid record length of ${this.cursor.byteLength} expected ${length}`);
    }

    Crc.verify(this.cursor.view); // * Kind of hackish
    this.cursor.skip(2); // Skip CRC uint16

    const type = this.cursor.readUint16();

    switch (type) {
      case RecordType.error:
        panic('Received device error message');
        break;
      case RecordType.rfSetup:
        return this.decodeRfSetupRecord();
      case RecordType.rssi:
        return this.decodeRssiRecord();
      case RecordType.passing:
        return this.decodePassingRecord();
      case RecordType.settings:
        return this.decodeSettingsRecord();
      case RecordType.status:
        return this.decodeStatusRecord();
      case RecordType.time:
        return this.decodeTimeRecord();
      // case RecordType.descriptor:
      // Record Type: 0xda08, Unknown Signature: 0x20, Size: 4
      // Record Type: 0xda08, Unknown Signature: 0x21, Size: 1
      default:
        return undefined;
    }
  }

  private decodeRfSetupRecord(): RfSetupRecord {
    const record: Partial<RfSetupRecord> = { type: 'rfSetup' };
    const length = this.cursor.view.byteLength;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case RfSetupField.slotIndex:
          record.slotIndex = this.decodeUint8Field() as SlotIndex;
          break;
        case RfSetupField.enabled:
          record.enabled = this.decodeUint16Field();
          break;
        case RfSetupField.channel: {
          const channel = this.decodeUint16Field() as ChannelIndex;
          if (CHANNEL_INDEXES.includes(channel)) {
            record.channel = channel;
          } else {
            throw new Error(`[LapRF] Invalid Record. Invalid rfSetup channel: ${channel}`);
          }
          break;
        }
        case RfSetupField.band: {
          const band = this.decodeUint16Field() as BandIndex;
          if (BAND_INDEXES.includes(band)) {
            record.band = band;
          } else {
            throw new Error(`[LapRF] Invalid Record. Invalid rfSetup band: ${band}`);
          }
          break;
        }
        case RfSetupField.threshold:
          record.threshold = this.decodeFloat32Field();
          break;
        case RfSetupField.gain:
          record.gain = this.decodeUint16Field();
          break;
        case RfSetupField.frequency:
          record.frequency = this.decodeUint16Field();
          break;
        default: {
          this.handleUnknown(RecordType.rfSetup, signature);
        }
      }
    }

    return record as RfSetupRecord;
  }

  private decodeRssiRecord(): RssiRecord {
    const record: Partial<RssiRecord> = { type: 'rssi' };
    const length = this.cursor.view.byteLength;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case RssiField.slotIndex:
          record.slotIndex = this.decodeUint8Field() as SlotIndex;
          break;
        case RssiField.minRssi:
          record.minRssi = this.decodeFloat32Field();
          break;
        case RssiField.maxRssi:
          record.maxRssi = this.decodeFloat32Field();
          break;
        case RssiField.meanRssi:
          record.meanRssi = this.decodeFloat32Field();
          break;
        default: {
          this.handleUnknown(RecordType.rfSetup, signature);
        }
      }
    }

    return record as RssiRecord;
  }

  private decodeSettingsRecord(): SettingsRecord {
    const record: Partial<SettingsRecord> = { type: 'settings' };
    const length = this.cursor.view.byteLength;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case SettingsField.statusInterval:
          record.updatePeriod = this.decodeUint16Field();
          break;
        case SettingsField.saveSettings:
          record.saveSettings = this.decodeUint8Field();
          break;
        case SettingsField.minLapTime:
          record.minLapTime = this.decodeUint32Field();
          break;
        default:
          this.handleUnknown(RecordType.settings, signature);
      }
    }

    return record as SettingsRecord;
  }

  private decodePassingRecord(): PassingRecord {
    const record: Partial<PassingRecord> = { type: 'passing' };
    const length = this.cursor.view.byteLength;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case PassingField.slotIndex:
          record.slotIndex = this.decodeUint8Field() as SlotIndex;
          break;
        case PassingField.rtcTime:
          record.rtcTime = this.decodeUint64Field();
          break;
        case PassingField.decoderId:
          record.decoderId = this.decodeUint32Field();
          break;
        case PassingField.passingNumber:
          record.passingNumber = this.decodeUint32Field();
          break;
        case PassingField.peakHeight:
          record.peakHeight = this.decodeUint16Field();
          break;
        case PassingField.flags:
          record.flags = this.decodeUint16Field();
          break;
        default:
          this.handleUnknown(RecordType.passing, signature);
      }
    }

    return record as PassingRecord;
  }

  private decodeStatusRecord(): StatusRecord {
    const record: Partial<StatusRecord> = { type: 'status' };
    const slots = {} as Record<SlotIndex, { lastRssi: number }>;
    const length = this.cursor.byteLength;

    let slotId: Maybe<SlotIndex> = undefined;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case StatusField.slotIndex:
          slotId = this.decodeUint8Field() as SlotIndex;
          break;
        case StatusField.flags:
          record.flags = this.decodeUint16Field();
          break;
        case StatusField.batteryVoltage:
          record.batteryVoltage = this.decodeUint16Field();
          break;
        case StatusField.lastRssi: {
          if (!isSlotIndex(slotId)) panic('Received `lastRssi` before a `slotId`');
          slots[slotId] = { lastRssi: this.decodeFloat32Field() };
          slotId = undefined;
          break;
        }
        case StatusField.gateState:
          record.gateState = this.decodeUint8Field();
          break;
        case StatusField.detectionCount:
          record.detectionCount = this.decodeUint32Field();
          break;
        default:
          this.handleUnknown(RecordType.status, signature);
      }
    }

    return Object.assign(record, { slots }) as StatusRecord;
  }

  private decodeTimeRecord(): TimeRecord {
    const record: Partial<TimeRecord> = { type: 'time' };
    const length = this.cursor.view.byteLength;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;
      switch (signature) {
        case TimeField.rtcTime:
          record.rtcTime = this.decodeUint64Field();
          break;
        default:
          this.handleUnknown(RecordType.status, signature);
      }
    }

    return record as TimeRecord;
  }

  private decodeUint8Field(): number {
    const size = this.cursor.readUint8();
    checkByteSize(1, size);
    return this.cursor.readUint8();
  }

  private decodeUint16Field(): number {
    const size = this.cursor.readUint8();
    checkByteSize(2, size);
    return this.cursor.readUint16();
  }

  private decodeUint32Field(): number {
    const size = this.cursor.readUint8();
    checkByteSize(4, size);
    return this.cursor.readUint32();
  }

  private decodeUint64Field(): number {
    const size = this.cursor.readUint8();
    checkByteSize(8, size);
    return this.cursor.readUint64();
  }

  private decodeFloat32Field(): number {
    const size = this.cursor.readUint8();
    checkByteSize(4, size);
    return this.cursor.readFloat32();
  }

  // private decodeFloat64Field(): number {
  //   const size = this.cursor.readUint8();
  //   checkByteSize(8, size);
  //   return this.cursor.readFloat64();
  // }

  private handleUnknown(type: RecordType, signature: number) {
    this.cursor.skip(this.cursor.readUint8());
    if (!this.debug) return;
    const t = type.toString(16);
    const s = signature.toString(16);
    console.log(`[laprf-decoder] Unknown field signature 0x${t} in record type 0x${s}`);
  }
}

function panic(msg = 'An error occurred'): never {
  throw new Error(`[laprf-decoder] ${msg}`);
}

function checkByteSize(expected: number, received: number): void {
  if (expected === received) return;
  panic(`byte size mismatch expected: ${expected}, received: ${received}`);
}

function isSlotIndex(value: unknown): value is SlotIndex {
  return typeof value === 'number' && SLOT_INDEXES.includes(value as SlotIndex);
}
