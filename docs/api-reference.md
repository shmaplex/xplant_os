# External API Reference (v1)

Base URL: `https://xplant.shmaplex.com/api/v1`

All requests require:

```
Authorization: Bearer YOUR_XPLANT_API_KEY
Content-Type: application/json
```

---

## Sensor Readings

### POST /sensor-readings

Record a sensor reading from a physical device.

**Request body**

```json
{
  "device_id": "uuid",
  "type": "temperature",
  "value": 24.5,
  "unit": "C",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `device_id` | `string` (UUID) | Yes | ID of the registered device |
| `type` | `string` | Yes | Reading type: `temperature`, `humidity`, `co2`, `light_lux`, `ph`, `ec` |
| `value` | `number` | Yes | Numeric reading value |
| `unit` | `string` | Yes | Unit string: `C`, `F`, `%`, `ppm`, `lux`, `pH`, `mS/cm` |
| `timestamp` | `string` (ISO 8601) | No | Defaults to server receipt time |

**Response** — `201 Created`

```json
{
  "id": "uuid",
  "device_id": "uuid",
  "type": "temperature",
  "value": 24.5,
  "unit": "C",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "created_at": "2025-01-01T12:00:00.123Z"
}
```

---

## Device Events

### POST /device-events

Log a discrete event from a device (button press, door open, scan, etc.).

**Request body**

```json
{
  "device_id": "uuid",
  "event_type": "scan",
  "payload": {
    "barcode": "XPL-2025-001",
    "scanner_mode": "transfer"
  },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `device_id` | `string` (UUID) | Yes | ID of the registered device |
| `event_type` | `string` | Yes | Free-form event type string (e.g. `scan`, `button_press`, `door_open`) |
| `payload` | `object` | No | Arbitrary JSON payload (max 4 KB) |
| `timestamp` | `string` (ISO 8601) | No | Defaults to server receipt time |

**Response** — `201 Created`

```json
{
  "id": "uuid",
  "device_id": "uuid",
  "event_type": "scan",
  "payload": { "barcode": "XPL-2025-001", "scanner_mode": "transfer" },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "created_at": "2025-01-01T12:00:00.123Z"
}
```

---

## Devices

### POST /devices/:deviceId/heartbeat

Signal that a device is alive and connected.

**URL parameters**

| Parameter | Description |
|---|---|
| `deviceId` | UUID of the registered device |

**Request body** (optional)

```json
{
  "firmware_version": "1.2.3",
  "ip_address": "192.168.1.42",
  "rssi": -65
}
```

**Response** — `200 OK`

```json
{
  "device_id": "uuid",
  "last_seen_at": "2025-01-01T12:00:00.123Z"
}
```

### GET /devices/:deviceId

Retrieve basic metadata for a registered device.

**Response** — `200 OK`

```json
{
  "id": "uuid",
  "name": "Growth Chamber A — Temp Sensor",
  "type": "sensor",
  "last_seen_at": "2025-01-01T12:00:00.000Z",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

## Error responses

All errors return a JSON body:

```json
{
  "error": "Short error code",
  "message": "Human-readable description"
}
```

| HTTP status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — key lacks required scope |
| `404` | Not found — device ID does not exist in your workspace |
| `422` | Unprocessable — valid JSON but failed validation |
| `429` | Rate limited — slow down requests |
| `500` | Server error — try again later |

---

## Rate limits

| Tier | Sensor readings | Device events | Heartbeats |
|---|---|---|---|
| Default | 60 req/min per key | 60 req/min per key | 12 req/min per device |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1735737600
```

---

## Versioning

The API is versioned via the URL path (`/api/v1/`). Breaking changes will be introduced in a new version (`/api/v2/`) with a deprecation notice and migration guide.
