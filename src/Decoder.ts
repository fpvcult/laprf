import type {
  Maybe,
  SlotId,
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
  SLOT_IDS,
  RecordType,
  PassingField,
  StatusField,
  RfSetupField,
  RssiField,
  ErrorCode,
  SettingsField,
  TimeField,
} from './const';

export class Decoder {
  private view: DataView;
  private cursor: Cursor;

  /**
   * Initialize a decoder of of a LapRF record.
   * @param {number} signature The [[RecordType]] of the record to initialize.
   */
  constructor(private buffer: ArrayBuffer, private debug = false) {
    this.view = new DataView(buffer);
    this.cursor = new Cursor(this.view);
    this.cursor.LE = true;
  }

  /**
   * Deserialize a LapRF record.
   */
  decode(): Maybe<DeviceRecord> {
    this.cursor.position = 1; // Skip SOR byte

    const length = this.cursor.readUint16();

    if (this.buffer.byteLength !== length) {
      const msg = `Invalid record length of ${this.buffer.byteLength} expected ${length}`;
      panic(`${ErrorCode.InvalidRecord}, ${msg}`);
    }

    Crc.verify(this.view); // * Kind of hackish
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
          record.slotId = this.decodeUint8Field() as SlotId;
          break;
        case RfSetupField.enabled:
          record.enabled = this.decodeUint16Field();
          break;
        case RfSetupField.channel:
          record.channel = this.decodeUint16Field();
          break;
        case RfSetupField.band:
          record.band = this.decodeUint16Field();
          break;
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
          record.slotId = this.decodeUint8Field() as SlotId;
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
          record.slotId = this.decodeUint8Field() as SlotId;
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
    const slots = {} as Record<SlotId, { lastRssi: number }>;
    const length = this.cursor.view.byteLength;

    let slotId: Maybe<SlotId> = undefined;

    while (this.cursor.position < length) {
      const signature = this.cursor.readUint8();
      if (signature === EOR) break;

      switch (signature) {
        case StatusField.slotIndex:
          slotId = this.decodeUint8Field() as SlotId;
          break;
        case StatusField.flags:
          record.flags = this.decodeUint16Field();
          break;
        case StatusField.batteryVoltage:
          record.batteryVoltage = this.decodeUint16Field();
          break;
        case StatusField.lastRssi: {
          if (!isSlotId(slotId)) panic('Received `lastRssi` before a `slotId`');
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
    console.log(`[LapRF Warning] Unknown field signature 0x${t} in record type 0x${s}`);
  }
}

function panic(msg = 'An error occurred'): never {
  throw new Error(`[LapRF Error] ${msg}`);
}

function checkByteSize(expected: number, received: number): void {
  if (expected === received) return;
  panic(`byte size mismatch expected: ${expected}, received: ${received}`);
}

function isSlotId(value: unknown): value is SlotId {
  return typeof value === 'number' && SLOT_IDS.includes(value as SlotId);
}
