# Running locally

## Requirements and startup

Install Node.js 24+ and npm. Clone this single repository, run `npm run setup`, then `npm start` from its root. No database, paid account or external asset service is required. Setup downloads dependencies; fonts, artwork and sound are local during play. Keep the terminal running. `npm start -- --no-open` skips opening a browser.

The lobby starts at http://localhost:7777/ (or the next available port) and the server is http://127.0.0.1:5555/. API and WebSocket requests use the frontend proxy. Enable sound inside a game; background music has a separate switch under Info. Reduced motion follows browser preferences.

## Independent development and production preview

Run `npm run dev:server` in one terminal and `npm run dev` in another, both from the repository root. For a local production preview, run `npm run build`, `npm run start:server` and, in a second terminal, `npm run preview`. The studio build is written to `apps/studio/dist/`.

## Canvas Tester projects

Use the same `npm start` command for playing and testing. It starts both services, opens the studio and prints **Canvas Tester project URLs** for all three games. Copy a printed game URL; it includes the port that is actually running, even if 7777 was busy.

Keep this terminal running. In Canvas Tester, choose **New project**, select a folder for your test project wherever you keep your tests, and enter the URL of the game you want to probe:

| Game             | Project URL                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| Treasure Chances | `http://localhost:7777/games/treasure-chances/?scenario=double-bonus&seed=7` |
| Lucky Numbers    | `http://localhost:7777/games/lucky-numbers/?scenario=double-bonus&seed=7`    |
| Star Quest       | `http://localhost:7777/games/star-quest/?scenario=double-bonus&seed=7`       |

The examples above assume port 7777. For initial project creation, use the printed URL. For repeat runs and pipelines, do not rely on the saved port: `npm start` writes the actual running URL to `.local/studio-url.json` after the frontend is listening. The file is ignored by Git, replaced on each successful startup, and removed on graceful shutdown when it belongs to that process.

After startup is ready, run this from the Game Studio repository root (replace the spec path with your saved spec):

```powershell
$studioUrl = (Get-Content .local/studio-url.json -Raw | ConvertFrom-Json).url
CanvasTester.exe test --spec "path/to/your/spec.json" --base-url $studioUrl
```

Canvas Tester's existing `--base-url` option replaces the saved origin while retaining game paths and query parameters. If your saved spec uses 7777 and the studio selects 7778, this command runs it against 7778. Read the file afresh for each run.

In the updated Canvas Tester UI, enter the full path to this clone's `.local/studio-url.json` in **Local app URL file (optional)** when creating the project. For an existing project, set it under **Environment → Local app URL** and choose **Save and check URL**. Keep **Site URL** as the game page shown above. The UI rereads the file before Probe, Run preview and Run, so the saved project follows port changes automatically. The file path is saved on that computer only; it does not enter the test repository. Projects without this optional setting keep their existing behaviour.

In a pipeline, start the game with the same `npm start -- --no-open` command on the test agent, wait for that startup to finish publishing its URL, and then use the command above in the test step while the game process remains running. Do not restore `.local` from a cache or read a file left by a previous run. For parallel jobs, use separate checkouts so each job reads its own file. No Canvas Tester source changes are needed.

Use a separate tester project folder for each game if you want independent probes and specifications. The tester folder holds tests and evidence; the game stays in its cloned repository. Use **Probe** on the direct game URL to discover its canvas. Reset demo before repeating a seeded first round; the URL does not reset an existing session.

`localhost` works when the tester's browser runs on the same computer as the studio. A remote test agent needs the game and server started on that agent, or a shared hosted environment with a stable HTTPS URL. Hosting must also support `/api` and `/ws` and explicitly allow its browser origin in the backend; the current backend accepts local HTTP origins only. A static upload of the frontend alone is insufficient.

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
