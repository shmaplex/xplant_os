# Quickstart: Post your first sensor reading in 5 minutes

This guide walks you through posting a temperature reading to xPlant from your local machine. No hardware required — you just need `curl` or Node.js.

---

## Step 1: Get your API key

1. Log in to [xplant.shmaplex.com](https://xplant.shmaplex.com).
2. Go to **Settings > Integrations > API Keys**.
3. Click **Generate new key** and copy the value. It looks like:
   ```
   xpk_live_a1b2c3d4e5f6...
   ```
4. Store it somewhere safe. You will not be able to see it again after closing the dialog.

---

## Step 2: Note your device ID

Every physical device or virtual data source needs a UUID to identify it. You can register a device from **Settings > Integrations > Devices** and copy the UUID shown, or generate one with:

```bash
python3 -c "import uuid; print(uuid.uuid4())"
# or
node -e "console.log(require('crypto').randomUUID())"
```

---

## Step 3: Post a reading

Replace `YOUR_XPLANT_API_KEY` and `YOUR_DEVICE_UUID` with your real values.

### Using curl

```bash
curl -X POST https://xplant.shmaplex.com/api/v1/sensor-readings \
  -H "Authorization: Bearer YOUR_XPLANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "YOUR_DEVICE_UUID",
    "type": "temperature",
    "value": 24.5,
    "unit": "C",
    "timestamp": "2025-01-01T12:00:00Z"
  }'
```

A successful response returns HTTP 201 with a JSON body containing the created reading.

### Using Node.js

```javascript
const client = new (require("@shmaplex/xplant-sdk").XPlantClient)({
  apiKey: process.env.XPLANT_API_KEY,
});

await client.sensorReadings.create({
  device_id: "YOUR_DEVICE_UUID",
  type: "temperature",
  value: 24.5,
  unit: "C",
});
```

### Using Python

```python
import os, requests

resp = requests.post(
    "https://xplant.shmaplex.com/api/v1/sensor-readings",
    headers={"Authorization": f"Bearer {os.environ['XPLANT_API_KEY']}"},
    json={
        "device_id": "YOUR_DEVICE_UUID",
        "type": "temperature",
        "value": 24.5,
        "unit": "C",
    },
)
resp.raise_for_status()
print(resp.json())
```

---

## Step 4: Verify

Go to your xPlant workspace and navigate to the device you registered. You should see the reading appear in its data history.

---

## Next steps

- Set up a real sensor: [ESP32 + DHT22](../devices/arduino/esp32-sensor/README.md) or [Raspberry Pi gateway](../devices/raspberry-pi/pi-gateway/README.md)
- Learn about authentication and scopes: [docs/auth.md](auth.md)
- Browse all API endpoints: [docs/api-reference.md](api-reference.md)
