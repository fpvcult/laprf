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

import { u8, u16, u32, u64, f32, f64, NumberType } from "./Binary";
import { IndexOf } from "./Util";

/**
 * Used to allow a SchemaBuilder to set the private indexes on its Schema
 */
const indexes = Symbol("indexes");

class Field {
  constructor(
    readonly name: string,
    readonly type: NumberType,
    readonly signature: number
  ) {}
}

class SchemaBuilder {
  constructor(private schema: Schema) {}

  u8(signature: number, name: string) {
    this.addField(u8, name, signature);
  }

  u16(signature: number, name: string) {
    this.addField(u16, name, signature);
  }

  u32(signature: number, name: string) {
    this.addField(u32, name, signature);
  }

  u64(signature: number, name: string) {
    this.addField(u64, name, signature);
  }

  f32(signature: number, name: string) {
    this.addField(f32, name, signature);
  }

  f64(signature: number, name: string) {
    this.addField(f64, name, signature);
  }

  private addField(type: NumberType, name: string, signature: number) {
    const field = new Field(name, type, signature);
    if (Reflect.has(this.schema[indexes], name)) {
      throw new Error(`Attempted to set name '${name}' twice`);
    } else if (Reflect.has(this.schema[indexes], signature)) {
      throw new Error(`Attempted to set signature '${signature}' twice`);
    } else {
      this.schema[indexes][name] = field;
      this.schema[indexes][signature] = field;
    }
    this.schema[indexes][name] = field;
  }
}

export class Schema {
  public [indexes]: IndexOf<Field> = {};

  constructor(builder: (instance: SchemaBuilder) => void) {
    const schemaBuilder: SchemaBuilder = new SchemaBuilder(this);
    builder(schemaBuilder);
  }

  get(index: string | number): Field | undefined {
    return this[indexes][index];
  }
}
