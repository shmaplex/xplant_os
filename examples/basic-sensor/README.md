# Basic Sensor Example

The simplest way to post a sensor reading to xPlant — three implementations, same result.

Choose the one that matches your setup:

| File | Language | Dependencies |
|---|---|---|
| `curl-example.sh` | Bash/curl | curl (pre-installed on most systems) |
| `node-example.mjs` | Node.js | `@xplant/sdk` (or just `fetch`) |
| `python-example.py` | Python 3 | `requests` |

---

## Before you start

1. **Get your API key** — [xplant.shmaplex.com/settings/integrations](https://xplant.shmaplex.com/settings/integrations)
2. **Register a device** — Settings > Integrations > Devices → copy the UUID

Set these as environment variables before running any example:

```bash
export XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE"
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

A successful response is HTTP `201 Created` with a JSON body.

---

## Next steps

- Add humidity: post a second reading with `"type": "humidity"` and `"unit": "%"`
- Set up real hardware: [ESP32 sensor](../../devices/arduino/esp32-sensor/README.md) or [Pi gateway](../../devices/raspberry-pi/pi-gateway/README.md)
- Read the full API reference: [docs/api-reference.md](../../docs/api-reference.md)
