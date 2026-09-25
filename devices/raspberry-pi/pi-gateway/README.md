# Raspberry Pi Gateway

A Python service that reads sensor data and posts it to xPlant at regular intervals. Supports DHT22 via GPIO and simulated readings for testing without hardware.

Runs as a systemd service so it starts automatically on boot.

---

## Hardware requirements

- Raspberry Pi (any model with Wi-Fi — Pi Zero W, Pi 3, Pi 4, etc.)
- DHT22 temperature and humidity sensor **or** skip hardware and use simulate mode
- Jumper wires

---

## Wiring diagram

### DHT22

```
Pi Pin           DHT22
───────────────────────────
Pin 1 (3.3V) →  VCC
Pin 6 (GND)  →  GND
GPIO 4        →  DATA
              (10kΩ between VCC and DATA if using bare sensor)
```

GPIO pin numbers can be changed in `config.json`.

---

## Software dependencies

- Python 3.9+
- `requests` (always required)
- `adafruit-circuitpython-dht` (only if reading a real DHT22)

---

## Setup

### 1. Clone the repo and enter this directory

```bash
git clone https://github.com/shmaplex/xplant_os.git
cd xplant_os/devices/raspberry-pi/pi-gateway
```

### 2. Create a virtual environment and install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# If using a real DHT22 sensor:
pip install adafruit-circuitpython-dht
```

### 3. Configure

```bash
cp config.example.json config.json
nano config.json
```

Fill in `device_token` and `device_id`. Set `"simulate": true` if you don't have a sensor yet.

The Pi carries a **device token** (`xpd_…`), never a workspace API key. To get one, from your own computer:

1. Create a workspace API key with `write:devices` at [app.xplantpro.com/settings/integrations/api-keys](https://app.xplantpro.com/settings/integrations/api-keys). It stays on your computer.
2. Register the Pi as a device and create its token: [Device tokens: setting up a device](https://docs.xplantpro.com/docs/device-tokens#setting-up-a-device). The token is shown once.

One Pi reading several sensors is one device: all its reading types post under the same `device_id` with the same token.

### 4. Run manually (to test)

```bash
python3 gateway.py
```

You should see log output like:

```
2025-01-01T12:00:00  INFO      Gateway started | device=xxx | reading every 60s
2025-01-01T12:00:00  INFO      Posted temperature = 24.5 C
2025-01-01T12:00:00  INFO      Posted humidity = 72.1 %
2025-01-01T12:00:00  INFO      Heartbeat sent for device xxx
```

### 5. Install as a systemd service (auto-start on boot)

```bash
# Edit the service file to match your username and path
nano systemd/xplant-gateway.service

# Install
sudo cp systemd/xplant-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable xplant-gateway
sudo systemctl start xplant-gateway

# Check status
sudo systemctl status xplant-gateway

# View logs
sudo journalctl -u xplant-gateway -f
```

---

## Batching

The gateway doesn't post each reading as it's taken. It buffers readings and posts them in batches, which uses a small fraction of the requests and keeps readings through a network outage.

| Setting | Default | What it does |
|---|---|---|
| `batch_flush_interval_seconds` | `60` | How often the buffer is posted. |
| `batch_max_readings` | `100` | Readings per request (the API accepts up to 500). A full batch posts straight away. |
| `batch_buffer_limit` | `5000` | The most readings kept while xPlant is unreachable. Past it, the oldest are dropped and logged. |

Every reading carries the time it was taken (`recorded_at`) and an `external_id`, so a batch retried after a lost response is never stored twice.

---

## Simulate mode

Set `"simulate": true` in `config.json` to generate fake sensor data without any GPIO hardware. Useful for testing your device token and device ID before hooking up hardware.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Config file not found" | You haven't copied `config.example.json` to `config.json` yet |
| "device_token is still a placeholder" | Edit `config.json` with the device's real `xpd_` token |
| HTTP 401 `UNAUTHORIZED` | Missing, mistyped or revoked device token |
| HTTP 403 `DEVICE_TOKEN_WRONG_DEVICE` | `device_id` isn't the device this token was created for |
| HTTP 429 `RATE_LIMIT_EXCEEDED` | Posting too often; batch readings (see the [sensors guide](https://docs.xplantpro.com/docs/guides/sensors-and-devices)) |
| "DHT22 read failed" | Wrong GPIO pin, loose wire, or need `adafruit-circuitpython-dht` installed |
| Service won't start | Check path in `.service` file matches your actual install location |
