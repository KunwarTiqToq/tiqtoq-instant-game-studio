# Changelog

Notable changes to tiQtoQ Instant Game Studio. Newest first.

## Unreleased

### Added

- **Demonstration faults.** Add `?fault=<name>` to a game URL to make the game
  misbehave in one known way, so an automated tester can be shown finding it.
  There are eleven faults: one on the server (`double-credit`) and ten in the
  game. They cover:
  - payments;
  - bonuses that never appear;
  - wrong or broken figures on screen;
  - missing or wrong sound, and muting that does not work;
  - a missing image;
  - an information screen that will not close or loses progress;
  - a round that does not resume after a reload.

  Without the parameter the games are unchanged. See
  [docs/demonstration-faults.md](docs/demonstration-faults.md).

- `round.start` accepts an optional `faults` list (only `double-credit`); any
  other value is refused. See [docs/server/protocol.md](docs/server/protocol.md).
