# tiQtoQ Instant Game Studio

Three original, lightweight instant-win demonstrations: **Treasure Chances**, **Lucky Numbers** and **Star Quest**. Click-to-reveal gameplay, two themed bonuses per game, original synthesised sound, optional music, local fonts, information panels and pretend credits. No account, database or cloud service is required.

## Start

Use Node.js 24 or newer. Place this repository beside `tiqtoq-instant-game-server`:

```text
tiQtoQ/
  tiqtoq-instant-game-studio/
  tiqtoq-instant-game-server/
```

```powershell
cd C:\tiQtoQ\tiqtoq-instant-game-studio
npm run setup
npm start
```

Setup installs locked dependencies in both repositories. Run it once after downloading, or when lockfiles change. `npm start` starts the local game server, starts Vite, and opens **http://127.0.0.1:7777/**. Ctrl+C shuts down the services the launcher owns. `npm start -- --no-open` skips opening a browser. An existing compatible game server is reused and is not stopped by the launcher.

## The games

| Game             | Main play                                 | First bonus                           | Second bonus                             |
| ---------------- | ----------------------------------------- | ------------------------------------- | ---------------------------------------- |
| Treasure Chances | Reveal nine pictures; three Crowns pay 50 | Three Bells unlock one of five Chests | Three Stars unlock the Fortune Wheel     |
| Lucky Numbers    | Match 7, 14 or 21; each match pays 15     | Two matches unlock a 2×–5× multiplier | Three matches unlock a Golden Vault      |
| Star Quest       | Each revealed Star pays 5                 | Three Stars unlock three extra picks  | Six Stars unlock Constellation selection |

Every round costs 10 demo credits. Sessions start with 1,000 credits. Your balance and active round survive refreshing while the server runs. Restarting the server clears all sessions. The in-game Info button explains rules, prize ranges and sound settings. Sound starts muted; enable it with SOUND OFF. Music is independently optional. Preferences are remembered on the same browser origin.

## Demonstrate a complete journey

Use **Show both bonuses** in the lobby, or open:

```text
http://127.0.0.1:7777/games/treasure-chances/?scenario=double-bonus&seed=7
http://127.0.0.1:7777/games/lucky-numbers/?scenario=double-bonus&seed=7
http://127.0.0.1:7777/games/star-quest/?scenario=double-bonus&seed=7
```

Use Reset demo before repeating a first-round seed. The browser shares one session across the games: finish an active round or reset before switching. An interrupted round offers Resume instead of silently charging for another game. The older `/treasure-chances/` route remains an alias. Obsolete slot, wheel-only, target and scratch examples have been removed.

## Documentation

- [Getting started and troubleshooting](docs/getting-started.md)
- [Architecture and repo structure](docs/architecture.md)
- [Game configuration](docs/configuration.md)
- [Adding another game](docs/creating-a-game.md)
- [Sound and settings](docs/audio.md)
- [Asset credits and licences](docs/asset-credits.md)
- [Reference-inspired canvas design and animation settings](docs/reference-redesign.md)

## Validate

```powershell
npm run build
npm test
```

Run `npm test` in the server repo for rules, accounting, session, retry and transport tests. `npm run dev` runs only the frontend and expects the server separately. `npm run preview` previews the production build and also expects the server separately. No pipeline definitions or Canvas Tester changes are included in this migration.

Original demonstration content only; no affiliation with any lottery operator. Outcomes are illustrative scenario layouts rather than a certified gambling model. Retained upstream Git history and MIT notices acknowledge the foundation; new artwork, game rules and sound have their own documentation.
