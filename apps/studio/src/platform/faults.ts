/**
 * Deliberate defects, switched on with `?fault=a,b` in the game URL.
 *
 * They exist so an automated tester can be shown finding real classes of
 * defect on a game whose healthy behaviour is known. With no `fault`
 * parameter every check below is false and the game is unchanged.
 */
export const FAULTS = {
  /** Server pays a completed round twice. */
  "double-credit": "Winnings are credited to the balance twice",
  /** Server enters the bonus, the screen never shows it. */
  "bonus-not-shown": "The first bonus never appears on screen",
  /** Displayed win omits the second bonus. */
  "wrong-total": "The displayed win leaves out the second bonus",
  /** Balance in the footer renders as NaN. */
  "broken-text": "The balance is displayed as NaN",
  /** No sound when a round is won. */
  "no-win-sound": "Winning rounds are silent",
  /** Sound keeps playing after the player mutes it. */
  "mute-ignored": "Muting does not silence the game",
  /** A losing round plays the winning celebration. */
  "loss-celebrated": "Losing rounds play the win celebration",
  /** An image the game requests is missing on the server. */
  "missing-asset": "A game image fails to load",
  /** The information screen's close button does nothing. */
  "info-wont-close": "The information screen cannot be closed",
  /** After closing information, revealed chances show as covered again. */
  "info-hides-progress": "Closing information hides the round's progress",
  /** After a reload the game offers a new round instead of resuming. */
  "no-resume": "Reloading the page abandons the round in progress",
} as const;

export type Fault = keyof typeof FAULTS;

export const SERVER_FAULTS: readonly Fault[] = ["double-credit"];

export function activeFaults(search = location.search): Set<Fault> {
  const requested = new URLSearchParams(search).get("fault") ?? "";
  return new Set(
    requested
      .split(",")
      .map((name) => name.trim())
      .filter((name): name is Fault => Object.hasOwn(FAULTS, name)),
  );
}
