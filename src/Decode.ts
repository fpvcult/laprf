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

import { Transform, TransformOptions } from "stream";

import { u8, u16, EOR, RecordType, IField } from "./Const";
import { RecordReader, RecordError, ErrorCode } from "./RecordReader";
import { lookup, isFieldDescriptor } from "./Signature";
import * as Debug from "./Debug";

export default class Decode extends Transform {
  constructor(options: TransformOptions = { objectMode: true }) {
    // Calls the stream.Writable(options) constructor
    super(options);
  }

  _transform(raw: Buffer, encoding: BufferEncoding, done: Function) {
    try {
      const fields: IField[] = [];
      const record = new RecordReader(raw, 5); // Begin befor recordType field
      const recordType = record.read(u16);
      if (recordType in RecordType) {
        Debug.log(`RecordType: ${RecordType[recordType]}`);
        loop: while (true) {
          const signature = record.read(u8);
          if (signature === EOR) break loop;
          let descriptor = lookup(recordType, signature);
          if (isFieldDescriptor(descriptor)) {
            const { name, dataType } = descriptor;
            const data = record.decodeData(dataType);
            Debug.log(`${name}: ${data}`);
            fields.push({ type: name, data });
          } else {
            record.decodeUnknown(signature);
          }
        }
      } else {
        const message = `Unknown RecordType 0x${recordType.toString(16)}`;
        throw new RecordError(ErrorCode.UnknownRecordType, message);
      }
      this.push({ type: RecordType[recordType], fields });
    } catch (error) {
      if (error instanceof RangeError) {
        // Hit the of the buffer unexpectedly
        Debug.log(error.message);
      } else if (error instanceof RecordError) {
        switch (error.code) {
          // Possibly handle the issues here.
          default:
            Debug.log(error.message);
        }
      }
    }
    done();
  }
}
