/**
 * Auther: John Hooks
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

import Unescape from "./Unescape";
import Verify from "./Verify";
import Parse from "./Parse";

import * as Debug from "./Debug";

const client = new Socket();

const unescape = new Unescape();
const verify = new Verify();
const parse = new Parse();

parse.on("data", console.log);

client
  .pipe(unescape)
  .pipe(verify)
  .pipe(parse);

client.connect(5403, "192.168.1.9", () => {
  Debug.log("connected");
});
