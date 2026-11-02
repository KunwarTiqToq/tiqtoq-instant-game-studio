import { describe, it, expect, vi, afterEach } from "vitest";
import { GameClient } from "../src/platform/network/client";
afterEach(() => vi.unstubAllGlobals());
describe("request retry contract", () => {
  it("retries network failures with the original request ID", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            type: "session.ready",
            sessionId: "s",
            token: "t",
            player: { id: "s", balance: 1000 },
            round: null,
            history: [],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetch);
    const client = new GameClient();
    await client.connect();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[0][1].body).requestId).toBe(
      JSON.parse(fetch.mock.calls[1][1].body).requestId,
    );
  });
  it("does not retry game-rule rejections", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Finish the current round first." }),
          { status: 400 },
        ),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(new GameClient().send("round.start")).rejects.toThrow(
      "Finish the current round",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
