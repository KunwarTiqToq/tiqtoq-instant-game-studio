# Running locally

## Requirements and startup

Install Node.js 24+ and npm. Clone this single repository, run `npm run setup`, then `npm start` from its root. No database, paid account or external asset service is required. Setup downloads dependencies; fonts, artwork and sound are local during play. Keep the terminal running. `npm start -- --no-open` skips opening a browser.

The lobby starts at http://127.0.0.1:7777/ (or the next available port) and the server is http://127.0.0.1:5555/. API and WebSocket requests use the frontend proxy. Enable sound inside a game; background music has a separate switch under Info. Reduced motion follows browser preferences.

## Independent development and production preview

Run `npm run dev:server` in one terminal and `npm run dev` in another, both from the repository root. For a local production preview, run `npm run build`, `npm run start:server` and, in a second terminal, `npm run preview`. The studio build is written to `apps/studio/dist/`.

## Configuration

Copy the root `.env.example` to `.env` only when changing defaults:

```dotenv
GAME_SERVER_PORT=5555
STUDIO_PORT=7777
STARTING_CREDITS=1000
# Optional alternative compatible server source:
# GAME_SERVER_DIR=apps/server
```

Every launcher reads the root environment file. Explicit shell variables take precedence; legacy leaf files in `apps/server/.env` and `apps/studio/.env` fill missing values. Restart after changing settings. Relative server paths resolve from the repository root. A GAME_SERVER_DIR pointing at the former sibling server folder redirects to the bundled server automatically.

## Troubleshooting

| Symptom                                 | What to do                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Missing dependencies                    | Run npm run setup from the repository root                                                  |
| Server not found                        | Check apps/server/src/server.mjs or your GAME_SERVER_DIR override                           |
| Studio port occupied                    | The launcher, frontend dev and preview automatically try the next port; use the printed URL |
| Server port occupied by another service | Stop that service or choose a different GAME_SERVER_PORT                                    |
| Game cannot connect                     | Keep the server running; use Reconnect after restarting it                                  |
| Session expired                         | Use Reset demo to create a fresh session                                                    |
| Another game is active                  | Resume and finish it, or reset the shared session                                           |
| No sound                                | Enable SOUND OFF; check browser and system volume; music has a separate Info switch         |
| Credits cleared on restart              | Expected: sessions and credits are held in memory                                           |
| Repeat an exact first round             | Reset demo and use the same scenario, seed and bonus choices                                |

Ctrl+C stops services owned by the combined launcher. A compatible server already running is reused and stays running when that launcher closes. No database cleanup is needed.

Changing the studio port creates a separate browser origin, so saved demo sessions and audio preferences from another port are not shared. STUDIO_PORT sets the first port to try, including for frontend development and production preview.
