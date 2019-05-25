/**
 * Author: John Hooks
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

import { NumberType, u8, u16, u32, u64, f32 } from "./Binary";
import { RecordType } from "./Const";

// I am sure there is a cleaner way to do this. But I want all the
// data about the protocol schema in one place rather than all through
// the code. Interested in creating something more generic.

class FieldDescriptor {
  constructor(
    readonly code: number,
    readonly numberType: NumberType,
    readonly name: string,
    readonly recordType: RecordDescriptor
  ) {}
}

class RecordDescriptor {
  constructor(readonly code: number, readonly name: string) {}
}

type FieldArgs = [number, NumberType, string];
type RecordArgs = [number, string, FieldArgs[]];
type CodeMap<T> = { [key: number]: T };
type NameMap<T> = { [key: string]: T };
type DeepCodeMap<T> = CodeMap<CodeMap<T>>;
type DeepNameMap<T> = NameMap<NameMap<T>>;

const {
  fieldTypeByCode,
  fieldTypeByName,
  recordTypeByCode,
  recordTypeByName
} = genMaps([
  [
    RecordType.rssi,
    "rssi",
    [
      [0x01, u8, "slotIndex"],
      [0x20, f32, "minRssi"],
      [0x21, f32, "maxRssi"],
      [0x22, f32, "meanRssi"],
      [0x23, u32, "unknown1"],
      // [ 0x24, ?, "customRate" ],
      // [ 0x25, ?, "packetRate" ],
      [0x26, u32, "unknown2"]
    ]
  ],

  [
    0xda02,
    "rfSetup",
    [
      [0x01, u8, "slotIndex"],
      [0x20, u16, "enabled"],
      [0x21, u16, "channel"],
      [0x22, u16, "band"],
      [0x23, f32, "threshold"],
      [0x24, u16, "gain"],
      [0x25, u16, "frequency"]
    ]
  ],

  [0xda04, "stateControl", [[0x20, u8, "gateState"]]],

  [
    0xda07,
    "settings",
    [
      // [ 0x22, u8, "statusInterval" ],
      [0x26, u32, "minLapTime"]
    ]
  ],

  // [ 0xda08, "descriptor", [] ]

  [
    0xda09,
    "passing",
    [
      [0x01, u8, "slotIndex"],
      [0x02, u64, "rtcTime"],
      [0x20, u32, "decoderId"],
      [0x21, u32, "passingNumber"],
      [0x22, u16, "peakHeight"],
      [0x23, u16, "flags"]
    ]
  ],

  [
    0xda0a,
    "status",
    [
      [0x01, u8, "slotIndex"],
      [0x03, u16, "flags"],
      [0x21, u16, "batteryVoltage"],
      [0x22, f32, "lastRSSI"],
      [0x23, u8, "gateState"],
      [0x24, u32, "detectionCount"]
    ]
  ],

  [0xda0c, "time", [[0x02, u64, "rtcTime"], [0x20, u64, "timeRtcTime"]]]

  // [ 0xffff, "error", [] ]
]);

function genMaps(
  recordTypeArgs: Array<RecordArgs>
): {
  fieldTypeByCode: DeepCodeMap<FieldDescriptor>;
  fieldTypeByName: DeepNameMap<FieldDescriptor>;
  recordTypeByCode: CodeMap<RecordDescriptor>;
  recordTypeByName: NameMap<RecordDescriptor>;
} {
  const recordTypeMap: NameMap<RecordDescriptor> = {};
  const fieldTypeByCode: DeepCodeMap<FieldDescriptor> = {};
  const fieldTypeByName: DeepNameMap<FieldDescriptor> = {};
  const recordTypeByCode: CodeMap<RecordDescriptor> = {};
  const recordTypeByName: NameMap<RecordDescriptor> = {};

  recordTypeArgs.forEach(args => {
    const recordType = <RecordDescriptor>(
      Reflect.construct(RecordDescriptor, args.slice(0, 2))
    );

    recordTypeByName[recordType.name] = recordType;
    recordTypeByCode[recordType.code] = recordType;

    const codedFields = <CodeMap<FieldDescriptor>>{};
    const namedFields = <NameMap<FieldDescriptor>>{};

    args[2].forEach(args => {
      const field = <FieldDescriptor>(
        Reflect.construct(FieldDescriptor, [...args, recordType])
      );
      codedFields[field.code] = field;
      namedFields[field.name] = field;
    });

    Object.freeze(codedFields);
    Object.freeze(namedFields);

    fieldTypeByCode[recordType.code] = codedFields;
    fieldTypeByName[recordType.name] = namedFields;
  });

  Object.freeze(fieldTypeByCode);
  Object.freeze(fieldTypeByName);
  Object.freeze(recordTypeByCode);
  Object.freeze(recordTypeByName);

  return {
    fieldTypeByCode,
    fieldTypeByName,
    recordTypeByCode,
    recordTypeByName
  };
}

export function isFieldDescriptor(
  item: FieldDescriptor | undefined
): item is FieldDescriptor {
  return item instanceof FieldDescriptor;
}

export function isRecordDescriptor(
  item: RecordDescriptor | undefined
): item is RecordDescriptor {
  return item instanceof RecordDescriptor;
}

export function findFieldTypeByCode(
  recordTypeCode: number,
  fieldTypeCode: number
): FieldDescriptor | undefined {
  const obj = fieldTypeByCode[recordTypeCode];
  if (obj !== undefined) {
    return obj[fieldTypeCode];
  }
  return undefined;
}

export function findFieldTypeByName(
  recordTypeName: string,
  fieldTypeName: string
): FieldDescriptor | undefined {
  const obj = fieldTypeByName[recordTypeName];
  if (obj !== undefined) {
    return obj[fieldTypeName];
  }
  return undefined;
}

export function findRecordTypeByCode(
  code: number
): RecordDescriptor | undefined {
  return recordTypeByCode[code];
}

export function findRecordTypeByName(
  name: string
): RecordDescriptor | undefined {
  return recordTypeByName[name];
}
