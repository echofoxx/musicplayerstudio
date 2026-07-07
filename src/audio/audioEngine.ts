import { EQ_FREQUENCIES } from '../types';
import type { Track } from '../types';

type Listener<T> = (payload: T) => void;

interface Deck {
  el: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  track: Track | null;
}

function equalPowerCurve(rising: boolean, steps = 64): Float32Array {
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const x = i / (steps - 1);
    curve[i] = rising ? Math.sin((x * Math.PI) / 2) : Math.cos((x * Math.PI) / 2);
  }
  return curve;
}

/**
 * Dual-deck Web Audio engine. Two <audio> elements feed a shared 5-band EQ
 * chain, master gain and analyser. Switching tracks either swaps decks
 * instantly or crossfades between them using equal-power gain curves so
 * playback doesn't dip in perceived loudness mid-fade.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private decks: [Deck, Deck] | null = null;
  private activeDeck = 0;
  private eqFilters: BiquadFilterNode[] = [];
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private crossfadeSeconds = 0;
  private masterVolume = 0.85;
  private crossfadeTriggeredForTrack = new Set<string>();
  private rafId: number | null = null;
  private scratching = false;

  private timeListeners = new Set<Listener<{ currentTime: number; duration: number }>>();
  private endedListeners = new Set<Listener<void>>();
  private nearEndListeners = new Set<Listener<{ remaining: number }>>();

  private ensureGraph() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.eqFilters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.frequency.value = freq;
      if (i === 0) filter.type = 'lowshelf';
      else if (i === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1;
      }
      filter.gain.value = 0;
      return filter;
    });
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.eqFilters[this.eqFilters.length - 1].connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    const makeDeck = (): Deck => {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.preload = 'auto';
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(this.eqFilters[0]);
      return { el, source, gain, track: null };
    };

    this.decks = [makeDeck(), makeDeck()];
    this.startTimeLoop();
  }

  private startTimeLoop() {
    const tick = () => {
      const deck = this.decks?.[this.activeDeck];
      if (deck?.track && deck.el.duration && !Number.isNaN(deck.el.duration)) {
        const currentTime = deck.el.currentTime;
        const duration = deck.el.duration;
        this.timeListeners.forEach((l) => l({ currentTime, duration }));

        const remaining = duration - currentTime;
        if (!this.scratching && this.crossfadeSeconds > 0 && remaining <= this.crossfadeSeconds + 0.05) {
          this.nearEndListeners.forEach((l) => l({ remaining }));
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  async resume() {
    this.ensureGraph();
    if (this.ctx!.state === 'suspended') await this.ctx!.resume();
  }

  getAnalyser(): AnalyserNode | null {
    this.ensureGraph();
    return this.analyser;
  }

  setEQGain(bandIndex: number, gainDb: number) {
    this.ensureGraph();
    const filter = this.eqFilters[bandIndex];
    if (filter) filter.gain.setTargetAtTime(gainDb, this.ctx!.currentTime, 0.02);
  }

  setMasterVolume(v: number) {
    this.masterVolume = v;
    this.ensureGraph();
    this.masterGain!.gain.setTargetAtTime(v, this.ctx!.currentTime, 0.02);
  }

  setCrossfadeDuration(seconds: number) {
    this.crossfadeSeconds = seconds;
  }

  /** Used while dragging the record for the scratch effect (see NowPlaying.tsx). */
  setPlaybackRate(rate: number) {
    const deck = this.decks?.[this.activeDeck];
    if (deck) deck.el.playbackRate = Math.max(0.1, rate);
  }

  setScratching(active: boolean) {
    this.scratching = active;
    if (!active) this.setPlaybackRate(1);
  }

  get currentTrack(): Track | null {
    return this.decks?.[this.activeDeck].track ?? null;
  }

  onTimeUpdate(cb: Listener<{ currentTime: number; duration: number }>) {
    this.timeListeners.add(cb);
    return () => this.timeListeners.delete(cb);
  }
  onEnded(cb: Listener<void>) {
    this.endedListeners.add(cb);
    return () => this.endedListeners.delete(cb);
  }
  onNearEnd(cb: Listener<{ remaining: number }>) {
    this.nearEndListeners.add(cb);
    return () => this.nearEndListeners.delete(cb);
  }

  isPlaying(): boolean {
    const deck = this.decks?.[this.activeDeck];
    return !!deck && !deck.el.paused && !deck.el.ended;
  }

  /**
   * Loads a track into the currently-idle deck without playing it, so a
   * later instant switch (crossfade = 0) has zero load/buffer delay — true
   * gapless playback between queued tracks. No-ops if that deck is already
   * primed with this track, or is mid-crossfade (still holds a track).
   */
  preloadNext(track: Track) {
    this.ensureGraph();
    if (!track.streamUrl || !this.decks) return;
    const idleDeck = this.decks[1 - this.activeDeck];
    if (idleDeck.track) return;
    idleDeck.track = track;
    idleDeck.el.src = track.streamUrl;
    idleDeck.el.currentTime = 0;
    idleDeck.gain.gain.value = 0;
  }

  async playTrack(track: Track, opts: { crossfade?: boolean } = {}) {
    this.ensureGraph();
    await this.resume();
    const ctx = this.ctx!;
    const decks = this.decks!;

    const fromIndex = this.activeDeck;
    const fromDeck = decks[fromIndex];
    const hasCurrent = !!fromDeck.track;
    // Always land on the other deck once something's already playing, so the
    // idle deck is consistently available for preloadNext() to prime ahead of time.
    const toIndex = hasCurrent ? 1 - fromIndex : fromIndex;
    const toDeck = decks[toIndex];
    const useCrossfade = !!opts.crossfade && this.crossfadeSeconds > 0 && hasCurrent && toIndex !== fromIndex;

    if (!track.streamUrl) return;

    const alreadyPrimed = toDeck.track?.id === track.id && toDeck.el.src === track.streamUrl;
    this.crossfadeTriggeredForTrack.delete(track.id);

    toDeck.track = track;
    if (!alreadyPrimed) {
      toDeck.el.src = track.streamUrl;
      toDeck.el.currentTime = 0;
    }

    try {
      await toDeck.el.play();
    } catch {
      // Autoplay may be blocked until a user gesture; caller's UI reflects paused state.
    }

    if (useCrossfade) {
      const dur = this.crossfadeSeconds;
      const t0 = ctx.currentTime;
      fromDeck.gain.gain.cancelScheduledValues(t0);
      toDeck.gain.gain.cancelScheduledValues(t0);
      fromDeck.gain.gain.setValueCurveAtTime(equalPowerCurve(false), t0, dur);
      toDeck.gain.gain.setValueCurveAtTime(equalPowerCurve(true), t0, dur);

      const previousFrom = fromDeck;
      window.setTimeout(() => {
        previousFrom.el.pause();
        previousFrom.track = null;
      }, dur * 1000 + 50);

      this.activeDeck = toIndex;
      this.bindEndedHandler(toDeck);
    } else {
      // Instant switch: stop the previous deck, snap the new one to full volume.
      if (toIndex !== fromIndex) {
        fromDeck.el.pause();
        fromDeck.track = null;
      }
      toDeck.gain.gain.cancelScheduledValues(ctx.currentTime);
      toDeck.gain.gain.setValueAtTime(1, ctx.currentTime);
      this.activeDeck = toIndex;
      this.bindEndedHandler(toDeck);
    }
  }

  private currentEndedHandler: (() => void) | null = null;
  private currentEndedDeck: HTMLAudioElement | null = null;

  private bindEndedHandler(deck: Deck) {
    if (this.currentEndedDeck && this.currentEndedHandler) {
      this.currentEndedDeck.removeEventListener('ended', this.currentEndedHandler);
    }
    const handler = () => {
      if (this.crossfadeSeconds === 0 && !this.scratching) {
        this.endedListeners.forEach((l) => l(undefined));
      }
    };
    deck.el.addEventListener('ended', handler);
    this.currentEndedDeck = deck.el;
    this.currentEndedHandler = handler;
  }

  markCrossfadeTriggered(trackId: string) {
    this.crossfadeTriggeredForTrack.add(trackId);
  }
  hasCrossfadeTriggered(trackId: string): boolean {
    return this.crossfadeTriggeredForTrack.has(trackId);
  }

  pause() {
    this.decks?.[this.activeDeck].el.pause();
  }

  async play() {
    await this.resume();
    try {
      await this.decks?.[this.activeDeck].el.play();
    } catch {
      // ignored: requires a user gesture on some browsers
    }
  }

  seek(seconds: number) {
    const deck = this.decks?.[this.activeDeck];
    if (deck) deck.el.currentTime = seconds;
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.decks?.forEach((d) => {
      d.el.pause();
      d.el.src = '';
    });
  }
}

export const audioEngine = new AudioEngine();
