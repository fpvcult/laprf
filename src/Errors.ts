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

import { RecordType } from "./Const";

export class SerialError extends Error {
  constructor(msg: string = "An unknown error occured while parsing") {
    super(`SerialError: ${msg}`);
    Object.setPrototypeOf(this, SerialError.prototype);
  }
}

export class EorError extends SerialError {
  constructor() {
    super("Unable to find EOR after finding SOR");
  }
}

export class SorError extends SerialError {
  constructor() {
    super("Unable to find SOR in packet");
  }
}

export class SizeError extends SerialError {
  constructor(
    recordType: number,
    signature: number,
    size: number,
    isSignatureValid: boolean = true
  ) {
    const r = RecordType[recordType];
    const s = signature.toString(16);
    let msg = `Unknown size: ${size}, found on RecordType.${r} `;

    msg += isSignatureValid
      ? ` signature 0x${s}`
      : ` of an unknown signature 0x${s}`;

    super(msg);
  }
}

export class SignatureError extends SerialError {
  constructor(recordType: number, signature: number) {
    const r = RecordType[recordType];
    const s = signature.toString(16);
    super(`Unknown signature: 0x${s}, found on RecordType.${r}`);
  }
}

export class RecordTypeError extends SerialError {
  constructor(recordType: number | string) {
    let msg: string = "Unknown record type: ";
    if (typeof recordType === "number") {
      msg += `0x${recordType.toString(16)}`;
    } else {
      msg += recordType;
    }
    super(msg);
  }
}
