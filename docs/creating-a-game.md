# Adding a game

1. Add a server game directory with a configuration and a `rules.mjs` exporting `layout(scenario, config)` and `evaluate(revealed, config)`.
2. Register its ID/configuration in `src/games/catalogue.mjs` and its rules in `src/rounds/round-service.mjs`. Evaluation returns the base prize, first/second bonus unlocks and progress counts.
3. Add a matching frontend theme and a content.ts module deriving instructions from GameConfig, register the theme in `src/games/registry.ts`, and register the content module in `src/games/content.ts`. Add the ID to the frontend GameId type.
4. Add the original background and any required artwork under `public/games/<id>/`; keep asset notices when incorporating third-party material.
5. Implement the game-specific main and bonus layouts in the shared screen modules under src/platform/ui/screens/, adding separate modules when the layout merits it. Keep requests and credit accounting out of drawing code.
6. Extend tests to cover win, loss, each bonus, repeated actions and final accounting. Play the complete journey and check small-screen layout, Info, mute/unmute and refresh recovery.

Do not award credits in the frontend or expose hidden prize layouts before the relevant reveal. Use the shared Scene helpers for stable control labels and readable Pixi Text. All sound must flow through GameAudio's master output so one mute button silences the entire game.
