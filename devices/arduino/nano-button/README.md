# Arduino Nano Physical Event Button (Stub)

> This is a planned device integration. The concept is described below.
> If you want to build this, please open a [proposal issue](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) and/or submit a PR.

---

## Concept

A low-cost, physical button station that lets bench technicians log lab events with a single press — no phone or computer required. Uses an Arduino Nano 33 IoT (or Nano ESP32) for Wi-Fi connectivity.

Example use cases:

- **Transfer button**: one press logs a subculture transfer event for the active batch
- **Contamination button**: one press opens a contamination workflow in xPlant
- **Done button**: marks the current task complete

Because the Nano has no screen, the button is pre-programmed for a single workflow via `config.h`.

---

## Planned hardware

- Arduino Nano 33 IoT or Arduino Nano ESP32
- 1× momentary push button
- 1× status LED (green = connected, red = posting, off = error)
- Optional: small piezo buzzer for audio feedback
- 3D-printed enclosure

---

## Planned API usage

```
POST /api/v1/device-events
{
  "device_id": "...",
  "event_type": "button_press",
  "payload": {
    "button_id": "transfer",
    "label": "Transfer logged"
  }
}
```

---

## Want to contribute this?

Open a [new package proposal](https://github.com/shmaplex/xplant_os/issues/new?template=new_package.md) or submit a PR. See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for device package conventions.
