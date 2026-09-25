# Contamination Check Example (Planned)

> **Waiting on the contaminations endpoint.** The `write:contaminations` scope already exists on the API Keys page, and the endpoint that uses it is on the way. This example will be filled in when it ships; watch the [scopes page](https://docs.xplantpro.com/docs/scopes) for the endpoint to appear.

---

## Use case

When a technician spots contamination in a culture vessel, they should be able to log it on the spot (from a scanner, a button or a phone) without walking to a computer.

## The plan

1. Scan the vessel label and [resolve it](https://docs.xplantpro.com/docs/guides/label-scanning) to its plant or explant.
2. Record a contamination observation against that record (type, severity, a note), using a key with `write:contaminations`.

## Until then

Record the scan with [`POST /api/v1/label-scans`](https://docs.xplantpro.com/docs/api/labels/create-label-scan) and a `context` that says what was seen, or create a follow-up [task](https://docs.xplantpro.com/docs/api/tasks/create-task) with `category: "contamination"` linked to the record:

```bash
curl -X POST https://app.xplantpro.com/api/v1/tasks \
  -H "Authorization: Bearer $XPLANT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Check vessel V04 for contamination",
    "category": "contamination",
    "priority": "urgent",
    "entity_type": "explant",
    "entity_id": "YOUR_EXPLANT_UUID"
  }'
```

This needs a key with `write:tasks`.

---

## Related

- [ESP32 scan station](../../devices/arduino/esp32-scan-station/README.md): scan a vessel label to identify it automatically
