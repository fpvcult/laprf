import { Binary, NumberType, u8 } from '@bitmachina/binary';
import { TimerEvent } from './types.d';
import { EOR, RecordType, ErrorCode } from './const';
import * as Debug from './Debug';
import { Index, DecodeError } from './Util';

interface Field {
  name: string;
  type: NumberType;
  signature: number;
}

type FieldInput = readonly [number, NumberType]; // (Signature, NumberType)

type FieldInputs<T> = T extends object ? { [P in keyof T]: FieldInput } : FieldInput;

type SchemaConfig<T extends TimerEvent> = {
  [P in keyof T]: P extends 'type' ? T[P] : FieldInputs<T[P]>;
};

export class Schema<T extends TimerEvent> {
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
          const [signature, type] = field[name] as FieldInput;
          this.indexes.set(signature, name, { signature, name, type });
          this.slots.add(name);
        }
      }
    }
  }

  decode<U extends Binary>(source: U): T {
    const { length } = source;

    const fields: Record<string, number> = {};
    const slots: Array<Record<string, number>> = [];

    let slot: Record<string, number> | undefined;

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
            if (name === 'slotIndex' /* Kludge */) {
              if (slot) slots.push(slot); // Push the slot data into the array if it exists
              slot = { slotIndex: data }; // Restart collecting slot data
            } else if (slot) {
              slot[name] = data;
            } else {
              Debug.error(`Unhandled slot field: ${name}`);
            }
          }
        } else {
          throw new DecodeError(ErrorCode.SizeError);
        }
      } else {
        Debug.warn(
          `Unknown field signature: 0x${signature.toString(16)} in record type: ${this.type}`
        );
      }
    }

    // * At this point, there could still be data left in `slot`
    if (slot) slots.push(slot);

    // Verify fields are properly formed
    for (const name in this.fields) {
      if (typeof fields[name] !== 'number') {
        const msg = `Record of type: ${this.type} is missing field: ${name}`;
        throw new Error(msg);
      }
    }

    if (slots.length > 0) {
      // Verify slots are properly formed
      for (let i = 0, len = slots.length; i < len; i++) {
        const slot = slots[i];
        for (const name in this.slots) {
          if (typeof slot[name] !== 'number') {
            const msg = `Record of type: ${this.type} is missing slot field: ${name}`;
            throw new Error(msg);
          }
        }
      }

      return ({ type: this.type, ...fields, slots } as unknown) as T;
    } else {
      return { type: this.type, ...fields } as T;
    }
  }
}

function isFieldInput<T extends TimerEvent>(
  o: SchemaConfig<T>,
  k: Extract<keyof T, string>
): boolean {
  return typeof o[k] === 'object' && Array.isArray(o[k]);
}
