import type { SlotIndex, DeviceRecord, RfSetupSlotInput, Maybe } from './types';
import { Encoder } from './Encoder';
import { Decoder } from './Decoder';
import { Frequency } from './Frequency';
import { u8, u16, u32, f32 } from './Numbers';
import { RecordType, RfSetupField, SettingsField, TimeField, EOR, SOR } from './const';
import { splitRecords, unescape } from './helpers';

/**
 * The LapRF Protocol encoder and decoder.
 * @public
 */
export class Protocol {
  /**
   * Boolean to determine whether or not to print debug messages.
   */
  static DEBUG = false;

  /**
   * Start Of Record byte.
   */
  static readonly SOR = SOR;

  /**
   * End Of Record byte.
   */
  static readonly EOR = EOR;

  /**
   * Serialize a LapRF packet to request the `rtcTime`.
   *
   * Requesting `rtcTime` requires an irregular packet.
   * @returns An encoded packet to request `rtcTime`.
   */
  static getRtcTime(): Uint8Array {
    return new Encoder(RecordType.time)
      .write(u8, TimeField.rtcTime) // `rtcTime`
      .write(u8, 0x00)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to get the `minLapTime`.
   * @returns An encoded packet to request `minLapTime`.
   */
  static getMinLapTime(): Uint8Array {
    return new Encoder(RecordType.settings)
      .encodeField(SettingsField.minLapTime, u32, 0x00)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to set the `minLapTime`.
   * @param milliseconds - The number of milliseconds to set as the minimum lap time.
   * @returns An encoded packet to set `minLapTime`.
   */
  static setMinLapTime(milliseconds: number): Uint8Array {
    return new Encoder(RecordType.settings)
      .encodeField(SettingsField.minLapTime, u32, milliseconds)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to get the `statusInterval`.
   * @remarks
   * ISSUE: Requesting the status interval does not work.
   * @returns An encoded packet to request `statusInterval`.
   */
  // static getStatusInterval(): Uint8Array {
  //   return new Encoder(RecordType.settings)
  //     .encodeField(SettingsField.statusInterval, u16, 0x00)
  //     .finishRecord();
  // }

  /**
   * Serialize a LapRF packet to set the `statusInterval`.
   * @param milliseconds - The number of milliseconds to use as the status interval.
   * @returns An encoded packet to set `statusInterval`.
   */
  static setStatusInterval(milliseconds: number): Uint8Array {
    return new Encoder(RecordType.settings)
      .encodeField(SettingsField.statusInterval, u16, milliseconds)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to request the `rfSetup`.
   * @param slotId - Optionally request only a single slot.
   * @returns An encoded packet to request `rfSetup`.
   */
  static getRfSetup(slotId?: SlotIndex): Uint8Array {
    const record = new Encoder(RecordType.rfSetup);
    if (typeof slotId === 'number') {
      record.encodeField(RfSetupField.slotIndex, u8, slotId);
    } else {
      for (let i = 1; i <= 8; i++) {
        record.encodeField(RfSetupField.slotIndex, u8, i);
      }
    }
    return record.finishRecord();
  }

  /**
   * Serialize a LapRF packet to set a `rfSetup` slot.
   * @param settings - The options to configure the slot.
   * @returns An encoded packet to set a `rfSetup` slot.
   */
  static setRfSetup({
    slotIndex,
    band: bandIndex,
    channel: channelIndex,
    gain,
    threshold,
    enabled,
  }: RfSetupSlotInput): Uint8Array {
    const channel = Frequency.getByIndexes(bandIndex, channelIndex);

    return new Encoder(RecordType.rfSetup)
      .encodeField(RfSetupField.slotIndex, u8, slotIndex)
      .encodeField(RfSetupField.enabled, u16, enabled ? 1 : 0)
      .encodeField(RfSetupField.channel, u16, channel.channel)
      .encodeField(RfSetupField.band, u16, channel.band)
      .encodeField(RfSetupField.threshold, f32, threshold)
      .encodeField(RfSetupField.gain, u16, gain)
      .encodeField(RfSetupField.frequency, u16, channel.frequency)
      .finishRecord();
  }

  /**
   * Deserialize a LapRF Packet.
   * @param buffer - The raw LapRF packet to deserialize.
   * @returns The deserialized records.
   */
  static decode(buffer: DataView): DeviceRecord[] {
    const records: DeviceRecord[] = [];
    const buffers = splitRecords(buffer);

    for (const buffer of buffers) {
      try {
        const record = new Decoder(buffer, Protocol.DEBUG).decode();
        if (record) records.push(record);
      } catch (error) {
        if (Protocol.DEBUG) {
          console.error(error);
        }
      }
    }

    return records;
  }

  /**
   * Deserialize a LapRF record.
   * @param buffer - An unescaped LapRF record to deserialize.
   * @returns The deserialized record or undefined.
   */
  static decodeRecord(buffer: DataView): Maybe<DeviceRecord> {
    return new Decoder(buffer, Protocol.DEBUG).decode();
  }

  /**
   * Unescaped a LapRF record.
   * @param input - Raw record received from a LapRF.
   * @returns The `input` with content unescaped.
   */
  static unescape(input: Uint8Array): DataView {
    return unescape(input);
  }
}
