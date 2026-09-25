<p align="center">
  <img src=".github/github-header.png" alt="xplant_os" width="full"/>
</p>
<p align="center">
  Open-source SDKs, firmware, and hardware bridges for connecting physical lab devices to <a href="https://www.xplantpro.com">xPlant</a>.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-CSL%20v1.1-green" alt="License"></a>
  <a href="https://github.com/shmaplex/xplant_os/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome"></a>
  <a href="#"><img src="https://img.shields.io/badge/Discord-join%20us-7289da" alt="Discord"></a>
</p>

---

xplant_os is the open-source companion to [xPlant](https://www.xplantpro.com) — a collection of SDKs, firmware examples, and hardware bridges for connecting physical lab devices and external software to your xPlant workspace.

The xPlant application itself, user data and credentials are never part of this repository.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Packages](#packages): JavaScript/TypeScript SDK
- [Devices](#devices) — ESP32, Raspberry Pi, ESPHome, Tasmota
- [Examples](#examples) — Minimal working examples
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Getting Started

**📖 Full documentation: [docs.xplantpro.com](https://docs.xplantpro.com)**: quickstart, guides, every endpoint, and AI-friendly Markdown of every page.

**1. Get a key**

In xPlant, open **Settings > Integrations > [API Keys](https://app.xplantpro.com/settings/integrations/api-keys)** and create a key with only the [scopes](https://docs.xplantpro.com/docs/scopes) you need. Workspace keys start with `xpk_live_` or `xpk_dev_` (both act on your real workspace; there is no sandbox). Keep them on servers and scripts you control, never in source control.

**2. Devices get device tokens, not keys**

A Raspberry Pi, an ESP32 or any other box in the lab carries a **device token** (`xpd_…`) that can only post its own readings, events and heartbeats. Use your workspace key once, from your own computer, to [register the device and create its token](https://docs.xplantpro.com/docs/device-tokens).

**3. Pick your starting point**

| I have... | Start here |
|---|---|
| ESP32 or Arduino | [`devices/arduino/esp32-sensor/`](devices/arduino/esp32-sensor/) |
| Raspberry Pi | [`devices/raspberry-pi/pi-gateway/`](devices/raspberry-pi/pi-gateway/) |
| ESPHome device | [`devices/esphome/`](devices/esphome/) |
| Tasmota device | [`devices/tasmota/`](devices/tasmota/) |
| Node.js / TypeScript project | [`@shmaplex/xplant-sdk`](https://github.com/shmaplex/xplant_sdk) |
| Just want to try the API | [Quickstart](https://docs.xplantpro.com/docs/quickstart) |

---

## Packages

### `@shmaplex/xplant-sdk`: JavaScript / TypeScript SDK

The SDK lives in its own repository: **[shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk)**

```bash
npm install @shmaplex/xplant-sdk
```

A typed client for the xPlant API, for Node.js and modern browsers, with retries, idempotency and paging built in.

```typescript
import { XPlantClient } from "@shmaplex/xplant-sdk";

// On a server or in a script: a workspace key.
const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY });
const tasks = await client.tasks.list({ status: "todo" });

// On a device: a device token.
const device = new XPlantClient({ deviceToken: process.env.XPLANT_DEVICE_TOKEN });
await device.sensorReadings.create({
  device_id: process.env.XPLANT_DEVICE_ID,
  type: "temperature",
  value: 24.5,
  unit: "C",
});
```

See the [SDK README](https://github.com/shmaplex/xplant_sdk#readme) and the [SDK page](https://docs.xplantpro.com/docs/sdk) for more.

---

## Devices

### Arduino / ESP32

| Package | Description |
|---|---|
| [`esp32-sensor`](devices/arduino/esp32-sensor/) | ESP32 + DHT22/BME280: posts temperature and humidity readings |
| [`esp32-scan-station`](devices/arduino/esp32-scan-station/) | Stub: barcode/QR scan station concept |
| [`nano-button`](devices/arduino/nano-button/) | Stub: Arduino Nano physical event button |

### Raspberry Pi

| Package | Description |
|---|---|
| [`pi-gateway`](devices/raspberry-pi/pi-gateway/) | Python MQTT/serial → xPlant HTTP bridge |
| [`pi-bench-kiosk`](devices/raspberry-pi/pi-bench-kiosk/) | Stub: bench-top touchscreen kiosk |

### ESPHome

[`devices/esphome/`](devices/esphome/) — YAML templates for ESPHome-flashed devices.

### Tasmota

[`devices/tasmota/`](devices/tasmota/) — Webhook rule examples for Tasmota firmware.

---

## Examples

| Example | Description |
|---|---|
| [`basic-sensor`](examples/basic-sensor/) | Post sensor readings and a heartbeat with a device token, in curl, Node.js or Python |
| [`transfer-counter`](examples/transfer-counter/) | Record a transfer via the API |
| [`contamination-check`](examples/contamination-check/) | Planned: log a contamination observation, once that endpoint ships |
| [`local-dashboard`](examples/local-dashboard/) | Concept: local sensor dashboard pulling from xPlant |

---

## Documentation

The documentation site at **[docs.xplantpro.com](https://docs.xplantpro.com)** is built from [`docs/`](docs/) in this repository:

| | |
|---|---|
| [Quickstart](https://docs.xplantpro.com/docs/quickstart) | A first call in five minutes |
| [Authentication](https://docs.xplantpro.com/docs/authentication) | Workspace keys and device tokens |
| [Scopes](https://docs.xplantpro.com/docs/scopes) | All 34 scopes and the endpoints they unlock |
| [API reference](https://docs.xplantpro.com/docs/api) | Every endpoint, generated from the OpenAPI spec |
| [Guides](https://docs.xplantpro.com/docs/guides) | Task sync, SOP runs, label scanning, sensors and more |
| [llms-full.txt](https://docs.xplantpro.com/llms-full.txt) | The whole API as one Markdown file, for AI assistants |

To run the site locally, see [`docs/README.md`](docs/README.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. The short version:

1. Fork and clone the repo
2. Create a branch: `feature/my-device` or `fix/my-fix`
3. Follow the directory conventions (each device gets its own folder with a `README.md`)
4. Open a PR — use the PR template

---

## Security

See [SECURITY.md](SECURITY.md). The key rules: **never commit keys or tokens**, and **never put a workspace key on a device**. If you accidentally push a key, revoke it immediately in **Settings > Integrations > [API Keys](https://app.xplantpro.com/settings/integrations/api-keys)**.

Report vulnerabilities to security@shmaplex.com.

---

## License

Licensed under the [Common Sense License (CSL) v1.1](https://github.com/shmaplex/csl).

- Small-scale and community users may freely use and modify this software.
- Large-scale commercial users (>$10M annual revenue) must contribute back proportionally.
- Ethical use restrictions apply: not for military, surveillance, labor exploitation, or environmental harm.

```
Copyright (C) 2025 Shmaplex

This source code is licensed under the Common Sense License (CSL) v1.1.
You may obtain a copy of the license at: https://github.com/shmaplex/csl
```
