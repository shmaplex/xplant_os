# @xplant/sdk

Official JavaScript/TypeScript client for the [xPlant](https://xplant.shmaplex.com) external API.

Works in Node.js (18+) and modern browsers.

---

## Installation

```bash
npm install @xplant/sdk
```

---

## Quick start

```typescript
import { XPlantClient } from "@xplant/sdk";

const client = new XPlantClient({
  apiKey: process.env.XPLANT_API_KEY, // xpk_live_YOUR_KEY_HERE
});

// Post a temperature reading
await client.sensorReadings.create({
  device_id: "your-device-uuid",
  type: "temperature",
  value: 24.5,
  unit: "C",
});

// Post a humidity reading
await client.sensorReadings.create({
  device_id: "your-device-uuid",
  type: "humidity",
  value: 72.1,
  unit: "%",
});

// Send a heartbeat
await client.devices.heartbeat("your-device-uuid");
```

---

## API

### `new XPlantClient(config)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your xPlant API key |
| `baseUrl` | `string` | `"https://xplant.shmaplex.com"` | Override for testing |

---

### `client.sensorReadings`

#### `.create(payload: SensorReadingPayload): Promise<SensorReading>`

Post a sensor reading. Fields: `device_id`, `type`, `value`, `unit`, `timestamp` (optional).

#### `.list(deviceId: string): Promise<SensorReading[]>`

List recent readings for a device.

---

### `client.devices`

#### `.heartbeat(deviceId: string, metadata?: object): Promise<{ last_seen_at: string }>`

Signal that a device is alive.

#### `.get(deviceId: string): Promise<DeviceSummary>`

Fetch metadata for a registered device.

---

### `client.plants`

#### `.list(): Promise<PlantSummary[]>`

List plant summaries for the workspace. Requires `plants:read` scope.

---

### `client.tasks`

#### `.list(): Promise<TaskSummary[]>`

List tasks for the workspace. Requires `tasks:read` scope.

---

### `client.labels`

#### `.resolve(barcode: string): Promise<LabelResolveResult>`

Resolve a barcode or QR code to its linked record. Requires `labels:read` scope.

---

## Getting an API key

1. Log in to [xplant.shmaplex.com](https://xplant.shmaplex.com)
2. Go to **Settings > Integrations > API Keys**
3. Generate a key and store it securely

Never commit your API key. Use an environment variable:

```bash
XPLANT_API_KEY=xpk_live_YOUR_KEY_HERE node my-script.mjs
```

---

## License

[Common Sense License (CSL) v1.1](https://github.com/shmaplex/csl)
