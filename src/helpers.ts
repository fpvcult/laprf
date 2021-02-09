/**
 * Copyright (C) 2021 copyright-holder John Hooks <bitmachina@outlook.com>
 * This file is part of @fpvcult/laprf.
 *
 * @fpvcult/laprf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @fpvcult/laprf is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @fpvcult/laprf.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { ErrorCode, SOR, EOR, ESC, ESC_OFFSET, MAX_RECORD_LEN } from './const';

/**
 * Escape a LapRF record.
 * @param {Uint8Array} input The record to escape.
 * @returns {ArrayBuffer} The `input` with content escaped.
 */
export function escape(input: Uint8Array): ArrayBuffer {
  const output = new Uint8Array(MAX_RECORD_LEN);
  let position = 0;
  let byte: number;

  for (let offset = 0, len = input.byteLength; offset < len; offset++) {
    byte = input[offset];
    if ((byte === ESC || byte === SOR || byte === EOR) && offset !== 0 && offset !== len - 1) {
      output[position++] = ESC;
      output[position++] = byte + ESC_OFFSET;
    } else {
      output[position++] = byte;
    }
  }

  return output.buffer.slice(0, position);
}

/**
 * Unescaped a LapRF packet.
 * @param {Uint8Array} input Raw record received from a LapRF.
 * @returns {DataView} The `input` with content unescaped.
 */
export function unescape(input: Uint8Array): DataView {
  const output = new Uint8Array(MAX_RECORD_LEN);
  let position = 0;
  let escaped = false;
  let byte: number;

  for (let offset = 0, len = input.byteLength; offset < len; offset++) {
    byte = input[offset];

    if (escaped) {
      escaped = false;
      output[position++] = byte - ESC_OFFSET;
    } else {
      switch (byte) {
        case EOR:
          output[position++] = byte;
          // * Important to use the ou
          return new DataView(output.buffer, 0, position);
        case ESC:
          escaped = true;
          break;
        default:
          output[position++] = byte;
      }
    }
  }

  throw new Error(`[LapRF Error] ${ErrorCode.InvalidRecord} Failed to unescape record`);
}

/**
 * Split a LapRF packet into individual records.
 * @param {DataView} buffer An LapRF packet.
 * @returns {DataView[]} The unescaped records contained in the `buffer`.
 */
export function splitRecords(view: DataView): DataView[] {
  const input = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const output: DataView[] = [];
  let position = 0;

  while (true) {
    const sor = input.indexOf(SOR, position);
    if (sor > -1) {
      position = input.indexOf(EOR, sor) + 1;
      if (position > -1) {
        output.push(unescape(input.subarray(sor, position)));
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return output;
}

interface OfArrayBuffer {
  buffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types
type OfArrayBufferConstructor<T extends {} = {}> = new (
  buffer: ArrayBuffer,
  byteOffset: number,
  byteLength: number
) => T;

export function convert<T extends OfArrayBuffer, U>(
  from: T,
  constructor: OfArrayBufferConstructor<U>
): U {
  return new constructor(from.buffer, from.byteOffset, from.byteLength);
}

/* eslint-disable @typescript-eslint/ban-types */

const toString = (value: unknown) => Object.prototype.toString.call(value);

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof value === 'object' && toString(value) === '[object ArrayBuffer]';
}

export function isUint8Array(value: unknown): value is Uint8Array {
  return typeof value === 'object' && toString(value) === '[object Uint8Array]';
}

export function isDataView(value: unknown): value is DataView {
  return typeof value === 'object' && toString(value) === '[object DataView]';
}
