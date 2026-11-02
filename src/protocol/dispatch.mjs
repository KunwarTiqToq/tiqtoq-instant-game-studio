import { games, SCENARIOS } from "../games/catalogue.mjs";
import {
  startRound,
  actOnRound,
  publicSession,
} from "../rounds/round-service.mjs";
export const catalogue = () => ({
  protocol: 1,
  scenarios: SCENARIOS,
  games: Object.values(games),
});
export function dispatch(store, message) {
  if (
    !message ||
    typeof message !== "object" ||
    typeof message.requestId !== "string" ||
    !/^[\w-]{1,100}$/.test(message.requestId)
  )
    throw new Error("A valid requestId is required.");
  if (message.type === "session.open") {
    const session = store.open(message.sessionId, message.token);
    return {
      type: "session.ready",
      requestId: message.requestId,
      sessionId: session.id,
      token: session.token,
      ...publicSession(session),
    };
  }
  const session = store.require(message.sessionId, message.token);
  const signature = JSON.stringify({
    type: message.type,
    payload: message.payload,
  });
  const previous = session.requests.get(message.requestId);
  if (previous) {
    if (previous.signature !== signature)
      throw new Error("Request ID already used for a different action.");
    return previous.response;
  }
  if (message.type === "round.start")
    startRound(session, message.payload || {});
  else if (message.type === "round.action")
    actOnRound(session, message.payload || {});
  else if (message.type === "session.reset") store.reset(session);
  else if (message.type !== "session.state")
    throw new Error("Unknown message type.");
  const response = {
    type: "session.state",
    requestId: message.requestId,
    ...publicSession(session),
  };
  session.requests.set(message.requestId, {
    signature,
    response: structuredClone(response),
  });
  if (session.requests.size > 500)
    session.requests.delete(session.requests.keys().next().value);
  return response;
}
