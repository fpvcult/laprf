import { NumberType } from '@bitmachina/binary';

export function unknownRecordType(signature: number | string): string {
  let msg = 'Unknown record type: ';
  if (typeof signature === 'number') {
    msg += `0x${signature.toString(16)}`;
  } else {
    msg += signature;
  }
  return msg;
}

export function unknownFieldType(signature: number | string) {
  let msg = 'Unknown field type: ';
  if (typeof signature === 'number') {
    msg += `0x${signature.toString(16)}`;
  } else {
    msg += signature;
  }
  return msg;
}

export function sizeMismatch(size: number, type: NumberType) {
  return `Size Mismatch: received ${size}, expected ${type.byteLength}`;
}
