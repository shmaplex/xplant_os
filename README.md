<p align="center">
  <img src=".github/github-header.png" alt="xplant_os" width="full"/>
</p>
<p align="center">
  Open-source docs, SDK pointers, firmware and hardware bridges for connecting your lab's systems and devices to <a href="https://www.xplantpro.com">xPlant</a>.
</p>

<p align="center">
  <a href="https://docs.xplantpro.com"><img src="https://img.shields.io/badge/docs-docs.xplantpro.com-2f7d46" alt="Documentation"></a>
  <a href="https://github.com/shmaplex/xplant_sdk"><img src="https://img.shields.io/badge/SDK-shmaplex%2Fxplant__sdk-b7ef48" alt="JavaScript SDK"></a>
  <a href="https://github.com/shmaplex/csl"><img src="https://img.shields.io/badge/license-CSL%20v1.1-green" alt="License: CSL v1.1"></a>
  <a href="https://github.com/shmaplex/xplant_os/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome"></a>
</p>

---

**xplant_os** is the open-source companion to [xPlant](https://www.xplantpro.com), the lab management platform for plant tissue culture. It holds everything you need to connect your own systems to an xPlant workspace through the xPlant API:

- the source of the **API documentation** at [docs.xplantpro.com](https://docs.xplantpro.com),
- **firmware and gateways** for ESP32, Raspberry Pi, ESPHome and Tasmota devices,
- **small working examples** in curl, Node.js and Python.

The **JavaScript / TypeScript SDK** lives in its own repository: **[shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk)**.

The xPlant application itself, user data and credentials are never part of this repository.

## Quick links

| | |
|---|---|
| 📖 Documentation | [docs.xplantpro.com](https://docs.xplantpro.com) |
| 🚀 Quickstart | [A first call in five minutes](https://docs.xplantpro.com/docs/quickstart) |
| 📚 API reference | [Every endpoint, with scopes, schemas, errors and examples](https://docs.xplantpro.com/docs/api) |
| 📦 JavaScript / TypeScript SDK | [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk) · `npm install @shmaplex/xplant-sdk` |
| 🔑 Create an API key | [Settings → Integrations → API Keys](https://app.xplantpro.com/settings/integrations/api-keys) |
| 🤖 For AI assistants | [llms.txt](https://docs.xplantpro.com/llms.txt) · [llms-full.txt](https://docs.xplantpro.com/llms-full.txt) · [openapi.json](https://docs.xplantpro.com/openapi.json) |
| 💬 Support | [support@xplantpro.com](mailto:support@xplantpro.com) |

---

## Table of contents

- [How it fits together](#how-it-fits-together)
- [The API at a glance](#the-api-at-a-glance)
- [Plans and access](#plans-and-access)
- [Getting started](#getting-started)
- [Credentials: keys and device tokens](#credentials-keys-and-device-tokens)
- [JavaScript / TypeScript SDK](#javascript--typescript-sdk)
- [Other languages](#other-languages)
- [Devices](#devices)
- [Examples](#examples)
- [Documentation site](#documentation-site)
- [Repository layout](#repository-layout)
- [Contributing](#contributing)
- [Security](#security)
- [Support](#support)
- [License](#license)

---

## How it fits together

```
 Your scripts, schedulers,           Devices on the bench and in the
 dashboards, storefronts             grow room (Pi, ESP32, ESPHome…)
        │  workspace key (xpk_)              │  device token (xpd_)
        │  via @shmaplex/xplant-sdk          │  via firmware in devices/
        │  or plain HTTPS                    │
        └──────────────┐        ┌────────────┘
                       ▼        ▼
          https://app.xplantpro.com/api/v1   ← documented at docs.xplantpro.com
                       │
                       ▼
              Your xPlant workspace
```

- **The API** is the contract. Everything talks to `https://app.xplantpro.com/api/v1`.
- **The SDK** ([shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk)) is a typed JavaScript/TypeScript client for it.
- **The devices and examples here** show how to call it from hardware and scripts.
- **The docs** in [`docs/`](docs/) describe it, with the API reference generated from the OpenAPI spec.

## The API at a glance

| | |
|---|---|
| Base URL | `https://app.xplantpro.com/api/v1` (`www.xplantpro.com` is the marketing site; it doesn't serve the API) |
| Auth | `Authorization: Bearer <key or device token>`, see [Authentication](https://docs.xplantpro.com/docs/authentication) |
| Responses | `{"ok": true, "data": …}` or `{"ok": false, "data": null, "error": "…", "code": "STABLE_CODE"}`. Branch on `code`, see [Errors](https://docs.xplantpro.com/docs/errors). Every response has an `X-Request-Id` to quote to support |
| Permissions | 34 scopes, `read:` / `write:` per resource, fixed when a key is created, see [Scopes](https://docs.xplantpro.com/docs/scopes) |
| Rate limits | 1,000 requests/min per key or token, 3,000/min per workspace. Successes report what's left in `X-RateLimit-*` headers; going over answers `429` with `Retry-After`, see [Rate limits](https://docs.xplantpro.com/docs/rate-limits) |
| Safe retries | `Idempotency-Key` on supported writes, see [Idempotency](https://docs.xplantpro.com/docs/idempotency) |
| Paging | Every list pages by cursor (`meta.next_cursor`), see [Pagination](https://docs.xplantpro.com/docs/pagination) |
| Plans | Whole API on xPlant+ Teams and Enterprise; devices only on Hobby and Pro Lab, see [Plans and access](#plans-and-access) |
| Spec | [OpenAPI 3](https://docs.xplantpro.com/openapi.json) |

What you can do with it: read plants and explants, record transfers and stage changes, sync tasks and push demand signals, run SOPs from a bench station, resolve and log label scans, register devices and stream sensor readings, and record equipment use and maintenance. See the [guides](https://docs.xplantpro.com/docs/guides).

## Plans and access

| Plan | What API keys can do |
|---|---|
| xPlant+ Teams, Enterprise | The whole API: every scope |
| Hobby, Pro Lab | Connect devices only: register devices, manage their tokens, post readings and events |
| Free | No API access (`402 PAID_PLAN_REQUIRED`) |

- **A key never does more than its owner can in xPlant.** Reads need any active member, writes need `member`, and `read:pricing`, `read:commerce` and `write:demand` need `manager`. Above the owner's role, calls answer `403 FORBIDDEN`.
- **Scopes decide what a key can reach** within those limits. Grant the least it needs, and give each integration its own key.
- `GET /me` shows a key's `effectiveScopes`: what it can use right now.
- Plan allowances still apply: registering devices past the allowance answers `402 DEVICE_LIMIT_REACHED`. See [plans](https://www.xplantpro.com/en/subscriptions).
- Enterprise customers can scope organisation-specific integrations with us: [support@xplantpro.com](mailto:support@xplantpro.com).

Details: [Plans and access](https://docs.xplantpro.com/docs/authentication#plans-and-access).

---

## Getting started

**1. Get a key.** In xPlant, open **Settings → Integrations → [API Keys](https://app.xplantpro.com/settings/integrations/api-keys)** and create a key with only the [scopes](https://docs.xplantpro.com/docs/scopes) your integration needs. Copy it: it's shown once.

**2. Make a first call.**

```bash
export XPLANT_API_KEY="xpk_live_…"
curl https://app.xplantpro.com/api/v1/me -H "Authorization: Bearer $XPLANT_API_KEY"
```

`GET /me` needs no scope and tells you which key you're using and what it can do. The [quickstart](https://docs.xplantpro.com/docs/quickstart) takes it from there.

**3. Pick your starting point.**

| I have… | Start here |
|---|---|
| A Node.js or TypeScript project | The SDK: [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk) |
| A Python script or another language | The [quickstart](https://docs.xplantpro.com/docs/quickstart) and the [API reference](https://docs.xplantpro.com/docs/api) (Python examples on every page) |
| An ESP32 or Arduino | [`devices/arduino/esp32-sensor/`](devices/arduino/esp32-sensor/) |
| A Raspberry Pi | [`devices/raspberry-pi/pi-gateway/`](devices/raspberry-pi/pi-gateway/) |
| An ESPHome device | [`devices/esphome/`](devices/esphome/) |
| A Tasmota device | [`devices/tasmota/`](devices/tasmota/) |
| A bench station running SOPs | [Run an SOP from a bench station](https://docs.xplantpro.com/docs/guides/sop-runs) |

---

## Credentials: keys and device tokens

| | Workspace API key | Device token |
|---|---|---|
| Prefix | `xpk_live_` / `xpk_dev_` | `xpd_live_` / `xpd_dev_` |
| Can do | Whatever its scopes allow, across the workspace | Post readings, events and heartbeats for **one** device, nothing else |
| Lives on | Servers, scripts and integrations you control | The device itself |
| Created | In [Settings → Integrations → API Keys](https://app.xplantpro.com/settings/integrations/api-keys) | With the API, using a workspace key ([how](https://docs.xplantpro.com/docs/device-tokens)) |

- **Never put a workspace key on a device.** A device carries a device token, which can't read anything.
- `xpk_dev_` and `xpk_live_` keys behave identically and act on your real workspace. There is no sandbox.
- A key's scopes are fixed when it's created. To change them, create a new key, move the integration over, and revoke the old one.

---

## JavaScript / TypeScript SDK

**Repository: [github.com/shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk)** · Package: [`@shmaplex/xplant-sdk`](https://www.npmjs.com/package/@shmaplex/xplant-sdk)

```bash
npm install @shmaplex/xplant-sdk
```

A typed client for Node.js 18+ and any runtime with standard `fetch` (Deno, Bun, edge and serverless functions). It covers every v1 endpoint and has retries, timeouts, idempotency keys and paging built in. Call the API from your server, not a web page: keys don't belong in front-end code.

```typescript
import { XPlantClient, XPlantError } from "@shmaplex/xplant-sdk";

// On a server or in a script: a workspace key.
const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY, retry: true });

const me = await client.me.get();                       // which key, which scopes
const tasks = await client.tasks.list({ status: "todo" });

for await (const plant of client.plants.list()) {   // every page, fetched as you go
  console.log(plant.id);
}

try {
  await client.tasks.create({ title: "Check jar 47" }, { idempotencyKey: "bench-3-jar-47" });
} catch (err) {
  if (err instanceof XPlantError) console.error(err.status, err.code, err.message);
}

// On a device: a device token. The client refuses anything that isn't xpd_.
const device = new XPlantClient({ deviceToken: process.env.XPLANT_DEVICE_TOKEN });
await device.sensorReadings.createBatch([
  { device_id: process.env.XPLANT_DEVICE_ID, type: "temperature", value: 24.5, unit: "C" },
]);
```

- Full SDK documentation: the [SDK README](https://github.com/shmaplex/xplant_sdk#readme) and the [SDK page](https://docs.xplantpro.com/docs/sdk).
- Every endpoint page in the [API reference](https://docs.xplantpro.com/docs/api) shows the SDK call next to curl and Python.
- SDK bugs and feature requests go to [shmaplex/xplant_sdk issues](https://github.com/shmaplex/xplant_sdk/issues).

## Other languages

There's no official SDK outside JavaScript/TypeScript yet. The API is plain HTTPS and JSON:

- **Python:** every page of the [API reference](https://docs.xplantpro.com/docs/api) has a `requests` example, and [`examples/basic-sensor/python-example.py`](examples/basic-sensor/python-example.py) is a complete script.
- **Anything else:** generate a client from the [OpenAPI spec](https://docs.xplantpro.com/openapi.json), or use the curl examples as a template.

Want to maintain an SDK for another language? Open a [package proposal](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md).

---

## Devices

Every device authenticates with its own [device token](https://docs.xplantpro.com/docs/device-tokens).

### Arduino / ESP32

| Package | Description |
|---|---|
| [`esp32-sensor`](devices/arduino/esp32-sensor/) | ESP32 + DHT22/BME280: posts temperature and humidity readings and heartbeats |
| [`esp32-scan-station`](devices/arduino/esp32-scan-station/) | Concept: a standalone barcode/QR scan station |
| [`nano-button`](devices/arduino/nano-button/) | Concept: an Arduino Nano event button |

### Raspberry Pi

| Package | Description |
|---|---|
| [`pi-gateway`](devices/raspberry-pi/pi-gateway/) | Python bridge from serial/MQTT sensors to xPlant, with a systemd service |
| [`pi-bench-kiosk`](devices/raspberry-pi/pi-bench-kiosk/) | Concept: a bench-top touchscreen kiosk |

### ESPHome and Tasmota

| Package | Description |
|---|---|
| [`esphome`](devices/esphome/) | YAML for ESPHome-flashed sensors |
| [`tasmota`](devices/tasmota/) | Rules for Tasmota devices |

Guide: [Sensors and devices](https://docs.xplantpro.com/docs/guides/sensors-and-devices), which covers registering a device, batching readings and heartbeats.

---

## Examples

| Example | Description |
|---|---|
| [`basic-sensor`](examples/basic-sensor/) | Post sensor readings and a heartbeat with a device token, in curl, Node.js or Python |
| [`transfer-counter`](examples/transfer-counter/) | Look up an explant by your own code and record a transfer |
| [`contamination-check`](examples/contamination-check/) | Scan a vessel label and record a contamination against it |
| [`local-dashboard`](examples/local-dashboard/) | Concept: a local sensor dashboard pulling from xPlant |

---

## Documentation site

[docs.xplantpro.com](https://docs.xplantpro.com) is built from [`docs/`](docs/) with Next.js and Fumadocs:

| | |
|---|---|
| [Quickstart](https://docs.xplantpro.com/docs/quickstart) | A first call in five minutes |
| [Authentication](https://docs.xplantpro.com/docs/authentication) | Workspace keys and device tokens |
| [Scopes](https://docs.xplantpro.com/docs/scopes) | All 34 scopes and the endpoints they unlock |
| [Errors](https://docs.xplantpro.com/docs/errors) | Every error code and what to do about it |
| [API reference](https://docs.xplantpro.com/docs/api) | Every endpoint, generated from the OpenAPI spec |
| [Guides](https://docs.xplantpro.com/docs/guides) | Task sync, demand signals, transfers, SOP runs, label scanning, sensors, equipment, change history |
| [SDK](https://docs.xplantpro.com/docs/sdk) | Using [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk) |
| [Use with AI tools](https://docs.xplantpro.com/docs/ai-tools) | Every page as Markdown, plus `llms.txt` and `llms-full.txt` |

Run it locally:

```bash
cd docs
npm install
npm run dev      # http://localhost:3210
npm run check    # public-safety check + generated pages up to date
```

The API reference and the scopes page are generated from the vendored spec; see [`docs/README.md`](docs/README.md) before editing them.

---

## Repository layout

```
xplant_os/
  docs/                 the documentation site (docs.xplantpro.com)
    content/docs/       hand-written guides (MDX)
    content/docs/api/   generated API reference, don't edit by hand
    openapi/            the vendored OpenAPI spec and per-endpoint examples
    scripts/            spec sync, page generator, public-safety check
  devices/              firmware and gateways
    arduino/            ESP32 / Arduino sketches
    raspberry-pi/       Python gateway and kiosk concept
    esphome/            ESPHome YAML
    tasmota/            Tasmota rules
  examples/             minimal end-to-end examples
  .github/              issue and PR templates, CI
```

The SDK is not in this repository; it's at [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk).

---

## Contributing

Contributions are welcome, especially firmware for more hardware and fixes to the docs. See [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

1. Fork and clone the repo.
2. Create a branch: `feature/my-device` or `fix/my-fix`.
3. Follow the directory conventions: each device gets its own folder with a `README.md`, and placeholders instead of real keys or tokens.
4. For docs changes, run `npm run check` in `docs/`.
5. Open a PR using the template.

SDK changes go to [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk).

---

## Security

See [SECURITY.md](SECURITY.md). The key rules: **never commit keys or tokens**, and **never put a workspace key on a device**. If a key leaks, revoke it immediately in **Settings → Integrations → [API Keys](https://app.xplantpro.com/settings/integrations/api-keys)**.

Report vulnerabilities privately to **security@shmaplex.com**.

---

## Support

- Questions about the API or your integration: [support@xplantpro.com](mailto:support@xplantpro.com)
- Bugs in the firmware, examples or docs: [open an issue](https://github.com/shmaplex/xplant_os/issues/new/choose)
- Bugs in the SDK: [shmaplex/xplant_sdk issues](https://github.com/shmaplex/xplant_sdk/issues)

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
