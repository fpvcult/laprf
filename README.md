# A Node.js LapRF Protocol Library

A library, written in TypeScript, to encode and decode ImmersionRC LapRF binary messages.

## Concept

The idea is to convert all the data coming from a LapRF into a form that is
easily converted to and from JSON, or consumed directly in a JavaScript application.

```
{ "type": "settings", "fields": [ [ "minLapTime", 6000 ], ... ] }
```

## API

### IRecord Interface

```typescript
interface IRecord {
  type: string; // recordType
  fields: Array<[string, number]>; // [[fieldName: string, data: number], ...]
}
```

### Class Method: encode

`encode(record: IRecord): Buffer`

Takes an object implementing `IRecord` and returns a `Buffer` encoded with the contents.

### Class Method: decode

`decode(record: Buffer): IRecord`

Takes a `Buffer` containing a LapRF record and returns an object implementing `IRecord`.

## Example:

```typescript
import { Socket } from "net";
import LapRFSerialProtocol, { IRecord } from "./index";

const client = new Socket();
const laprf = new LapRFSerialProtocol();

client.connect(5403, "192.168.1.9");

client.write(
  laprf.encode({
    type: "settings",
    fields: [["minLapTime", 6000]]
  })
);
```

Inspired by:

- [IRCSwiftyLapRF](https://github.com/hydrafpv/irc-swifty-laprf)
- [LapRFUtilities](https://github.com/ImmersionRC/LapRFUtilities)
