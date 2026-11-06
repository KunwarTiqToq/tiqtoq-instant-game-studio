import { randomUUID } from "node:crypto";
import {
  games,
  randomFromSeed,
  shuffle,
  SCENARIOS,
} from "../games/catalogue.mjs";
import * as treasure from "../games/treasure-chances/rules.mjs";
import * as numbers from "../games/lucky-numbers/rules.mjs";
import * as stars from "../games/star-quest/rules.mjs";
const rules = {
  "treasure-chances": treasure,
  "lucky-numbers": numbers,
  "star-quest": stars,
};
/**
 * Deliberate defects for demonstrating automated testers. Off unless a round
 * is started with `faults`; a normal player never sends this field.
 */
export const SERVER_FAULTS = ["double-credit"];
export function startRound(
  session,
  { gameId, scenario = "random", seed = 7, faults = [] },
) {
  const config = Object.hasOwn(games, gameId) ? games[gameId] : null;
  if (
    !config ||
    !SCENARIOS.includes(scenario) ||
    !Number.isSafeInteger(seed) ||
    Math.abs(seed) > 2147483647 ||
    !Array.isArray(faults) ||
    !faults.every((fault) => SERVER_FAULTS.includes(fault))
  )
    throw new Error("Invalid game, scenario or seed.");
  if (session.round && session.round.phase !== "result")
    throw new Error("Finish your current round first.");
  if (session.balance < config.cost)
    throw new Error("Not enough demo credits. Reset your demo to play again.");
  const number = ++session.roundNumber;
  const random = randomFromSeed(seed + number - 1);
  const chosen =
    scenario === "random" ? SCENARIOS[1 + Math.floor(random() * 4)] : scenario;
  const round = {
    id: randomUUID(),
    gameId,
    number,
    seed,
    scenario,
    phase: "reveal",
    deck: shuffle(rules[gameId].layout(chosen, config), random),
    revealed: [],
    base: 0,
    first: false,
    second: false,
    progress: 0,
    secondary: 0,
    bonus1: 0,
    bonus2: 0,
    firstChoices: shuffle(config.bonus1, random),
    secondChoices: shuffle(config.bonus2, random),
    choices: [],
    wheelIndex: Math.floor(random() * 6),
    wheelDone: false,
    collected: false,
    faults: [...new Set(faults)],
    bonusStep: 0,
    message: "Choose any covered chance to begin.",
  };
  session.balance -= config.cost;
  session.round = round;
}
export function actOnRound(session, { roundId, action, index }) {
  const round = session.round;
  if (!round || round.id !== roundId)
    throw new Error("This round is no longer active.");
  const config = games[round.gameId];
  if (
    ["reveal", "pick"].includes(action) &&
    (!Number.isInteger(index) || index < 0)
  )
    throw new Error("Choose a valid position.");
  if (action === "reveal") {
    if (round.phase !== "reveal" || index >= config.tileCount)
      throw new Error("That chance cannot be revealed now.");
    if (!round.revealed.includes(index)) round.revealed.push(index);
    Object.assign(
      round,
      rules[round.gameId].evaluate(
        round.revealed.map((i) => round.deck[i]),
        config,
      ),
    );
    round.message = `${round.revealed.length} of ${config.tileCount} chances revealed. ${round.first ? "First bonus unlocked! " : ""}${round.second ? "Second bonus unlocked!" : ""}`;
  } else if (action === "reveal-all") {
    if (round.phase !== "reveal") throw new Error("Reveal is complete.");
    for (let i = 0; i < config.tileCount; i++)
      if (!round.revealed.includes(i))
        actOnRound(session, { roundId, action: "reveal", index: i });
  } else if (action === "pick") {
    if (round.phase !== "bonus1" && round.phase !== "bonus2")
      throw new Error("No selection bonus is open.");
    if (round.phase === "bonus1") {
      if (index >= 5) throw new Error("Choose a valid bonus item.");
      const limit = round.gameId === "star-quest" ? 3 : 1;
      if (round.choices.includes(index)) return;
      if (round.choices.length >= limit)
        throw new Error("All bonus choices have been used.");
      round.choices.push(index);
      round.bonus1 +=
        round.gameId === "lucky-numbers"
          ? round.base * (round.firstChoices[index] - 1)
          : round.firstChoices[index];
      round.message =
        round.gameId === "lucky-numbers"
          ? `${round.firstChoices[index]}× multiplier! ${round.bonus1} extra credits.`
          : `${round.firstChoices[index]} bonus credits revealed.`;
    } else {
      if (round.gameId === "treasure-chances" || index >= 6)
        throw new Error("Choose a valid bonus item.");
      if (round.choices.length) return;
      round.choices.push(index);
      round.bonus2 = round.secondChoices[index];
      round.message = `${round.bonus2} bonus credits uncovered!`;
    }
  } else if (action === "spin") {
    if (round.phase !== "bonus2" || round.gameId !== "treasure-chances")
      throw new Error("The wheel is not ready.");
    if (!round.wheelDone) {
      round.wheelDone = true;
      round.bonus2 = config.bonus2[round.wheelIndex];
    }
    round.message = `The wheel landed on ${round.bonus2} credits!`;
  } else if (action === "continue") {
    if (round.phase === "reveal") {
      if (round.revealed.length !== config.tileCount)
        throw new Error("Reveal all your chances first.");
      round.phase = round.first ? "bonus1" : round.second ? "bonus2" : "result";
    } else if (round.phase === "bonus1") {
      if (round.choices.length < (round.gameId === "star-quest" ? 3 : 1))
        throw new Error("Complete your bonus choices first.");
      round.phase = round.second ? "bonus2" : "result";
      round.choices = [];
    } else if (round.phase === "bonus2") {
      if (
        !(round.gameId === "treasure-chances"
          ? round.wheelDone
          : round.choices.length)
      )
        throw new Error("Play this bonus first.");
      round.phase = "result";
    }
    round.message =
      round.phase === "result"
        ? `Round complete. ${round.base + round.bonus1 + round.bonus2} credits won.`
        : "Your bonus is ready. Choose your next adventure!";
  } else throw new Error("Unknown round action.");
  if (round.phase === "result" && !round.collected) {
    const total = round.base + round.bonus1 + round.bonus2;
    session.balance += total;
    if (round.faults?.includes("double-credit")) session.balance += total;
    round.collected = true;
    session.history.unshift({
      gameId: round.gameId,
      number: round.number,
      total,
      balance: session.balance,
    });
    session.history = session.history.slice(0, 10);
  }
}
export function publicSession(session) {
  const r = session.round;
  let round = null;
  if (r) {
    const completeFirst =
      r.phase === "result" ||
      (r.phase === "bonus1" &&
        r.choices.length >= (r.gameId === "star-quest" ? 3 : 1));
    round = {
      id: r.id,
      gameId: r.gameId,
      number: r.number,
      scenario: r.scenario,
      seed: r.seed,
      phase: r.phase,
      tiles: r.deck.map((symbol, i) =>
        r.revealed.includes(i) ? symbol : null,
      ),
      base: r.base,
      bonus1: r.bonus1,
      bonus2: r.bonus2,
      first: r.first,
      second: r.second,
      progress: r.progress,
      secondary: r.secondary,
      choices: [...r.choices],
      firstChoices:
        r.phase === "bonus1"
          ? r.firstChoices.map((amount, i) =>
              completeFirst || r.choices.includes(i) ? amount : null,
            )
          : [],
      secondChoices:
        r.phase === "bonus2" && r.gameId !== "treasure-chances"
          ? r.secondChoices.map((amount, i) =>
              r.choices.length || r.choices.includes(i) ? amount : null,
            )
          : [],
      wheelIndex: r.wheelDone ? r.wheelIndex : null,
      total: r.base + r.bonus1 + r.bonus2,
      message: r.message,
    };
  }
  return {
    player: {
      id: session.id,
      balance: session.balance,
      displayName: "Demo explorer",
    },
    round,
    history: session.history,
  };
}
