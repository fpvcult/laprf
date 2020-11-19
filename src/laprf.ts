import { u8, u16, u32, f32 } from '@bitmachina/binary';
import { SetSlotInput } from './types.d';
import { RecordType, ErrorCode } from './const';
import * as Serial from './Serial';
import * as Frequency from './Frequency';
import { EncodeError } from './Util';

/**
 * Decode a LapRF packet.
 * @param {Buffer} buffer The LapRF packet to decode.
 * @returns {TimerEvent[]} The decoded `TimerEvents`.
 */
export const decode = Serial.decode;

/**
 * Lookup a fpv channel.
 */
export const lookupChannel = Frequency.get;

/**
 * Serialize a LapRF packet to request the `rtcTime`.
 * * Requesting `rtcTime' requires an irregular packet.
 * @returns {Buffer} An encoded packet to request `rtcTime'.
 */
export function getRtcTime(): Buffer {
  const record = Serial.startRecord(RecordType.time)
    .write(u8, 0x02) // `rtcTime'
    .write(u8, 0x00);
  return Serial.finishRecord(record);
}

/**
 * Serialize a LapRF packet to get the `minLapTime`.
 * @returns {Buffer} An encoded packet to request `minLapTime'.
 */
export function getMinLapTime(): Buffer {
  const record = Serial.startRecord(RecordType.settings);
  Serial.encodeField(record, 0x026, u32, 0x00);
  return Serial.finishRecord(record);
}

/**
 * Serialize a LapRF packet to set the `minLapTime`.
 * @param {number} milliseconds The number of milliseconds to set as the minimum lap time.
 * @returns {Buffer} An encoded packet to set `minLapTime'.
 */
export function setMinLapTime(milliseconds: number): Buffer {
  const record = Serial.startRecord(RecordType.settings);
  Serial.encodeField(record, 0x26, u32, milliseconds);
  return Serial.finishRecord(record);
}

/**
 * Serialize a LapRF packet to request the `rfSetup`.
 * @param {number} [slotIndex] Optionally request only a single slot.
 * @returns {Buffer} An encoded packet to request `rfSetup'.
 */
export function getRfSetup(slotIndex?: number): Buffer {
  const record = Serial.startRecord(RecordType.rfSetup);
  if (typeof slotIndex === 'number') {
    Serial.encodeField(record, 0x01, u8, slotIndex);
  } else {
    for (let i = 1; i <= 8; i++) {
      Serial.encodeField(record, 0x01, u8, i);
    }
  }
  return Serial.finishRecord(record);
}

/**
 * Serialize a LapRF packet to set a `rfSetup` slot.
 * @param {Object} settings The options to configure the slot.
 * @returns {Buffer} An encoded packet to set a `rfSetup' slot.
 */
export function setRfSetup({
  slotId,
  channelName,
  gain = 51,
  threshold = 900,
  enabled = true,
}: SetSlotInput): Buffer {
  const channel = Frequency.get(channelName);
  if (channel) {
    const record = Serial.startRecord(RecordType.rfSetup);
    Serial.encodeField(record, 0x01, u8, slotId);
    Serial.encodeField(record, 0x20, u16, enabled ? 1 : 0);
    Serial.encodeField(record, 0x21, u16, channel.channel);
    Serial.encodeField(record, 0x22, u16, channel.band);
    Serial.encodeField(record, 0x23, f32, threshold);
    Serial.encodeField(record, 0x24, u16, gain);
    Serial.encodeField(record, 0x25, u16, channel.frequency);
    return Serial.finishRecord(record);
  }
  throw new EncodeError(ErrorCode.InvalidChannelName);
}
