import { randomUUID, timingSafeEqual } from "node:crypto";
export class SessionStore {
  sessions = new Map();
  constructor({
    startingCredits = 1000,
    ttlMs = 4 * 60 * 60 * 1000,
    maxSessions = 1000,
  } = {}) {
    if (
      !Number.isSafeInteger(startingCredits) ||
      startingCredits < 10 ||
      startingCredits > 1000000
    )
      throw new Error("Invalid starting credits.");
    this.startingCredits = startingCredits;
    this.ttlMs = ttlMs;
    this.maxSessions = maxSessions;
  }
  open(id, token) {
    const now = Date.now();
    for (const [key, value] of this.sessions)
      if (now - value.touched > this.ttlMs) this.sessions.delete(key);
    let session = this.sessions.get(id);
    if (session) {
      if (
        typeof token !== "string" ||
        token.length !== session.token.length ||
        !timingSafeEqual(Buffer.from(token), Buffer.from(session.token))
      )
        throw new Error("Invalid demo session. Reset your demo to reconnect.");
      session.touched = now;
      return session;
    }
    if (this.sessions.size >= this.maxSessions)
      throw new Error("Demo session limit reached. Restart the server.");
    session = {
      id: randomUUID(),
      token: randomUUID(),
      balance: this.startingCredits,
      roundNumber: 0,
      round: null,
      history: [],
      requests: new Map(),
      touched: now,
    };
    this.sessions.set(session.id, session);
    return session;
  }
  require(id, token) {
    if (!this.sessions.has(id))
      throw new Error("Session expired. Reconnect to start a fresh demo.");
    return this.open(id, token);
  }
  reset(session) {
    session.balance = this.startingCredits;
    session.round = null;
    session.roundNumber = 0;
    session.history = [];
  }
}
