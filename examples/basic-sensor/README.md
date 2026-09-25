# Basic Sensor Example

The simplest way to post a sensor reading to xPlant — three implementations, same result.

Choose the one that matches your setup:

| File | Language | Dependencies |
|---|---|---|
| `curl-example.sh` | Bash/curl | curl (pre-installed on most systems) |
| `node-example.mjs` | Node.js 18+ | `@shmaplex/xplant-sdk` (or just `fetch`) |
| `python-example.py` | Python 3 | `requests` |

---

## Before you start

These examples post as a **device**, with a device token (`xpd_…`), the same way real hardware should. Never put a workspace key (`xpk_…`) on a device.

1. **Create a workspace key** with the `write:devices` scope at [app.xplantpro.com/settings/integrations/api-keys](https://app.xplantpro.com/settings/integrations/api-keys). Keep it on your own computer.
2. **Register a device and create its token.** Follow [Device tokens: setting up a device](https://docs.xplantpro.com/docs/device-tokens#setting-up-a-device). You'll get the device's id and an `xpd_` token, shown once.

Set these as environment variables before running any example:

```bash
export XPLANT_DEVICE_TOKEN="xpd_live_YOUR_TOKEN_HERE"
export XPLANT_DEVICE_ID="YOUR_DEVICE_UUID"
```

---

## What it posts

All three examples post the same payload:

```json
{
  "device_id": "YOUR_DEVICE_UUID",
  "type": "temperature",
  "value": 24.5,
  "unit": "C"
}
```

A successful response is `{"ok": true, "data": {...}}`. A failure is `{"ok": false, "data": null, "error": "...", "code": "..."}`; see [Errors](https://docs.xplantpro.com/docs/errors).

---

## Next steps

- Add humidity: post a second reading with `"type": "humidity"` and `"unit": "%"`
- Set up real hardware: [ESP32 sensor](../../devices/arduino/esp32-sensor/README.md) or [Pi gateway](../../devices/raspberry-pi/pi-gateway/README.md)
- Batch your readings once you post more than one a minute: [Sensors and devices](https://docs.xplantpro.com/docs/guides/sensors-and-devices)
- Read the full API reference: [docs.xplantpro.com/docs/api](https://docs.xplantpro.com/docs/api)
