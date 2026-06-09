# API Key Scopes

Scopes restrict what an API key can read or write. You can assign scopes when generating a key from **Settings > Integrations > API Keys**.

A key without explicit scopes receives the default scope set (`sensor_readings:write`, `device_events:write`, `devices:heartbeat`), which is sufficient for most hardware integrations.

---

## Available scopes

| Scope | Description |
|---|---|
| `sensor_readings:write` | Post new sensor readings |
| `sensor_readings:read` | Read sensor readings for your workspace |
| `device_events:write` | Post new device events |
| `device_events:read` | Read device events for your workspace |
| `devices:read` | Read device metadata |
| `devices:write` | Register and update devices |
| `devices:heartbeat` | Post heartbeat pings (included in default set) |
| `plants:read` | Read plant/explant summaries |
| `tasks:read` | Read task summaries |
| `labels:read` | Resolve label barcodes/QR codes to records |

---

## Default scope set

Keys generated without specifying scopes receive:

- `sensor_readings:write`
- `device_events:write`
- `devices:heartbeat`

This is the minimum needed for a sensor device to function.

---

## Choosing scopes for your use case

| Use case | Recommended scopes |
|---|---|
| ESP32 temperature / humidity sensor | `sensor_readings:write`, `devices:heartbeat` |
| Barcode scan station | `device_events:write`, `labels:read`, `devices:heartbeat` |
| Read-only dashboard | `sensor_readings:read`, `device_events:read`, `plants:read` |
| Full integration (bidirectional) | All scopes |

---

## Scope enforcement

Scope violations return HTTP `403 Forbidden` with:

```json
{
  "error": "FORBIDDEN",
  "message": "This key does not have the required scope: sensor_readings:write"
}
```

---

## Future scopes (planned)

These scopes are planned for future API versions:

- `media:write` — upload media recipes or notes from external tools
- `batches:read` — read batch / subculture records
- `contamination:write` — record contamination events from external instruments
