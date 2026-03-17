// Progress & Streak tracking — persisted in localStorage

const Progress = {
  STORAGE_KEY: 'hipChallenge',

  _state: null,

  _defaultState() {
    return {
      poses: {},           // poseId -> { done: true, completedAt: ISO string }
      daysCompleted: {},   // dayNumber -> ISO date string
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null  // "YYYY-MM-DD"
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this._state = raw ? JSON.parse(raw) : this._defaultState();
    } catch {
      this._state = this._defaultState();
    }
    // Recalculate streak on load in case days have passed
    this._recalcStreak();
    return this._state;
  },

  _save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
  },

  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  },

  _yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },

  markPoseDone(poseId) {
    this._state.poses[poseId] = {
      done: true,
      completedAt: new Date().toISOString()
    };
    this._save();
  },

  isPoseDone(poseId) {
    return !!(this._state.poses[poseId] && this._state.poses[poseId].done);
  },

  isDayComplete(dayNumber) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    if (!dayData) return false;
    return dayData.poses.every(p => this.isPoseDone(p.id));
  },

  completedPosesForDay(dayNumber) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    if (!dayData) return 0;
    return dayData.poses.filter(p => this.isPoseDone(p.id)).length;
  },

  markDayComplete(dayNumber) {
    const today = this._todayStr();
    this._state.daysCompleted[dayNumber] = today;

    // Update streak
    const last = this._state.lastCompletedDate;
    if (!last || last < this._yesterdayStr()) {
      // No previous or gap > 1 day: reset streak
      this._state.currentStreak = 1;
    } else if (last === this._yesterdayStr()) {
      // Completed yesterday: extend streak
      this._state.currentStreak += 1;
    } else if (last === today) {
      // Already completed something today: keep streak, just increment if first day today
      if (this._state.currentStreak === 0) this._state.currentStreak = 1;
    }

    this._state.lastCompletedDate = today;
    if (this._state.currentStreak > this._state.longestStreak) {
      this._state.longestStreak = this._state.currentStreak;
    }

    this._save();
  },

  _recalcStreak() {
    if (!this._state.lastCompletedDate) return;
    const today = this._todayStr();
    const yesterday = this._yesterdayStr();
    const last = this._state.lastCompletedDate;

    // If last completed date is older than yesterday, streak is broken
    if (last < yesterday) {
      this._state.currentStreak = 0;
      this._save();
    }
  },

  getStreak() {
    return {
      current: this._state.currentStreak,
      longest: this._state.longestStreak
    };
  },

  // Returns the next day the user should do (first incomplete day)
  getCurrentDay() {
    for (let i = 1; i <= 21; i++) {
      if (!this.isDayComplete(i)) return i;
    }
    return 21; // All done
  },

  isCurrentDay(dayNumber) {
    return dayNumber === this.getCurrentDay();
  },

  resetAll() {
    this._state = this._defaultState();
    this._save();
  },

  resetDay(dayNumber) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    if (!dayData) return;
    dayData.poses.forEach(p => { delete this._state.poses[p.id]; });
    delete this._state.daysCompleted[dayNumber];
    this._save();
  }
};
