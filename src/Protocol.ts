import type { DeviceRecord, SetSlotInput } from './types';
import { Encoder } from './Encoder';
import { Decoder } from './Decoder';
import { Frequency } from './Frequency';
import { u8, u16, u32, f32 } from './Numbers';
import { RecordType, RfSetupField, SettingsField, TimeField, ErrorCode } from './const';
import { splitRecords } from './helpers';

export class Protocol {
  static DEBUG = false;

  /**
   * Serialize a LapRF packet to request the `rtcTime`.
   *
   * Requesting `rtcTime' requires an irregular packet.
   * @static
   * @returns {Uint8Array} An encoded packet to request `rtcTime'.
   */
  static getRtcTime(): Uint8Array {
    return new Encoder(RecordType.time)
      .write(u8, TimeField.rtcTime) // `rtcTime`
      .write(u8, 0x00)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to get the `minLapTime`.
   * @returns {Uint8Array} An encoded packet to request `minLapTime'.
   */
  static getMinLapTime(): Uint8Array {
    return new Encoder(RecordType.settings)
      .encodeField(SettingsField.minLapTime, u32, 0x00)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to set the `minLapTime`.
   * @param {number} milliseconds The number of milliseconds to set as the minimum lap time.
   * @returns {Uint8Array} An encoded packet to set `minLapTime'.
   */
  static setMinLapTime(milliseconds: number): Uint8Array {
    return new Encoder(RecordType.settings)
      .encodeField(SettingsField.minLapTime, u32, milliseconds)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to request the `rfSetup`.
   * @param {number} [slotIndex] Optionally request only a single slot.
   * @returns {Uint8Array} An encoded packet to request `rfSetup'.
   */
  static getRfSetup(slotIndex?: number): Uint8Array {
    const record = new Encoder(RecordType.rfSetup);
    if (typeof slotIndex === 'number') {
      record.encodeField(RfSetupField.slotIndex, u8, slotIndex);
    } else {
      for (let i = 1; i <= 8; i++) {
        record.encodeField(RfSetupField.slotIndex, u8, i);
      }
    }
    return record.finishRecord();
  }

  /**
   * Serialize a LapRF packet to set a `rfSetup` slot.
   * @param {SetSlotInput} settings The options to configure the slot.
   * @returns {Uint8Array} An encoded packet to set a `rfSetup' slot.
   */
  static setRfSetup({
    slotId,
    channelName,
    gain = 51,
    threshold = 900,
    enabled = true,
  }: SetSlotInput): Uint8Array {
    const channel = Frequency.get(channelName);

    if (!channel) {
      throw new Error(`[LapRF Error] ${ErrorCode.InvalidChannelName}`);
    }

    return new Encoder(RecordType.rfSetup)
      .encodeField(RfSetupField.slotIndex, u8, slotId)
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
   * @param {ArrayBuffer} buffer The raw LapRF packet to deserialize.
   * @returns {DeviceRecord[]} The deserialized records.
   */
  static decode(buffer: ArrayBuffer): DeviceRecord[] {
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
}
