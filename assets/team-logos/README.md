# Team marks

This directory contains locally bundled team marks used by ROUND/ONE. The app never fetches logos at runtime and falls back to its procedural badge when a current official identity cannot be verified.

- Source index: Liquipedia Commons team-logo repository.
- Selection: current textless `allmode` mark where available, followed by the official dark-background variant. A full lockup is used only when no standalone mark exists.
- Academy teams may use the verified parent-organization mark; this is recorded as `official-parent-mark` in `manifest.json`.
- `former-roster` and `unverified` entries intentionally receive no third-party mark.
- Team names and marks remain trademarks of their respective organizations. Their inclusion identifies the simulated team and does not imply endorsement.

Run `node scripts/sync-team-logos.mjs` from the repository root to refresh the static Metro catalog and manifest. Review changes before committing because organizations can rebrand.
