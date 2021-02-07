import type { DeviceRecord, SetSlotInput } from './types';
import Encoder from './Encoder';
import Decoder from './Decoder';
import Frequency from './Frequency';
import { u8, u16, u32, f32 } from './NumberType';
import { RecordType, ErrorCode } from './const';
import { splitRecords } from './helpers';

export default class Protocol {
  static DEBUG = false;

  /**
   * Serialize a LapRF packet to request the `rtcTime`.
   * * Requesting `rtcTime' requires an irregular packet.
   * @returns {Uint8Array} An encoded packet to request `rtcTime'.
   */
  static getRctTime(): ArrayBuffer {
    return new Encoder(RecordType.time)
      .write(u8, 0x02) // `rtcTime`
      .write(u8, 0x00)
      .finishRecord();
  }

  /**
   * Serialize a LapRF packet to get the `minLapTime`.
   * @returns {Uint8Array} An encoded packet to request `minLapTime'.
   */
  static getMinLapTime(): ArrayBuffer {
    return new Encoder(RecordType.settings).encodeField(0x026, u32, 0x00).finishRecord();
  }

  /**
   * Serialize a LapRF packet to set the `minLapTime`.
   * @param {number} milliseconds The number of milliseconds to set as the minimum lap time.
   * @returns {Uint8Array} An encoded packet to set `minLapTime'.
   */
  static setMinLapTime(milliseconds: number): ArrayBuffer {
    return new Encoder(RecordType.settings).encodeField(0x26, u32, milliseconds).finishRecord();
  }

  /**
   * Serialize a LapRF packet to request the `rfSetup`.
   * @param {number} [slotIndex] Optionally request only a single slot.
   * @returns {Uint8Array} An encoded packet to request `rfSetup'.
   */
  static getRfSetup(slotIndex?: number): ArrayBuffer {
    const record = new Encoder(RecordType.rfSetup);
    if (typeof slotIndex === 'number') {
      record.encodeField(0x01, u8, slotIndex);
    } else {
      for (let i = 1; i <= 8; i++) {
        record.encodeField(0x01, u8, i);
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
  }: SetSlotInput): ArrayBuffer {
    const channel = Frequency.get(channelName);

    if (!channel) {
      throw new Error(`[LapRF Error] ${ErrorCode.InvalidChannelName}`);
    }

    return new Encoder(RecordType.rfSetup)
      .encodeField(0x01, u8, slotId)
      .encodeField(0x20, u16, enabled ? 1 : 0)
      .encodeField(0x21, u16, channel.channel)
      .encodeField(0x22, u16, channel.band)
      .encodeField(0x23, f32, threshold)
      .encodeField(0x24, u16, gain)
      .encodeField(0x25, u16, channel.frequency)
      .finishRecord();
  }

  static decode(buffer: ArrayBuffer): DeviceRecord[] {
    const records: DeviceRecord[] = [];
    const buffers = splitRecords(buffer);

    for (const buffer of buffers) {
      const record = new Decoder(buffer, Protocol.DEBUG).decode();
      if (record) records.push(record);
    }

    return records;
  }
}
