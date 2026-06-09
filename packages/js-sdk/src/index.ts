// @xplant/sdk — public API surface

export { XPlantClient } from "./client.js";
export type { XPlantClientConfig, RequestFn } from "./client.js";

export { SensorReadingsResource } from "./resources/sensor-readings.js";
export { DevicesResource } from "./resources/devices.js";
export { PlantsResource } from "./resources/plants.js";
export { TasksResource } from "./resources/tasks.js";
export { LabelsResource } from "./resources/labels.js";

export type {
  XPlantApiResponse,
  SensorType,
  SensorUnit,
  SensorReadingPayload,
  SensorReading,
  DeviceEventPayload,
  DeviceEvent,
  DeviceHeartbeatPayload,
  HeartbeatResponse,
  DeviceSummary,
  PlantSummary,
  TaskSummary,
  LabelResolveResult,
} from "./types.js";
