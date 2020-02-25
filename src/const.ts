export const MAX_RECORD_LEN = 1024;
export const MAX_SLOTS = 8;

export const SOR = 0x5a;
export const EOR = 0x5b;
export const ESC = 0x5c;
export const ESC_OFFSET = 0x40;

export const enum RecordType {
  rssi = 0xda01,
  rfSetup = 0xda02,
  stateControl = 0xda04,
  settings = 0xda07,
  descriptor = 0xda08,
  passing = 0xda09,
  status = 0xda0a,
  time = 0xda0c,
  error = 0xffff,
}

export const enum ErrorCode {
  CrcMismatch = 0x100,
  InvalidPacket,
  InvalidRecord,
  MissingSOR,
  MissingEOR,
  SizeError,
  UnknownRecordType,
  UnknownSignatureType,
  DeviceError,
  RangeError,
  InvalidChannelName,
}
