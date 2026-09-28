# Deploy the LiveOps demo to Heroku

Use three separate Cedar apps on the `heroku-24` stack with the official `heroku/nodejs` classic buildpack: core-api, games-web, and back-office-web. Each repository has its own `Procfile`, Node 24 / npm 11 version selection, build hook, lockfile, and `app.json` manifest. MongoDB remains external (Atlas or another reachable replica set); Heroku does not run the database in these web dynos.

## 1. Create the apps

Choose three globally unique app names. From the workspace root, run each command in its own repository (replace the example names):

```sh
heroku login
cd core-api
heroku create YOUR-API-APP --generation cedar --stack heroku-24 --buildpack heroku/nodejs
cd ../games-web
heroku create YOUR-GAMES-APP --generation cedar --stack heroku-24 --buildpack heroku/nodejs
cd ../back-office-web
heroku create YOUR-ADMIN-APP --generation cedar --stack heroku-24 --buildpack heroku/nodejs
```

For existing apps, use `heroku git:remote --app APP_NAME` inside the matching repo and select the Node.js buildpack. Copy each app's actual **Web URL** from `heroku apps:info --app APP_NAME` or the dashboard; the hostname can include a generated suffix. Do not assume it is just the app name plus `.herokuapp.com`.

The `app.json` manifests provide configuration metadata for app creation workflows. Ordinary CLI app creation and Git pushes do not automatically apply those config values; set them explicitly below.

## 2. Set Config Vars before deployment

In each app's dashboard, open Settings → Reveal Config Vars. Do not upload `.env` files. Do not configure `PORT`: Heroku assigns it.

| App | Config Var | Value |
| --- | --- | --- |
| API | `NODE_ENV` | `production` |
| API | `HOST` | `0.0.0.0` |
| API | `MONGO_DB_CONNECTION_STRING` | Your MongoDB Atlas / replica-set connection string |
| API | `MONGO_DB_NAME` | `liveops` (or your demo database name) |
| API | `BACK_OFFICE_ORIGINS` | Actual back-office HTTPS origin, without a trailing slash; comma-separated if multiple |
| API | `MONGOMS_DISABLE_POSTINSTALL` | `true` (skips the test-only MongoDB binary download) |
| Games | `NODE_ENV` | `production` |
| Games | `HOST` | `0.0.0.0` |
| Games | `VITE_GAME_WS_URL` | `wss://YOUR-ACTUAL-API-HOST/ws/games` |
| Back office | `NODE_ENV` | `production` |
| Back office | `HOST` | `0.0.0.0` |
| Back office | `VITE_API_URL` | `https://YOUR-ACTUAL-API-HOST/api/back-office` |
| Back office | `VITE_GAME_URL` | `https://YOUR-ACTUAL-GAMES-HOST` |

Allow the Heroku API deployment to reach your database in the MongoDB provider's network settings, and use a database user permitted to create indexes, read/write the demo collections, and apply the existing index migration. A standalone MongoDB instance is not supported because balances and awards use transactions.

`VITE_*` variables are embedded in the browser bundle when Vite builds. They are public URLs, not secrets. **Rebuild/redeploy the frontend after changing them**; restarting its dyno alone does not change the bundle. The frontend Heroku build hook rejects missing, local, or insecure deployment URLs. Leave dev dependencies enabled for the build; Heroku prunes them afterward.

## 3. Commit and deploy each repo

Review and commit the prepared files in each repository. From each repo, push its current commit:

```sh
git push heroku HEAD:main
heroku ps:scale web=1
heroku logs --tail
```

Deploy core-api first, followed by both frontends. Select the dyno plan in Heroku for each app. **Keep core-api at one web dyno and one Node process**: campaign pushes use in-process events, so scaling horizontally requires shared pub/sub first. Pick an always-on plan if you need the demo and automatic timed-round settlement continuously available. If the API stops, persisted expired target rounds settle when it starts again.

The frontends build during deployment and run `node server.mjs`. They do not run Vite dev/preview servers. HTML uses revalidation, hashed assets use immutable caching, and direct mini-game URLs return the SPA entry page. The API binds HTTP and WebSockets to the same assigned port and sends WebSocket ping frames every 25 seconds. On dyno restart, awarded games restore persisted sessions/results; database-free previews are temporary.

## 4. Check the deployment

- API: `https://YOUR-API-HOST/api/back-office/health` returns `{"ready":true}` once MongoDB is reachable.
- Frontends: `/healthz` returns `{"ready":true}`.
- Open the back office, create a demo player, and use its **Open slot as this player** link.
- Check a spin, then issue a mini-game campaign and confirm that the open game receives it.
- Open and refresh `/lucky-wheel/`, `/lucky-chests/`, `/shooting-targets/`, and `/scratch-card/` on games-web.

The existing unauthenticated demo API and `/clear-db` behavior are unchanged. `/clear-db` clears the database selected by this deployed API; it is not a health-check URL.

## Local checks

```sh
npm run build
npm run typecheck
npm test
```

In either frontend, run `npm run build` then `npm run test:server` to check the production static server on a disposable local port. `npm run dev` still uses 5555 / 7777 / 9999 in the corresponding repos. No deployment is performed by these checks.

References: [Node.js support](https://devcenter.heroku.com/articles/nodejs-support), [classic Node builds](https://devcenter.heroku.com/articles/nodejs-classic-buildpack-builds), [WebSockets](https://devcenter.heroku.com/articles/websockets), [Heroku-24](https://devcenter.heroku.com/articles/heroku-24-stack), [Vite environment variables](https://vite.dev/guide/env-and-mode.html).
