# Security Policy

## Supported versions

This repository contains open-source SDKs, firmware examples, and hardware bridges. We apply security fixes to the `main` branch. There are no versioned release lines at this time.

---

## API key safety rules

**Never commit your API key to source control.** This is the most common security mistake.

xPlant credentials start with a recognisable prefix, so secret scanners can catch them:

```
xpk_live_…   workspace API key (production label)
xpk_dev_…    workspace API key (development label; it still reads and writes your real workspace)
xpd_live_…   device token: posts readings, heartbeats and events for one device only
```

A device on a bench or in a grow room should carry a device token, never a workspace key. See the [device token guide](https://docs.xplantpro.com/docs/device-tokens).

Rules to follow:

1. Store your key in an environment variable, a `config.json` that is `.gitignore`'d, or a secrets manager — never in source code.
2. When working with the Arduino/ESP32 sketches, edit `config.h` locally and make sure it is listed in your `.gitignore` before committing.
3. When working with the Raspberry Pi gateway, copy `config.example.json` to `config.json` (which is already in `.gitignore`) and fill in your key there.
4. Do not paste your API key into GitHub issues, PR descriptions, Discord messages, or any other public forum.

### What to do if you accidentally commit a key

1. **Revoke the key immediately**: open [Settings > Integrations > API Keys](https://app.xplantpro.com/settings/integrations/api-keys) in xPlant and revoke the compromised key. For a leaked device token, taking the device out of service in xPlant revokes all of its tokens at once; then register it again and create a fresh token.
2. Generate a new key.
3. Remove the key from git history using `git filter-repo` or BFG Repo Cleaner, then force-push. Treat the old key as permanently compromised regardless of history rewriting.

---

## Responsible disclosure

If you discover a security vulnerability in this repository (e.g. a code pattern that would lead users to inadvertently expose keys, or an authentication bypass in example or firmware code), please report it privately before disclosing publicly.

**Contact:** security@shmaplex.com

Please include:
- A description of the issue
- Steps to reproduce
- The potential impact
- Any suggested fix (optional but appreciated)

We will acknowledge your report within 48 hours and aim to release a fix within 14 days for critical issues.

---

## Scope

This repository does **not** contain:

- xPlant application source code
- User data, session tokens, or billing information
- Any credentials

The JavaScript SDK lives in [shmaplex/xplant_sdk](https://github.com/shmaplex/xplant_sdk). Vulnerabilities in the SDK or in the xPlant application itself should be reported to the same address above.
