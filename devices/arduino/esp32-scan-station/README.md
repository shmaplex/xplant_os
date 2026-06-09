# ESP32 Scan Station (Stub)

> This is a planned device integration. The hardware concept is described below.
> If you want to build this, please open a [proposal issue](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) and/or submit a PR.

---

## Concept

A bench-top barcode and QR code scanning station built around an ESP32 and a 2D barcode scanner module (e.g. GM65, ZBar-compatible USB scanner, or similar). When a lab technician scans an xPlant label, the device:

1. Reads the barcode from the scanner via UART or USB-HID
2. Calls `POST /api/v1/device-events` with `event_type: "scan"` and the barcode in the payload
3. Optionally calls `GET /api/v1/labels/resolve?barcode=...` to display plant/batch info on a small OLED screen

This allows physical label scans to be logged as events in xPlant, useful for transfer tracking, contamination checks, and QC workflows.

---

## Planned hardware

- ESP32-WROOM-32 or ESP32-S3
- 2D barcode/QR scanner module (GM65, E2000, or USB HID scanner connected via USB host shield)
- SSD1306 128×64 OLED display (optional, for scan feedback)
- 3D-printed enclosure (design to be provided separately)

---

## Planned API usage

```
POST /api/v1/device-events
{
  "device_id": "...",
  "event_type": "scan",
  "payload": {
    "barcode": "XPL-2025-001",
    "scanner_mode": "transfer"
  }
}
```

---

## Want to contribute this?

Open a [new package proposal](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) or submit a PR directly. See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for the device package conventions.
