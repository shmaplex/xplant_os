# Tasmota Integration

[Tasmota](https://tasmota.github.io) is open-source firmware for ESP8266/ESP32 devices. If you have a Tasmota-flashed device (e.g. Sonoff, generic ESP8266 relay boards, WEMOS D1 Mini), you can use Tasmota's **Rules** engine to POST sensor data to xPlant via webhooks.

---

## How it works

Tasmota fires rules based on sensor events. The `WebSend` command sends an HTTP request to an endpoint you define. The `sensor-rule.txt` file in this directory contains copy-paste rules for common scenarios.

---

## Setup

1. Open the Tasmota web UI on your device (navigate to its IP address).
2. Go to **Console**.
3. Set your xPlant API key and device ID as backlog variables:

```
Backlog Var1 xpk_live_YOUR_KEY_HERE; Var2 YOUR_DEVICE_UUID
```

4. Paste the rules from `sensor-rule.txt` into the console.
5. Enable the rules: `Rule1 1`

---

## Limitations

Tasmota's `WebSend` command has limitations:
- No custom Authorization header support in older firmware versions (< 12.x)
- Use Tasmota 12.0+ for full webhook support with custom headers
- The `%value%` placeholder in rules is Tasmota's substitution syntax

---

## Alternative: MQTT bridge

If your Tasmota devices publish to an MQTT broker, a better approach is to run the [Raspberry Pi gateway](../raspberry-pi/pi-gateway/README.md) with an MQTT subscriber that forwards readings to xPlant. This gives you more control over formatting and retry logic.

---

## Getting an API key

Go to [xplant.shmaplex.com/settings/integrations](https://xplant.shmaplex.com/settings/integrations) and generate a key. Never paste it into a public channel or commit it to source control.
