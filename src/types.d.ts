export type RecordField = [string, number];

export interface Record {
  type: string;
  fields: Array<RecordField>;
}

declare class LapRF {
  encode(record: Record): Buffer;
  decode(packet: Buffer): Record[];
  requestRtcTime(): Buffer;
}
