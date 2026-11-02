# Reference-inspired canvas design

The supplied IWG folder contains ten static game screenshots and their logos. They were reviewed as visual references; none of those screenshots or logos is bundled into this game collection.

## Mapping the references

| Game             | Reference characteristics used                                                                                      | Result                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Treasure Chances | Black Pearl: separate prize game, central play area, side collectors and captioned symbols                          | Original moonlit treasure cove, nine-chance board, Crown prize panel, separate Bell and Star collectors                         |
| Lucky Numbers    | Millionaire Maker: gold theatre framing, prominent winning numbers, covered prize tickets and side bonus panels     | Original red-and-gold stage, twelve number tickets, winning-number strip, three-tier prize ladder, multiplier and vault screens |
| Star Quest       | Cash Bolt Power Spins and Lucky Letters: neon framing, illuminated progress bars, central GO control and dense grid | Original cosmic cabinet, sixteen reveal positions, three illuminated columns, bonus portal and constellation selection          |

The other screenshots reinforce the use of distinct themed worlds, compact layouts, prize ladders, large action controls and symbol captions. Existing game identities and rules are retained; these are original demonstrations rather than reproductions of the referenced titles.

## Rendering and interaction

The canvas is 1100 × 740 logical pixels. Only the environment is a background image. Logos are styled live Pixi Text. Tickets, numbers, symbols, captions, lights, buttons, counters and prize panels are separate interactive/display objects. Stable labels such as Chance 1 and Chest 1 remain available to structural discovery. An image backdrop must never contain the only copy of an essential rule, result or control.

Each game owns its board renderer in `apps/studio/src/games/<id>/board.ts`. Shared cabinet frames, metallic/neon trim, gradient titles, reveal tiles, collectors and circular GO controls live in `apps/studio/src/platform/rendering/cabinet.ts`. The header/footer live in `apps/studio/src/platform/ui/screens/chrome.ts`. Other shared screens handle introductions, bonuses, Info and results.

## Configuration

Each theme has a presentation block:

```json
{
  "layout": "number-stage",
  "columns": 4,
  "trim": "#ffc74e",
  "backdrop": "/games/lucky-numbers/backdrop-v2.jpg",
  "animation": {
    "revealMs": 260,
    "bonusMs": 650,
    "wheelMs": 2300,
    "particles": 16
  }
}
```

Layout presets are treasure-board, number-stage and neon-grid. Columns can be 3 or 4; the grid fits its available region automatically. Server tile counts are nine for Treasure Chances, 9–12 for Lucky Numbers and 9–16 for Star Quest. The defaults are 9, 12 and 16. Counts are server rules, while layout and animation settings are presentation configuration.

Animation settings are validated: durations are 0–5000 ms, and particle counts are 0–40. Reveals flip and fade only newly revealed tiles. Collector lights flash briefly. Bonus screens fade in, and the wheel has a decelerating spin. Input stays locked during transition animations. Reduced-motion preferences bypass flips, fades and celebratory particles and shorten the wheel transition.

The references are still images: exact animation sequences, timings and game probabilities cannot be established from them. The motion described above was designed for these demonstrations and is configurable.

## Original artwork

The backdrops were generated with the built-in image generation tool, then exported as JPEG at quality 88. Each is below 400 KB. Only the selected game's background is loaded. The original generated PNGs remain in the local generated-image library; the game uses the project-local JPEGs below:

- `apps/studio/public/games/treasure-chances/backdrop-v2.jpg`
- `apps/studio/public/games/lucky-numbers/backdrop-v2.jpg`
- `apps/studio/public/games/star-quest/backdrop-v2.jpg`

### Prompt set

Shared prompt: landscape 1536 × 1024 original premium illustrated browser-game backdrop; reference image is mood/richness guidance only, not an edit target; environment only, no UI, game board, text, logos, numbers, buttons or watermark; decorative objects at the edges, simple dark central 75% for live Pixi objects; no copied branding or exact reference composition.

Treasure Chances: deep turquoise moonlit sea, distant pirate cove, carved dark wood and antique gold edge detailing, a glowing treasure chest and coins in the lower-left corner, palm silhouettes at the sides, luminous jewel accents, cinematic storybook 3D game art.

Lucky Numbers: sumptuous red-and-gold theatrical game-show stage, crimson velvet curtains at the extreme left/right, gold proscenium, warm bulb lights across the top, subtle spotlights, glossy wooden stage floor, simple dark burgundy centre, playful polished 3D game art.

Star Quest: midnight-blue space, violet/cyan energy arcs at the edges, glowing magenta circuit frame, tiny starfield, jewel-like planets in far lower corners, simple dark navy centre, vibrant premium 3D illustrated game art.

## Verification

Tests cover asset references and image sizes, three distinct presentation presets, bounded animation settings, game rules, variable ticket/grid sizes, retries, sessions and credit accounting. Browser review covers all three main boards, both bonus journeys, visual spacing, Info/mute controls and result settlement. Pipeline implementation and Canvas Tester changes remain out of scope.
