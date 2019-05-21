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

import Unescape from "./Unescape";
import Verify from "./Verify";
import Decode from "./Decode";

import * as Debug from "./Debug";

export default class LapRF extends Writable {
  private socket: Socket;

  constructor(port: number = 5403, address: string = "192.168.1.9") {
    super({ objectMode: true });

    this.socket = new Socket();

    this.socket
      .pipe(new Unescape())
      .pipe(new Verify())
      .pipe(new Decode())
      .pipe(this);

    this.socket.connect(port, address, () => {
      Debug.log("connected");
    });
  }

  _write(chunk: object, encoding: any, done: Function) {
    // To implement
    done();
  }
}
