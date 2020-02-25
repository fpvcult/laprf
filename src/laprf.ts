import { u8, u16, f32 } from '@bitmachina/binary';
import { TimerEvent, SetSlotInput } from './types.d';
import { RecordType, ErrorCode } from './const';
import * as Serial from './Serial';
import * as Frequency from './Frequency';
import { EncodeError } from './Util';

export function decode(packet: Buffer): Array<TimerEvent> {
  return Serial.decode(packet);
}
/**
 * Serialize a LapRF packet to request the `rtcTime`.
 * * Requesting `rtcTime' requires an irregular packet.
 * @returns {Buffer} An encoded packet for the `rtcTime'.
 */
export function getRtcTime(): Buffer {
  const record = Serial.startRecord(RecordType.time)
    .write(u8, 0x02) // `rtcTime'
    .write(u8, 0x00);
  return Serial.finishRecord(record);
}

/**
 * Serialize a LapRF packet to request the `rfSetup`.
 * @param {number} [slotIndex] Optionally request a single slot.
 * @returns {Buffer} An encoded packet for the `rfSetup'.
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
 * Serialize a LapRF packet to configure a `rfSetup` slot.
 * @param {Object} settings The options to setup the slot.
 * @returns {Buffer} An encoded packet to configure a `rfSetup' slot.
 */
export function setRfSetup({
  slotIndex,
  channelName,
  gain = 51,
  threshold = 900,
  enabled = true,
}: SetSlotInput): Buffer {
  const channel = Frequency.get(channelName);

  if (channel) {
    const record = Serial.startRecord(RecordType.rfSetup);

    Serial.encodeField(record, 0x01, u8, slotIndex);
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
