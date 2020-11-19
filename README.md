# A Node.js LapRF Protocol Library

A library, written in TypeScript, to encode and decode ImmersionRC LapRF binary messages.

## Concept

Convert all the data coming from a LapRF into a form that is easily converted to
and from JSON, or consumed directly in a JavaScript application.

```json
{ "type": "settings", "fields": [ [ "minLapTime", 6000 ], ... ] }
```

## API

### Class Method: encode

`encode(record: Record): Buffer`

Take an object implementing `Record` and return a `Buffer` encoded with the contents.

### Class Method: decode

`decode(packet: Buffer): Record[]`

Take a `Buffer` containing a LapRF packet and return an array of objects implementing
`Record` (A LapRF packet can contain more than one record).

### Record Interface

```typescript
interface Record {
  type: string; // recordType
  fields: Array<[string, number]>; // [[fieldName: string, data: number], ...]
}
```

## Example:

```typescript
import { Socket } from 'net';
import { LapRF, Record } from './index';

const client = new Socket();
const laprf = new LapRF();

client.connect(5403, '192.168.1.9');

client.write(
  laprf.encode({
    type: 'settings',
    fields: [['minLapTime', 6000]],
  })
);

client.on('data', (chunk) => {
  const records = laprf.decode(chunk);
  // ... do something with the records
});
```

## Notes

Inspired by [IRCSwiftyLapRF](https://github.com/hydrafpv/irc-swifty-laprf) and
[LapRFUtilities](https://github.com/ImmersionRC/LapRFUtilities)
