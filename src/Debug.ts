/**
 * Author: John Hooks
 * URL: https://github.com/johnhooks/laprf
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

import chalk from "chalk";
import { DEBUG, RecordType } from "./Const";

export function log(message: string): void {
  if (DEBUG !== undefined) console.log(message);
}

export function warn(msg: string): void {
  console.log(chalk`[{yellow Warning}] ${msg}`);
}

export const Msg = Object.freeze({
  unknowSignature(recordType: number, signature: number) {
    let msg = `Unknown signature 0x${signature.toString(16)}, found on `;
    msg +=
      recordType in RecordType
        ? `RecordType.${RecordType[recordType]}`
        : `an unknown record type 0x${recordType.toString(16)}`;
    return msg;
  }
});
