# Pi Bench Kiosk (Stub)

> This is a planned device integration. The concept is described below.
> If you want to build this, open a [proposal issue](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) and/or submit a PR.

---

## Concept

A touchscreen kiosk mounted at a lab bench, running a Raspberry Pi with a 7" touchscreen display. Technicians interact with a local web interface to:

- View their assigned tasks for the day
- Log transfers, observations, and contamination events
- Scan barcodes using a USB scanner
- See live sensor readings from the bench's ESP32/DHT22

The kiosk would run a local lightweight web app (likely a Next.js static export) that communicates with the xPlant API using a device-scoped API key.

---

## Planned hardware

- Raspberry Pi 4B (4 GB recommended)
- Official Raspberry Pi 7" Touchscreen Display
- USB barcode/QR scanner (any HID-compliant 2D scanner)
- Optional: USB hub for scanner + keyboard + mouse
- 3D-printed or laser-cut bench mount

---

## Planned software approach

- Chromium in kiosk mode (`--kiosk --noerrdialogs`) pointing at a local server or the hosted xPlant app
- A local Express/Fastify server bridging USB scanner HID input to xPlant API events
- Systemd services for auto-start

---

## Want to contribute this?

Open a [new package proposal](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) or submit a PR. See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for device package conventions.
