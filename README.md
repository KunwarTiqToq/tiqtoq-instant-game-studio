# Core API / LiveOps PoC

Node.js + TypeScript, Express HTTP, native WebSockets, and MongoDB. The back office uses HTTP; games-web uses only WebSockets.

## Setup

```sh
npm install
cp .env.example .env
```

Set `MONGO_DB_CONNECTION_STRING` in `.env` to your MongoDB URI. Atlas or a replica set is required: player balances and financial records are committed in multi-document transactions. Standalone MongoDB is rejected at startup. `MONGO_DB_NAME` optionally overrides the database in the URI; `.env.example` suggests `liveops`.

```sh
npm run dev
```

The API listens on `127.0.0.1:5555`. `tsx watch` restarts on source changes. Restart after editing `.env`; dotenv loads it at startup. If the URI is absent, the server starts with explicit HTTP 503 / WebSocket database-unavailable errors. It never substitutes an in-memory database for application data. A configured but invalid connection fails startup.

Back-office origin defaults to `http://127.0.0.1:9999` and `http://localhost:9999`; configure `BACK_OFFICE_ORIGINS` for additional origins. Ports and host can be overridden with `PORT` and `HOST`.

## Player balances and payouts

Credits are integers. Each spin costs exactly **1 credit**, deducted once. Every three-of-a-kind winning way pays the following multiplier of that bet:

| Symbol IDs | Game symbols | Per-way multiplier |
| --- | --- | --- |
| 0–2 | Cherries, lemon, grapes | 1× |
| 3–5 | Bell, star, diamond | 3× |
| 6–9 | Clover, crown, horseshoe, planet | 10× |

The total payout is the sum of all winning ways. Example: two crown ways pay 20 credits, giving a net balance change of +19 after the stake. Payout includes the entire return; no extra stake refund is added. There are 27 ways. With uniform independent symbols, this intentionally simple paytable is not tuned to a target RTP.

Players with fewer than 1 credit cannot spin. A transaction updates balance/counters and inserts the round together. `(playerId, requestId)` uniquely identifies a spin. Repeating it returns the original matrix and payout without charging or crediting again; the response also includes the latest player profile. Deposit/award request IDs are likewise idempotent, with mismatched reuse rejected.

## HTTP `/api/back-office`

- `GET /health`: database readiness.
- `GET /players`, `POST /players`: list / create a player (`displayName`, `balance`, `tags`).
- `GET /players/:id`, `PATCH /players/:id`: read / update display name, tags, or status. Balance cannot be patched.
- `DELETE /players/:id`: archive a player while retaining all history.
- `POST /targeting/preview`: audience matching with `playerIds`, required `tags`, `minBalance`, `maxBalance`, `minDeposits`. All filters intersect; only active players match.
- `GET /campaigns`, `POST /campaigns`, `PUT /campaigns/:id`, `DELETE /campaigns/:id`: campaign list / create / full update / archive.
- `POST /campaigns/:id/issue`: start a new run of an active campaign, re-evaluating current player data. At most 500 matching players per run. Optional `{issuanceId: UUID}` identifies a run; retry with the same ID returns its saved result without additional awards. New runs use new IDs. The run and all awards commit atomically.
- `GET /awards`, `POST /awards`: list / manual grant (`playerId`, `type`, `value`, `requestId`).
- `POST /awards/:id/revoke`: revoke a pending mini-game award. Delivered credits are immutable ledger records.
- `GET /deposits`: list mock deposits.
- `POST /simulation/deposits`: `{ playerId, amount, requestId }`; deposits credits and records a labeled mock deposit.
- `POST /simulation/sessions`: `{ playerId, daysAgo }`; records a labeled return session, never before the player's creation.
- `POST /simulation/seed`: `{ count: 1..100 }`; creates a cohort dated 14 days ago, starting with 100 credits, tagged `simulated`, with deterministic return sessions.
- `GET /analytics`: player activity, credits, awards, and D1/D7 retention.

List endpoints return up to 500 records; players, awards, and deposits support `?offset=500`. Campaign audiences and collections are intentionally simple PoC models. No arbitrary MongoDB query bodies are accepted.

