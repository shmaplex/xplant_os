/**
 * Hand-written additions to the generated API reference, keyed by
 * "METHOD /path" (stable across operationId renames).
 *
 * The OpenAPI spec is the source of truth for parameters, schemas, scopes and
 * errors. This file only adds what a spec can't carry well: a page slug, a
 * readable title when the spec has none, example values, the SDK call, and a
 * short note. `npm run check` fails if an entry here has no operation in the
 * spec, or an operation in the spec has no entry here.
 *
 * sdk:   null when the SDK doesn't cover the endpoint yet (the page shows fetch);
 *        otherwise the JavaScript lines after the client is created (`client` for a
 *        workspace key, `device` for a device token). `$QUERY` and `$BODY` are
 *        replaced with the `query` / `body` examples as JS literals; or pass a
 *        function ({ js, body, query }) => string for anything else.
 * path:  example values for path parameters (also used as variable names).
 * notes: Markdown shown under the description (for documented endpoints, only
 *        its links to guides are kept).
 * sdkNote: Markdown about the SDK call, always shown.
 */

const PLANT_ID = "0b8e2f4c-6a1d-4c3e-9f7a-2d5b8c1e4a90";
const EXPLANT_ID = "7c1d9e2a-3b4f-4a5c-8d6e-1f2a3b4c5d6e";
const TASK_ID = "4e9a1c7b-2d3f-4b5a-9c8d-6e7f8a9b0c1d";
const SOP_ID = "9d2c4b6a-8e1f-4a3b-b5c7-d9e1f3a5b7c9";
const RUN_ID = "2a4c6e8b-1d3f-4b5a-a7c9-e1f3a5b7c9d1";
const DEVICE_ID = "5f7a9c1e-3b5d-4f7a-9c1e-3b5d7f9a1c3e";
const EQUIPMENT_ID = "8b0d2f4a-6c8e-4a0b-8d2f-4a6c8e0b2d4f";
const MEMBER_ID = "1c3e5a7b-9d1f-4b3d-8e5a-7b9d1f3b5d7e";
const CONTAMINATION_ID = "6a8c0e2b-4d6f-4a8c-9e0b-2d4f6a8c0e2b";
const ASSET_ID = "9e1a3c5b-7d9f-4b1d-a3c5-e7f9b1d3f5a7";
const RECIPE_ID = "4b6d8f0a-2c4e-4d6f-8a0c-2e4b6d8f0a2c";

