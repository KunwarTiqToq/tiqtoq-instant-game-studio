# Running locally

## Requirements

Node.js 24+, npm and the two sibling repositories. There is no MongoDB requirement, paid account, external asset server or audio download during play. Dependencies need network access during setup. Fonts, artwork and sound run locally afterwards.

Run `npm run setup` and then `npm start` from the studio repository. The launcher prints the lobby URL and uses loopback addresses only. Keep its terminal running. Sound can be enabled inside each game. Use Info to enable background music. Reduced motion follows your operating system or browser preference.

## Independent development

In the server repository run `npm run dev`. In a second terminal in the studio run `npm run dev`. The default addresses are port 5555 for the server and port 7777 for the studio. API and WebSocket requests use Vite's proxy, so the browser does not need a separate server address.

Optional `.env` values for the combined launcher:

```dotenv
GAME_SERVER_PORT=5555
STUDIO_PORT=7777
STARTING_CREDITS=1000
# Set only if the server repository is not the default sibling:
# GAME_SERVER_DIR=C:/somewhere/tiqtoq-instant-game-server
```

The combined launcher reads the studio `.env`; running the server alone reads the server `.env`. Restart after changing settings. `npm run dev` does not use the combined launcher's env-file loading; set environment variables in your terminal when independently changing ports.

## Troubleshooting

| Symptom                               | What to do                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Server not found                      | Check the sibling directory name or set GAME_SERVER_DIR                                                |
| Port 5555 occupied                    | Stop the old server, or choose GAME_SERVER_PORT; the launcher checks identity before reusing a service |
| Port 7777 occupied                    | Close the other frontend or choose STUDIO_PORT; the launcher never kills unrelated processes           |
| Game cannot connect                   | Keep the launch terminal running; press Reconnect after restarting the server                          |
| Session expired or invalid            | Reset demo; this creates a fresh session if the old server has restarted                               |
| Another game is active                | Resume and finish it, or reset the shared demo session                                                 |
| No sound                              | Enable SOUND OFF; check browser/site and system volume; music has a separate switch under Info         |
| All credits disappeared after restart | Expected: sessions are intentionally in memory                                                         |
| Need the exact same first round again | Reset demo, then use the same game, scenario, seed and bonus choices                                   |

When closing the combined launcher, Ctrl+C closes its frontend and owned backend. If it reused an independently started game server, stop that server in its original terminal. No database cleanup is needed.