A campaign has `name`, `description`, `status` (`draft`, `active`, `paused`, `archived`), `rewardType`, `rewardValue`, and `audience`. Reward types are `credits`, `wheel`, `chests`, `targets`, `scratch`. Credits are delivered immediately. All four mini-games create pending one-play awards with optional `gameConfig`. Award expiration remains future work. Campaigns run manually via Issue; no scheduler is implied.

## WebSocket `/ws/games`

First send a session request:

```json
{"type":"session.open","requestId":"open-1"}
```

Without credentials this provisions a demo player with 100 credits and records a session. The response is `{ type: 'session.ready', requestId, player: { id, displayName, balance, status }, token }`. Reconnect using `playerId` and `token` in `session.open`. One player is bound to each socket; spin messages cannot select a different player.

```json
{"type":"slot.spin","requestId":"unique-spin-id"}
```

The response is `{ type: 'slot.result', requestId, result, player }`. `result` contains `spinId`, row-major `matrix[row][reel]`, all 27 `ways`, matching `wins`, `winCount`, `bet`, `payout`, and settlement `balance`. Each way contains a stable ID, selected rows, cell positions, symbols, and `isWin`.

Changes to a connected player's name, balance, or status emit `{ type: 'player.updated', player }`. Errors use `{ type: 'error', requestId, error: { code, message } }`. Requests require a nonblank ID of at most 128 characters; binary messages are rejected; maximum payload is 16 KiB.

## Collections and analytics

Collections: `players`, `sessions`, `deposits`, `campaigns`, `campaignRuns`, `awards`, `gameRounds`. Collections and indexes initialize automatically. Rounds and credit grants serve as immutable records. Deleting players/campaigns means archival, not destructive deletion.

Retention uses player creation date as cohort day, distinct players returning on exactly D1 or D7, UTC calendar days, and only completed observation days. Game-player retention excludes simulated sessions; seeded-cohort retention is reported separately. Activity charts include both kinds with simulation counts. The simulator demonstrates measurement, not causal campaign uplift. Analytics currently aggregates collections in application memory and should move to bounded MongoDB aggregations as data grows.

## Verification

```sh
npm run typecheck
npm run build
npm test
npm start
```

Tests create a disposable MongoDB replica set, never using `.env` or your database. First run may download a MongoDB binary. They cover all payout tiers, duplicate and concurrent spins, insufficient balances, rollback on failed persistence, idempotent deposits, targeting and campaign grants, award revocation, retention, HTTP validation, and WebSocket player/balance flows.

## Scope

Local demo only: the administrative HTTP API has no operator authentication. Player tokens are simple demo session credentials, not a production identity system. Keep the default loopback binding. Starting credits are profile funding, not deposits. No real-money wallet, production gambling math, campaign scheduler is implemented. Live balance notifications are in-process; a multi-instance deployment would need shared pub/sub.

## Mini-game awards

Campaigns accept `gameConfig`; manual grants accept the same field. Example:

```json
{"mode":"multiplier","baseAmount":10,"prizes":[{"amount":1,"label":"Small"},{"amount":5,"label":"Big"}]}
```

Use `mode: "instant"` for direct credit amounts. `baseAmount` is required for multipliers. Wheel supports 2–16 prize entries; chests supports 2–12. Integer values only, equal odds per entry, maximum payout 1,000,000 credits. Omitted configs use game defaults. Legacy `rewardValue` / `value` remains required; use 1 for mini-games, whose payouts come from `gameConfig`. Configuration is copied onto each award when issued and cannot change retroactively.

The authenticated WebSocket protocol adds:

- `session.ready` includes `awards`, an ordered pending mini-game list.
- `{type:"awards.updated",awards:[...]}` pushes that list only to sockets bound to the affected player.
- `{type:"award.get",requestId,awardId}` reads an owned award.
- `{type:"award.play",requestId,awardId,choiceIndex?}` settles it. Chests and scratch require a zero-based `choiceIndex`.
- Both requests return `{type:"award.result",requestId,award:{id,type,status,config,outcome?},player}`.
- `{type:"mini.preview",requestId,game:"wheel"|"chests"|"scratch",config?,choiceIndex?}` returns `{type:"mini.result",requestId,outcome}` without requiring a player or database, and never modifies a wallet.

