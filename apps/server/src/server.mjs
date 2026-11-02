import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { WebSocketServer } from "ws";
import { SessionStore } from "./sessions/session-store.mjs";
import { dispatch, catalogue } from "./protocol/dispatch.mjs";
export const SERVICE = "tiqtoq-instant-game-server";
export function createGameServer({ startingCredits = 1000 } = {}) {
  const store = new SessionStore({ startingCredits });
  const server = createServer(async (req, res) => {
    const json = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(body));
    };
    try {
      if (req.method === "GET" && req.url === "/api/health")
        return json(200, {
          service: SERVICE,
          protocol: 1,
          ready: true,
          storage: "memory",
        });
      if (req.method === "GET" && req.url === "/api/catalogue")
        return json(200, catalogue());
      if (req.method !== "POST" || req.url !== "/api/action")
        return json(404, { error: "Not found." });
      // Accept only same-site browser requests; bind to loopback as well.
      const origin = req.headers.origin;
      if (origin && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))
        return json(403, { error: "This demo accepts local origins only." });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return json(415, { error: "JSON is required." });
      let body = "";
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) return json(413, { error: "Request too large." });
        body += chunk;
      }
      const message = JSON.parse(body);
      return json(200, dispatch(store, message));
    } catch (error) {
      return json(400, {
        error: error instanceof Error ? error.message : "Invalid request.",
      });
    }
  });
  const sockets = new WebSocketServer({
    server,
    path: "/ws/studio",
    maxPayload: 16384,
    verifyClient: ({ origin }) =>
      !origin || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin),
  });
  sockets.on("connection", (socket) =>
    socket.on("message", (data) => {
      try {
        socket.send(
          JSON.stringify(dispatch(store, JSON.parse(data.toString()))),
        );
      } catch (error) {
        socket.send(JSON.stringify({ type: "error", error: error.message }));
      }
    }),
  );
  const close = () => {
    for (const socket of sockets.clients) socket.terminate();
    sockets.close();
    server.close();
  };
  return { server, store, close };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.GAME_SERVER_PORT || 5555);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("GAME_SERVER_PORT must be 1024–65535.");
  const app = createGameServer({
    startingCredits: Number(process.env.STARTING_CREDITS || 1000),
  });
  app.server.on("error", (error) => {
    console.error(`Game server: ${error.message}`);
    process.exitCode = 1;
  });
  app.server.listen(port, "127.0.0.1", () =>
    console.log(
      `tiQtoQ game server · http://127.0.0.1:${port} · in-memory credits · no database`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, app.close);
}
