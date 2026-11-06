# Demonstration faults

The studio can deliberately misbehave. Each fault is a real class of defect
that acceptance testers look for in an instant-win game. They let an automated
tester, such as tiQtoQ Canvas Tester's autonomous test, be shown finding known
defects in a game whose healthy behaviour is otherwise known.

Faults are switched on per page load with the `fault` URL parameter. Several
can be combined with commas:

```text
http://localhost:7777/games/treasure-chances/?scenario=double-bonus&seed=7&fault=wrong-total
http://localhost:7777/games/lucky-numbers/?fault=no-win-sound,missing-asset
```

With no `fault` parameter, or with a name that is not listed below, the game
behaves normally. Nothing is stored: reloading without the parameter turns the
fault off.

## Faults

| Fault                 | What goes wrong                                                                                                     | Where  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ |
| `double-credit`       | A completed round's winnings are credited to the balance twice                                                      | Server |
| `bonus-not-shown`     | The server enters the first bonus, but the screen never shows it, so play gets stuck                                | Game   |
| `wrong-total`         | The headline win and the footer's total leave out the second bonus                                                  | Game   |
| `broken-text`         | The balance in the footer is shown as `NaN`                                                                         | Game   |
| `no-win-sound`        | Winning rounds are silent                                                                                           | Game   |
| `mute-ignored`        | Switching sound off changes the label, but sound keeps playing                                                      | Game   |
| `loss-celebrated`     | A losing round plays the winning celebration                                                                        | Game   |
| `missing-asset`       | The game requests an image that does not exist                                                                      | Game   |
| `info-wont-close`     | The information screen's **CLOSE INFO** button does nothing                                                         | Game   |
| `info-hides-progress` | After the information screen closes, revealed chances show as covered again until the next action                   | Game   |
| `no-resume`           | After a page reload, the game offers a new round instead of resuming the one in progress, and the server refuses it | Game   |

The game reads `fault` from the page address. Server faults are passed to the
server in the `round.start` request (see [Server protocol](server/protocol.md)),
and only for rounds started from a page that asked for them.

## Suggested combinations

| To show…                           | Use                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| A healthy game passing every check | `?scenario=random&seed=3` (a win, a loss, then both bonuses)                                |
| Payment defects                    | `?scenario=double-bonus&seed=7&fault=double-credit`                                         |
| A stuck bonus                      | `?scenario=double-bonus&seed=7&fault=bonus-not-shown`                                       |
| A misleading result screen         | `?scenario=double-bonus&seed=7&fault=wrong-total`                                           |
| Sound defects                      | `?scenario=random&seed=3&fault=loss-celebrated`, `fault=no-win-sound`, `fault=mute-ignored` |
| Navigation defects                 | `fault=info-wont-close`, `fault=info-hides-progress`, `fault=no-resume`                     |

## Adding a fault

1. Add the name and a one-line description to `FAULTS` in
   `apps/studio/src/platform/faults.ts`.
2. If it runs on the server, also add it to `SERVER_FAULTS` there and in
   `apps/server/src/rounds/round-service.mjs`, with a test in
   `apps/server/tests/game-service.test.mjs`.
3. Check it with `ctx.faults.has("name")` in the screen code, or with
   `faults.has("name")` in `app/game.ts`.

Keep each fault confined to its own check, so normal play is untouched when it
is off.
