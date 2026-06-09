# ESP32 Temperature & Humidity Sensor

Posts temperature and humidity readings to xPlant every 60 seconds, and sends a heartbeat ping every 5 minutes.

Supports two sensor modules: **DHT22** (common, cheap) and **Adafruit BME280** (more accurate, also reads pressure).

---

## Hardware requirements

- ESP32 development board (ESP32-WROOM-32, ESP32-DevKitC, or similar)
- DHT22 sensor module **or** Adafruit BME280 breakout
- 10 kΩ resistor (if wiring DHT22 from raw pins — most DHT22 breakout modules include this)
- USB cable for programming
- Wi-Fi network (2.4 GHz — ESP32 does not support 5 GHz)

---

## Wiring diagram

### DHT22

```
ESP32 Pin        DHT22 Module
─────────────────────────────
3.3V         →   VCC
GND          →   GND
GPIO 4       →   DATA
                 (10kΩ pull-up between VCC and DATA if using bare sensor)
```

### BME280 (I2C)

```
ESP32 Pin        BME280 Breakout
─────────────────────────────────
3.3V         →   VIN
GND          →   GND
GPIO 21      →   SDA
GPIO 22      →   SCL
```

---

## Software dependencies

Install these via **Arduino IDE > Tools > Manage Libraries**:

| Library | Author | Notes |
|---|---|---|
| DHT sensor library | Adafruit | Only needed for DHT22 |
| Adafruit Unified Sensor | Adafruit | Required by DHT library |
| Adafruit BME280 Library | Adafruit | Only needed for BME280 |
| ArduinoJson | Benoit Blanchon | Version 6.x or 7.x |

Also install the **ESP32 board package** if you have not already:
- Go to **File > Preferences > Additional boards manager URLs** and add:
  `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
- Then go to **Tools > Board > Boards Manager** and install "esp32 by Espressif Systems".

---

## Setup

1. **Copy and configure `config.h`**

   Edit `config.h` with your credentials. Do not commit this file — it is in `.gitignore` by default.

   ```c
   #define WIFI_SSID     "MyLabWiFi"
   #define WIFI_PASSWORD "mysecretpassword"
   #define XPLANT_API_KEY    "xpk_live_YOUR_KEY_HERE"
   #define XPLANT_DEVICE_ID  "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

2. **Get your API key**

   Log in to [xplant.shmaplex.com/settings/integrations](https://xplant.shmaplex.com/settings/integrations), generate a key, and paste it into `config.h`.

3. **Register your device in xPlant**

   Go to **Settings > Integrations > Devices** and register a new device. Copy the UUID it assigns into `XPLANT_DEVICE_ID` in `config.h`.

4. **Select your sensor**

   - DHT22 (default): leave `#define USE_DHT22` in `config.h`.
   - BME280: comment out `#define USE_DHT22`.

5. **Open in Arduino IDE**

   Open `esp32_xplant_sensor.ino`. Select your board (**Tools > Board > ESP32 Arduino > ESP32 Dev Module** or your specific variant) and the correct serial port.

6. **Upload**

   Click Upload. Open the Serial Monitor at **115200 baud** to watch the output.

---

## Expected serial output

```
=== xPlant ESP32 Sensor ===
DHT22 initialised on pin 4
Connecting to Wi-Fi: MyLabWiFi
......
Connected. IP address: 192.168.1.42
Reading: temperature=24.50°C  humidity=72.1%
  Posted temperature reading (24.5 C) — HTTP 201
  Posted humidity reading (72.1 %) — HTTP 201
Heartbeat sent (RSSI: -65 dBm) — HTTP 200
```

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Sensor returned NaN" | Wiring error, wrong GPIO pin, or defective sensor |
| "Could not connect to Wi-Fi" | Wrong SSID/password, or 5 GHz network |
| HTTP 401 | Invalid or missing API key |
| HTTP 404 | Device UUID not registered in xPlant |
| HTTP 429 | Posting too fast — increase `READING_INTERVAL_MS` |

---

## Customising the reading interval

Edit `config.h`:

```c
#define READING_INTERVAL_MS 30000  // post every 30 seconds
```

Values under 10 seconds may hit rate limits. See [docs/api-reference.md](../../../docs/api-reference.md).
