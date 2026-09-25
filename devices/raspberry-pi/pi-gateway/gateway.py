#!/usr/bin/env python3
"""
gateway.py — xPlant Raspberry Pi Gateway
=========================================
Reads sensor data and posts it to xPlant at regular intervals.

Supports:
  - DHT22 via GPIO (requires adafruit-circuitpython-dht)
  - Simulated readings (for testing without hardware)

Configuration: copy config.example.json to config.json and fill in
your device token (xpd_...), device ID, and sensor pin. Never commit config.json.

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

    # A device carries a device token (xpd_...), never a workspace API key.
    # Older configs named the credential "api_key"; accept it, but say so.
    if not config.get("device_token") and config.get("api_key"):
        log.warning("Config key 'api_key' is deprecated: rename it to 'device_token'.")
        config["device_token"] = config["api_key"]

    required = ("device_token", "device_id", "xplant_base_url")
    for key in required:
        if not config.get(key):
            log.error("Missing required config key: %s", key)
            sys.exit(1)

    if "YOUR" in config["device_token"]:
        log.error(
            "device_token is still a placeholder. Create a device token for this device: "
            "https://docs.xplantpro.com/docs/device-tokens"
        )
        sys.exit(1)

    if config["device_token"].startswith("xpk_"):
        log.warning(
            "device_token holds a workspace API key (xpk_). Put a device token (xpd_) on "
            "the device instead: https://docs.xplantpro.com/docs/device-tokens"
        )

    config.setdefault("sensors", [
        {"type": "temperature", "unit": "C",  "gpio_pin": 4},
        {"type": "humidity",    "unit": "%",  "gpio_pin": 4},
    ])
    config.setdefault("reading_interval_seconds", 60)
    config.setdefault("heartbeat_interval_seconds", 300)
    config.setdefault("simulate", False)

    # Readings accumulate locally and post in batches. One HTTP request per
    # reading would be a request per sensor per interval — at a 60s interval
    # that is ~43k requests per sensor per month, against an endpoint that
    # accepts 500 readings in a single call.
    config.setdefault("batch_flush_interval_seconds", 300)
    config.setdefault("batch_max_readings", 100)
    # Cap the retry buffer so a long outage cannot exhaust memory. Oldest
    # readings are dropped first once this is exceeded.
    config.setdefault("batch_buffer_limit", 5000)

    # The API rejects payloads over 500 readings.
    config["batch_max_readings"] = min(int(config["batch_max_readings"]), 500)

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

def build_reading(
    config: dict[str, Any],
    sensor: dict[str, Any],
    value: float,
) -> dict[str, Any]:
    """
    Build one reading, stamped with the time it was TAKEN.

    The field is `recorded_at`, not `timestamp`. The API validates with a
    schema that strips unknown keys, so a `timestamp` field is silently
    discarded and the reading falls back to server-receive time. That is
    invisible while readings post immediately, and wrong the moment one is
    buffered through an outage or a retry — exactly when the real
    observation time matters.
    """
    return {
        "device_id":   config["device_id"],
        "type":        sensor["type"],
        "value":       value,
        "unit":        sensor["unit"],
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }


def post_sensor_readings(
    config: dict[str, Any],
    readings: list[dict[str, Any]],
) -> bool:
    """
    POST a batch of readings to /api/v1/sensor-readings.

    Returns True when the batch was accepted. On failure the caller keeps the
    readings buffered and retries them in the next flush — each one still
    carrying the `recorded_at` from when it was taken.
    """
    if not readings:
        return True

    url = config["xplant_base_url"].rstrip("/") + "/api/v1/sensor-readings"
    headers = {
        "Authorization": f"Bearer {config['device_token']}",
        "Content-Type": "application/json",
    }

    description = f"sensor_readings(batch of {len(readings)})"
    success = post_with_retry(url, headers, {"readings": readings}, description)

    if success:
        log.info("Posted batch of %d reading(s)", len(readings))

    return success


def flush_readings(config: dict[str, Any], buffer: list[dict[str, Any]]) -> None:
    """
    Post everything buffered, in chunks the API will accept, mutating `buffer`
    in place to drop only what was successfully delivered. Stops at the first
    failed chunk so ordering is preserved for the next attempt.
    """
    max_batch = config["batch_max_readings"]

    while buffer:
        chunk = buffer[:max_batch]
        if not post_sensor_readings(config, chunk):
            log.warning(
                "Batch failed; keeping %d reading(s) buffered for retry",
                len(buffer),
            )
            return
        del buffer[: len(chunk)]


def send_heartbeat(config: dict[str, Any]) -> None:
    """POST a heartbeat to /api/v1/devices/:deviceId/heartbeat."""
    device_id = config["device_id"]
    url = (
        config["xplant_base_url"].rstrip("/")
        + f"/api/v1/devices/{device_id}/heartbeat"
    )
    headers = {
        "Authorization": f"Bearer {config['device_token']}",
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
    reading_interval   = config["reading_interval_seconds"]
    heartbeat_interval = config["heartbeat_interval_seconds"]
    flush_interval     = config["batch_flush_interval_seconds"]
    buffer_limit       = config["batch_buffer_limit"]
    simulate           = config["simulate"]
    sensors            = config["sensors"]

    if simulate:
        log.info("Running in SIMULATE mode — no real GPIO reads")

    buffer: list[dict[str, Any]] = []
    last_reading   = 0.0
    last_heartbeat = 0.0
    last_flush     = 0.0

    log.info(
        "Gateway started | device=%s | reading every %ds | "
        "posting every %ds (max %d per batch) | heartbeat every %ds",
        config["device_id"],
        reading_interval,
        flush_interval,
        config["batch_max_readings"],
        heartbeat_interval,
    )

    while True:
        now = time.monotonic()

        # Take readings into the buffer
        if now - last_reading >= reading_interval:
            last_reading = now
            for sensor in sensors:
                try:
                    value = get_sensor_value(sensor, simulate)
                    buffer.append(build_reading(config, sensor, value))
                    log.debug("Read %s = %s %s", sensor["type"], value, sensor["unit"])
                except Exception as exc:
                    log.error("Error reading %s: %s", sensor["type"], exc)

            if len(buffer) > buffer_limit:
                dropped = len(buffer) - buffer_limit
                del buffer[:dropped]
                log.error(
                    "Buffer limit (%d) exceeded — dropped %d oldest reading(s). "
                    "xPlant has been unreachable for a long time.",
                    buffer_limit, dropped,
                )

        # Post the buffer on the flush interval, or as soon as it fills a batch
        due = now - last_flush >= flush_interval
        if buffer and (due or len(buffer) >= config["batch_max_readings"]):
            last_flush = now
            try:
                flush_readings(config, buffer)
            except Exception as exc:
                log.error("Error posting readings: %s", exc)

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
