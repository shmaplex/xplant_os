# Transfer Counter Example

Record a transfer (a subculture onto fresh media) in xPlant from a script, a scanner or a button at the bench.

---

## What is a transfer?

In plant tissue culture, a transfer is moving explants from one vessel onto fresh media. Recording each one lets xPlant:

- count subculture cycles for every line,
- schedule the next transfer, and
- trace contamination back through a line's history.

---

## Before you start

You need a workspace API key with these scopes, from [Settings → Integrations → API Keys](https://app.xplantpro.com/settings/integrations/api-keys):

- `read:explants` (or `read:plants`), to look the record up
- `write:transfers`, to record the transfer

Transfers need a workspace key; a device token can't record them. Give the bench computer its own key with only these scopes, so a lost station can be revoked on its own.

```bash
export XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE"
```

---

## 1. Find the explant

If your own tracker knows the line by its own code, look it up by `external_id`:

```bash
curl "https://app.xplantpro.com/api/v1/explants?external_id=LINE-0412" \
  -H "Authorization: Bearer $XPLANT_API_KEY"
```

## 2. Record the transfer

Give exactly one of `plant_id` or `explant_id`. The transfer cycle counts up automatically unless you send `transfer_cycle`.

```bash
curl -X POST https://app.xplantpro.com/api/v1/transfers \
  -H "Authorization: Bearer $XPLANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "explant_id": "YOUR_EXPLANT_UUID",
    "from_location": "Shelf A2",
    "to_location": "Shelf B1",
    "notes": "Routine subculture"
  }'
```

---

## Node.js

```javascript
import { XPlantClient } from "@shmaplex/xplant-sdk";

const client = new XPlantClient({ apiKey: process.env.XPLANT_API_KEY });

const explant = await client.explants.findByExternalId("LINE-0412");
if (!explant) throw new Error("No explant with that code in this workspace");

const transfer = await client.transfers.create({
  explant_id: explant.id,
  from_location: "Shelf A2",
  to_location: "Shelf B1",
});
console.log("Recorded transfer", transfer.id);
```

## Python

```python
import os
import requests

BASE = "https://app.xplantpro.com/api/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['XPLANT_API_KEY']}"}

matches = requests.get(f"{BASE}/explants", headers=HEADERS, params={"external_id": "LINE-0412"}, timeout=10).json()["data"]
if not matches:
    raise SystemExit("No explant with that code in this workspace")

body = requests.post(
    f"{BASE}/transfers",
    headers=HEADERS,
    json={"explant_id": matches[0]["id"], "from_location": "Shelf A2", "to_location": "Shelf B1"},
    timeout=10,
).json()
if not body["ok"]:
    raise SystemExit(f"{body['code']}: {body['error']}")
print("Recorded transfer", body["data"]["id"])
```

---

## Hardware button variant

A physical button (Arduino Nano or ESP32) next to a scanner can record the transfer when pressed: scan the vessel label, press the button. See the [nano-button stub](../../devices/arduino/nano-button/README.md) for the planned design.

---

## Related

- [Record transfers and stages guide](https://docs.xplantpro.com/docs/guides/transfers-and-stages)
- [Record a transfer (API reference)](https://docs.xplantpro.com/docs/api/transfers-and-stages/create-transfer)
- [Label scanning](https://docs.xplantpro.com/docs/guides/label-scanning): scan a label to find the record automatically
