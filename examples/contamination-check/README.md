# Contamination Check Example

Record a contamination observation from an external device or script.

---

## Use case

When a technician visually inspects a culture vessel and detects contamination, they can log the observation immediately — without having to find a computer and navigate to xPlant. This example shows how to post that observation via the API from a script, barcode scanner, or custom button device.

---

## API call

```bash
curl -X POST https://xplant.shmaplex.com/api/v1/device-events \
  -H "Authorization: Bearer YOUR_XPLANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "YOUR_DEVICE_UUID",
    "event_type": "contamination_observed",
    "payload": {
      "batch_id": "XPL-BATCH-2025-001",
      "vessel_label": "XPL-2025-001-V04",
      "contamination_type": "bacterial",
      "severity": "moderate",
      "note": "White fuzzy growth on medium surface, 2 vessels affected"
    }
  }'
```

---

## Python example

```python
import os, requests

resp = requests.post(
    "https://xplant.shmaplex.com/api/v1/device-events",
    headers={"Authorization": f"Bearer {os.environ['XPLANT_API_KEY']}"},
    json={
        "device_id": os.environ["XPLANT_DEVICE_ID"],
        "event_type": "contamination_observed",
        "payload": {
            "batch_id": "XPL-BATCH-2025-001",
            "contamination_type": "bacterial",
            "severity": "moderate",
        },
    },
)
resp.raise_for_status()
print(resp.json())
```

---

## Contamination type values

The `contamination_type` field is a free-form string. Common values used in xPlant:

- `bacterial` — cloudy medium, slimy growth
- `fungal` — fuzzy or powdery growth, often white, black, or green
- `viral` — unusual plant symptoms (mosaic, stunting)
- `unknown` — contamination present but type unclear

---

## Related

- [API reference — device events](../../docs/api-reference.md#device-events)
- [ESP32 scan station](../../devices/arduino/esp32-scan-station/README.md) — scan a vessel label to identify it automatically
