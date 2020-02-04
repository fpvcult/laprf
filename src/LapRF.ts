import { Record } from './types.d';
import Serial from './Serial';

/**
 * A class to serialize/deserialize LapRF protocol packets.
 */
export class LapRF {
  serial = new Serial();

  // constructor() {}

  /**
   * Serialize an object implementing [[Record]] into a binary LapRF record.
   * @param record An object to serialize into a LapRF packet.
   * @returns A buffer containing an encoded LapRF packet.
   */
  encode(record: Record): Buffer {
    return this.serial.encode(record);
  }

  /**
   * Deserialize a LapRF packet into an array of objects implementing [[Record]].
   * @param packet A packet received from a LapRF to deserialize.
   * @returns An array of JavaScript objects conforming to the Record interface.
   */
  decode(packet: Buffer): Record[] {
    return this.serial.decode(packet);
  }

  /**
   * Requesting `rtcTime' from the LapRF device requires a irregularly formated packet.
   * @returns A buffer containing an encoded request for the `rtcTime'.
   */
  requestRtcTime(): Buffer {
    return this.serial.requestRfSetup();
  }
}
