#!/usr/bin/env python3
"""
gateway.py — xPlant Raspberry Pi Gateway
=========================================
Reads sensor data and posts it to xPlant at regular intervals.

Supports:
  - DHT22 via GPIO (requires adafruit-circuitpython-dht)
  - Simulated readings (for testing without hardware)

Configuration: copy config.example.json to config.json and fill in
your API key, device ID, and sensor pin. Never commit config.json.

Usage:
  python3 gateway.py [--config /path/to/config.json]

Copyright (C) 2025 Shmaplex
Licensed under the Common Sense License (CSL) v1.1
https://github.com/shmaplex/csl
"""

import argparse
import json
import logging
import math
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("xplant-gateway")

# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------
DEFAULT_CONFIG_PATH = Path(__file__).parent / "config.json"


def load_config(path: Path) -> dict[str, Any]:
    """Load and validate configuration from a JSON file."""
    if not path.exists():
        log.error(
            "Config file not found: %s\n"
            "Copy config.example.json to config.json and fill in your credentials.",
            path,
        )
        sys.exit(1)

    with path.open() as f:
        config = json.load(f)

    required = ("api_key", "device_id", "xplant_base_url")
    for key in required:
        if not config.get(key):
            log.error("Missing required config key: %s", key)
            sys.exit(1)

    if config.get("api_key", "").startswith("xpk_live_YOUR"):
        log.error(
            "api_key is still a placeholder. "
            "Get your key at https://xplant.shmaplex.com/settings/integrations"
        )
        sys.exit(1)

    config.setdefault("sensors", [
        {"type": "temperature", "unit": "C",  "gpio_pin": 4},
        {"type": "humidity",    "unit": "%",  "gpio_pin": 4},
    ])
    config.setdefault("reading_interval_seconds", 60)
    config.setdefault("heartbeat_interval_seconds", 300)
    config.setdefault("simulate", False)

    return config


# ---------------------------------------------------------------------------
# Sensor reading — DHT22 via GPIO or simulated
# ---------------------------------------------------------------------------

def read_dht22(pin: int) -> tuple[float, float]:
    """
    Read temperature (°C) and humidity (%) from a DHT22 on the given GPIO pin.
    Requires: pip install adafruit-circuitpython-dht
    """
    try:
        import adafruit_dht
        import board

        gpio_pin = getattr(board, f"D{pin}", None)
        if gpio_pin is None:
            raise ValueError(f"Unknown board pin: D{pin}")

        sensor = adafruit_dht.DHT22(gpio_pin)
        temperature = sensor.temperature
        humidity    = sensor.humidity
        sensor.exit()
        return float(temperature), float(humidity)
    except Exception as exc:
        raise RuntimeError(f"DHT22 read failed on pin {pin}: {exc}") from exc


def simulate_reading(sensor_type: str) -> float:
    """Return a plausible fake value for testing without hardware."""
    if sensor_type == "temperature":
        # Drift slowly around 24°C
        return round(24.0 + random.uniform(-0.5, 0.5), 2)
    if sensor_type == "humidity":
        return round(70.0 + random.uniform(-2.0, 2.0), 1)
    return round(random.uniform(0, 100), 2)


def get_sensor_value(sensor: dict[str, Any], simulate: bool) -> float:
    """Dispatch to the correct sensor reader."""
    if simulate:
        return simulate_reading(sensor["type"])

    sensor_type = sensor["type"]
    gpio_pin    = sensor.get("gpio_pin", 4)

    if sensor_type in ("temperature", "humidity"):
        temperature, humidity = read_dht22(gpio_pin)
        return temperature if sensor_type == "temperature" else humidity

    raise ValueError(f"Unsupported sensor type: {sensor_type}")


# ---------------------------------------------------------------------------
# HTTP helpers with retry / exponential backoff
# ---------------------------------------------------------------------------
MAX_RETRIES = 5
RETRY_BASE_SECONDS = 2


