# Tasmota Integration

[Tasmota](https://tasmota.github.io) is open-source firmware for ESP8266/ESP32 devices. If you have a Tasmota-flashed device (e.g. Sonoff, generic ESP8266 relay boards, WEMOS D1 Mini), you can use Tasmota's **Rules** engine to POST sensor data to xPlant via webhooks.

---

## How it works

Tasmota fires rules based on sensor events. The `WebSend` command sends an HTTP request to an endpoint you define. The `sensor-rule.txt` file in this directory contains copy-paste rules for common scenarios.

---

## Setup

1. Open the Tasmota web UI on your device (navigate to its IP address).
2. Go to **Console**.
3. Set the device's token and id as backlog variables. The device carries a **device token** (`xpd_…`), never a workspace API key; see [Getting a device token](#getting-a-device-token).

```
Backlog Var1 xpd_live_YOUR_TOKEN_HERE; Var2 YOUR_DEVICE_UUID
```

4. Paste the rules from `sensor-rule.txt` into the console.
5. Enable the rules: `Rule1 1`

---

## Limitations

Tasmota's `WebSend` command has limitations:
- No custom Authorization header support in older firmware versions (< 12.x)
- Use Tasmota 12.0+ for full webhook support with custom headers
- The `%value%` placeholder in rules is Tasmota's substitution syntax
- **Use HTTPS.** Sending the token over plain HTTP exposes it to anyone on the network. HTTPS needs a TLS-capable build (ESP32 builds, or a TLS build on ESP8266). If your device can't do TLS, use the MQTT bridge below instead.

---

## Alternative: MQTT bridge

If your Tasmota devices publish to an MQTT broker, a better approach is to run the [Raspberry Pi gateway](../raspberry-pi/pi-gateway/README.md) with an MQTT subscriber that forwards readings to xPlant. This gives you more control over formatting and retry logic.

---

## Getting a device token

1. Create a workspace API key with `write:devices` at [app.xplantpro.com/settings/integrations/api-keys](https://app.xplantpro.com/settings/integrations/api-keys). Keep it on your own computer, not on the Tasmota device.
2. Use it once to register the device and create its token: [Device tokens: setting up a device](https://docs.xplantpro.com/docs/device-tokens#setting-up-a-device).
3. Put the `xpd_` token in `Var1` and the device id in `Var2`.

Never paste a token into a public channel or commit it to source control.
