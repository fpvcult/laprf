export const enum DebugLevel {
  Log,
  Warn,
  Error,
  None,
}

export const DEBUG: DebugLevel = DebugLevel.Warn;

export function log(message: string) {
  if (DEBUG === DebugLevel.Log) console.log(message);
}

export function warn(message: string) {
  if (DEBUG === DebugLevel.Log || DEBUG === DebugLevel.Warn) console.warn(message);
}

export function error(message: string) {
  if (DEBUG !== DebugLevel.None) console.error(message);
}

export function isWarning() {
  return !(DEBUG === DebugLevel.Error || DEBUG === DebugLevel.None);
}
