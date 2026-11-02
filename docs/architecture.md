# Architecture

The studio owns presentation; the game server owns round state and credits. The browser never sends a claimed win, balance or prize amount. It sends a game action and renders the server's response.

```text
Browser / PixiJS (apps/studio/src/)
  app/lobby.ts             Game selection and resume link
  app/game.ts              Requests, session state and scene orchestration
  games/<id>/theme.json    Per-game art direction, animation and sound configuration
  games/<id>/board.ts      Dedicated main-board layout for each game
  platform/rendering/      Named Pixi controls and drawing primitives
  platform/network/        Requests, session credentials and safe retries
  platform/audio/          One audio context, effects, music and master mute
  platform/ui/screens/     Intro, reveal, bonuses, results and Info screens
  platform/ui/             Local fonts, responsive layout and settings
          |
          | same-origin /api requests through Vite proxy
          v
Local game server (apps/server/src/)
  sessions/               Memory store and credentials
  rounds/                 Round lifecycle and one-time settlement
  games/<id>/             Independent rules and server configuration
  protocol/               Shared HTTP / WebSocket dispatch and deduplication
```

All three games share presentation primitives but have different rule modules, layouts, bonus interactions, palettes, fonts and sounds. The shared screen orchestrator avoids three copies of balance, Info, mute, error and reconnect logic. Six separate screen modules keep the game orchestrator focused on lifecycle and requests. Per-game content modules derive instructions and prize ranges from the server catalogue.

The server uses native Node.js ES modules (`.mjs`), avoiding a server transpilation step. Frontend code remains TypeScript and is checked during build. Server build validates syntax and configuration; server tests exercise the actual modules and network transports.

## State and lifetime

A browser stores only a demo session ID/token and audio preferences. Active rounds and balances stay on the server. Refreshing restores a round. One active round is allowed per session across all games. The Results screen settles base and bonus prizes once. The store expires idle sessions after four hours and limits the server to 1,000 sessions. Recent round history is limited to ten entries and request deduplication to 500 requests per session.

Transport requests carry unique IDs. Retrying the same ID with the same body returns its saved response; using it for another body is rejected. Repeat selections, wheel spins and settlement cannot credit twice. Unrevealed tiles and pending bonus values are excluded from client state.

## Ownership and migration

One npm workspace repository contains both applications, one root lockfile and shared launchers. The consolidation merge retains both original Git histories and the application MIT notices. Source folders moved without changing gameplay or the protocol. See [consolidation notes](consolidation.md) for provenance and compatibility. The old MongoDB backend and obsolete examples were removed before consolidation.

The server defaults to loopback and accepts local browser origins. This is a demo platform, not production authentication or a real-money service. No deployment, pipeline or Canvas Tester implementation is part of this change.
