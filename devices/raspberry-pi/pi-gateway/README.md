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

Fill in your `api_key` and `device_id`. Set `"simulate": true` if you don't have a sensor yet.

**Get your API key** at [xplant.shmaplex.com/settings/integrations](https://xplant.shmaplex.com/settings/integrations).

**Register your device** at **Settings > Integrations > Devices** and copy the UUID.

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

## Simulate mode

Set `"simulate": true` in `config.json` to generate fake sensor data without any GPIO hardware. Useful for testing your API key and device ID before hooking up hardware.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Config file not found" | You haven't copied `config.example.json` to `config.json` yet |
| "api_key is still a placeholder" | Edit `config.json` with your real key |
| HTTP 401 | Invalid API key |
| HTTP 404 | Device UUID not registered in xPlant |
| "DHT22 read failed" | Wrong GPIO pin, loose wire, or need `adafruit-circuitpython-dht` installed |
| Service won't start | Check path in `.service` file matches your actual install location |
