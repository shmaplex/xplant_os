# Contributing to xplant_os

This doc covers technical contribution details. For the high-level overview, see [CONTRIBUTING.md](../CONTRIBUTING.md) at the repo root.

---

## Adding a new device integration

A device integration is a self-contained folder under `devices/<platform>/<device-name>/` that gives a developer everything they need to get a specific piece of hardware posting data to xPlant.

### Required files

| File | Purpose |
|---|---|
| `README.md` | Hardware requirements, wiring, dependencies, step-by-step setup |
| Source file(s) | The actual firmware / script (`.ino`, `.py`, `.yaml`, etc.) |
| `config.h` or `config.example.json` | Configuration template with placeholder values only |

### README.md template for devices

```markdown
# <Device Name>

<One sentence description of what this does.>

## Hardware requirements

- [List components]

## Wiring diagram

    [ASCII wiring diagram]

## Software dependencies

- [List libraries / packages]

## Setup

1. Step one
2. Step two

## API key

Get your key from https://xplant.shmaplex.com/settings/integrations
and place it in config.h (never commit this file).
```

---

## Adding to the JS SDK

The SDK lives in `packages/js-sdk/src/`. Resources are in `src/resources/`.

Each resource file exports a class that wraps `this.request`:

```typescript
// src/resources/my-resource.ts
import type { RequestFn } from "../client.js";

export class MyResource {
  constructor(private request: RequestFn) {}

  async create(payload: MyPayload): Promise<MyResponse> {
    return this.request("/api/v1/my-endpoint", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
```

Add a getter to `XPlantClient` in `src/client.ts`, export the new type from `src/types.ts`, and re-export the class from `src/index.ts`.

---

## Adding a new example

Examples live in `examples/<name>/`. They should:

- Use `YOUR_XPLANT_API_KEY` or `process.env.XPLANT_API_KEY` — never a real key
- Be short and heavily commented
- Include a `README.md` explaining what the example demonstrates and how to run it

---

## Running the JS SDK locally

```bash
cd packages/js-sdk
npm install
npm run build   # tsc
```

There is no test suite yet. If you add tests, use Vitest (consistent with the main xPlant app).

---

## Style guide

- TypeScript: strict mode, no `any` unless unavoidable
- Python: PEP 8, type hints where reasonable
- Arduino/C++: Arduino style (camelCase functions, ALL_CAPS constants)
- All config examples: placeholder values only, never real credentials

---

## Getting help

Open a [GitHub Discussion](https://github.com/shmaplex/xplant_os/discussions) if you are unsure where something should go or have questions before writing code.
