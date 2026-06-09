import { SensorReadingsResource } from "./resources/sensor-readings.js";
import { DevicesResource } from "./resources/devices.js";
import { PlantsResource } from "./resources/plants.js";
import { TasksResource } from "./resources/tasks.js";
import { LabelsResource } from "./resources/labels.js";

/** Internal type for the shared request function passed to each resource. */
export type RequestFn = <T>(path: string, options?: RequestInit) => Promise<T>;

export interface XPlantClientConfig {
  /** Your xPlant API key (xpk_live_... or xpk_dev_...). */
  apiKey: string;
  /**
   * Override the base URL. Defaults to https://xplant.shmaplex.com.
   * Useful for pointing at a local dev server during testing.
   */
  baseUrl?: string;
}

export class XPlantClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: XPlantClientConfig) {
    if (!config.apiKey) {
      throw new Error(
        "XPlantClient: apiKey is required. " +
          "Get yours at https://xplant.shmaplex.com/settings/integrations",
      );
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (
      config.baseUrl ?? "https://xplant.shmaplex.com"
    ).replace(/\/$/, "");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`xPlant API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  /** Post sensor readings (temperature, humidity, CO2, etc.) */
  get sensorReadings(): SensorReadingsResource {
    return new SensorReadingsResource(this.request.bind(this));
  }

  /** Register devices, send heartbeats, and retrieve device metadata */
  get devices(): DevicesResource {
    return new DevicesResource(this.request.bind(this));
  }

  /** Read plant summaries (requires plants:read scope) */
  get plants(): PlantsResource {
    return new PlantsResource(this.request.bind(this));
  }

  /** Read task summaries (requires tasks:read scope) */
  get tasks(): TasksResource {
    return new TasksResource(this.request.bind(this));
  }

  /** Resolve barcode/QR labels to xPlant records (requires labels:read scope) */
  get labels(): LabelsResource {
    return new LabelsResource(this.request.bind(this));
  }
}
