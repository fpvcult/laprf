/**
 * Author: John Hooks
 * URL: https://github.com/johnhooks/laprf-serial-protocol
 * Version: 0.1.0
 *
 * This file is part of LapRFSerialProtocol.
 *
 * LapRFSerialProtocol is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LapRFSerialProtocol is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LapRFSerialProtocol.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema } from "./Schema";
import { Index } from "./Util";

export enum Signature {
  rssi = 0xda01,
  rfSetup = 0xda02,
  stateControl = 0xda04,
  settings = 0xda07,
  descriptor = 0xda08,
  passing = 0xda09,
  status = 0xda0a,
  time = 0xda0c,
  error = 0xffff
}

class RecordType {
  readonly name: string;
  constructor(readonly signature: Signature, readonly schema: Schema) {
    this.name = Signature[signature];
  }
}

const recordTypes = new Index<RecordType>();

export function get(key: string | number): RecordType | undefined {
  return recordTypes.get(key);
}

[
  new RecordType(
    Signature.rssi,
    new Schema(s => {
      s.u8(0x01, "slotIndex");
      s.f32(0x20, "minRssi");
      s.f32(0x21, "maxRssi");
      s.f32(0x22, "meanRssi");
      s.u32(0x23, "unknown1");
      s.u8(0x24, "customRate");
      s.u32(0x25, "packetRate");
      s.u32(0x26, "unknown2");
    })
  ),
  new RecordType(
    Signature.rfSetup,
    new Schema(s => {
      s.u8(0x01, "slotIndex");
      s.u16(0x20, "enabled");
      s.u16(0x21, "channel");
      s.u16(0x22, "band");
      s.f32(0x23, "threshold");
      s.u16(0x24, "gain");
      s.u16(0x25, "frequency");
    })
  ),
  new RecordType(
    Signature.stateControl,
    new Schema(s => {
      s.u8(0x20, "gateState");
    })
  ),
  new RecordType(
    Signature.settings,
    new Schema(s => {
      s.u32(0x26, "minLapTime");
    })
  ),
  new RecordType(
    Signature.passing,
    new Schema(s => {
      s.u8(0x01, "slotIndex");
      s.u64(0x02, "rtcTime");
      s.u32(0x20, "decoderId");
      s.u32(0x21, "passingNumber");
      s.u16(0x22, "peakHeight");
      s.u16(0x23, "flags");
    })
  ),
  new RecordType(
    Signature.status,
    new Schema(s => {
      s.u8(0x01, "slotIndex");
      s.u16(0x03, "flags");
      s.u16(0x21, "batteryVoltage");
      s.f32(0x22, "lastRssi");
      s.u8(0x23, "gateState");
      s.u32(0x24, "detectionCount");
    })
  ),
  new RecordType(
    Signature.time,
    new Schema(s => {
      s.u64(0x02, "rtcTime");
      s.u64(0x20, "timeRtcTime");
    })
  )
].forEach(record => recordTypes.set(record.signature, record.name, record));
