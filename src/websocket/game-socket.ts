import {
  startTargetRound,
  hitTarget,
  targetOutcome,
  type TargetRound,
} from "../games/mini/target-round.js";
import type { MiniConfig } from "../games/mini/mini-engine.js";
import {
  isMiniType,
  defaultMiniConfig,
  drawMini,
  validateMiniConfig,
} from "../games/mini/mini-engine.js";
import type { Award } from "../domain/models.js";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import type { LiveOpsService } from "../domain/service.js";
import { publicPlayer } from "../domain/models.js";
import { DomainError, requestId, id } from "../domain/validation.js";

export function attachGameSocket(
  server: Server,
  service: LiveOpsService | null,
  heartbeatIntervalMs = 25000,
) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/games",
    maxPayload: 16 * 1024,
  });
  wss.on("error", () =>
    console.error("WebSocket server error. Check the configured port."),
  );
  const awaitingPong = new Set<WebSocket>();
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (awaitingPong.has(socket)) {
        socket.terminate();
        continue;
      }
      if (socket.readyState === WebSocket.OPEN) {
        awaitingPong.add(socket);
        socket.ping();
      }
    }
  }, heartbeatIntervalMs);
  heartbeat.unref();
  wss.on("close", () => {
    clearInterval(heartbeat);
    awaitingPong.clear();
  });
  let sweeping = false;
  const sweep = setInterval(async () => {
    if (!service || sweeping) return;
    sweeping = true;
    try {
      await service.settleExpiredTargets();
    } catch {
      /* Retry next sweep; results remain persisted. */
    } finally {
      sweeping = false;
    }
  }, 500);
  sweep.unref();
  wss.on("close", () => clearInterval(sweep));
  const visibleAward = (a: Award) => ({
    id: a._id,
    type: a.type,
    status: a.status,
    config:
      a.gameConfig ?? defaultMiniConfig(isMiniType(a.type) ? a.type : "wheel"),
    outcome: a.outcome,
    targetRound: a.targetRound,
    serverNow: Date.now(),
  });
  wss.on("connection", (socket) => {
    socket.on("pong", () => awaitingPong.delete(socket));
    socket.on("close", () => awaitingPong.delete(socket));
    let playerId: string | null = null;
    let busy = false;
    let previewRound: { config: MiniConfig; round: TargetRound } | undefined;
    const send = (message: unknown) => {
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify(message));
    };
    const fail = (
      code: string,
      message: string,
      requestId: string | null = null,
    ) => send({ type: "error", requestId, error: { code, message } });
    const updatePlayer = async (changedId: string) => {
      if (playerId !== changedId || !service) return;
      try {
        send({
          type: "player.updated",
          player: publicPlayer(await service.getPlayer(changedId)),
        });
      } catch {
        /* Next request reports the connection failure. */
      }
    };
    const updateAwards = async (changedId: string) => {
      if (changedId !== playerId || !service) return;
      try {
        send({
          type: "awards.updated",
          awards: (await service.pendingAwards(changedId)).map(visibleAward),
        });
      } catch {
        /* Session reconnect reloads the persisted queue. */
      }
    };
    service?.on("player", updatePlayer);
    service?.on("awards", updateAwards);
    socket.on("close", () => {
      service?.off("player", updatePlayer);
      service?.off("awards", updateAwards);
    });
    socket.on("error", () => console.error("Game socket connection error."));
    socket.on("message", async (data, isBinary) => {
      if (isBinary) return fail("INVALID_MESSAGE", "Send a JSON text message.");
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch {
        return fail("INVALID_JSON", "Message must contain valid JSON.");
      }
      if (!message || typeof message !== "object" || Array.isArray(message))
        return fail("INVALID_MESSAGE", "Message must be an object.");
      const parsedId = requestId.safeParse(message.requestId);
      if (!parsedId.success)
        return fail(
          "INVALID_MESSAGE",
          "requestId must be a non-empty string of at most 128 characters.",
        );
      const rid = parsedId.data;
      if (
        ![
          "session.open",
          "slot.spin",
          "award.get",
          "award.play",
          "mini.preview",
          "targets.start",
          "targets.hit",
          "targets.finish",
          "targets.preview",
        ].includes(message.type)
      )
        return fail(
          "UNKNOWN_MESSAGE_TYPE",
          "Supported types: session.open, slot.spin, award.get, award.play, mini.preview.",
          rid,
        );
      if (message.type === "targets.preview") {
        try {
          const input = z
            .object({
              type: z.literal("targets.preview"),
              requestId,
              action: z.enum(["start", "hit", "finish"]),
              config: z.unknown().optional(),
              targetId: z.string().min(1).max(128).optional(),
            })
            .strict()
            .parse(message);
          if (input.action === "start") {
            if (!previewRound || Date.now() >= previewRound.round.endsAt) {
              const config = validateMiniConfig(
                "targets",
                input.config ?? defaultMiniConfig("targets"),
              );
              previewRound = { config, round: startTargetRound(config) };
            }
          }
          if (!previewRound) throw new Error("Start the preview round first.");
          if (input.action === "hit")
            previewRound.round = hitTarget(
              previewRound.round,
              previewRound.config,
              input.targetId!,
            );
          const ended = Date.now() >= previewRound.round.endsAt;
          send({
            type: "targets.result",
            requestId: rid,
            award: {
              id: "preview",
              type: "targets",
              status: ended ? "played" : "pending",
              config: previewRound.config,
              targetRound: previewRound.round,
              serverNow: Date.now(),
              ...(ended
                ? {
                    outcome: targetOutcome(
                      previewRound.round,
                      previewRound.config,
                    ),
                  }
                : {}),
            },
          });
        } catch (error) {
          fail(
            "INVALID_TARGET",
            error instanceof Error ? error.message : "Invalid target request.",
            rid,
          );
        }
        return;
      }
      // Standalone URL previews never mutate a player or create an award.
      if (message.type === "mini.preview") {
        try {
          const input = z
            .object({
              type: z.literal("mini.preview"),
              requestId,
              game: z.enum(["wheel", "chests", "targets", "scratch"]),
              config: z.unknown().optional(),
              choiceIndex: z.number().int().min(0).max(11).optional(),
            })
            .strict()
            .parse(message);
          if (input.game === "targets")
            throw new Error("Use targets.preview for a timed round.");
          const config = validateMiniConfig(
            input.game,
            input.config ?? defaultMiniConfig(input.game),
          );
          send({
            type: "mini.result",
            requestId: rid,
            outcome: drawMini(input.game, config, input.choiceIndex),
          });
        } catch (error) {
          fail(
            "INVALID_CONFIG",
            error instanceof Error
              ? error.message
              : "Invalid preview configuration.",
            rid,
          );
        }
        return;
      }
      if (!service)
        return fail(
          "DATABASE_UNAVAILABLE",
          "Database is not configured. Set MONGO_DB_CONNECTION_STRING in core-api/.env.",
          rid,
        );
      if (busy)
        return fail(
          "REQUEST_IN_PROGRESS",
          "Wait for the previous request.",
          rid,
        );
      busy = true;
      try {
        if (message.type === "session.open") {
          if (playerId)
            throw new DomainError(
              409,
              "SESSION_EXISTS",
              "Session already opened.",
            );
          const credentials = z
            .object({ playerId: id.optional(), token: id.optional() })
            .refine(
              (v) => Boolean(v.playerId) === Boolean(v.token),
              "Player ID and token must be supplied together",
            )
            .parse(message);
          const opened = await service.openSession(
            credentials.playerId,
            credentials.token,
          );
          playerId = opened.player.id;
          send({
            type: "session.ready",
            requestId: rid,
            ...opened,
            awards: (await service.pendingAwards(playerId)).map(visibleAward),
          });
        } else {
          if (!playerId)
            throw new DomainError(
              401,
              "SESSION_REQUIRED",
              "Open a player session before spinning.",
            );
          if (
            ["targets.start", "targets.hit", "targets.finish"].includes(
              message.type,
            )
          ) {
            const input = z
              .object({
                type: z.enum([
                  "targets.start",
                  "targets.hit",
                  "targets.finish",
                ]),
                requestId,
                awardId: id,
                targetId: z.string().min(1).max(128).optional(),
              })
              .strict()
              .parse(message);
            const action = input.type.split(".")[1] as
              "start" | "hit" | "finish";
            if (action === "hit" && !input.targetId)
              throw new DomainError(400, "INVALID_TARGET", "Choose a target.");
            const award = await service.targetAction(
              playerId,
              input.awardId,
              action,
              input.targetId,
            );
            send({
              type: "award.result",
              requestId: rid,
              award: visibleAward(award),
              player: publicPlayer(await service.getPlayer(playerId)),
            });
          } else if (
            message.type === "award.get" ||
            message.type === "award.play"
          ) {
            const input = z
              .object({
                type: z.enum(["award.get", "award.play"]),
                requestId,
                awardId: id,
                choiceIndex: z.number().int().min(0).max(11).optional(),
              })
              .strict()
              .parse(message);
            const award =
              input.type === "award.get"
                ? await service.getAward(playerId, input.awardId)
                : await service.playAward(
                    playerId,
                    input.awardId,
                    input.choiceIndex,
                  );
            send({
              type: "award.result",
              requestId: rid,
              award: visibleAward(award),
              player: publicPlayer(await service.getPlayer(playerId)),
            });
          } else {
            send({
              type: "slot.result",
              requestId: rid,
              result: await service.play(playerId, rid),
              player: publicPlayer(await service.getPlayer(playerId)),
            });
          }
        }
      } catch (error) {
        if (error instanceof DomainError) fail(error.code, error.message, rid);
        else if (error instanceof z.ZodError)
          fail("INVALID_MESSAGE", "Invalid request parameters.", rid);
        else {
          console.error(
            "Game operation failed:",
            error instanceof Error ? error.name : "Unknown error",
          );
          fail("INTERNAL_ERROR", "Unable to complete this request.", rid);
        }
      } finally {
        busy = false;
      }
    });
  });
  return wss;
}
