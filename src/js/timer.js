// Countdown timer — wall-clock based to survive tab backgrounding

class PoseTimer {
  constructor(durationSeconds, onTick, onComplete) {
    this.totalDuration = durationSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this._elapsed = 0;        // seconds elapsed before current run
    this._startTime = null;   // Date.now() when current run started
    this._interval = null;
    this._running = false;
    this._completed = false;
  }

  start() {
    if (this._completed || this._running) return;
    this._startTime = Date.now();
    this._running = true;
    this._tick();
    this._interval = setInterval(() => this._tick(), 250); // 4Hz for smoother updates
  }

  pause() {
    if (!this._running) return;
    this._elapsed += (Date.now() - this._startTime) / 1000;
    this._startTime = null;
    this._running = false;
    clearInterval(this._interval);
    this._interval = null;
  }

  resume() {
    if (this._running || this._completed) return;
    this.start();
  }

  toggle() {
    if (this._running) this.pause();
    else this.resume();
  }

  reset() {
    this.pause();
    this._elapsed = 0;
    this._completed = false;
    if (this.onTick) this.onTick(this.totalDuration);
  }

  skip() {
    this.pause();
    this._completed = true;
    if (this.onComplete) this.onComplete();
  }

  get remaining() {
    let elapsed = this._elapsed;
    if (this._running && this._startTime) {
      elapsed += (Date.now() - this._startTime) / 1000;
    }
    return Math.max(0, this.totalDuration - elapsed);
  }

  get progress() {
    return 1 - (this.remaining / this.totalDuration);
  }

  get isRunning() {
    return this._running;
  }

  get isCompleted() {
    return this._completed;
  }

  _tick() {
    const rem = this.remaining;
    if (this.onTick) this.onTick(rem);
    if (rem <= 0) {
      this.pause();
      this._completed = true;
      if (this.onComplete) this.onComplete();
    }
  }

  destroy() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }
}