export const overlay = {
  // ── Account ───────────────────────────────────────────────────────────────
  "GET /api/v1/me": {
    slug: "get-me",
    title: "Get the calling key",
    description: "The key's identity, every scope it holds, and the workspace it acts in. Make this your first call.",
    resultVar: "me",
    sdk: "const me = await client.me.get();\nconsole.log(me.scopes); // e.g. [\"read:plants\", \"write:sensor_readings\"]",
    notes:
      "This endpoint needs no scope, but it still needs a valid, active key. Use it to check a key's scopes before calling anything else, rather than finding a missing scope one `403` at a time. Only the key's **prefix** is ever returned, never the key itself.",
  },
  "GET /api/v1/workspaces": {
    slug: "list-workspaces",
    title: "Get the workspace",
    description: "The lab this key acts in: its id, name and type.",
    resultVar: "workspaces",
    sdk: "const [workspace] = await client.workspaces.list();\nconsole.log(workspace.name);",
    notes:
      "The response is a list that always holds exactly one workspace: a key is created in one workspace and can only act there. Use the name to label what an integration is writing to, and to fail loudly if it has been pointed at the wrong lab.",
  },

  // ── Plants and explants ───────────────────────────────────────────────────
  "GET /api/v1/plants": {
    slug: "list-plants",
    title: "List plants",
    sdkNote: "The SDK takes `external_id`; the query parameter is `externalId`.",
    description: "Plant records for the key's workspace.",
    resultVar: "plants",
    query: { limit: 50 },
    sdk: "const plants = await client.plants.list($QUERY);",
  },
  "GET /api/v1/plants/{id}": {
    slug: "get-plant",
    title: "Get a plant",
    description: "One plant by id, from the key's workspace.",
    path: { id: PLANT_ID },
    resultVar: "plant",
    sdk: `const plant = await client.plants.get("${PLANT_ID}");`,
  },
  "GET /api/v1/explants": {
    slug: "list-explants",
    title: "List explants",
    sdkNote: "The SDK takes `external_id`; the query parameter is `externalId`.",
    description: "Explant records for the key's workspace, optionally matched by your own identifier.",
    resultVar: "explants",
    query: { externalId: "LINE-0412" },
    sdk: "const explants = await client.explants.list({ external_id: \"LINE-0412\" });\n\n// Or resolve one of your own codes straight to a record (or null):\nconst batch = await client.explants.findByExternalId(\"LINE-0412\");",
    notes:
      "Pass `externalId` to find the record your own tracker already knows by (a spreadsheet batch number, for example). You don't need to keep a separate id mapping on your side.",
  },
  "GET /api/v1/explants/{id}": {
    slug: "get-explant",
    title: "Get an explant",
    description: "One explant by id, from the key's workspace.",
    path: { id: EXPLANT_ID },
    resultVar: "explant",
    sdk: `const explant = await client.explants.get("${EXPLANT_ID}");`,
  },

  "POST /api/v1/plants": {
    title: "Create a plant",
    resultVar: "plant",
    idempotencyKey: "import-2026-09-25-row-0412",
    sdk: null,
  },
  "PATCH /api/v1/plants/{id}": {
    title: "Update a plant",
    path: { id: PLANT_ID },
    resultVar: "plant",
    sdk: null,
  },
  "POST /api/v1/explants": {
    title: "Create an explant",
    resultVar: "explant",
    idempotencyKey: "import-2026-09-25-line-0412",
    sdk: null,
  },
  "PATCH /api/v1/explants/{id}": {
    title: "Update an explant",
    path: { id: EXPLANT_ID },
    resultVar: "explant",
    sdk: null,
  },

  // ── Transfers and stages ──────────────────────────────────────────────────
  "GET /api/v1/transfers": {
    slug: "list-transfers",
    title: "List transfers",
    description: "Transfer history for one plant or explant, most recent first.",
    resultVar: "transfers",
    query: { explant_id: EXPLANT_ID },
    sdk: "const transfers = await client.transfers.list($QUERY);",
    notes: "Pass exactly one of `plant_id` or `explant_id`.",
  },
  "POST /api/v1/transfers": {
    slug: "create-transfer",
    title: "Record a transfer",
    description: "Logs a subculture to fresh media for a plant or explant.",
    resultVar: "transfer",
    body: {
      explant_id: EXPLANT_ID,
      from_location: "Shelf A2",
      to_location: "Shelf B1",
      notes: "Routine subculture",
    },
    sdk: "const transfer = await client.transfers.create($BODY);",
    notes:
      "Give exactly one of `plant_id` or `explant_id`. The transfer cycle counts up from the record's history unless you pass `transfer_cycle` yourself.",
  },
  "GET /api/v1/stages": {
    slug: "list-stages",
    title: "List stages",
    description: "Stage progression for one plant or explant, most recent first.",
    resultVar: "stages",
    query: { plant_id: PLANT_ID },
    sdk: "const stages = await client.stages.list($QUERY);",
    notes: "Pass exactly one of `plant_id` or `explant_id`.",
  },
  "POST /api/v1/stages": {
    slug: "create-stage",
    title: "Advance a stage",
    description: "Moves a plant or explant to a new tissue-culture stage.",
    resultVar: "stage",
    body: { plant_id: PLANT_ID, stage: "Multiplication" },
    sdk: "const stage = await client.stages.advance($BODY);",
    notes:
      "One call completes the current stage and makes the new one current. `stage` is required; give exactly one of `plant_id` or `explant_id`.",
  },

  // ── Change history ────────────────────────────────────────────────────────
  "GET /api/v1/events": {
    slug: "list-change-events",
    title: "List change history",
    description: "Plant or explant edit history for the key's workspace, oldest first.",
    resultVar: "events",
    query: { entity: "plant", since: "2026-09-01T00:00:00Z" },
    sdk: "const events = await client.events.list($QUERY);",
    notes:
      "`entity` is required: `plant` or `explant`. Pull each one separately. Events come oldest first, and `since` is exclusive (only events created after it). To sync incrementally, save the last `created_at` you saw and pass it back as `since` on the next call. See [Pull change history](/docs/guides/change-history).",
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  "GET /api/v1/tasks": {
    slug: "list-tasks",
    title: "List tasks",
    description: "Tasks in the key's workspace, optionally filtered by status or assignee.",
    resultVar: "tasks",
    query: { status: "todo", limit: 50 },
    sdk: "const tasks = await client.tasks.list($QUERY);",
  },
  "POST /api/v1/tasks": {
    slug: "create-task",
    title: "Create a task",
    description: "Adds a task to the workspace.",
    resultVar: "task",
    idempotencyKey: "bench-3-replate-line-0412",
    body: {
      title: "Replate LINE-0412",
      category: "transfer",
      priority: "urgent",
      due_date: "2026-10-02T09:00:00Z",
      assigned_to: MEMBER_ID,
    },
    sdk: 'const task = await client.tasks.create(\n  $BODY,\n  { idempotencyKey: "bench-3-replate-line-0412" },\n);',
  },
  "GET /api/v1/tasks/{id}": {
    slug: "get-task",
    title: "Get a task",
    description: "One task by id, from the key's workspace.",
    path: { id: TASK_ID },
    resultVar: "task",
    sdk: `const task = await client.tasks.get("${TASK_ID}");`,
  },
  "PATCH /api/v1/tasks/{id}": {
    slug: "update-task",
    title: "Update a task",
    description: "Changes fields on a task.",
    path: { id: TASK_ID },
    resultVar: "result",
    body: { priority: "high", priority_rank: 1500 },
    sdk: `const { task, skipped } = await client.tasks.update(\n  "${TASK_ID}",\n  $BODY,\n);\nif (skipped) {\n  // Someone ordered this task by hand; the ordering change was left out.\n}`,
    notes:
      "A partial update: send only the fields you want to change.\n\nA change made through the API never overrides an order someone set by hand. If a person has positioned the task, an ordering change (`priority`, `priority_rank`) is skipped rather than applied. The response is still `200`, the rest of the patch still applies, and `meta.priority_write` explains what happened. Send `release: true` with the change to hand the task back to automatic ordering. See [Sync tasks](/docs/guides/sync-tasks).",
  },
  "GET /api/v1/tasks/demand": {
    slug: "list-demand-signals",
    title: "List demand signals",
    description: "Demand signals recorded for the workspace, per genus.",
    resultVar: "signals",
    query: { genus: "Alocasia", current: true },
    sdk: "const signals = await client.taskDemand.list($QUERY);",
  },
  "POST /api/v1/tasks/demand": {
    slug: "create-demand-signal",
    title: "Record a demand signal",
    description: "Pushes a sales or order demand number for a genus, so the bench queue can prioritise the work that sells.",
    resultVar: "signal",
    body: {
      genus: "Alocasia",
      demand_score: 82,
      source: "Online store, last 30 days",
      observed_at: "2026-09-24T00:00:00Z",
    },
    sdk: "const signal = await client.taskDemand.record($BODY);",
    notes: "See [Push demand signals](/docs/guides/demand-signals).",
  },

  // ── SOPs ──────────────────────────────────────────────────────────────────
  "GET /api/v1/sops": {
    slug: "list-sops",
    title: "List SOPs",
    description: "SOP summaries for the workspace. Steps are not included; fetch one SOP to get them.",
    resultVar: "sops",
    query: { limit: 50 },
    sdk: "const sops = await client.sops.list($QUERY);",
  },
  "GET /api/v1/sops/{id}": {
    slug: "get-sop",
    title: "Get an SOP",
    description: "One SOP with the version currently in force and its steps.",
    path: { id: SOP_ID },
    resultVar: "sop",
    sdk: `const sop = await client.sops.get("${SOP_ID}");\nif (!sop.version) {\n  // No version is in force yet, so there are no steps to run.\n}`,
    notes:
      "You get the version the lab works from right now, never a draft and never a version that is approved but not yet in force. If no version is in force, `version` is `null` and there are no steps; handle that rather than treating it as an empty procedure.\n\n`currentVersion` (the highest version that exists) and `version.version` (the one in force) can differ, and often do.",
  },
  "POST /api/v1/sop-runs": {
    slug: "create-sop-run",
    title: "Start an SOP run",
    description: "Starts a run of an SOP at a bench, pinned to the version in force.",
    resultVar: "run",
    idempotencyKey: "station-3-wk38-start",
    body: { sop_id: SOP_ID, batch_code: "WK-38" },
    sdk: 'const run = await client.sopRuns.start(\n  $BODY,\n  { idempotencyKey: "station-3-wk38-start" },\n);',
    notes:
      "A run always follows the version in force, and you can't name a different one. An SOP with no version in force answers `409 SOP_RUN_NOT_EFFECTIVE`. See [Run an SOP from a bench station](/docs/guides/sop-runs).",
  },
  "GET /api/v1/sop-runs/{id}": {
    slug: "get-sop-run",
    title: "Get an SOP run",
    description: "The run, its steps and every piece of evidence recorded against them, in order.",
    path: { id: RUN_ID },
    resultVar: "run",
    sdk: `const run = await client.sopRuns.get("${RUN_ID}");`,
  },
  "POST /api/v1/sop-runs/{id}/steps/{stepId}/events": {
    slug: "create-sop-step-event",
    title: "Record step evidence",
    description: "Records a confirmation, scan, skip, note or device state against one step of a run.",
    path: { id: RUN_ID, stepId: "step-3" },
    resultVar: "event",
    idempotencyKey: "station-3-wk38-step3-scan",
    body: { event_type: "scanned", payload: { code: "LINE-0412" } },
    sdk: `const event = await client.sopRuns.recordStepEvent(\n  "${RUN_ID}",\n  "step-3",\n  $BODY,\n  { idempotencyKey: "station-3-wk38-step3-scan" },\n);`,
    notes:
      "Runs are append-only: nothing here can be edited or deleted. To correct something, record another event. A completed run answers `409 SOP_RUN_CLOSED`.",
  },
  "POST /api/v1/sop-runs/{id}/steps/{stepId}/measurements": {
    slug: "create-sop-step-measurement",
    title: "Record a step measurement",
    description: "Records a numeric reading, with its unit, against one step of a run.",
    path: { id: RUN_ID, stepId: "step-3" },
    resultVar: "measurement",
    idempotencyKey: "station-3-wk38-step3-ph",
    body: { metric: "ph", value: 5.7, unit: "pH" },
    sdk: `const measurement = await client.sopRuns.recordMeasurement(\n  "${RUN_ID}",\n  "step-3",\n  $BODY,\n  { idempotencyKey: "station-3-wk38-step3-ph" },\n);`,
    notes:
      "`unit` is required and has no default. The measurement shows up on the run's timeline as a `measured` event, alongside the confirmations.",
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  "GET /api/v1/labels/resolve": {
    slug: "resolve-label",
    title: "Resolve a label",
    description: "Turns a scanned QR or barcode value into the plant or explant it labels.",
    query: { barcode: "LINE-0412" },
    resultVar: "match",
    sdk: 'const match = await client.labels.resolve("LINE-0412");\nconsole.log(match.record_type, match.display_name, match.url);',
    notes:
      "Plant labels are matched first, then explant labels, within the key's workspace. Returns `record_type`, `record_id`, `display_name` and a link to the record in the app. Resolving leaves no trace; to record that a scan happened, also call [Record a label scan](/docs/api/labels/create-label-scan).",
  },
  "POST /api/v1/label-scans": {
    slug: "create-label-scan",
    title: "Record a label scan",
    description: "Records that a label was scanned, and where.",
    resultVar: "scan",
    idempotencyKey: "scanner-3-0f2a7c91",
    body: { barcode: "LINE-0412", plant_id: PLANT_ID, context: "Shelf 3" },
    sdk: 'const scan = await client.labels.recordScan(\n  $BODY,\n  { idempotencyKey: "scanner-3-0f2a7c91" },\n);',
    notes:
      "You don't send `resolved`; it's set to true when the body names a record. Scans are history, so they can't be edited or deleted. A correction is another scan.",
  },

  // ── Devices ───────────────────────────────────────────────────────────────
  "GET /api/v1/devices": {
    slug: "list-devices",
    title: "List devices",
    description: "Registered devices in the key's workspace and their status.",
    resultVar: "devices",
    sdk: "const devices = await client.devices.list();",
  },
  "POST /api/v1/devices": {
    slug: "create-device",
    title: "Register a device",
    description: "Registers a device in the key's workspace.",
    resultVar: "device",
    body: { name: "Grow room Pi", type: "gateway", hardware: "Raspberry Pi 4B" },
    sdk: "const device = await client.devices.register($BODY);",
    notes:
      "Next, [create a device token](/docs/api/devices/create-device-token) for it. The device should carry that token, never a workspace key.\n\nRegistering past your plan's device allowance answers `402 DEVICE_LIMIT_REACHED`.",
  },
  "POST /api/v1/devices/{deviceId}/heartbeat": {
    slug: "send-heartbeat",
    title: "Send a heartbeat",
    description: "Tells xPlant a device is alive, and updates its last-seen time.",
    path: { deviceId: DEVICE_ID },
    resultVar: "heartbeat",
    sdk: `const heartbeat = await device.devices.heartbeat("${DEVICE_ID}");`,
  },
  "GET /api/v1/devices/{deviceId}/tokens": {
    slug: "list-device-tokens",
    title: "List device tokens",
    description: "Prefix, status and last use of each token for one device. The secret is never returned.",
    path: { deviceId: DEVICE_ID },
    resultVar: "tokens",
    sdk: `const tokens = await client.devices.listTokens("${DEVICE_ID}");`,
    notes: "Use this to decide which token to [revoke](/docs/api/devices/revoke-device-token). Nothing here can be used to authenticate.",
  },
  "POST /api/v1/devices/{deviceId}/tokens": {
    slug: "create-device-token",
    title: "Create a device token",
    description: "Creates an `xpd_` token that can post readings, heartbeats and events for this one device.",
    path: { deviceId: DEVICE_ID },
    resultVar: "created",
    body: { name: "Grow room Pi" },
    sdk: `const { token } = await client.devices.createToken(\n  "${DEVICE_ID}",\n  $BODY,\n);\n// Store it on the device now: it is never shown again.`,
    notes:
      "Run this once, from a machine you control, with a workspace key. **The token is returned once and never again.** If you lose it, create another and revoke the old one. See [Device tokens](/docs/device-tokens).",
    response: { token: "xpd_live_…", prefix: "xpd_live_9f3a" },
  },
  "DELETE /api/v1/devices/{deviceId}/tokens/{tokenId}": {
    slug: "revoke-device-token",
    title: "Revoke a device token",
    description: "Stops one device token from working. The device's other tokens are unaffected.",
    path: { deviceId: DEVICE_ID, tokenId: "3c5e7a9b-1d3f-4b5d-8f7a-9c1e3b5d7f9a" },
    resultVar: "revoked",
    sdk: `const revoked = await client.devices.revokeToken(\n  "${DEVICE_ID}",\n  "3c5e7a9b-1d3f-4b5d-8f7a-9c1e3b5d7f9a",\n);`,
    notes:
      "Needs a workspace key; a device token can't revoke tokens. The token is refused from its next request. Revoking a token that is already revoked answers `200` with its current state, so a retry is harmless. A token belonging to another device or workspace answers `404`.",
  },
  "POST /api/v1/device-events": {
    slug: "create-device-event",
    title: "Record a device event",
    description: "Records something a device observed or did, such as a door opening or a status change.",
    resultVar: "event",
    body: {
      device_id: DEVICE_ID,
      event_type: "door_opened",
      payload: { door: "Grow room 2" },
      occurred_at: "2026-09-25T08:15:00Z",
    },
    sdk: "const event = await device.devices.recordEvent($BODY);",
  },

  // ── Sensor readings ───────────────────────────────────────────────────────
  "GET /api/v1/sensor-readings": {
    slug: "list-sensor-readings",
    title: "List sensor readings",
    description: "Stored sensor readings, filtered by device, room, type or time.",
    resultVar: "readings",
    query: { device_id: DEVICE_ID, type: "temperature", since: "2026-09-24T00:00:00Z", limit: 200 },
    sdk: "const readings = await client.sensorReadings.list($QUERY);",
  },
  "POST /api/v1/sensor-readings": {
    slug: "create-sensor-readings",
    title: "Submit sensor readings",
    description: "Submits one reading, or up to 500 in a single batch.",
    resultVar: "stored",
    body: {
      readings: [
        {
          device_id: DEVICE_ID,
          type: "temperature",
          value: 23.4,
          unit: "C",
          recorded_at: "2026-09-25T12:00:00Z",
          external_id: "gw1-temperature-20260925T120000",
        },
        {
          device_id: DEVICE_ID,
          type: "humidity",
          value: 71.2,
          unit: "%",
          recorded_at: "2026-09-25T12:00:00Z",
          external_id: "gw1-humidity-20260925T120000",
        },
      ],
    },
    sdk: ({ js, body }) => `const stored = await device.sensorReadings.createBatch(${js(body.readings)});`,
    notes:
      "Send a batch (`{\"readings\": [...]}`, up to 500) rather than one request per reading: batching uses far less of your rate limit. Put `external_id` and `recorded_at` on every reading so a retried batch doesn't store duplicates. See [Sensors and devices](/docs/guides/sensors-and-devices).",
  },

  // ── Contaminations ────────────────────────────────────────────────────────
  // Not in the SDK yet (sdk: null): pages show a fetch example instead.
  "GET /api/v1/contaminations": {
    title: "List contaminations",
    resultVar: "contaminations",
    query: { explant_id: EXPLANT_ID, status: "active" },
    sdk: null,
  },
  "POST /api/v1/contaminations": {
    title: "Record a contamination",
    resultVar: "contamination",
    idempotencyKey: "scanner-3-line-0412-contamination",
    sdk: null,
  },
  "GET /api/v1/contaminations/{id}": {
    title: "Get a contamination",
    path: { id: CONTAMINATION_ID },
    resultVar: "contamination",
    sdk: null,
  },

  // ── Comments ──────────────────────────────────────────────────────────────
  "GET /api/v1/comments": {
    title: "List comments",
    resultVar: "comments",
    query: { entity_type: "explant", entity_id: EXPLANT_ID },
    sdk: null,
  },
  "POST /api/v1/comments": {
    title: "Add a comment",
    resultVar: "comment",
    idempotencyKey: "bench-3-line-0412-note-1",
    sdk: null,
  },

  // ── Media files ───────────────────────────────────────────────────────────
  "GET /api/v1/assets": {
    title: "List media files",
    resultVar: "assets",
    query: { target: "explant", target_id: EXPLANT_ID },
    sdk: null,
  },
  "POST /api/v1/assets": {
    title: "Attach a media file",
    resultVar: "asset",
    idempotencyKey: "camera-2-line-0412-photo-1",
    sdk: null,
  },
  "GET /api/v1/assets/{id}": {
    title: "Get a media file",
    path: { id: ASSET_ID },
    resultVar: "asset",
    sdk: null,
  },

  // ── Media recipes ─────────────────────────────────────────────────────────
  "GET /api/v1/media-recipes": {
    title: "List media recipes",
    resultVar: "recipes",
    query: { status: "published" },
    sdk: null,
  },
  "POST /api/v1/media-recipes": {
    title: "Create a media recipe",
    resultVar: "recipe",
    idempotencyKey: "recipes-sync-half-ms-v3",
    sdk: null,
  },
  "GET /api/v1/media-recipes/{id}": {
    title: "Get a media recipe",
    path: { id: RECIPE_ID },
    resultVar: "recipe",
    sdk: null,
  },
  "PATCH /api/v1/media-recipes/{id}": {
    title: "Update a media recipe",
    path: { id: RECIPE_ID },
    resultVar: "recipe",
    sdk: null,
  },

  // ── Equipment ─────────────────────────────────────────────────────────────
  "GET /api/v1/equipment": {
    title: "List equipment",
    resultVar: "equipment",
    query: { category: "autoclave_pressure_cooker", status: "active" },
    sdk: null,
  },
  "GET /api/v1/equipment/{id}": {
    title: "Get a piece of equipment",
    path: { id: EQUIPMENT_ID },
    resultVar: "item",
    sdk: null,
  },
  "GET /api/v1/equipment/{id}/events": {
    title: "List equipment events",
    path: { id: EQUIPMENT_ID },
    resultVar: "events",
    query: { kind: "calibration" },
    sdk: null,
  },
  "POST /api/v1/equipment/{id}/events": {
    slug: "create-equipment-event",
    title: "Record an equipment event",
    description: "Records that a piece of equipment was used, calibrated or maintained.",
    path: { id: EQUIPMENT_ID },
    resultVar: "event",
    idempotencyKey: "autoclave-2-cycle-4411",
    body: {
      kind: "calibration",
      outcome: "pass",
      performed_at: "2026-09-25T07:30:00Z",
      result_summary: "Two-point calibration, pH 4.01 and 7.00",
    },
    sdk: `const event = await client.equipment.recordEvent(\n  "${EQUIPMENT_ID}",\n  $BODY,\n  { idempotencyKey: "autoclave-2-cycle-4411" },\n);`,
    notes:
      "`kind: \"used\"` records usage against a subject (how hard the equipment has been worked). `calibration`, `service`, `fault` and `verification` record maintenance (whether it is fit to use), with an `outcome` of `pass`, `fail`, `adjusted` or `inconclusive`. Events are append-only. See [Equipment events](/docs/guides/equipment-events).",
  },

  // ── Pricing and sell-through ──────────────────────────────────────────────
  "GET /api/v1/pricing/culture-lines": {
    title: "List culture line prices",
    resultVar: "prices",
    query: { plant_id: PLANT_ID },
    sdk: null,
  },
  "GET /api/v1/pricing/events": {
    title: "List price changes",
    resultVar: "events",
    query: { plant_id: PLANT_ID, from: "2026-09-01T00:00:00Z" },
    sdk: null,
  },
  "GET /api/v1/commerce/order-lines": {
    title: "List order lines",
    resultVar: "lines",
    query: { from: "2026-09-01T00:00:00Z", to: "2026-09-25T00:00:00Z" },
    sdk: null,
  },
  "GET /api/v1/commerce/sell-through": {
    title: "Get sell-through",
    resultVar: "sellThrough",
    query: { from: "2026-09-01T00:00:00Z", to: "2026-09-25T00:00:00Z" },
    sdk: null,
  },
};
