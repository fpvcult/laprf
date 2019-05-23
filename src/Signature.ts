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

type FieldArgs = [number, NumberType, string];
type RecordTypeArgs = [number, string, FieldArgs[]];

interface IFieldDescriptor {
  signature: number;
  dataType: NumberType;
  name: string;
  recordType: number;
  recordTypeName: string;
}

type CodeMap<T> = { [key: number]: T };

const fieldDescriptors = fill([
  [
    RecordType.rssi, // 0xda01
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
    RecordType.rfSetup, // 0xda02
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

  [
    RecordType.stateControl, // 0xda04
    "stateControl",
    [[0x20, u8, "gateState"]]
  ],

  [
    RecordType.settings, // 0xda07
    "settings",
    [
      // [ 0x22, u8, "statusInterval" ],
      [0x26, u32, "minLapTime"]
    ]
  ],

  // [ 0xda08, "descriptor", [] ]

  [
    RecordType.passing, // 0xda09
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
    RecordType.status, // 0xda0a
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

  [
    RecordType.time, // 0xda0c
    "time",
    [[0x02, u64, "rtcTime"], [0x20, u64, "timeRtcTime"]]
  ]

  // [ 0xffff, "error", [] ]
]);

export function isFieldDescriptor(
  item: IFieldDescriptor | undefined
): item is IFieldDescriptor {
  return (<IFieldDescriptor>item).dataType !== undefined;
}

function lookupCode(recordType: number, signature: number) {
  return (recordType << 8) | (signature & 0xff);
}

function fill(typeArgs: Array<RecordTypeArgs>) {
  const fieldDescriptors: CodeMap<IFieldDescriptor> = {};
  typeArgs.forEach(([recordType, recordTypeName, fieldArgs]) => {
    fieldArgs.forEach(([signature, dataType, name]) => {
      const field: IFieldDescriptor = {
        signature,
        dataType,
        name,
        recordType: recordType,
        recordTypeName
      };
      Object.freeze(field);
      fieldDescriptors[lookupCode(recordType, signature)] = field;
    });
  });
  Object.freeze(fieldDescriptors);
  return fieldDescriptors;
}

export function lookup(
  recordType: number,
  signature: number
): IFieldDescriptor | undefined {
  const descriptor = fieldDescriptors[lookupCode(recordType, signature)];
  return isFieldDescriptor(descriptor) ? descriptor : undefined;
}
