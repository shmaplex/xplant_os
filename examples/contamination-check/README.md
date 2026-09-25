# Contamination Check Example

Log a contamination the moment a technician spots it, from a script, a scanner or a button at the bench, instead of walking to a computer.

---

## Before you start

You need a workspace API key with these scopes, from [Settings → Integrations → API Keys](https://app.xplantpro.com/settings/integrations/api-keys):

- `read:labels`, to turn a scanned vessel label into its record
- `write:contaminations`, to record the contamination

Contamination endpoints are part of the full API, which is included with xPlant+ Teams and Enterprise ([plans](https://www.xplantpro.com/en/subscriptions)). A bench station needs a workspace key because device tokens can't record contaminations. Give the station its own key with only these scopes.

```bash
export XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE"
```

---

## 1. Resolve the scanned label

```bash
curl "https://app.xplantpro.com/api/v1/labels/resolve?barcode=LINE-0412" \
  -H "Authorization: Bearer $XPLANT_API_KEY"
```

The answer's `record_type` (`plant` or `explant`) and `record_id` say which record the vessel belongs to.

## 2. Record the contamination

`type` and `issue` are required. Link it to the record with `plant_id` or `explant_id`.

```bash
curl -X POST https://app.xplantpro.com/api/v1/contaminations \
  -H "Authorization: Bearer $XPLANT_API_KEY" \
  -H "Idempotency-Key: scanner-3-line-0412-contamination" \
  -H "Content-Type: application/json" \
  -d '{
    "explant_id": "YOUR_EXPLANT_UUID",
    "type": "bacteria",
    "issue": "Cloudy halo around the base of the explant",
    "severity": "medium",
    "vessels_affected": 2,
    "affected_vessel_markings": "V04 / V05"
  }'
```

The `Idempotency-Key` makes a retry after a network hiccup safe: the same observation is recorded once.

---

## Python

```python
import os
import uuid

import requests

BASE = "https://app.xplantpro.com/api/v1"
HEADERS = {"Authorization": f"Bearer {os.environ['XPLANT_API_KEY']}"}


def log_contamination(barcode, issue, contamination_type="bacteria", severity="medium"):
    match = requests.get(f"{BASE}/labels/resolve", headers=HEADERS, params={"barcode": barcode}, timeout=10).json()
    if not match["ok"]:
        raise SystemExit(f"{match['code']}: {match['error']}")
    record = match["data"]
    field = "plant_id" if record["record_type"] == "plant" else "explant_id"

    body = requests.post(
        f"{BASE}/contaminations",
        headers={**HEADERS, "Idempotency-Key": f"scanner-3-{uuid.uuid4()}"},
        json={field: record["record_id"], "type": contamination_type, "issue": issue, "severity": severity},
        timeout=10,
    ).json()
    if not body["ok"]:
        raise SystemExit(f"{body['code']}: {body['error']}")
    return body["data"]


print(log_contamination("LINE-0412", "Cloudy halo around the base of the explant"))
```

---

## Values

- `type`: `mold`, `bacteria`, `hyperhydricity`, `phenolic`, `algae`, `yeast`, `endophytic`, `viral`, `fungal`, `physiological`, `contaminated_media`, `damage`, `insect` or `other` (then describe it in `type_other`).
- `severity`: `very low`, `low`, `medium`, `high` or `critical`.

The full list of fields is on the [Record a contamination](https://docs.xplantpro.com/docs/api/contaminations/create-contamination) reference page.

---

## Related

- [Label scanning guide](https://docs.xplantpro.com/docs/guides/label-scanning)
- [ESP32 scan station](../../devices/arduino/esp32-scan-station/README.md): scan a vessel label to identify it automatically
