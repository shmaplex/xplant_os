# ESPHome Integration

[ESPHome](https://esphome.io) is a framework for configuring ESP8266/ESP32 devices using YAML. If you're already using ESPHome in your lab, you can post sensor data to xPlant using ESPHome's built-in `http_request` action.

---

## Quick start

1. Copy `xplant-sensor.yaml` into your ESPHome configuration directory.
2. Replace all `YOUR_*` placeholders with your real values.
3. Flash to your device: `esphome run xplant-sensor.yaml`

---

## Storing the device token securely

The device carries a **device token** (`xpd_…`), never a workspace API key. Create one by registering the device and minting its token from your own computer: see [Device tokens: setting up a device](https://docs.xplantpro.com/docs/device-tokens#setting-up-a-device).

Use ESPHome's `secrets.yaml` to keep the token out of your config file:

```yaml
# secrets.yaml (never commit this file)
xplant_device_token: "xpd_live_YOUR_TOKEN_HERE"
xplant_device_id: "YOUR_DEVICE_UUID"
wifi_ssid: "YOUR_WIFI_SSID"
wifi_password: "YOUR_WIFI_PASSWORD"
```

Reference them in your config:

```yaml
xplant_device_token: !secret xplant_device_token
```

---

## Supported sensor types

The `type` field in the POST body must be one of these:

| `type` | `unit` (examples) | Description |
|---|---|---|
| `temperature` | `C` or `F` | Air or media temperature |
| `humidity` | `%` | Relative humidity |
| `co2` | `ppm` | CO2 concentration |
| `light` | `lux` | Light level |
| `ph` | `pH` | Media pH |
| `other` | any | Anything else; say what in `notes` |

`type` must be one of these values; anything else is rejected with `422 VALIDATION_ERROR`. `unit` is free text (1–20 characters).

---|---|---|
| `temperature` | `C` or `F` | Air or media temperature |
| `humidity` | `%` | Relative humidity |
| `co2` | `ppm` | CO2 concentration |
| `light_lux` | `lux` | Photosynthetically active light |
| `ph` | `pH` | Media pH |
| `ec` | `mS/cm` | Electrical conductivity |

---

## Getting a device token

1. Create a workspace API key with `write:devices` at [app.xplantpro.com/settings/integrations/api-keys](https://app.xplantpro.com/settings/integrations/api-keys). Keep it on your own computer.
2. Use it once to register the device and create its token: [Device tokens: setting up a device](https://docs.xplantpro.com/docs/device-tokens#setting-up-a-device).
3. Put the `xpd_` token and the device id in `secrets.yaml`.
