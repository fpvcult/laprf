export type RecordField = [string, number];

export interface Record {
  type: string;
  fields: Array<RecordField>;
}

/**
 * A class to serialize/de-serialize LapRF protocol packets.
 */
declare class LapRF {
  /**
   * Serialize an object implementing [[Record]] into a binary LapRF record.
   * @param record An object to serialize into a LapRF packet.
   * @returns A buffer containing an encoded LapRF packet.
   */
  encode(record: Record): Buffer;

  /**
   * De-serialize a LapRF packet into an array implementing [[Record]].
   * @param packet A packet received from a LapRF device to de-serialize.
   * @returns An array conforming to the Record interface.
   */
  decode(packet: Buffer): Record[];
}
