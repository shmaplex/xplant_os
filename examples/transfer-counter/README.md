# Transfer Counter Example

Log a lab transfer (subculture) event to xPlant from an external device or script.

---

## What is a transfer event?

In plant tissue culture, a "transfer" is when explants are moved from one vessel to fresh media. Tracking transfers is important for:

- Counting subculture generations
- Scheduling future transfers
- Auditing contamination sources

---

## API call

Post to `/api/v1/device-events` with `event_type: "transfer"` and a payload describing the transfer.

```bash
curl -X POST https://xplant.shmaplex.com/api/v1/device-events \
  -H "Authorization: Bearer YOUR_XPLANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "YOUR_DEVICE_UUID",
    "event_type": "transfer",
    "payload": {
      "source_batch": "XPL-BATCH-2025-001",
      "destination_batch": "XPL-BATCH-2025-042",
      "explant_count": 12,
      "media_type": "MS30",
      "technician_note": "Healthy growth, no contamination observed"
    }
  }'
```

---

## Node.js example

```javascript
import { XPlantClient } from "@xplant/sdk";

const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY });

// Log the transfer
await client.request("/api/v1/device-events", {
  method: "POST",
  body: JSON.stringify({
    device_id: process.env.XPLANT_DEVICE_ID,
    event_type: "transfer",
    payload: {
      source_batch: "XPL-BATCH-2025-001",
      destination_batch: "XPL-BATCH-2025-042",
      explant_count: 12,
    },
  }),
});
```

---

## Hardware button variant

A physical transfer counter button (Arduino Nano or ESP32) can post this event automatically when pressed. See the [nano-button stub](../../devices/arduino/nano-button/README.md) for the planned hardware design.

---

## Related

- [device-events endpoint](../../docs/api-reference.md#device-events)
- [ESP32 scan station](../../devices/arduino/esp32-scan-station/README.md) — scan a label barcode to identify the batch automatically
