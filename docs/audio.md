# Sound and settings

GameAudio creates one Web Audio context after the user enables sound. Effects are short, original synthesised notes, not downloaded recordings. The sound theme changes the pitch, waveform and music tempo for each game. Cues cover clicks, reveals, matches, bonus unlocks, wheel spins, wins and losing results.

The master mute gain controls every voice, including music. Muting immediately silences output, stops scheduled voices and stops the music timer. Unmuting enables subsequent cues without replaying old ones. Background music has a separate switch under Info and defaults off. Sound defaults off. Both preferences are stored under `tiqtoq-audio-v1` on the same origin.

Music pauses its scheduling when the page is hidden and restarts when visible if enabled. Leaving the page closes its audio context and stops the timer. Web Audio playback still requires a browser-accepted user gesture; a saved preference does not bypass autoplay restrictions.

Audio passes through a final analyser after the master gain. This leaves a useful extension point for future signal-level checks. `window.__TIQTOQ_AUDIO__.inspect()` exposes a small read-only summary of mute/music/context status and recent cue events. It does not prove sound reached a physical speaker and is not a Canvas Tester audio assertion. No Canvas Tester changes are included here.

Manual review: enable sound, reveal a tile, trigger a bonus, mute during sound, reveal another tile while muted, unmute, finish a round and toggle music. Check Info can close without changing the current round. Automated audio-signal comparison is deferred to the later tester work.
