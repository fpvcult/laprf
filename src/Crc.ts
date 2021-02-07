/* eslint-disable no-bitwise */
import { ErrorCode } from './const';

const crc16Table: Uint16Array = (function () {
  const length = 256;
  const table = new Uint16Array(length);
  let remainder = 0;

  for (let i = 0; i < length; i++) {
    remainder = (i << 8) & 0xff00;
    for (let j = 8; j > 0; j--) {
      if ((remainder & 0x8000) === 0x8000) {
        remainder = ((remainder << 1) & 0xffff) ^ 0x8005;
      } else {
        remainder = (remainder << 1) & 0xffff;
      }
    }
    table[i] = remainder;
  }
  return table;
})();

function reflect(input: number, nbits: number): number {
  let shift: number = input;
  let output = 0;
  for (let i = 0; i < nbits; i++) {
    if ((shift & 0x01) === 0x01) {
      output |= 1 << (nbits - 1 - i);
    }
    shift >>= 1; // shift = shift >> 1;
  }
  return output;
}

export function compute(buffer: DataView): number {
  let remainder = 0;

  for (let offset = 0, len = buffer.byteLength; offset < len; offset++) {
    let a = reflect(buffer.getUint8(offset), 8);
    a &= 0xff;
    const b = (remainder >> 8) & 0xff;
    const c = (remainder << 8) & 0xffff;
    const data = a ^ b;
    remainder = crc16Table[data] ^ c;
  }

  return reflect(remainder, 16);
}

/**
 * Verify a LapRF record by performing a cyclic redundancy check (CRC).
 * WARNING: The `buffer` is modified in order to verify the CRC.
 * @param {DataView} buffer A LapRF record to verify.
 * @returns {void} Throw an error if there is a CRC mismatch.
 */
export function verify(buffer: DataView): void {
  const crcRecord = buffer.getUint16(3, true);
  buffer.setUint16(3, 0, true); // Zero the CRC before computing
  const crcComputed = compute(buffer);
  if (!(crcRecord === crcComputed)) {
    throw new Error(`[LapRF Error] ${ErrorCode.CrcMismatch}`);
  }
}
