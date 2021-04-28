# A Node.js LapRF Protocol Library

A library, written in TypeScript, to encode and decode ImmersionRC LapRF binary messages.

## Concept

Convert all the data coming from a LapRF into a form that is easily converted to
and from JSON, or consumed directly in a JavaScript application.

## API

```ts
class Protocol {
  // Serialize a LapRF packet to request the rtc time.
  static getRctTime(): Uint8Array;

  // Serialize a LapRF packet to request the minimum lap time.
  static getMinLapTime(): Uint8Array;

  // Serialize a LapRF packet to set the minimum lap time.
  static setMinLapTime(milliseconds: number): Uint8Array;

  // Serialize a LapRF packet to set the status interval.
  static setStatusInterval(milliseconds: number): Uint8Array {

  // Serialize a LapRF packet to request the rfSetup of either an individual slot,
  // or all slots if `slotIndex` isn't provided.
  static getRfSetup(slotIndex?: number): Uint8Array;

  // Serialize a LapRF packet to configure a rfSetup slot.
  static setRfSetup(input: {
    slotId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    channelName: ChannelName;
    gain: number;
    threshold: number;
    enabled: boolean;
  }): Uint8Array;

  // Takes an `DataView` containing a LapRF packet and return an array of
  // `DeviceRecord`s (A LapRF packet can contain more than one record).
  static decode(packet: DataView): DeviceRecord[];
}
```

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
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const records = Protocol.decode(view); // Argument needs to be an DataView

  // ... do something with the records
});
```

## Notes

Inspired by [IRCSwiftyLapRF](https://github.com/hydrafpv/irc-swifty-laprf) and
[LapRFUtilities](https://github.com/ImmersionRC/LapRFUtilities)
