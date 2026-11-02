# tiQtoQ Instant Game Server

Local, authoritative demo server for Treasure Chances, Lucky Numbers and Star Quest. **No MongoDB or other database is required.** Sessions, credits and rounds are held in memory. Node.js 24+ is required.

The simplest startup is `npm start` from the repository root. It starts both projects. To install and run this server independently, from the repository root:

```powershell
npm run setup
npm run start:server
```

The default address is `http://127.0.0.1:5555`. `npm run dev` restarts on source changes. The root `.env` is shared by all launchers; a legacy `apps/server/.env` fills missing values. Optional values are GAME_SERVER_PORT and STARTING_CREDITS; `.env.example` documents the defaults. No existing MongoDB environment variable is used.

## Structure

```text
src/server.mjs             HTTP/WS startup and loopback binding
src/sessions/              Memory store, tokens, expiry and reset
src/rounds/                Round lifecycle, hidden outcomes and credits
src/games/<id>/            Individual rules and configuration
src/protocol/              Transport-independent dispatch and catalogue
tests/                    Rules, accounting, reconnect and network tests
scripts/check.mjs         Syntax and configuration validation
```

Native ES modules avoid a separate server compiler or build output. `npm run build` validates modules/configuration; `npm test` runs the actual rules and transport tests. `npm run check` does both. Only the `ws` runtime package is needed.

## State contract

One active round per session. Round start deducts the configured cost. Reveals unlock bonuses; bonuses record prizes; Results settles the combined amount once. The browser cannot choose a balance or submit a prize amount. Refreshing reconnects using the stored demo ID/token. Restart clears all state. Idle sessions expire after four hours; history keeps ten entries and request deduplication keeps 500 requests per session. This server caps sessions at 1,000.

Unrevealed tiles and unopened bonus values stay on the server. Duplicate selections or spins do not add another prize. Retries with the same request ID/body return their cached response; conflicting reuse is rejected.

See [protocol](../../docs/server/protocol.md) for endpoint and message details. Configuration is in `src/games/<id>/config.json`; restart after edits. The old database backend and administrative examples were removed as requested. Original Git history and MIT notices are retained; upstream provenance is recorded in [consolidation notes](../../docs/consolidation.md). No hosting or pipeline is configured.

For local demonstrations only: pretend credits, illustrative outcomes and no real-money wallet. Keep the default loopback binding. This is not production authentication or a certified gambling model.
