/*
 * esp32_xplant_sensor.ino
 * ========================
 * Posts temperature and humidity readings to xPlant from an ESP32
 * connected to a DHT22 or BME280 sensor.
 *
 * Hardware: ESP32-WROOM-32 (or any ESP32 variant) + DHT22 or Adafruit BME280
 *
 * Required Arduino libraries (install via Library Manager):
 *   - DHT sensor library by Adafruit (if using DHT22)
 *   - Adafruit BME280 Library (if using BME280)
 *   - Adafruit Unified Sensor
 *   - ArduinoJson by Benoit Blanchon
 *
 * Configuration: edit config.h with your Wi-Fi credentials, API key, and device ID.
 *
 * Copyright (C) 2025 Shmaplex
 * Licensed under the Common Sense License (CSL) v1.1
 * https://github.com/shmaplex/csl
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// ---------------------------------------------------------------------------
// Sensor setup
// Choose DHT22 or BME280 via the USE_DHT22 define in config.h
// ---------------------------------------------------------------------------

#ifdef USE_DHT22
  #include <DHT.h>
  DHT dht(SENSOR_PIN, DHT22);
#else
  #include <Adafruit_BME280.h>
  Adafruit_BME280 bme;
#endif

// ---------------------------------------------------------------------------
// Timing state — track when we last posted a reading and heartbeat
// ---------------------------------------------------------------------------
unsigned long lastReadingTime  = 0;
unsigned long lastHeartbeatTime = 0;

// ---------------------------------------------------------------------------
// setup() — runs once at power-on
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== xPlant ESP32 Sensor ===");

  // Initialise sensor hardware
  #ifdef USE_DHT22
    dht.begin();
    Serial.println("DHT22 initialised on pin " + String(SENSOR_PIN));
  #else
    if (!bme.begin(0x76)) {
      Serial.println("ERROR: BME280 not found at address 0x76. Check wiring.");
      while (true) { delay(1000); }
    }
    Serial.println("BME280 initialised");
  #endif

  // Connect to Wi-Fi
  connectWiFi();
}

// ---------------------------------------------------------------------------
// loop() — runs continuously after setup()
// ---------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // Reconnect if we dropped off Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    connectWiFi();
  }

  // Post sensor readings on schedule
  if (now - lastReadingTime >= READING_INTERVAL_MS || lastReadingTime == 0) {
    lastReadingTime = now;
    postReadings();
  }

  // Send heartbeat on schedule
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS || lastHeartbeatTime == 0) {
    lastHeartbeatTime = now;
    sendHeartbeat();
  }

  // Small delay to avoid busy-looping
  delay(1000);
}

// ---------------------------------------------------------------------------
// connectWiFi() — connect and block until connected
// ---------------------------------------------------------------------------
void connectWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 40) {
      Serial.println("\nERROR: Could not connect to Wi-Fi after 20 seconds. Restarting.");
      ESP.restart();
    }
  }

  Serial.println();
  Serial.print("Connected. IP address: ");
  Serial.println(WiFi.localIP());
}

// ---------------------------------------------------------------------------
// readTemperature() / readHumidity() — abstract DHT22 vs BME280
// ---------------------------------------------------------------------------
float readTemperature() {
  #ifdef USE_DHT22
    return dht.readTemperature(); // Celsius
  #else
    return bme.readTemperature();
  #endif
}

float readHumidity() {
  #ifdef USE_DHT22
    return dht.readHumidity(); // percent
  #else
    return bme.readHumidity();
  #endif
}

// ---------------------------------------------------------------------------
// postReadings() — read the sensor and POST to xPlant
// ---------------------------------------------------------------------------
void postReadings() {
  float temperature = readTemperature();
  float humidity    = readHumidity();

  // Validate readings — NaN means the sensor failed to respond
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("ERROR: Sensor returned NaN. Check wiring.");
    return;
  }

  Serial.printf("Reading: temperature=%.2f°C  humidity=%.1f%%\n",
                temperature, humidity);

  // Post temperature
  postSensorReading("temperature", temperature, "C");

  // Post humidity
  postSensorReading("humidity", humidity, "%");
}

// ---------------------------------------------------------------------------
// postSensorReading() — POST a single reading to /api/v1/sensor-readings
// ---------------------------------------------------------------------------
void postSensorReading(const char* type, float value, const char* unit) {
  String url = String(XPLANT_BASE_URL) + "/api/v1/sensor-readings";

  // Build the JSON body
  // Format: {"device_id":"...","type":"temperature","value":24.5,"unit":"C"}
  StaticJsonDocument<256> doc;
  doc["device_id"] = XPLANT_DEVICE_ID;
  doc["type"]      = type;
  doc["value"]     = value;
  doc["unit"]      = unit;

  String body;
  serializeJson(doc, body);

  // Send the HTTP request
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(XPLANT_API_KEY));

  int statusCode = http.POST(body);

  if (statusCode == 201) {
    Serial.printf("  Posted %s reading (%s %s) — HTTP 201\n", type,
                  String(value).c_str(), unit);
  } else {
    Serial.printf("  ERROR posting %s reading — HTTP %d: %s\n",
                  type, statusCode, http.getString().c_str());
  }

  http.end();
}

// ---------------------------------------------------------------------------
// sendHeartbeat() — POST to /api/v1/devices/:deviceId/heartbeat
// ---------------------------------------------------------------------------
void sendHeartbeat() {
  String url = String(XPLANT_BASE_URL) + "/api/v1/devices/"
               + String(XPLANT_DEVICE_ID) + "/heartbeat";

  // Include Wi-Fi signal strength so xPlant can show device health
  StaticJsonDocument<128> doc;
  doc["rssi"] = WiFi.RSSI();

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(XPLANT_API_KEY));

  int statusCode = http.POST(body);

  if (statusCode == 200) {
    Serial.printf("Heartbeat sent (RSSI: %d dBm) — HTTP 200\n", WiFi.RSSI());
  } else {
    Serial.printf("ERROR sending heartbeat — HTTP %d: %s\n",
                  statusCode, http.getString().c_str());
  }

  http.end();
}
