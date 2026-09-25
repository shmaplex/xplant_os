#!/usr/bin/env python3
"""
python-example.py
==================
Post a temperature reading to xPlant using Python.

Usage:
    pip install requests
    XPLANT_DEVICE_TOKEN="xpd_live_YOUR_TOKEN_HERE" \\
    XPLANT_DEVICE_ID="YOUR_DEVICE_UUID" \\
    python3 python-example.py

Python 3.8+ required.
"""

import os
import sys
import json
from datetime import datetime, timezone

import requests

# Read credentials from environment variables — never hard-code them
device_token = os.environ.get("XPLANT_DEVICE_TOKEN")  # a device token, never a workspace key
device_id    = os.environ.get("XPLANT_DEVICE_ID")

if not device_token:
    print("Error: Set XPLANT_DEVICE_TOKEN before running this script.", file=sys.stderr)
    sys.exit(1)

if not device_id:
    print("Error: Set XPLANT_DEVICE_ID before running this script.", file=sys.stderr)
    sys.exit(1)

BASE_URL = "https://app.xplantpro.com"

# All API requests use this header
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json",
}


def post_sensor_reading(reading_type: str, value: float, unit: str) -> dict:
    """Post a single sensor reading and return the created record."""
    payload = {
        "device_id": device_id,
        "type": reading_type,
        "value": value,
        "unit": unit,
        # The field is `recorded_at`, not `timestamp`. The API validates with
        # a schema that strips unknown keys, so a field named `timestamp` is
        # silently discarded and the reading falls back to server-receive
        # time. Always send the time the reading was taken.
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }

    resp = requests.post(
        f"{BASE_URL}/api/v1/sensor-readings",
        headers=headers,
        json=payload,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def send_heartbeat() -> dict:
    """Ping the heartbeat endpoint."""
    resp = requests.post(
        f"{BASE_URL}/api/v1/devices/{device_id}/heartbeat",
        headers=headers,
        json={},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


if __name__ == "__main__":
    print("Posting temperature reading to xPlant...")
    reading = post_sensor_reading("temperature", 24.5, "C")
    print("Success! Created reading:")
    print(json.dumps(reading, indent=2))

    print("\nPosting humidity reading...")
    post_sensor_reading("humidity", 72.1, "%")
    print("Humidity reading posted.")

    print("\nSending heartbeat...")
    hb = send_heartbeat()
    print("Heartbeat sent:", json.dumps(hb.get("data"), indent=2))

    print("\nDone.")
