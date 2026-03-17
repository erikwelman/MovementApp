// App controller — navigation, events, timer management

const App = {
  currentTimer: null,
  currentDay: 1,
  currentPoseIndex: 0,
  bjjCountdownTimer: null,
  bjjDuration: 120,

  init() {
    Progress.load();
    this.currentDay = Progress.getCurrentDay();
    this.render('home');
    this.bindGlobalEvents();
  },

  render(screen, params) {
    const app = document.getElementById('app');

    // Clean up timer if leaving timer screen
    if (this.currentTimer) {
      this.currentTimer.destroy();
      this.currentTimer = null;
    }
    if (this.bjjCountdownTimer) {
      clearInterval(this.bjjCountdownTimer);
      this.bjjCountdownTimer = null;
    }

    switch (screen) {
      case 'home':
        app.innerHTML = UI.renderMainHome();
        break;
      case 'hip-home':
        app.innerHTML = UI.renderHome();
        break;
      case 'day':
        this.currentDay = params.day;
        app.innerHTML = UI.renderDay(params.day);
        break;
      case 'timer':
        this.currentDay = params.day;
        this.currentPoseIndex = params.pose;
        app.innerHTML = UI.renderTimer(params.day, params.pose);
        this.initTimer(params.day, params.pose);
        break;
      case 'bjj-start':
        app.innerHTML = UI.renderBjjStart();
        this.initBjjScrollWheel();
        break;
      case 'bjj-countdown':
        app.innerHTML = UI.renderBjjCountdown();
        this.initBjjCountdown();
        break;
      case 'bjj-circuit':
        const idx = params ? params.exercise : 0;
        app.innerHTML = UI.renderBjjCircuit(idx);
        this.initBjjTimer(idx);
        break;
      case 'bjj-complete':
        app.innerHTML = UI.renderBjjComplete();
        break;
    }
  },

  bindGlobalEvents() {
    // Event delegation on #app
    document.getElementById('app').addEventListener('click', (e) => {
      const target = e.target.closest('[data-nav]');
      if (target) {
        const nav = target.dataset.nav;
        if (nav === 'home') {
          this.render('home');
        } else if (nav === 'hip-home') {
          this.render('hip-home');
        } else if (nav === 'day') {
          this.render('day', { day: parseInt(target.dataset.day) });
        } else if (nav === 'timer') {
          this.render('timer', {
            day: parseInt(target.dataset.day),
            pose: parseInt(target.dataset.pose)
          });
        } else if (nav === 'bjj-start') {
          this.render('bjj-start');
        } else if (nav === 'bjj-countdown') {
          this.render('bjj-countdown');
        } else if (nav === 'bjj-circuit') {
          this.render('bjj-circuit', { exercise: parseInt(target.dataset.exercise || 0) });
        } else if (nav === 'bjj-complete') {
          this.render('bjj-complete');
        }
        return;
      }

      // Image lightbox
      if (e.target.closest('[data-action="zoom-image"]')) {
        const lb = document.getElementById('image-lightbox');
        if (lb) {
          lb.classList.add('active');
          lb.focus();
        }
        return;
      }
      if (e.target.closest('[data-action="close-lightbox"]')) {
        this._closeLightbox();
        return;
      }

      // Timer controls (Hip Challenge)
      if (e.target.id === 'btn-timer-toggle') {
        if (this.currentTimer) {
          this.currentTimer.toggle();
          const btn = document.getElementById('btn-timer-toggle');
          if (btn) {
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            btn.textContent = label;
            btn.setAttribute('aria-label', label + ' timer');
          }
        }
        return;
      }
      if (e.target.id === 'btn-timer-skip') {
        if (this.currentTimer) this.currentTimer.skip();
        return;
      }

      // BJJ Timer controls
      if (e.target.id === 'btn-bjj-toggle') {
        if (this.currentTimer) {
          this.currentTimer.toggle();
          const btn = document.getElementById('btn-bjj-toggle');
          if (btn) {
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            btn.textContent = label;
            btn.setAttribute('aria-label', label + ' timer');
          }
        }
        return;
      }
      if (e.target.id === 'btn-bjj-skip') {
        if (this.currentTimer) {
          const skipIdx = parseInt(document.getElementById('btn-bjj-skip').dataset.exercise);
          this.currentTimer.destroy();
          this.currentTimer = null;
          this.onBjjExerciseComplete(skipIdx);
        }
        return;
      }

      // BJJ restart
      if (e.target.closest('[data-action="bjj-restart"]')) {
        this.render('bjj-countdown');
        return;
      }

      // Pose complete — continue button
      if (e.target.closest('[data-action="pose-continue"]')) {
        const btn = e.target.closest('[data-action="pose-continue"]');
        const day = parseInt(btn.dataset.day);
        const pose = parseInt(btn.dataset.pose);
        this.render('timer', { day, pose });
        return;
      }

      // Reset all
      if (e.target.closest('[data-action="reset-all"]')) {
        if (confirm('Reset all progress? This cannot be undone.')) {
          Progress.resetAll();
          this.render('hip-home');
        }
      }
    });

    // Global keyboard handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close lightbox if open
        const lb = document.getElementById('image-lightbox');
        if (lb && lb.classList.contains('active')) {
          this._closeLightbox();
          return;
        }

        // Close congrats overlay if open
        const congrats = document.getElementById('congrats-overlay');
        if (congrats && congrats.classList.contains('active')) {
          this.render('hip-home');
          return;
        }

        // Close pose-complete overlay if open
        const poseOverlay = document.querySelector('.pose-complete-overlay');
        if (poseOverlay) {
          poseOverlay.remove();
          return;
        }
      }

      // Spacebar to toggle timer when on timer screen or BJJ circuit
      if (e.key === ' ') {
        const timerBtn = document.getElementById('btn-timer-toggle') || document.getElementById('btn-bjj-toggle');
        if (timerBtn && (e.target === document.body || e.target === document.getElementById('app'))) {
          e.preventDefault();
          if (this.currentTimer) {
            this.currentTimer.toggle();
            const label = this.currentTimer.isRunning ? 'Pause' : 'Resume';
            timerBtn.textContent = label;
            timerBtn.setAttribute('aria-label', label + ' timer');
          }
        }
      }
    });
  },

  _closeLightbox() {
    const lb = document.getElementById('image-lightbox');
    if (lb) {
      lb.classList.remove('active');
      const trigger = document.querySelector('[data-action="zoom-image"]');
      if (trigger) trigger.focus();
    }
  },

  // ── Hip Challenge Timer ──────────────────────────────────────

  initTimer(dayNumber, poseIndex) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    const pose = dayData.poses[poseIndex];

    this.currentTimer = new PoseTimer(
      pose.duration,
      (remaining) => {
        UI.updateTimer(remaining, this.currentTimer.progress, this.currentTimer.isRunning);
      },
      () => {
        this.onPoseComplete(dayNumber, poseIndex);
      }
    );
  },

  onPoseComplete(dayNumber, poseIndex) {
    const dayData = CHALLENGE_DATA.find(d => d.day === dayNumber);
    const pose = dayData.poses[poseIndex];

    if (navigator.vibrate) navigator.vibrate(200);
    Progress.markPoseDone(pose.id);

    if (Progress.isDayComplete(dayNumber)) {
      Progress.markDayComplete(dayNumber);
      this.showCongrats(dayNumber);
    } else {
      const nextIndex = dayData.poses.findIndex((p, i) => i > poseIndex && !Progress.isPoseDone(p.id));
      if (nextIndex !== -1) {
        this.showPoseComplete(pose.name, dayNumber, nextIndex);
      } else {
        this.render('day', { day: dayNumber });
      }
    }
  },

  showPoseComplete(poseName, dayNumber, nextPoseIndex) {
    const app = document.getElementById('app');
    const overlay = document.createElement('div');
    overlay.className = 'pose-complete-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', `${poseName} complete`);
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="pose-complete-content">
        <div class="pose-complete-check" aria-hidden="true">&#x2713;</div>
        <p>${UI.esc(poseName)}</p>
        <p class="pose-complete-next">Up next...</p>
        <button class="btn-pose-continue" data-action="pose-continue" data-day="${dayNumber}" data-pose="${nextPoseIndex}">Continue</button>
      </div>`;
    app.appendChild(overlay);

    requestAnimationFrame(() => {
      const btn = overlay.querySelector('.btn-pose-continue');
      if (btn) btn.focus();
    });
  },

  showCongrats(dayNumber) {
    const app = document.getElementById('app');
    app.insertAdjacentHTML('beforeend', UI.renderCongrats(dayNumber));

    requestAnimationFrame(() => {
      const overlay = document.getElementById('congrats-overlay');
      if (overlay) {
        overlay.classList.add('active');
        const firstBtn = overlay.querySelector('.btn-congrats-next');
        if (firstBtn) firstBtn.focus();
      }
    });
  },

  // ── BJJ Circuit ──────────────────────────────────────────────

  initBjjScrollWheel() {
    const wheel = document.getElementById('bjj-scroll-wheel');
    if (!wheel) return;

    const items = wheel.querySelectorAll('.scroll-wheel-item');
    const ITEM_HEIGHT = 48;
    const values = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

    // Find initial index from current bjjDuration
    let currentIndex = values.indexOf(this.bjjDuration);
    if (currentIndex === -1) currentIndex = 3; // default 2min

    // Scroll to selected position
    wheel.scrollTop = currentIndex * ITEM_HEIGHT;
    items[currentIndex].classList.add('selected');

    const updateSelection = () => {
      const scrollPos = wheel.scrollTop;
      const idx = Math.round(scrollPos / ITEM_HEIGHT);
      const clampedIdx = Math.max(0, Math.min(idx, values.length - 1));

      items.forEach(item => item.classList.remove('selected'));
      items[clampedIdx].classList.add('selected');

      this.bjjDuration = values[clampedIdx];

      const info = document.getElementById('bjj-total-info');
      if (info) {
        const totalMin = Math.round((this.bjjDuration * 11) / 60);
        info.textContent = `11 exercises \u00b7 ${UI._formatDurationLabel(this.bjjDuration)} each \u00b7 ${totalMin} min total`;
      }
    };

    let scrollTimeout;
    wheel.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Snap to nearest item
        const idx = Math.round(wheel.scrollTop / ITEM_HEIGHT);
        const clampedIdx = Math.max(0, Math.min(idx, values.length - 1));
        wheel.scrollTo({ top: clampedIdx * ITEM_HEIGHT, behavior: 'smooth' });
        updateSelection();
      }, 80);
    });
  },

  initBjjCountdown() {
    let count = 3;
    const display = document.getElementById('bjj-countdown-number');
    if (display) display.textContent = count;

    this.bjjCountdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        if (display) {
          display.textContent = count;
          display.classList.remove('bjj-countdown-pulse');
          void display.offsetWidth;
          display.classList.add('bjj-countdown-pulse');
        }
      } else if (count === 0) {
        if (display) {
          display.textContent = 'GO!';
          display.classList.remove('bjj-countdown-pulse');
          void display.offsetWidth;
          display.classList.add('bjj-countdown-pulse');
        }
      } else {
        clearInterval(this.bjjCountdownTimer);
        this.bjjCountdownTimer = null;
        this.render('bjj-circuit', { exercise: 0 });
      }
    }, 1000);
  },

  initBjjTimer(exerciseIndex) {
    this.currentTimer = new PoseTimer(
      this.bjjDuration,
      (remaining) => {
        UI.updateBjjTimer(remaining, this.currentTimer.progress, this.currentTimer.isRunning);
      },
      () => {
        this.onBjjExerciseComplete(exerciseIndex);
      }
    );

    // Auto-start
    this.currentTimer.start();
  },

  onBjjExerciseComplete(index) {
    if (navigator.vibrate) navigator.vibrate(200);

    if (index < BJJ_EXERCISES.length - 1) {
      this.render('bjj-circuit', { exercise: index + 1 });
    } else {
      this.render('bjj-complete');
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
