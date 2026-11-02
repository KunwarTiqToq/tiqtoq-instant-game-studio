# Consolidation and GitHub handoff

## Single repository

The existing tiqtoq-instant-game-studio checkout is the repository root. Frontend source, public assets and tests moved into apps/studio; server source, rules and tests moved into apps/server. Shared documentation, setup and launch scripts remain at the root. Both applications use npm workspaces and one package-lock.json. There are no nested Git repositories or submodules.

The original studio history ends at `4cc7735a424b9a2e36cdbc1bbe5f7ce22e58ed09`; the original server history ends at `801b111f3c3d63998a24ea197b6325044d5d7a5e`. Both are parents/ancestors of the consolidation merge. Their code and MIT notices are retained. Historical upstreams are [games-web](https://github.com/ms-liveops-platform/games-web) and [core-api](https://github.com/ms-liveops-platform/core-api). The existing studio upstream remote remains for provenance.

## Compatibility

- Root commands setup, start, dev, preview, build, test and typecheck remain available. Build and test now validate both applications.
- The studio starts at port 7777 and automatically advances to a free port; the server still uses port 5555. Custom ports and starting credits remain configurable.
- All three /games/<id>/ routes, the older short game routes, query scenarios and seed parameters are unchanged.
- HTTP endpoints /api/health, /api/catalogue and /api/action, WebSocket /ws/studio, protocol version 1 and the server service identity are unchanged.
- Sessions and audio preferences use the same browser storage keys. A server restart clears in-memory sessions as before; use Reset demo if an old token has expired.
- Root .env settings and existing shell variables work. A legacy override to the removed sibling server folder maps to apps/server. Other compatible server overrides are supported.
- Source paths changed. Use apps/studio and apps/server instead of opening the old sibling server directory. App-level npm commands work after root setup; install dependencies at the root.
- No MongoDB, pipeline configuration, hosting or Canvas Tester changes are included.

## Push to the GitHub repository

Use this folder as the local checkout for your new repository. The local folder name does not have to match the GitHub display name. No origin or GitHub push is configured by this consolidation.

If the GitHub repository is empty, set its exact clone URL as origin, then push main:

```powershell
git remote add origin <your-exact-GitHub-clone-URL>
git push -u origin main
```

If origin already exists, inspect it with `git remote -v` before changing it. If GitHub already has a README or other commits, fetch and reconcile those commits before pushing; do not force-push over them. The upstream remote is historical provenance, not the publishing destination. Environment files, dependencies and build outputs are ignored.

## Verification

Run `npm run setup`, `npm run build`, `npm test` and `npm run format:check` from the root. Use `npm start -- --no-open` for a local smoke check. Server tests cover rules, credit accounting, retries and HTTP/WebSocket transport; frontend tests cover configuration, content and bundled artwork; root tests cover bundled paths, legacy server overrides and port validation.

Changing the studio port creates a separate browser origin, so saved demo sessions and audio preferences from another port are not shared. STUDIO_PORT sets the first port to try, including for frontend development and production preview.
