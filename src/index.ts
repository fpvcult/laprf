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

import { Duplex } from "stream";

import { Serial } from "./Serial";
import { IRecord } from "./Const";

export default class LapRF extends Duplex {
  private serial = new Serial();

  constructor() {
    super(/* { objectMode: true } */);
  }

  _write(packet: Buffer, _encoding: any, done: Function) {
    // TODO: implement what to do with the records.
    const records: IRecord[] = this.serial.deserialize(packet);
    records.forEach(record => {
      console.log(record);
    });
    done();
  }
}
