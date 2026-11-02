# Configuration

## Server rules

Edit the server's `apps/server/src/games/<game-id>/config.json` and its `rules.mjs`. The configuration defines round cost, number of tiles, base prize and bonus prize pools. Rules define how layouts are made and which revealed matches unlock bonuses. Restart the server after changes; active in-memory sessions will reset.

The current server supports nine chances for Treasure Chances, 9–12 tickets for Lucky Numbers (default 12), and 9–16 positions for Star Quest (default 16). All games have five first-bonus choices and six second-bonus prizes. Changing bonus counts requires updating the corresponding scene layout and validation. Configured costs and prize ranges are shown from the server catalogue in the game UI.

## Themes and assets

Edit `apps/studio/src/games/<game-id>/theme.json` for the name, subtitle, introduction, colours, title font, bonus names and sound theme. Colours must be six-digit hex values. Original illustrated backgrounds are selected through `presentation.backdrop` and live at `apps/studio/public/games/<game-id>/backdrop-v2.jpg`; shared symbol artwork and open-licensed fonts live under `apps/studio/public/shared/`.

Sound settings are a root frequency, oscillator waveform, master volume and music tempo. Keep volume between 0 and 1 and the other values inside the validator's bounds. The UI follows reduced-motion preferences automatically.

Rule-specific instructional text lives in each game content.ts module and derives costs and prize ranges from the server catalogue. Shared screen renderers live under src/platform/ui/screens/; src/app/game.ts coordinates requests, loading and transitions. Current rules are intentionally explicit and small rather than an unrestricted game-description language.

## Repeatable scenarios

| URL scenario | Purpose                                |
| ------------ | -------------------------------------- |
| random       | Picks one of the demonstration layouts |
| double-bonus | Both bonuses and a base win            |
| first-bonus  | First bonus and a base win             |
| win          | Base win only                          |
| lose         | No prize and no bonus                  |

`?scenario=double-bonus&seed=7` selects a repeatable scenario. The effective seed includes the session's round number. Reset demo before comparing first rounds. The same seed, round number and choices repeat the outcome; different picks can produce different prizes. These distributions are illustrative, with no promised or calculated RTP.

The server validates game IDs, scenario names, bounded integer seeds, tile indices, active round IDs and legal phase transitions. It validates configuration at startup. HTTP request bodies and WebSocket messages are limited to 16 KiB.

See [reference-inspired design](reference-redesign.md) for board presets, column settings, animation timing and artwork prompts.
