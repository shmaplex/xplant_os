# Security Policy

## Supported versions

This repository contains open-source SDKs, firmware examples, and hardware bridges. We apply security fixes to the `main` branch. There are no versioned release lines at this time.

---

## API key safety rules

**Never commit your API key to source control.** This is the most common security mistake.

xPlant API keys follow the format:

```
xpk_live_<48 hex chars>   ← production key
xpk_dev_<48 hex chars>    ← development key
```

Rules to follow:

1. Store your key in an environment variable, a `config.json` that is `.gitignore`'d, or a secrets manager — never in source code.
2. When working with the Arduino/ESP32 sketches, edit `config.h` locally and make sure it is listed in your `.gitignore` before committing.
3. When working with the Raspberry Pi gateway, copy `config.example.json` to `config.json` (which is already in `.gitignore`) and fill in your key there.
4. Do not paste your API key into GitHub issues, PR descriptions, Discord messages, or any other public forum.

### What to do if you accidentally commit a key

1. **Revoke the key immediately**: go to **Settings > Integrations > API Keys** in your xPlant workspace and delete the compromised key.
2. Generate a new key.
3. Remove the key from git history using `git filter-repo` or BFG Repo Cleaner, then force-push. Treat the old key as permanently compromised regardless of history rewriting.

---

## Responsible disclosure

If you discover a security vulnerability in this repository (e.g. a code pattern that would lead users to inadvertently expose keys, a prototype pollution vector in the JS SDK, an authentication bypass in example code), please report it privately before disclosing publicly.

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
- Database schemas or RLS policies
- User data, session tokens, or billing information
- Supabase or Stripe credentials

Vulnerabilities in the main xPlant application should be reported to the same address above.
