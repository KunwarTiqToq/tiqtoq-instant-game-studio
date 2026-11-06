# Protocol v1

HTTP GET `/api/health` returns `{service:"tiqtoq-instant-game-server",protocol:1,ready:true,storage:"memory"}`. GET `/api/catalogue` returns game configurations and available scenarios.

POST `/api/action` accepts JSON. WebSocket `/ws/studio` accepts the same JSON messages and shares sessions with HTTP. The studio currently uses HTTP with same-origin Vite proxying. Messages and HTTP bodies are limited to 16 KiB. Local browser origins only; no general CORS access is enabled.

Every request needs a unique 1–100 character alphanumeric/underscore/hyphen `requestId`.

```json
{ "type": "session.open", "requestId": "open-1" }
```

This returns `type:session.ready`, `sessionId`, `token`, public `player`, current `round` and `history`. Reconnect by including the sessionId/token. If a session no longer exists (for example after restart), opening provisions a fresh session. An existing session with an incorrect token is rejected.

All other messages require sessionId and token:

| type          | payload                                                     |
| ------------- | ----------------------------------------------------------- |
| session.state | none                                                        |
| session.reset | none; reset balance, round number, active round and history |
| round.start   | `{gameId,scenario,seed,faults?}`                            |
| round.action  | `{roundId,action,index?}`                                   |

`faults` is optional and is for demonstrations only. It is a list of server faults to apply to this one round; the only one is `double-credit`. Any other value is refused as an invalid request. See [Demonstration faults](../demonstration-faults.md).

Actions: `reveal` (zero-based index), `reveal-all`, `continue`, `pick` (zero-based index), `spin`. Continue requires all main reveals or required bonus choices. Star Quest needs three distinct first-bonus picks; the other first bonuses need one. Only Treasure Chances has a wheel spin.

Successful actions return `type:session.state`, the requestId, player, public round and history. Phases are reveal, bonus1, bonus2, result. `round.tiles` contains null for unrevealed positions. `firstChoices` and `secondChoices` expose only permitted reveals. The round includes base, bonus1, bonus2 and total amounts, bonus unlock flags, progress and a player-facing message.

On HTTP failure, the server returns a 4xx status and `{error:"message"}`. WebSocket errors return `{type:"error",error:"message"}`. Clients should preserve requestId when retrying a state-changing action. The browser retries network failures once using the same ID; game-rule errors are not automatically retried.
