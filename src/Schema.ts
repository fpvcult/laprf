import { Binary, NumberType, u8 } from '@bitmachina/binary';
import Debug from 'debug';

import { DeviceRecord } from './types.d';
import { EOR, RecordType, ErrorCode } from './const';
import { Index, DecodeError } from './Util';

const debug = Debug('laprf:schema');

interface Field {
  name: string;
  type: NumberType;
  signature: number;
}

type FieldInput = readonly [number, NumberType]; // (Signature, NumberType)

/**
 * * SAVE I was pretty proud of this typing, but it's unnecessary now.
 * To capture the type of an array use `infer`.
 * T extends (infer U)[] ? [ can use U here ]
 *
 * type SchemaConfig<T extends DeviceRecord> = {
 *   [P in keyof T]: P extends 'type'
 *     ? T[P]
 *     : P extends 'slots'
 *     ? T[P] extends (infer U)[]
 *       ? U extends object
 *         ? { [P in keyof U]: FieldInput }
 *         : never
 *       : never
 *     : FieldInput;
 * };
 */

type SchemaConfig<T extends DeviceRecord> = {
  [P in keyof T]: P extends 'type'
    ? T[P]
    : P extends 'slots'
    ? Record<string, FieldInput>
    : FieldInput;
};

export class Schema<T extends DeviceRecord> {
  private type: keyof typeof RecordType;

  private slots: Set<string> = new Set();
  private fields: Set<string> = new Set();
  private indexes = new Index<Field>();

  constructor(schema: SchemaConfig<T>) {
    this.type = schema.type;

    for (const name in schema) {
      if (isFieldInput(schema, name)) {
        const [signature, type] = schema[name] as FieldInput;
        this.indexes.set(signature, name, { signature, name, type });
        this.fields.add(name);
      }
      if (name === 'slots') {
        const field = schema[name];
        for (const name in field) {
          const [signature, type] = (field[name] as unknown) as FieldInput;
          this.indexes.set(signature, name, { signature, name, type });
          this.slots.add(name);
        }
      }
    }
  }

  decode<U extends Binary>(source: U): T {
    const { length } = source;

    const fields: Record<string, number> = {};
    const slots: Record<number, { lastRssi: number }> = {};

    let slotId: number | undefined;

    while (source.byteOffset < length) {
      const signature = source.read(u8);

      if (signature === EOR) break;

      const size = source.read(u8);
      const fieldType = this.indexes.get(signature);

      if (fieldType) {
        const { name, type } = fieldType;

        if (size === type.byteLength) {
          const data = source.read(type);

          if (this.fields.has(name)) {
            fields[name] = data;
          } else if (this.slots.has(name)) {
            switch (name) {
              case 'slotId':
                slotId = data;
                break;
              case 'lastRssi': {
                if (slotId) {
                  slots[slotId] = { lastRssi: data };
                  slotId = undefined;
                }
                break;
              }
              default:
                debug(`Unhandled slot field: ${name}`);
            }
          }
        } else {
          throw new DecodeError(ErrorCode.SizeError);
        }
      } else {
        debug(`Unknown field signature: 0x${signature.toString(16)} in record type: ${this.type}`);
      }
    }

    // Verify fields are properly formed
    for (const name in this.fields) {
      if (typeof fields[name] !== 'number') {
        const msg = `Record of type: ${this.type} is missing field: ${name}`;
        throw new Error(msg);
      }
    }

    if (this.type === 'status') {
      for (let i = 1; i <= 8; i++) {
        if (typeof slots[i] === 'undefined') {
          const msg = `Record of type: ${this.type} is missing slot field index: ${i}`;
          throw new Error(msg);
        }
      }
      return ({ type: this.type, ...fields, slots } as unknown) as T;
    } else {
      return { type: this.type, ...fields } as T;
    }
  }
}

function isFieldInput<T extends DeviceRecord>(
  o: SchemaConfig<T>,
  k: Extract<keyof T, string>
): boolean {
  return typeof o[k] === 'object' && Array.isArray(o[k]);
}
