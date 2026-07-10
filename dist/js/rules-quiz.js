// IBJJF Rules quiz — in-memory lesson session (progress persists via RulesProgress)

const RulesQuiz = {
  session: null,

  start(lessonId) {
    const lesson = RULES_LESSONS[lessonId];
    if (!lesson) return false;

    // Fisher-Yates shuffle of question indices
    const order = lesson.questions.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    this.session = {
      lessonId,
      order,
      index: 0,
      correct: 0,
      answered: null,   // null | { choice, isCorrect }
      finished: false
    };
    return true;
  },

  lesson() {
    return this.session ? RULES_LESSONS[this.session.lessonId] : null;
  },

  current() {
    if (!this.session) return null;
    const lesson = this.lesson();
    return lesson.questions[this.session.order[this.session.index]];
  },

  total() {
    return this.session ? this.session.order.length : 0;
  },

  answer(choiceIdx) {
    // Idempotent: ignore taps after the question is locked in
    if (!this.session || this.session.answered) return null;
    const q = this.current();
    const isCorrect = choiceIdx === q.answer;
    this.session.answered = { choice: choiceIdx, isCorrect };
    if (isCorrect) this.session.correct += 1;
    return { isCorrect, answerIdx: q.answer, feedback: q.feedback };
  },

  // Advance to the next question; returns false when the lesson is over
  next() {
    if (!this.session) return false;
    this.session.answered = null;
    this.session.index += 1;
    return this.session.index < this.session.order.length;
  },

  finish() {
    if (!this.session || this.session.finished) return null;
    this.session.finished = true;
    const { lessonId, correct } = this.session;
    const result = RulesProgress.recordLessonResult(lessonId, correct, this.total());
    return { correct, total: this.total(), isBest: result.isBest, best: result.best };
  },

  clear() {
    this.session = null;
  }
};
