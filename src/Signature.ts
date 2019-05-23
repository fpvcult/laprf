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
// import { RecordType } from "./Const";

type FieldArgs = [number, NumberType, string];
type RecordTypeArgs = [number, string, FieldArgs[]];

type CodeMap<T> = { [key: number]: T };

class FieldDescriptor {
  private recordTypeInfo: { name: string; code: number };
  constructor(
    readonly code: number,
    readonly numberType: NumberType,
    readonly name: string,
    recordType: RecordType
  ) {
    this.recordTypeInfo = recordType.props;
  }

  get recordType(): { name: string; code: number } {
    return this.recordTypeInfo;
  }
}

class RecordType {
  readonly fieldDescriptors: CodeMap<FieldDescriptor> = {};
  readonly props: { name: string; code: number };
  constructor(code: number, name: string, fieldArgs: FieldArgs[]) {
    this.props = { name, code };

    fieldArgs.forEach(args => {
      const field = Reflect.construct(FieldDescriptor, [...args, this]);
      this.fieldDescriptors[args[0]] = field;
    });

    Object.freeze(this.props);
    Object.freeze(this.fieldDescriptors);
  }

  get code(): number {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }
}

const RecordTypes = fill([
  [
    0xda01,
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

function fill(recordTypeArgs: Array<RecordTypeArgs>) {
  const recordTypes: CodeMap<RecordType> = {};
  recordTypeArgs.forEach(args => {
    recordTypes[args[0]] = Reflect.construct(RecordType, args);
  });
  Object.freeze(recordTypes);
  return recordTypes;
}

export function isRecordType(item: RecordType | undefined): item is RecordType {
  return item instanceof RecordType;
}

export function isFieldDescriptor(
  item: FieldDescriptor | undefined
): item is FieldDescriptor {
  return item instanceof FieldDescriptor;
}

export function lookup(
  recordType: number,
  signature: number
): FieldDescriptor | undefined {
  const type = RecordTypes[recordType];
  if (isRecordType(type)) {
    return type.fieldDescriptors[signature];
  }
  return undefined;
}
