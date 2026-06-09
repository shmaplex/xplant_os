# Local Dashboard (Concept)

A minimal local web dashboard that pulls live sensor readings from xPlant and displays them on a lab bench display.

---

## Concept

This example is a starting point for building a local dashboard — a simple web page or terminal display that:

- Polls `GET /api/v1/sensor-readings?device_id=...` every 30 seconds
- Displays current temperature, humidity, and other readings
- Shows device online/offline status based on heartbeat recency

This is useful for a wall-mounted screen in a growth room, a Raspberry Pi kiosk, or any secondary display that should show live conditions at a glance.

---

## Minimal Node.js polling script

```javascript
// dashboard-poll.mjs
// Prints live sensor readings to the terminal every 30 seconds

import { XPlantClient } from "@shmaplex/xplant-sdk";

const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY });
const deviceId = process.env.XPLANT_DEVICE_ID;

async function poll() {
  const readings = await client.sensorReadings.list(deviceId);
  console.clear();
  console.log(`=== xPlant Live Readings — ${new Date().toLocaleTimeString()} ===\n`);
  for (const r of readings.slice(0, 5)) {
    console.log(`  ${r.type.padEnd(12)} ${r.value} ${r.unit}`);
  }
}

// Poll immediately, then every 30 seconds
poll();
setInterval(poll, 30_000);
```

Run with:

```bash
XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE" \
XPLANT_DEVICE_ID="YOUR_DEVICE_UUID" \
node dashboard-poll.mjs
```

---

## Building a web UI

For a web-based dashboard, you could use:

- **Next.js** with server-side rendering — fetch from xPlant API server-side, render to HTML
- **Plain HTML + JS** — fetch from `/api/v1/sensor-readings` in the browser using your API key (only use a key with `sensor_readings:read` scope and treat it as semi-public if embedded in client-side code)
- **Grafana** — if you're already running a time-series database, bridge xPlant sensor data into InfluxDB or Prometheus and visualise with Grafana

---

## Want to build a full kiosk?

See the [Pi bench kiosk stub](../../devices/raspberry-pi/pi-bench-kiosk/README.md) for the planned hardware design. Contributions welcome.
