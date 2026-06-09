import type { RequestFn } from "../client.js";
import type {
  DeviceHeartbeatPayload,
  DeviceSummary,
  HeartbeatResponse,
} from "../types.js";

export class DevicesResource {
  constructor(private request: RequestFn) {}

  /**
   * Signal that a device is alive and connected.
   * Call this periodically (e.g. every 5 minutes) from firmware.
   */
  heartbeat(
    deviceId: string,
    metadata?: DeviceHeartbeatPayload,
  ): Promise<HeartbeatResponse> {
    return this.request<HeartbeatResponse>(
      `/api/v1/devices/${encodeURIComponent(deviceId)}/heartbeat`,
      {
        method: "POST",
        body: JSON.stringify(metadata ?? {}),
      },
    );
  }

  /**
   * Fetch metadata for a registered device.
   * Requires the `devices:read` scope.
   */
  get(deviceId: string): Promise<DeviceSummary> {
    return this.request<DeviceSummary>(
      `/api/v1/devices/${encodeURIComponent(deviceId)}`,
    );
  }
}
