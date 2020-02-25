import { ErrorCode } from './const';

export interface IndexOf<T> {
  [key: string]: T;
  [index: number]: T;
}

export class Index<T> {
  private indexes: IndexOf<T> = {};

  set(signature: number, name: string, item: T) {
    this.indexes[signature] = item;
    this.indexes[name] = item;
  }

  get(key: string | number): T | undefined {
    return this.indexes[key];
  }
}

export class TimerError extends Error {
  constructor(readonly code: ErrorCode, message = 'An LapRF error occurred.') {
    super(message);
    Object.setPrototypeOf(this, TimerError.prototype);
  }
}
export class EncodeError extends TimerError {
  constructor(readonly code: ErrorCode, message = 'An error occurred while encoding a packet') {
    super(code, message);
  }
}

export class DecodeError extends TimerError {
  constructor(readonly code: ErrorCode, message = 'An error occurred while decoding a packet') {
    super(code, message);
  }
}
