#!/usr/bin/env python3
"""
python-example.py
==================
Post a temperature reading to xPlant using Python.

Usage:
    pip install requests
    XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE" \\
    XPLANT_DEVICE_ID="YOUR_DEVICE_UUID" \\
    python3 python-example.py

Python 3.8+ required.
"""

import os
import sys
import json

import requests

# Read credentials from environment variables — never hard-code them
api_key   = os.environ.get("XPLANT_API_KEY")
device_id = os.environ.get("XPLANT_DEVICE_ID")

if not api_key:
    print("Error: Set XPLANT_API_KEY before running this script.", file=sys.stderr)
    sys.exit(1)

if not device_id:
    print("Error: Set XPLANT_DEVICE_ID before running this script.", file=sys.stderr)
    sys.exit(1)

BASE_URL = "https://xplant.shmaplex.com"

# All API requests use this header
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}


def post_sensor_reading(reading_type: str, value: float, unit: str) -> dict:
    """Post a single sensor reading and return the created record."""
    payload = {
        "device_id": device_id,
        "type": reading_type,
        "value": value,
        "unit": unit,
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
    print(f"Heartbeat sent. Last seen: {hb.get('last_seen_at')}")

    print("\nDone.")
