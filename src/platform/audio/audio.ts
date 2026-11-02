export type Cue =
  "click" | "reveal" | "match" | "bonus" | "spin" | "win" | "lose";
export interface SoundTheme {
  root: number;
  wave: OscillatorType;
  volume: number;
  musicTempo: number;
}
export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private analyser?: AnalyserNode;
  private voices = new Set<OscillatorNode>();
  private musicTimer?: ReturnType<typeof setInterval>;
  muted = true;
  music = false;
  cues: { cue: string; time: number }[] = [];
  constructor(private theme: SoundTheme) {
    try {
      const saved = JSON.parse(localStorage.getItem("tiqtoq-audio-v1") || "{}");
      this.muted = saved.muted !== false;
      this.music = saved.music === true;
    } catch {
      /* default to quiet */
    }
    document.addEventListener("visibilitychange", this.visibility);
  }
  private visibility = () => {
    if (document.hidden) this.stopMusic();
    else if (!this.muted && this.music) this.startMusic();
  };
  async unlock() {
    if (this.muted) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.theme.volume;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.master.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    if (this.context.state !== "running") await this.context.resume();
    if (this.music) this.startMusic();
  }
  async toggle() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.master && this.context)
        this.master.gain.setValueAtTime(0, this.context.currentTime);
      this.stopMusic();
      for (const voice of this.voices) {
        try {
          voice.stop();
        } catch {
          /* already ended */
        }
      }
      this.voices.clear();
    } else {
      await this.unlock();
      if (this.master && this.context)
        this.master.gain.setValueAtTime(
          this.theme.volume,
          this.context.currentTime,
        );
      this.play("click");
    }
    this.save();
  }
  toggleMusic() {
    this.music = !this.music;
    if (this.music && !this.muted) this.startMusic();
    else this.stopMusic();
    this.save();
  }
  private save() {
    try {
      localStorage.setItem(
        "tiqtoq-audio-v1",
        JSON.stringify({ muted: this.muted, music: this.music }),
      );
    } catch {
      /* optional */
    }
  }
  private note(
    frequency: number,
    start: number,
    duration: number,
    volume = 0.15,
  ) {
    if (
      !this.context ||
      !this.master ||
      this.muted ||
      this.context.state !== "running"
    )
      return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = this.theme.wave;
    oscillator.frequency.value = frequency;
    const at = this.context.currentTime + start;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
    this.voices.add(oscillator);
    oscillator.onended = () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  play(cue: Cue) {
    if (this.muted || this.context?.state !== "running") return;
    this.cues.push({ cue, time: this.context.currentTime });
    this.cues = this.cues.slice(-40);
    const notes: Record<Cue, number[]> = {
      click: [1],
      reveal: [1, 1.5],
      match: [1, 1.25, 1.5],
      bonus: [1, 1.25, 1.5, 2],
      spin: [2, 1.8, 1.6, 1.4, 1.2],
      win: [1, 1.25, 1.5, 2, 2.5],
      lose: [1, 0.75],
    };
    notes[cue].forEach((ratio, i) =>
      this.note(
        this.theme.root * ratio,
        i * 0.085,
        cue === "click" ? 0.055 : 0.25,
        cue === "click" ? 0.08 : 0.13,
      ),
    );
  }
  private startMusic() {
    if (this.musicTimer || document.hidden || this.context?.state !== "running")
      return;
    let step = 0;
    const melody = [1, 1.5, 1.25, 1.5, 0.75, 1.25, 1, 1.5];
    this.musicTimer = setInterval(() => {
      this.note(
        (this.theme.root * melody[step++ % melody.length]) / 2,
        0,
        0.7,
        0.035,
      );
    }, 60000 / this.theme.musicTempo);
  }
  private stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }
  inspect() {
    return {
      muted: this.muted,
      music: this.music,
      state: this.context?.state || "locked",
      cues: [...this.cues],
    };
  }
  async destroy() {
    this.stopMusic();
    document.removeEventListener("visibilitychange", this.visibility);
    await this.context?.close();
  }
}
