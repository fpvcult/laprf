import { RecordType } from "./Const";

export class SerialError extends Error {
  constructor(msg: string = "An unknown error occured while parsing") {
    super(`SerialError: ${msg}`);
    Object.setPrototypeOf(this, SerialError.prototype);
  }
}

export class EorError extends SerialError {
  constructor() {
    super("Unable to find EOR after finding SOR");
  }
}

export class SorError extends SerialError {
  constructor() {
    super("Unable to find SOR in packet");
  }
}

export class SizeError extends SerialError {
  constructor(
    recordType: number,
    signature: number,
    size: number,
    isSignatureValid: boolean = true
  ) {
    const r = RecordType[recordType];
    const s = signature.toString(16);
    let msg = `Unknown size: ${size}, found on RecordType.${r} `;

    msg += isSignatureValid
      ? ` signature 0x${s}`
      : ` of an unknown signature 0x${s}`;

    super(msg);
  }
}

export class SignatureError extends SerialError {
  constructor(recordType: number, signature: number) {
    const r = RecordType[recordType];
    const s = signature.toString(16);
    super(`Unknown signature: 0x${s}, found on RecordType.${r}`);
  }
}

export class RecordTypeError extends SerialError {
  constructor(recordType: number | string) {
    let msg: string = "Unknown record type: ";
    if (typeof recordType === "number") {
      msg += `0x${recordType.toString(16)}`;
    } else {
      msg += recordType;
    }
    super(msg);
  }
}
