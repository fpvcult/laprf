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

import { Socket } from "net";
import { Writable, WritableOptions } from "stream";

import { Unescape, Verify, Decode } from "./Transforms";
import { PacketWriter } from "./PacketWriter";

import { IRecord } from "./Const";
import { IRaceTimer, IPassingRecord } from "./Interface";

// import * as Debug from "./Debug";

export default class LapRF extends Writable {
  private writer: PacketWriter;

  constructor(client: Socket) {
    super({ objectMode: true });

    client
      .pipe(new Unescape())
      .pipe(new Verify())
      .pipe(new Decode())
      .pipe(this);

    this.writer = new PacketWriter();
  }

  _write(record: IRecord, _encoding: any, done: Function) {
    // To implement
    console.log(record);
    done();
  }
}
