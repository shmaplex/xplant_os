#!/usr/bin/env bash
# curl-example.sh
# ================
# Post a temperature reading to xPlant using curl.
#
# Usage:
#   export XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE"
#   export XPLANT_DEVICE_ID="YOUR_DEVICE_UUID"
#   bash curl-example.sh

set -euo pipefail

# Read credentials from environment variables — never hard-code them
API_KEY="${XPLANT_API_KEY:?Set XPLANT_API_KEY before running this script}"
DEVICE_ID="${XPLANT_DEVICE_ID:?Set XPLANT_DEVICE_ID before running this script}"

BASE_URL="https://xplant.shmaplex.com"

echo "Posting temperature reading to xPlant..."

# POST the reading
# The -f flag makes curl exit with an error code if the HTTP status is 4xx/5xx
RESPONSE=$(curl -sf \
  -X POST "${BASE_URL}/api/v1/sensor-readings" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"${DEVICE_ID}\",
    \"type\": \"temperature\",
    \"value\": 24.5,
    \"unit\": \"C\"
  }")

echo "Success! Response:"
echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"

# Post a heartbeat to signal the device is online
echo ""
echo "Sending heartbeat..."

curl -sf \
  -X POST "${BASE_URL}/api/v1/devices/${DEVICE_ID}/heartbeat" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{}" \
  | python3 -m json.tool 2>/dev/null

echo ""
echo "Done."