def post_with_retry(
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    description: str,
) -> bool:
    """
    POST JSON payload to url with exponential backoff on failure.
    Returns True on success, False after exhausting retries.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=10)

            if resp.status_code in (200, 201):
                return True

            if resp.status_code == 429:
                # Rate limited — back off longer
                wait = RETRY_BASE_SECONDS * (2 ** attempt)
                log.warning(
                    "%s: rate limited (429), retrying in %ds (attempt %d/%d)",
                    description, wait, attempt, MAX_RETRIES,
                )
                time.sleep(wait)
                continue

            if 400 <= resp.status_code < 500:
                # Client error — no point retrying
                log.error(
                    "%s: client error %d: %s",
                    description, resp.status_code, resp.text,
                )
                return False

            # Server error — retry with backoff
            wait = RETRY_BASE_SECONDS * (2 ** attempt)
            log.warning(
                "%s: server error %d, retrying in %ds (attempt %d/%d)",
                description, resp.status_code, wait, attempt, MAX_RETRIES,
            )
            time.sleep(wait)

        except requests.exceptions.RequestException as exc:
            wait = RETRY_BASE_SECONDS * (2 ** attempt)
            log.warning(
                "%s: network error (%s), retrying in %ds (attempt %d/%d)",
                description, exc, wait, attempt, MAX_RETRIES,
            )
            time.sleep(wait)

    log.error("%s: failed after %d attempts", description, MAX_RETRIES)
    return False


# ---------------------------------------------------------------------------
# xPlant API calls
# ---------------------------------------------------------------------------

def post_sensor_reading(
    config: dict[str, Any],
    sensor: dict[str, Any],
    value: float,
) -> None:
    """POST a single sensor reading to /api/v1/sensor-readings."""
    url = config["xplant_base_url"].rstrip("/") + "/api/v1/sensor-readings"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "device_id": config["device_id"],
        "type":      sensor["type"],
        "value":     value,
        "unit":      sensor["unit"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    description = f"sensor_reading({sensor['type']})"
    success = post_with_retry(url, headers, payload, description)

    if success:
        log.info("Posted %s = %s %s", sensor["type"], value, sensor["unit"])


def send_heartbeat(config: dict[str, Any]) -> None:
    """POST a heartbeat to /api/v1/devices/:deviceId/heartbeat."""
    device_id = config["device_id"]
    url = (
        config["xplant_base_url"].rstrip("/")
        + f"/api/v1/devices/{device_id}/heartbeat"
    )
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {}

    success = post_with_retry(url, headers, payload, "heartbeat")
    if success:
        log.info("Heartbeat sent for device %s", device_id)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run(config: dict[str, Any]) -> None:
    reading_interval  = config["reading_interval_seconds"]
    heartbeat_interval = config["heartbeat_interval_seconds"]
    simulate          = config["simulate"]
    sensors           = config["sensors"]

    if simulate:
        log.info("Running in SIMULATE mode — no real GPIO reads")

    last_reading   = 0.0
    last_heartbeat = 0.0

    log.info(
        "Gateway started | device=%s | reading every %ds | heartbeat every %ds",
        config["device_id"],
        reading_interval,
        heartbeat_interval,
    )

    while True:
        now = time.monotonic()

        # Post sensor readings
        if now - last_reading >= reading_interval:
            last_reading = now
            for sensor in sensors:
                try:
                    value = get_sensor_value(sensor, simulate)
                    post_sensor_reading(config, sensor, value)
                except Exception as exc:
                    log.error("Error reading %s: %s", sensor["type"], exc)

        # Send heartbeat
        if now - last_heartbeat >= heartbeat_interval:
            last_heartbeat = now
            try:
                send_heartbeat(config)
            except Exception as exc:
                log.error("Error sending heartbeat: %s", exc)

        time.sleep(1)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="xPlant Raspberry Pi Gateway")
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help="Path to config.json (default: config.json in the same directory)",
    )
    args = parser.parse_args()

    config = load_config(args.config)
    run(config)


if __name__ == "__main__":
    main()
