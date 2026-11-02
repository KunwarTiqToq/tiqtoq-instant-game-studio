export type GameId = "treasure-chances" | "lucky-numbers" | "star-quest";
export interface GameConfig {
  id: GameId;
  name: string;
  cost: number;
  tileCount: number;
  matchPrize: number;
  bonus1: number[];
  bonus2: number[];
  winningNumbers?: number[];
}
export interface Round {
  id: string;
  gameId: GameId;
  number: number;
  scenario: string;
  seed: number;
  phase: "reveal" | "bonus1" | "bonus2" | "result";
  tiles: (number | null)[];
  base: number;
  bonus1: number;
  bonus2: number;
  first: boolean;
  second: boolean;
  progress: number;
  secondary: number;
  choices: number[];
  firstChoices: (number | null)[];
  secondChoices: (number | null)[];
  wheelIndex: number | null;
  total: number;
  message: string;
}
export interface State {
  player: { id: string; balance: number; displayName: string };
  round: Round | null;
  history: { gameId: GameId; number: number; total: number; balance: number }[];
}
interface Response extends State {
  type: string;
  sessionId?: string;
  token?: string;
  error?: string;
}
const KEY = "tiqtoq-studio-session-v1";
export class GameClient {
  private credentials: { sessionId?: string; token?: string } = {};
  state: State | null = null;
  constructor() {
    try {
      this.credentials = JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      /* Private storage is optional. */
    }
  }
  async connect() {
    const result = await this.send("session.open");
    this.credentials = { sessionId: result.sessionId, token: result.token };
    try {
      localStorage.setItem(KEY, JSON.stringify(this.credentials));
    } catch {
      /* Session still works in this tab. */
    }
    return result;
  }
  async send(type: string, payload?: unknown): Promise<Response> {
    const message = {
      ...this.credentials,
      requestId: crypto.randomUUID(),
      type,
      payload,
    };
    // One retry reuses the same ID; the server deduplicates state-changing actions.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
          signal: AbortSignal.timeout(7000),
        });
        const result = await response.json();
        if (!response.ok)
          throw new ServerError(
            result.error || "The game server rejected this action.",
          );
        if (result.type !== "session.ready" && result.type !== "session.state")
          throw new Error("Unexpected response from the game server.");
        this.state = result;
        return result;
      } catch (error) {
        if (error instanceof ServerError || attempt === 1) throw error;
      }
    }
    throw new Error("Cannot reach the game server.");
  }
  forget() {
    this.credentials = {};
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* optional */
    }
  }
}
class ServerError extends Error {}