Settlement draws on the server and atomically credits the player and marks the award `played`, storing `outcome` and `playedAt`. Retries, reconnects and concurrent plays return the stored result without another credit. Clients cannot submit prize configs on awarded plays. Analytics exposes played counts and mini-game payout totals.

### Target ranges and scratch layouts

Targets accept `gameConfig.targetRange: {min,max}`. A hit draws uniformly from every integer in that inclusive range, then multiplies by `baseAmount` when `mode` is `multiplier`. The number of `prizes` entries determines the live bird count (3–12; legacy two-entry pools show three birds); entry amounts are unused when a range exists. Without a range, the configured list is the reward pool. Back-office forms always provide an explicit range for new target awards.

Scratch supports an optional `mode` on each prize, overriding the overall mode for mixed instant/multiplier cards. A base is required if any zone is a multiplier. Chests and scratch responses include `outcome.revealedPrizes`, a permutation of configured prize indices keyed by visible choice index. The chosen entry matches `outcome.prizeIndex`; only this entry contributes to the wallet payout. The layout is saved atomically with settlement and remains unchanged on retries. No additional collection is needed.

### Timed target rounds

Targets use a separate WebSocket flow; `award.play` and `mini.preview` cannot redeem targets:

- `{type:"targets.start",requestId,awardId}` starts or resumes the persisted round.
- `{type:"targets.hit",requestId,awardId,targetId}` claims a currently active bird. Its replacement has a new ID; a duplicate ID cannot add another prize.
- `{type:"targets.finish",requestId,awardId}` returns current state, settling only after the server deadline.

Responses use `award.result` and include `award.targetRound` (`startedAt`, `endsAt`, `activeIds`, `hits`, summed `amount` and `payout`) and `award.serverNow`. All times are Unix milliseconds. `gameConfig.durationSeconds` defaults to 30 and allows 5–120 seconds. Starting again preserves the original deadline. A background sweep settles expired rounds, including after disconnect or server restart; award reads also settle expired rounds. Started rounds cannot be revoked.

Settlement atomically credits the accumulated payout and saves a `total:true` outcome with `hitCount`. Replays return the same result. Hits at or after the deadline add nothing. For multiplier mode, payout is the sum of hit multipliers times `baseAmount`, rather than multiplying the multipliers together.

Database-free previews use `{type:"targets.preview",requestId,action:"start"|"hit"|"finish",config?,targetId?}` on one persistent socket, returning `targets.result` with the same award-shaped state. Configuration is accepted on Start; hit messages cannot change it. Preview state is socket-local and never affects a player balance.

### Repeated campaign issuance

Every new Issue uses a fresh MongoDB transaction snapshot for player balances, tags, status and deposit totals. Previous campaign awards do not disqualify a player; only the current audience rules do. A balance-≤500 campaign includes a player at 100 credits, then excludes that player on a later run after a prize raises their balance above 500. Pending awards can be issued again in later runs if the player still qualifies.

`campaignRuns` records each issuance ID, matched player IDs and result counts. `awards.issuanceId` links awards to their run. Retrying an ID replays its original result, even if player data has since changed; use a new ID to evaluate the audience again. Award pushes occur after the transaction commits. Database initialization creates a per-run/player unique index and removes the old campaign/player unique index without deleting historical awards. Restart core-api to apply this index migration.

## Clear demo records

`GET http://127.0.0.1:5555/clear-db` deletes all documents from all user collections in the configured MongoDB database, including any additional collections beyond the app's built-in ones. Collections and indexes are preserved. The deletes commit together in a transaction. MongoDB system collections and views are not modified.

No parameters or authentication are required. The response contains `database`, total `deletedCount`, and per-collection counts in `collections`. Restart/close active game sessions before clearing if you want the database to remain empty; new application activity can create new records. Previously saved player links reference deleted players after a reset. HEAD requests do not clear data.

## Heroku deployment

See [HEROKU.md](HEROKU.md) for all three apps. Production binds to `0.0.0.0` by default and uses `$PORT`; the game WebSocket shares that port. Keep one API web dyno because live player/award pushes use an in-process event bus.
