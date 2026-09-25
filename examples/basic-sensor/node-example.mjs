/**
 * node-example.mjs
 * =================
 * Post sensor readings and a heartbeat to xPlant as a device, using
 * @shmaplex/xplant-sdk and a device token.
 *
 * Usage:
 *   npm install @shmaplex/xplant-sdk
 *   XPLANT_DEVICE_TOKEN="xpd_live_YOUR_TOKEN_HERE" \
 *   XPLANT_DEVICE_ID="YOUR_DEVICE_UUID" \
 *   node node-example.mjs
 *
 * Node.js 18+ is required (native fetch).
 */

import { XPlantClient } from "@shmaplex/xplant-sdk";

// Read credentials from environment variables — never hard-code them.
// A device carries a device token (xpd_…), never a workspace key (xpk_…).
const deviceToken = process.env.XPLANT_DEVICE_TOKEN;
const deviceId = process.env.XPLANT_DEVICE_ID;

if (!deviceToken) throw new Error("Set XPLANT_DEVICE_TOKEN before running this script");
if (!deviceId) throw new Error("Set XPLANT_DEVICE_ID before running this script");

// The SDK refuses a deviceToken that doesn't start with xpd_.
const device = new XPlantClient({ deviceToken, retry: true });

// Send both readings in one request. `external_id` + `recorded_at` make a
// retried batch harmless: the same reading is never stored twice.
const at = new Date().toISOString();
const stored = await device.sensorReadings.createBatch([
  { device_id: deviceId, type: "temperature", value: 24.5, unit: "C", recorded_at: at, external_id: `${deviceId}-temperature-${at}` },
  { device_id: deviceId, type: "humidity", value: 72.1, unit: "%", recorded_at: at, external_id: `${deviceId}-humidity-${at}` },
]);
console.log(`Stored ${stored.length} readings.`);

// Tell xPlant the device is alive.
await device.devices.heartbeat(deviceId);
console.log("Heartbeat sent.");

// ---------------------------------------------------------------------------
// Without the SDK — plain fetch
// ---------------------------------------------------------------------------
//
// const res = await fetch("https://app.xplantpro.com/api/v1/sensor-readings", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${deviceToken}`,
//   },
//   body: JSON.stringify({
//     readings: [{ device_id: deviceId, type: "temperature", value: 24.5, unit: "C", recorded_at: at }],
//   }),
// });
// const body = await res.json();
// if (!body.ok) throw new Error(`${res.status} ${body.code}: ${body.error}`);
// console.log(body.data);
