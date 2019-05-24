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

import {
  SOR,
  EOR,
  ESC,
  ESC_OFFSET,
  RecordType,
  RFSetupField,
  TimeField,
  SettingsField
} from "./Const";
import { u8, u16, u32, u64, f32, f64, NumberType, Binary } from "./Binary";
import { Crc } from "./Util";
import * as Debug from "./Debug";
import { ISetupSlot } from "./Interface";
import { lookup } from "./Signature";

export class PacketWriter {
  private buffer = Buffer.alloc(256); // Should be long enough
  private byteOffset = 0;

  constructor() {}

  // Bands F:1, R:2, E:3, B:4, A:5, LowBand: 6
  public setRFSetupSlot(setup: ISetupSlot): Buffer {
    const {
      slotIndex,
      enable,
      band,
      channel,
      gain,
      threshold,
      frequency
    } = setup;
    this.writeField(u8, RFSetupField.slotIndex, slotIndex);
    this.writeField(u16, RFSetupField.enabled, enable ? 0x01 : 0x00);
    this.writeField(u16, RFSetupField.band, band);
    this.writeField(u16, RFSetupField.channel, channel);
    this.writeField(u16, RFSetupField.gain, gain);
    this.writeField(u32, RFSetupField.threshold, threshold);
    this.writeField(u16, RFSetupField.frequency, frequency);
    return this.finish();
  }

  public setRFSetupSlots(setups: ISetupSlot[]): Buffer {
    this.init(RecordType.rfSetup);
    for (let i = 0, len = setups.length; i < len; i++) {
      const { slotIndex, enable, frequency } = setups[i];
      this.writeField(u8, RFSetupField.slotIndex, slotIndex);
      this.writeField(u16, RFSetupField.enabled, enable ? 0x01 : 0x00);
      this.writeField(u16, RFSetupField.frequency, frequency);
    }
    return this.finish();
  }

  public requestRFSetup(): Buffer {
    this.init(RecordType.rfSetup);
    for (let i = 1; i <= 8; i++) {
      this.writeField(u8, RFSetupField.slotIndex, i);
    }
    return this.finish();
  }

  /**
   * Not working
   */
  public requestSettings(): Buffer {
    this.init(RecordType.settings);
    this.write(u8, SettingsField.minLapTime);
    this.write(u8, 0x00);
    return this.finish();
  }

  public setMinLapTime(milliseconds: number): Buffer {
    this.init(RecordType.settings);
    this.writeField(u32, SettingsField.minLapTime, milliseconds);
    return this.finish();
  }

  public requestTime(): Buffer {
    this.init(RecordType.time);
    this.write(u8, TimeField.rtcTime);
    this.write(u32, 0x00);
    return this.finish();
  }

  private init(recordType: RecordType): void {
    this.byteOffset = 0;
    this.write(u8, SOR);
    this.write(u16, 0); // Length placeholder
    this.write(u16, 0); // CRC placeholder
    this.write(u16, recordType);
  }

  private finish(): Buffer {
    this.write(u8, EOR);
    const length = this.byteOffset;
    this.byteOffset = 1;
    this.write(u16, length);
    const buffer = this.buffer.slice(0, length);
    const crc = Crc.compute(buffer);
    this.write(u16, crc); // Should work
    return escape(buffer);
  }

  private writeField(type: NumberType, signature: number, data: number) {
    this.write(u8, signature);
    this.write(u8, type.byteLength);
    this.write(type, data);
  }

  private write(type: NumberType, data: number): void {
    switch (type) {
      case u8:
        this.byteOffset = this.buffer.writeUInt8(data, this.byteOffset);
        break;
      case u16:
        this.byteOffset = this.buffer.writeUInt16LE(data, this.byteOffset);
        break;
      case u32:
        this.byteOffset = this.buffer.writeInt32LE(data, this.byteOffset);
        break;
      case f32:
        this.byteOffset = this.buffer.writeFloatLE(data, this.byteOffset);
        break;
      case u64:
        this.byteOffset = this.buffer.writeBigUInt64LE(
          BigInt(data),
          this.byteOffset
        );
        break;
      case f64:
        this.byteOffset = this.buffer.writeDoubleLE(data, this.byteOffset);
        break;
    }
  }
}

function escape(buffer: Buffer) {
  const escaped = [];
  let byte: number;
  let byteOffset = 0;
  let length = buffer.length;
  for (; byteOffset < length; byteOffset++) {
    byte = buffer[byteOffset];
    if (
      (byte === ESC || byte === SOR || byte === EOR) &&
      byteOffset !== 0 &&
      byteOffset !== length - 1
    ) {
      escaped.push(ESC);
      escaped.push(byte + ESC_OFFSET);
    } else {
      escaped.push(byte);
    }
  }
  return Buffer.from(escaped);
}
