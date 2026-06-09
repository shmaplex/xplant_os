import type { RequestFn } from "../client.js";
import type { SensorReading, SensorReadingPayload } from "../types.js";

export class SensorReadingsResource {
  constructor(private request: RequestFn) {}

  /**
   * Post a new sensor reading from a device.
   *
   * @example
   * await client.sensorReadings.create({
   *   device_id: "uuid",
   *   type: "temperature",
   *   value: 24.5,
   *   unit: "C",
   * });
   */
  create(payload: SensorReadingPayload): Promise<SensorReading> {
    return this.request<SensorReading>("/api/v1/sensor-readings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * List recent sensor readings for a device.
   * Requires the `sensor_readings:read` scope.
   */
  list(deviceId: string): Promise<SensorReading[]> {
    return this.request<SensorReading[]>(
      `/api/v1/sensor-readings?device_id=${encodeURIComponent(deviceId)}`,
    );
  }
}
