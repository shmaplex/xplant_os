# Contributing to xplant_os

Thank you for helping make xplant_os better. This guide explains how the repository is organized, what belongs where, and how to get your contribution merged.

---

## Repository structure

```
xplant_os/
  docs/           ← documentation: quickstart, auth, API reference, scopes
  packages/       ← reusable SDK packages (npm, pip, etc.)
    js-sdk/       ← @shmaplex/xplant-sdk: TypeScript/JavaScript client (source at shmaplex/xplant-sdk)
  devices/        ← firmware and hardware integration examples
    arduino/      ← Arduino / ESP32 sketches (.ino + config.h)
    raspberry-pi/ ← Python scripts for Pi-based gateways and kiosks
    esphome/      ← ESPHome YAML templates
    tasmota/      ← Tasmota webhook rule examples
  examples/       ← minimal end-to-end examples for new integrators
  .github/        ← PR template, issue templates
```

---

## What belongs where

### Adding a new device package

1. Create a folder under the appropriate `devices/<platform>/` directory, e.g. `devices/arduino/my-device/`.
2. Add a `README.md` that includes:
   - What the device does and which hardware it targets
   - Hardware requirements (components, wiring diagram in ASCII)
   - Software/library dependencies
   - Step-by-step setup instructions
   - A link to the API key settings page: `https://xplant.shmaplex.com/settings/integrations`
3. Add the firmware/script source file(s).
4. Add a `config.h` or `config.example.json` with placeholder values — **never real keys**.
5. Reference the new package from the root `README.md` devices table.

### Adding a new SDK language

1. Create a folder under `packages/<language>-sdk/`.
2. Follow the same structure as `packages/js-sdk/`: `src/`, `README.md`, package manifest.
3. Implement at minimum: `XPlantClient` (key auth, base URL), `sensorReadings.create()`, `devices.heartbeat()`.
4. Add tests if your language has a standard testing tool.

### Adding a new example

1. Create a folder under `examples/<name>/`.
2. Add a `README.md` explaining what the example demonstrates.
3. Keep source files short and heavily commented — these are for developers new to xPlant.
4. Use `YOUR_XPLANT_API_KEY` or `xpk_live_YOUR_KEY_HERE` as the placeholder key string.

### Documentation changes

Edit files in `docs/`. Keep language clear and aimed at hardware developers and hobbyists, not just software engineers.

---

## Development workflow

### JS SDK

```bash
cd packages/js-sdk
npm install      # install dev dependencies
npm run build    # tsc compile
npm test         # run tests (if present)
```

No lockfile is committed — add `package-lock.json` to your `.gitignore` locally if your npm version auto-generates one.

### Arduino / ESP32

Open the `.ino` file in Arduino IDE. Install required libraries via Library Manager (see each device's `README.md`).

### Raspberry Pi

```bash
cd devices/raspberry-pi/pi-gateway
python3 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp config.example.json config.json
# edit config.json with your key and device ID
python3 gateway.py
```

---

## PR checklist

Before submitting a pull request:

- [ ] No real API keys, passwords, or secrets anywhere in the diff
- [ ] `config.h` / `config.example.json` uses placeholder values only
- [ ] New device folders include a `README.md` with wiring diagram and setup steps
- [ ] Code is commented enough for a hobbyist to follow
- [ ] Root `README.md` updated if you added a new package/device/example
- [ ] `docs/` updated if you changed any public-facing API contract

---

## Commit style

Follow conventional commits loosely:

```
feat(esp32): add BME280 pressure sensor support
fix(pi-gateway): retry on 429 rate limit response
docs(quickstart): clarify API key generation step
```

---

## Code of conduct

Be respectful. This project serves hobbyists, students, researchers, and professional lab operators alike. Condescending, dismissive, or harassing behavior will not be tolerated.

---

## Questions?

Open a [GitHub Discussion](https://github.com/shmaplex/xplant_os/discussions) or file an issue using the appropriate template.
