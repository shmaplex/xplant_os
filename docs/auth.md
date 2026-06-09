# Authentication

## API key model

xPlant external API uses bearer token authentication. Every request must include your API key in the `Authorization` header:

```
Authorization: Bearer xpk_live_YOUR_KEY_HERE
```

Keys are workspace-scoped: a key authenticates all requests on behalf of a specific xPlant workspace.

### Key formats

| Prefix | Environment |
|---|---|
| `xpk_live_` | Production workspace |
| `xpk_dev_` | Development / sandbox workspace |

Both formats are followed by 48 lowercase hexadecimal characters.

---

## Generating a key

1. Log in to [xplant.shmaplex.com](https://xplant.shmaplex.com).
2. Go to **Settings > Integrations > API Keys**.
3. Click **Generate new key**.
4. Optionally give it a label (e.g. "ESP32 growth chamber").
5. Copy the key — it is shown only once.

You can generate multiple keys and revoke them individually. Revoking a key immediately invalidates all requests using it.

---

## Scopes

Keys can be issued with restricted scopes to limit what they can read or write. See [scopes.md](scopes.md) for the full list.

If your key was generated without specifying scopes it has the default scope set, which is enough for posting sensor readings and device events.

---

## Security model

- Keys are hashed before storage. xPlant cannot recover a key after it is generated.
- A key is tied to your workspace — it cannot access other workspaces.
- Keys do not expire by default. Set an expiry at generation time or revoke manually when a device is decommissioned.
- Rate limits apply per key. See [api-reference.md](api-reference.md) for limits.

---

## Keeping keys safe

- **Never commit a key to source control.** Store it in:
  - An environment variable (`XPLANT_API_KEY=...`)
  - A secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
  - A `config.json` file that is listed in `.gitignore`
- Do not paste keys into GitHub issues, PR descriptions, Slack, or Discord.
- Rotate keys regularly on long-running devices.
- If a key is compromised, revoke it immediately from the xPlant settings page.

See [SECURITY.md](../SECURITY.md) for the full security policy.

---

## What authentication does NOT cover

xPlant's core auth (user sessions, RLS, billing) is managed entirely within the main xPlant application and is not part of this open-source repository. API keys only grant access to the external API endpoints listed in [api-reference.md](api-reference.md).
