# A Node.js LapRF Protocol Library

A library, written in TypeScript, to encode and decode ImmersionRC LapRF binary messages.

## Concept

Convert all the data coming from a LapRF into a form that is easily converted to
and from JSON, or consumed directly in a JavaScript application.

## API

### Protocol Static Method: getRctTime

```ts
Protocol.getRctTime(): Uint8Array
```

Serialize a LapRF packet to request the rtc time.

### Protocol Static Method: getMinLapTime

```ts
Protocol.getMinLapTime(): Uint8Array
```

Serialize a LapRF packet to request the minimum lap time.

### Protocol Static Method: setMinLapTime

```ts
Protocol.setMinLapTime(milliseconds: number): Uint8Array
```

Serialize a LapRF packet to set the minimum lap time.

### Protocol Static Method: getRfSetup

```ts
Protocol.getRfSetup(slotIndex?: number): Uint8Array
```

Serialize a LapRF packet to request the rfSetup of either an individual slot, or all
slots if `slotIndex` isn't provided.

### Protocol Static Method: setRfSetup

```ts
Protocol.setRfSetup(input: {
  slotId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  channelName: string;
  gain: number;
  threshold: number;
  enabled: boolean;
}): Uint8Array
```

Serialize a LapRF packet to configure a rfSetup slot.

### Protocol Static Method: decode

```ts
Protocol.decode(packet: ArrayBuffer): DeviceRecord[]
```

Takes an `ArrayBuffer` containing a LapRF packet and return an array of `DeviceRecord`s
(A LapRF packet can contain more than one record).

#### DeviceRecord Types

```ts
interface RfSetupRecord {
  type: 'rfSetup';
  slotId: SlotId;
  enabled: number;
  channel: number;
  band: number;
  threshold: number;
  gain: number;
  frequency: number;
}

interface RssiRecord {
  type: 'rssi';
  slotId: SlotId;
  minRssi: number;
  maxRssi: number;
  meanRssi: number;
}

interface SettingsRecord {
  type: 'settings';
  updatePeriod: number;
  saveSettings: number;
  minLapTime: number;
}

interface PassingRecord {
  type: 'passing';
  slotId: SlotId;
  rtcTime: number;
  decoderId: number;
  passingNumber: number;
  peakHeight: number;
  flags: number;
}

interface StatusRecord {
  type: 'status';
  flags: number;
  gateState: number;
  batteryVoltage: number;
  detectionCount: number;
  slots: {
    slotId: SlotId;
    lastRssi: number;
  };
}

interface TimeRecord {
  type: 'time';
  rtcTime: number;
  timeRtcTime: number;
}

type DeviceRecord =
  | RfSetupRecord
  | RssiRecord
  | SettingsRecord
  | PassingRecord
  | StatusRecord
  | TimeRecord;
```

## Example:

```typescript
import { Socket } from 'net';
import { Protocol } from '@fpvcult/laprf';

const client = new Socket();

client.connect(5403, '192.168.1.9');

client.write(Protocol.setMinLapTime(10_000));

client.on('data', (buffer: Buffer) => {
  const records = Protocol.decode(buffer.buffer); // Argument is an ArrayBuffer
  // ... do something with the records
});
```

## Notes

Inspired by [IRCSwiftyLapRF](https://github.com/hydrafpv/irc-swifty-laprf) and
[LapRFUtilities](https://github.com/ImmersionRC/LapRFUtilities)
