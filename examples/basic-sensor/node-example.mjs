/**
 * node-example.mjs
 * =================
 * Post a temperature reading to xPlant using the @shmaplex/xplant-sdk.
 *
 * Usage:
 *   npm install @shmaplex/xplant-sdk
 *   XPLANT_API_KEY="xpk_live_YOUR_KEY_HERE" \
 *   XPLANT_DEVICE_ID="YOUR_DEVICE_UUID" \
 *   node node-example.mjs
 *
 * Node.js 18+ is required (native fetch).
 */

// Read credentials from environment variables — never hard-code them
const apiKey  = process.env.XPLANT_API_KEY;
const deviceId = process.env.XPLANT_DEVICE_ID;

if (!apiKey)   throw new Error("Set XPLANT_API_KEY before running this script");
if (!deviceId) throw new Error("Set XPLANT_DEVICE_ID before running this script");

// ---------------------------------------------------------------------------
// Using the @shmaplex/xplant-sdk (recommended)
// ---------------------------------------------------------------------------
import { XPlantClient } from "@shmaplex/xplant-sdk";

const client = new XPlantClient({ apiKey });

console.log("Posting temperature reading to xPlant...");

// Post a temperature reading
const reading = await client.sensorReadings.create({
  device_id: deviceId,
  type: "temperature",
  value: 24.5,
  unit: "C",
});

console.log("Success! Created reading:", reading);

// Post a humidity reading
await client.sensorReadings.create({
  device_id: deviceId,
  type: "humidity",
  value: 72.1,
  unit: "%",
});

console.log("Humidity reading posted.");

// Send a heartbeat
const heartbeat = await client.devices.heartbeat(deviceId);
console.log("Heartbeat sent. Last seen:", heartbeat.last_seen_at);

// ---------------------------------------------------------------------------
// Without the SDK — using raw fetch (no dependencies)
// ---------------------------------------------------------------------------
// If you prefer not to install the SDK, here is the equivalent with fetch:
//
// const BASE_URL = "https://xplant.shmaplex.com";
//
// const res = await fetch(`${BASE_URL}/api/v1/sensor-readings`, {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${apiKey}`,
//   },
//   body: JSON.stringify({
//     device_id: deviceId,
//     type: "temperature",
//     value: 24.5,
//     unit: "C",
//   }),
// });
//
// if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
// console.log(await res.json());
