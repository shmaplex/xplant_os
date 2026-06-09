# ESPHome Integration

[ESPHome](https://esphome.io) is a framework for configuring ESP8266/ESP32 devices using YAML. If you're already using ESPHome in your lab, you can post sensor data to xPlant using ESPHome's built-in `http_request` action.

---

## Quick start

1. Copy `xplant-sensor.yaml` into your ESPHome configuration directory.
2. Replace all `YOUR_*` placeholders with your real values.
3. Flash to your device: `esphome run xplant-sensor.yaml`

---

## Storing the API key securely

Use ESPHome's `secrets.yaml` to keep the key out of your config file:

```yaml
# secrets.yaml (never commit this file)
xplant_api_key: "xpk_live_YOUR_KEY_HERE"
xplant_device_id: "YOUR_DEVICE_UUID"
wifi_ssid: "YOUR_WIFI_SSID"
wifi_password: "YOUR_WIFI_PASSWORD"
```

Reference them in your config:

```yaml
xplant_api_key: !secret xplant_api_key
```

---

## Supported sensor types

The `type` field in the POST body can be any string, but xPlant recognises these standard types:

| `type` | `unit` | Description |
|---|---|---|
| `temperature` | `C` or `F` | Air or media temperature |
| `humidity` | `%` | Relative humidity |
| `co2` | `ppm` | CO2 concentration |
| `light_lux` | `lux` | Photosynthetically active light |
| `ph` | `pH` | Media pH |
| `ec` | `mS/cm` | Electrical conductivity |

---

## Getting an API key

Go to [xplant.shmaplex.com/settings/integrations](https://xplant.shmaplex.com/settings/integrations) and generate a key. Store it in `secrets.yaml`.
