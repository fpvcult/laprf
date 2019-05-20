/**
 * Auther: John Hooks
 * URL: https://github.com/johnhooks/laprf
 * Version: 0.1.0
 *
 * This file is part of LapRFJavaScript.
 *
 * LapRFJavaScript is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LapRFJavaScript is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LapRFJavaScript.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Transform, TransformOptions } from "stream";

import {
  Result,
  NumberType,
  u8,
  u16,
  u32,
  u64,
  f32,
  f64,
  EOR
} from "./Constant";
import { Reader, verifyNumber, isOk, value } from "./util";

import * as Debug from "./Debug";

import {
  RecordType,
  RFSetupField,
  RssiField,
  PassingField,
  SettingsField,
  StateControlField,
  StatusField,
  TimeField,
  IRecord,
  IField
} from "./Constant";

export const enum ErrorCode {
  SizeError,
  UnknownRecordType,
  UnknownSignatureType
}

export class ParseError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = "An error occured while parsing"
  ) {
    super(message);
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

type RecordResult = Result<IRecord, ParseError>;
type FieldResult = Result<number, ParseError>;

export default class Parse extends Transform {
  constructor(options: TransformOptions = { objectMode: true }) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(buffer: Buffer, encoding: BufferEncoding, done: Function) {
    const recordType = buffer.readUInt16LE(5);
    Debug.log(`RecordType: ${RecordType[recordType]}`);
    try {
      this.push(value(parseFields(buffer, recordType)));
    } catch (error) {
      if (error instanceof RangeError) {
        // Something went wrong while parsing
        Debug.log(error.message);
      } else if (error instanceof ParseError) {
        switch (error.code) {
          case ErrorCode.UnknownRecordType:
            Debug.log(error.message);
            break;
          case ErrorCode.SizeError:
            break;
        }
      }
    }
    done();
  }
}

function parseFields(buffer: Buffer, recordType: number): RecordResult {
  const fields: IField[] = [];
  let result: FieldResult;
  let data = new Reader(buffer, 7); // Begin after record type field
  loop: while (true) {
    const signature = data.read(u8);
    if (signature === EOR) break loop;
    switch (recordType) {
      case RecordType.error:
        result = parseUnknownSignature(data, signature);
        break;
      case RecordType.descriptor:
        // Record Type: 0xda08, Unknown Signature: 0x20, Size: 4
        // Record Type: 0xda08, Unknown Signature: 0x21, Size: 1
        result = parseUnknownSignature(data, signature);
        break;
      case RecordType.passing:
        // result = parseField(data, PassingFieldMap, signature);
        result = parsePassingField(data, signature);
        break;
      case RecordType.rfSetup:
        result = parseRFSetupField(data, signature);
        break;
      case RecordType.rssi:
        // let numberType: NumberType;
        // if (RssiFieldMap.has(signature)) {
        //   numberType = RssiFieldMap.get(signature);
        //   result = parseData(data, numberType);
        // }
        result = parseRssiField(data, signature);
        break;
      case RecordType.settings:
        result = parseSettingsField(data, signature);
        break;
      case RecordType.status:
        result = parseStatusField(data, signature);
        break;
      case RecordType.stateControl:
        result = parseStateControlField(data, signature);
        break;
      case RecordType.time:
        result = parseTimeField(data, signature);
        break;
      default:
        const message = `Unknown RecordType 0x${recordType}`;
        return { error: new ParseError(ErrorCode.UnknownRecordType, message) };
    }
    fields.push({ signature, data: value(result) });
  }
  return { value: { type: recordType, fields } };
}

function parseData(data: Reader, type: NumberType): FieldResult {
  const size = data.read(u8);
  if (verifyNumber(type, size)) {
    return { value: data.read(type) };
  } else {
    return { error: new ParseError(ErrorCode.SizeError) };
  }
}

function parseField<T, K extends keyof T>(
  data: Reader,
  map: Map<K, NumberType>,
  signature: number
): FieldResult {
  const size = data.read(u8);
  if (map.has(<K>signature)) {
    const numberType = map.get(<K>signature);
    if (verifyNumber(numberType, size)) {
      return { value: data.read(numberType) };
    } else {
      return { error: new ParseError(ErrorCode.SizeError) };
    }
  }
  return parseRawUInt(data);
}

function parseRawUInt(data: Reader): FieldResult {
  const size = data.read(u8);
  let value: number;
  switch (size) {
    case 1:
      value = data.read(u8);
      break;
    case 2:
      value = data.read(u16);
      break;
    case 4:
      value = data.read(u32);
      break;
    case 8:
      value = data.read(u64);
      break;
    default:
      return { error: new ParseError(ErrorCode.SizeError) };
  }
  return { value };
}

function parseUnknownSignature(data: Reader, signature: number): FieldResult {
  const result = parseRawUInt(data);
  if (isOk(result)) {
    Debug.log(`Signature 0x${signature.toString(16)}: ${result.value}`);
  }
  return result;
}

function parseRssiField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case RssiField.slotIndex:
      result = parseData(data, u8);
      break;
    case RssiField.minRssi:
      result = parseData(data, f32);
      break;
    case RssiField.maxRssi:
      result = parseData(data, f32);
      break;
    case RssiField.meanRssi:
      result = parseData(data, f32);
      break;
    case RssiField.unknown1:
      result = parseRawUInt(data);
      break;
    case RssiField.unknown2:
      result = parseRawUInt(data);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result)) Debug.log(`${RssiField[signature]}: ${result.value}`);
  return result;
}

// public var enabled: UInt16 = 0
// public var channel: UInt16 = 0
// public var band: UInt16 = 0
// public var gain: UInt16 = calculateGain(racePower: .tx25mw, sensitivity: .normal)
// public var threshold: Float = 900
// public var frequency: UInt16 = 0

// public enum RacePower: Int {
//     case tx25mw     = 58
//     case tx200mw    = 44
//     case tx350mw    = 40
//     case tx600mw    = 34
// }

// public enum Sensitivity: Int {
//     case subSub = -4
//     case sub    = -2
//     case normal = 0
//     case add    = 2
//     case addAdd = 4
// }

function parseRFSetupField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case RFSetupField.slotIndex:
      result = parseData(data, u8);
      break;
    case RFSetupField.enabled:
      result = parseData(data, u16);
      break;
    case RFSetupField.channel:
      result = parseData(data, u16);
      break;
    case RFSetupField.band:
      result = parseData(data, u16);
      break;
    case RFSetupField.gain:
      result = parseData(data, u16);
      break;
    case RFSetupField.frequency:
      result = parseData(data, u16);
      break;
    case RFSetupField.threshold:
      result = parseData(data, f32);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result)) Debug.log(`${RFSetupField[signature]}: ${result.value}`);
  return result;
}

function parseStateControlField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case StateControlField.gateState:
      result = parseData(data, u8);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result))
    Debug.log(`${StateControlField[signature]}: ${result.value}`);
  return result;
}

function parseSettingsField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case SettingsField.minLapTime:
      result = parseData(data, u32);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result)) Debug.log(`${SettingsField[signature]}: ${result.value}`);
  return result;
}

function parsePassingField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case PassingField.slotIndex:
      result = parseData(data, u8);
      break;
    case PassingField.rtcTime:
      result = parseData(data, u64);
      break;
    case PassingField.passingNumber:
      result = parseData(data, u32);
      break;
    case PassingField.decoderId:
      result = parseData(data, u32);
      break;
    case PassingField.peakHeight:
      result = parseData(data, u16);
      break;
    case PassingField.flags:
      result = parseData(data, u16);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result)) Debug.log(`${PassingField[signature]}: ${result.value}`);
  return result;
}

function parseStatusField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case StatusField.slotIndex:
      result = parseData(data, u8);
      break;
    case StatusField.flags:
      result = parseData(data, u8);
      break;
    case StatusField.batteryVoltage:
      result = parseData(data, u16);
      if (isOk(result)) result.value = result.value / 1000; // Convert to Volts
      break;
    case StatusField.lastRSSI:
      result = parseData(data, f32);
      break;
    case StatusField.gateState:
      result = parseData(data, u8);
      break;
    case StatusField.detectionCount:
      result = parseData(data, u32);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  let field: string = <string>StatusField[signature];
  if (isOk(result)) Debug.log(`${field}: ${result.value}`);
  return result;
}

function parseTimeField(data: Reader, signature: number): FieldResult {
  let result: FieldResult;
  switch (signature) {
    case TimeField.rtcTime:
      result = parseData(data, f64);
      break;
    case TimeField.timeRtcTime:
      result = parseData(data, f64);
      break;
    default:
      result = parseUnknownSignature(data, signature);
  }
  if (isOk(result)) Debug.log(`${TimeField[signature]}: ${result.value}`);
  return result;
}
