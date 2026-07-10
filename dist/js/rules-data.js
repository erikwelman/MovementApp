// IBJJF Rules section — static content: units, rule cards, quiz lessons, legality matrix

// ── Units ──────────────────────────────────────────────────────

const RULES_UNITS = [
  {
    id: 'scoreboard',
    title: 'Scoreboard Basics',
    icon: '&#x1F4CA;',
    sub: 'What scores and how many points',
    cards: 'scoreboard',
    lessons: []
  },
  {
    id: 'scenarios',
    title: 'Scoring Scenarios',
    icon: '&#x1F3AF;',
    sub: 'Practise recognising points',
    cards: null,
    lessons: ['scenarios-1', 'scenarios-2', 'scenarios-3']
  },
  {
    id: 'penalties',
    title: 'Penalties & DQ',
    icon: '&#x1F6A8;',
    sub: 'Stalling, fouls and disqualification',
    cards: 'penalties',
    lessons: ['penalties-1']
  },
  {
    id: 'legal',
    title: 'Legal Moves by Belt',
    icon: '&#x2696;&#xFE0F;',
    sub: '"Can I do this?" checker',
    cards: null,
    checker: true,
    lessons: ['legal-1', 'legal-2']
  }
];

// ── Rule cards ─────────────────────────────────────────────────

const RULES_CARDS = {
  scoreboard: [
    {
      id: 'sb-control',
      title: '3-Second Control',
      points: null,
      rule: 'You do not score until you control. Most point-scoring positions must be held for 3 seconds.',
      explain: 'Getting to the position is not enough. The referee must see control. If the opponent escapes before the 3-second count finishes, you usually do not get the full points.',
      miniQuiz: 'Player A passes to side control but Player B recovers guard after 2 seconds. What happens?',
      miniAnswer: 'No full guard-pass points. Possible advantage, depending on how close the pass was.'
    },
    {
      id: 'sb-takedown',
      title: 'Takedown',
      points: 2,
      rule: 'A takedown scores when a standing athlete brings the opponent down and establishes top control for 3 seconds.',
      explain: 'Common scores: double leg, single leg, foot sweep, hip throw.',
      trap: 'Common non-score: you throw them, but they immediately scramble back up.',
      image: 'rules_takedown'
    },
    {
      id: 'sb-sweep',
      title: 'Sweep',
      points: 2,
      rule: 'A sweep happens when the bottom player, from guard or half guard, reverses the position and comes on top for 3 seconds.',
      trap: 'Not every reversal is a sweep. A reversal from mount, side control or turtle is usually not a sweep unless it started from guard or half guard.',
      image: 'rules_sweep'
    },
    {
      id: 'sb-guard-pass',
      title: 'Guard Pass',
      points: 3,
      rule: 'Top player clears the opponent\'s guard or half guard and controls side control or north-south for 3 seconds.',
      trap: 'Half guard is still guard. If the bottom player catches half guard before the pass is stabilised, the pass is not complete.',
      miniQuiz: 'Player A is in top side control. Player B gets their knee in and recovers half guard. What is the score?',
      miniAnswer: 'Player B scores 0 points — recovering guard is not a sweep. But if Player A had already held side control for 3 seconds before the recovery, Player A already scored 3 points for the guard pass.',
      image: 'rules_guard_pass'
    },
    {
      id: 'sb-kob',
      title: 'Knee on Belly',
      points: 2,
      rule: 'Top player is free of guard, places knee or shin on the opponent\'s belly/chest/ribs, keeps the opposite knee off the mat, and stabilises for 3 seconds.',
      trap: 'If the knee is on but the other foot is not properly posted, this may be only an advantage, not 2 points.',
      image: 'rules_knee_on_belly'
    },
    {
      id: 'sb-mount',
      title: 'Mount',
      points: 4,
      rule: 'Top player is clear of guard or half guard, sitting on the opponent\'s torso, facing the head, with two knees or one foot and one knee on the ground, for 3 seconds.',
      trap: 'Mount while still trapped in half guard is not mount points.',
      image: 'rules_mount'
    },
    {
      id: 'sb-back',
      title: 'Back Control',
      points: 4,
      rule: 'Player controls the back with both heels inside the opponent\'s thighs, legs not crossed, and holds for 3 seconds.',
      trap: 'A body triangle / figure-four around the waist is not 4 points under IBJJF. It is generally an advantage, not full back-control points.',
      image: 'rules_back_control'
    },
    {
      id: 'sb-cumulative',
      title: 'Cumulative Points',
      points: null,
      rule: 'If one scoring action flows directly into another, the points can add up.',
      explain: 'IBJJF allows cumulative points where the athlete progresses through scoring positions in a continuous sequence and stabilises the final position.',
      table: {
        head: ['Sequence', 'Score'],
        rows: [
          ['Guard pass → mount', '7 points'],
          ['Sweep → mount', '6 points'],
          ['Guard pass → back control', '7 points'],
          ['Takedown → guard pass', '5 points']
        ]
      }
    }
  ],

  penalties: [
    {
      id: 'pn-stalling',
      title: 'Stalling / Lack of Combativeness',
      badge: 'Penalty',
      rule: 'If an athlete avoids action, holds without progressing, backs away, or refuses to engage, the referee can give a penalty.',
      explain: 'Referee command: "LUTE" for lack of combativeness.'
    },
    {
      id: 'pn-serious',
      title: 'Serious Foul',
      badge: 'Penalty + restart',
      rule: 'Serious fouls usually result in a penalty and restart or correction of position.',
      table: {
        head: ['Foul', 'Category'],
        rows: [
          ['Gripping inside the sleeve or pants', 'Serious foul'],
          ['Fleeing the mat to avoid a score or submission', 'Serious foul'],
          ['Illegal grip', 'Serious foul'],
          ['Lower-belt knee reap', 'Serious or severe depending on position'],
          ['White belt jumping closed guard', 'Serious foul / restart']
        ]
      }
    },
    {
      id: 'pn-severe',
      title: 'Severe Foul',
      badge: 'Disqualification',
      rule: 'Severe fouls are dangerous actions that can cause immediate disqualification.',
      explain: 'The IBJJF illegal-moves chart lists these as prohibited across adult belt categories.',
      table: {
        head: ['Severe foul', 'Result'],
        rows: [
          ['Slam', 'Disqualification'],
          ['Scissor takedown', 'Disqualification'],
          ['Spinal lock without choke', 'Disqualification'],
          ['Bending fingers backwards', 'Disqualification'],
          ['Dangerous suplex onto head or neck', 'Disqualification']
        ]
      },
      image: 'rules_illegal_slam'
    }
  ]
};

// ── Quiz lessons ───────────────────────────────────────────────
// Each question: prompt, choices (4), answer (index into choices), feedback.

const RULES_LESSONS = {

  'scenarios-1': {
    unitId: 'scenarios',
    title: 'Takedowns, Sweeps & Passes',
    questions: [
      {
        id: 'sc-1',
        prompt: 'Player A passes guard to side control and holds for 3 seconds.',
        choices: ['Player A gets 3 points', 'Player A gets 2 points', 'Advantage only', 'No points'],
        answer: 0,
        feedback: 'Guard pass — 3 points for clearing the guard and controlling side control for 3 seconds.'
      },
      {
        id: 'sc-2',
        prompt: 'Player A almost passes, but Player B recovers guard after 2 seconds.',
        choices: ['Player A gets 3 points', 'Player A gets 2 points', 'No points, possible advantage', 'Player B gets 2 points'],
        answer: 2,
        feedback: 'No 3-second control, so no full points. A close pass may earn an advantage.'
      },
      {
        id: 'sc-3',
        prompt: 'Player A is in side control. Player B recovers half guard.',
        choices: ['Player B gets 2 points for a sweep', 'Player B gets an advantage', 'No points for anyone', 'Player A gets 3 points'],
        answer: 2,
        feedback: 'Guard recovery is not a sweep — Player B scores 0.'
      },
      {
        id: 'sc-4',
        prompt: 'Player A passes to side control, holds 3 seconds, then Player B recovers half guard.',
        choices: ['Player A keeps 3 points — the pass was already scored', 'The 3 points are removed', 'Advantage only for Player A', 'Player B gets 2 points'],
        answer: 0,
        feedback: 'The pass was already scored after 3 seconds of control. Recovering guard afterwards does not undo it.'
      },
      {
        id: 'sc-5',
        prompt: 'Player B is on bottom half guard, reverses Player A, and holds top for 3 seconds.',
        choices: ['Player B gets 2 points', 'Player B gets 3 points', 'Advantage only', 'No points'],
        answer: 0,
        feedback: 'Sweep from half guard — 2 points. Half guard counts as guard for sweeps.'
      },
      {
        id: 'sc-6',
        prompt: 'Player B is mounted, bridges Player A over and lands inside Player A\'s closed guard.',
        choices: ['Player B gets 2 points for a sweep', 'Player B gets 4 points', 'No points — a reversal from mount is not a sweep', 'Player B gets an advantage'],
        answer: 2,
        feedback: 'Sweeps must start from guard or half guard. A reversal from mount is not a sweep.'
      },
      {
        id: 'sc-7',
        prompt: 'Player A double-legs Player B and lands in closed guard, holding top for 3 seconds.',
        choices: ['Player A gets 2 points', 'No points — landed inside guard', 'Player A gets 3 points', 'Advantage only'],
        answer: 0,
        feedback: 'Takedown — 2 points. Landing in guard can still score if top control is held for 3 seconds.'
      },
      {
        id: 'sc-8',
        prompt: 'Player A takes Player B down, but Player B immediately sweeps and stabilises on top.',
        choices: ['Player A gets 2 and Player B gets 2', 'Player A gets an advantage, Player B gets 2 points', 'Only Player A scores 2', 'No score for anyone'],
        answer: 1,
        feedback: 'The takedown was not stabilised (advantage only); the sweep was stabilised, so Player B scores 2.'
      },
      {
        id: 'sc-9',
        prompt: 'Player A pulls guard. Player B remains standing and does nothing else.',
        choices: ['Player A gets 2 points', 'Player B gets 2 points', 'Player B gets an advantage', 'No points'],
        answer: 3,
        feedback: 'Pulling guard by itself gives no points.'
      }
    ]
  },

  'scenarios-2': {
    unitId: 'scenarios',
    title: 'Mount, Knee on Belly & Combos',
    questions: [
      {
        id: 'sc-10',
        prompt: 'Both players pull guard. Player A comes on top first.',
        choices: ['Player A gets 2 points for a sweep', 'Player A gets an advantage', 'No score for anyone', 'Player B gets a penalty'],
        answer: 1,
        feedback: 'Double guard pull: the first athlete to come on top gets an advantage.'
      },
      {
        id: 'sc-11',
        prompt: 'Player A passes guard directly to mount and stabilises.',
        choices: ['Player A gets 4 points', 'Player A gets 3 points', 'Player A gets 7 points', 'Advantage only'],
        answer: 2,
        feedback: 'Cumulative scoring: guard pass (3) + mount (4) = 7 points.'
      },
      {
        id: 'sc-12',
        prompt: 'Player B sweeps from closed guard directly to mount and stabilises.',
        choices: ['Player B gets 2 points', 'Player B gets 4 points', 'Player B gets 6 points', 'Player B gets 7 points'],
        answer: 2,
        feedback: 'Cumulative scoring: sweep (2) + mount (4) = 6 points.'
      },
      {
        id: 'sc-13',
        prompt: 'Player A gets knee on belly and holds for 3 seconds with the free foot posted.',
        choices: ['Player A gets 2 points', 'Player A gets 3 points', 'Advantage only', 'No points'],
        answer: 0,
        feedback: 'Knee on belly — 2 points when held for 3 seconds with the correct structure.'
      },
      {
        id: 'sc-14',
        prompt: 'Player A puts knee on belly but the other foot is not on the mat.',
        choices: ['Player A gets 2 points anyway', 'Advantage, not 2 points', 'No score at all', 'Penalty for Player A'],
        answer: 1,
        feedback: 'Incorrect knee-on-belly structure — the free foot must be posted. Usually only an advantage.'
      },
      {
        id: 'sc-15',
        prompt: 'Player A mounts, but both of Player B\'s arms are trapped under Player A\'s legs.',
        choices: ['Player A gets 4 points', 'Advantage, not 4 points', 'No score at all', 'Player A gets 3 points'],
        answer: 1,
        feedback: 'With both arms trapped, the mount control is not valid for full points — advantage only.'
      },
      {
        id: 'sc-16',
        prompt: 'Player A mounts with one of Player B\'s arms trapped, but the trapping leg does not pass the shoulder line.',
        choices: ['Player A gets 4 points — valid mount', 'Advantage only', 'No points', 'Player A gets 2 points'],
        answer: 0,
        feedback: 'One arm trapped below the shoulder line is still a valid mount — 4 points.'
      },
      {
        id: 'sc-17',
        prompt: 'Player A takes the back with both hooks, heels inside, no crossed feet, and holds 3 seconds.',
        choices: ['Player A gets 4 points', 'Player A gets 3 points', 'Advantage only', 'Player A gets 2 points'],
        answer: 0,
        feedback: 'Textbook back control — 4 points.'
      }
    ]
  },

  'scenarios-3': {
    unitId: 'scenarios',
    title: 'Back Control & Tricky Calls',
    questions: [
      {
        id: 'sc-18',
        prompt: 'Player A takes the back with a body triangle.',
        choices: ['Player A gets 4 points', 'Advantage, not 4 points', 'No score at all', 'Player A gets 2 points'],
        answer: 1,
        feedback: 'A body triangle is not full IBJJF back-control scoring — generally an advantage.'
      },
      {
        id: 'sc-19',
        prompt: 'Player A takes the back but crosses their feet.',
        choices: ['Player A gets 4 points', 'Player A gets 2 points', 'Advantage, not 4 points', 'Penalty for Player A'],
        answer: 2,
        feedback: 'Crossed feet do not score full back control — advantage at most.'
      },
      {
        id: 'sc-20',
        prompt: 'Player A has one hook only and holds the back.',
        choices: ['Player A gets 4 points', 'Player A gets 2 points', 'Advantage at most', 'Automatic penalty'],
        answer: 2,
        feedback: 'One hook is not full back control — advantage or nothing.'
      },
      {
        id: 'sc-21',
        prompt: 'Player A is passing, Player B turtles, and Player A controls the turtle but has no hooks.',
        choices: ['Player A gets 4 points for the back', 'Player A gets 3 points for the pass', 'Advantage', 'No score ever possible from turtle'],
        answer: 2,
        feedback: 'Near guard pass / control of the turtle without hooks is an advantage, not full points.'
      },
      {
        id: 'sc-22',
        prompt: 'Player A escapes a submission by running outside the mat area.',
        choices: ['No consequence', 'Player A gets a penalty only', 'The opponent may be awarded 2 points', 'The match restarts with no score'],
        answer: 2,
        feedback: 'A defensive escape from a submission out of bounds can award 2 points to the attacker.'
      },
      {
        id: 'sc-23',
        prompt: 'Player A reaches mount while caught in a tight triangle and does not escape before time ends.',
        choices: ['Player A gets 4 points', 'Player A gets 4, Player B gets an advantage', 'No full mount points', 'Advantage for Player A'],
        answer: 2,
        feedback: 'Points are only awarded after escaping the submission and stabilising the position.'
      },
      {
        id: 'sc-24',
        prompt: 'Player A sweeps but immediately drops back for a leg lock and gives up top position.',
        choices: ['Player A gets 2 points for the sweep', 'Advantage for Player A', 'No sweep points', 'Player A gets 2 points and an advantage'],
        answer: 2,
        feedback: 'No top control means no sweep points.'
      },
      {
        id: 'sc-25',
        prompt: 'Player A is in 50/50, comes up on top, then both return to 50/50.',
        choices: ['Player A gets 2 points', 'Player A gets an advantage', 'No advantage', 'Penalty for stalling'],
        answer: 2,
        feedback: 'IBJJF does not award advantages for sweeps that start and end in 50/50.'
      }
    ]
  },

  'penalties-1': {
    unitId: 'penalties',
    title: 'Penalty or DQ?',
    questions: [
      {
        id: 'pn-1',
        prompt: 'Player A stays in closed guard holding sleeves for a long time without attacking.',
        choices: ['Nothing — closed guard is a safe position', 'Penalty risk — lack of combativeness', 'Player B gets 2 points', 'Immediate disqualification'],
        answer: 1,
        feedback: 'Holding without progressing is lack of combativeness — the referee can call "LUTE" and penalise.'
      },
      {
        id: 'pn-2',
        prompt: 'Player A is ahead by 2 points and keeps backing away from engagement.',
        choices: ['Smart strategy — no consequence', 'Player B gets 2 points', 'Penalty risk — stalling / avoiding combat', 'Immediate disqualification'],
        answer: 2,
        feedback: 'Backing away to protect a lead is stalling / avoiding combat — penalty risk.'
      },
      {
        id: 'pn-3',
        prompt: 'Player A grips inside Player B\'s sleeve with fingers inside the cuff.',
        choices: ['Legal grip', 'Penalty — illegal grip', 'Advantage for Player B', 'Disqualification'],
        answer: 1,
        feedback: 'Gripping inside the sleeve or pants is an illegal grip — serious foul, penalty.'
      },
      {
        id: 'pn-4',
        prompt: 'Player A runs outside the mat to avoid a sweep.',
        choices: ['Play continues, no consequence', 'Penalty, and possibly points for Player B', 'Only a restart in the centre', 'Player A gets an advantage'],
        answer: 1,
        feedback: 'Fleeing the combat area is a foul — penalty, with possible score consequences.'
      },
      {
        id: 'pn-5',
        prompt: 'Player A slams Player B to escape a triangle.',
        choices: ['Legal if the triangle is locked', 'Penalty and restart', 'Disqualification', 'Player B gets 2 points'],
        answer: 2,
        feedback: 'Slams are prohibited — severe foul, disqualification.'
      },
      {
        id: 'pn-6',
        prompt: 'White belt Player A jumps closed guard while Player B is standing.',
        choices: ['Legal at every belt', 'Serious foul / restart', 'Disqualification', 'Player A gets an advantage'],
        answer: 1,
        feedback: 'Jumping closed guard is forbidden for white belts — serious foul and restart.'
      },
      {
        id: 'pn-7',
        prompt: 'Player A performs a scissor takedown.',
        choices: ['2 points for the takedown', 'Penalty only', 'Disqualification', 'Advantage'],
        answer: 2,
        feedback: 'The scissor takedown (kani basami) is prohibited — disqualification.'
      },
      {
        id: 'pn-8',
        prompt: 'Player A bends Player B\'s fingers backwards to break a grip.',
        choices: ['Legal grip fighting', 'Penalty and restart', 'Disqualification', 'Advantage for Player B'],
        answer: 2,
        feedback: 'Bending fingers backwards is prohibited — disqualification.'
      },
      {
        id: 'pn-9',
        prompt: 'Player A receives four serious-foul/stalling penalties.',
        choices: ['Nothing more happens', 'Player B gets 2 points', 'Disqualification', 'The match restarts standing'],
        answer: 2,
        feedback: 'Four penalties can end the match — disqualification.'
      },
      {
        id: 'pn-10',
        prompt: 'Player A applies a heel hook in a white belt match.',
        choices: ['Legal if applied slowly', 'Penalty and restart', 'Disqualification', 'Advantage'],
        answer: 2,
        feedback: 'Heel hooks are an illegal submission for that division — disqualification.'
      }
    ]
  },

  'legal-1': {
    unitId: 'legal',
    title: 'What Can Lower Belts Do?',
    questions: [
      {
        id: 'lg-1',
        prompt: 'An adult white belt applies a straight ankle lock.',
        choices: ['Legal', 'Illegal — blue belt and up', 'Illegal — brown/black only', 'Legal only in no-gi'],
        answer: 0,
        feedback: 'The straight ankle lock is allowed at white belt if applied correctly.'
      },
      {
        id: 'lg-2',
        prompt: 'An adult white belt applies a wrist lock.',
        choices: ['Legal', 'Illegal — wrist locks start at blue belt', 'Legal only in gi', 'Legal only in no-gi'],
        answer: 1,
        feedback: 'Wrist locks start at blue belt.'
      },
      {
        id: 'lg-3',
        prompt: 'An adult blue belt applies a wrist lock.',
        choices: ['Illegal', 'Legal', 'Legal only in no-gi', 'Legal only at brown/black'],
        answer: 1,
        feedback: 'Wrist locks are allowed from blue belt.'
      },
      {
        id: 'lg-4',
        prompt: 'An adult blue belt applies a toe hold.',
        choices: ['Legal', 'Legal only in no-gi', 'Illegal — toe holds are brown/black level', 'Legal with control'],
        answer: 2,
        feedback: 'Toe holds unlock at brown/black.'
      },
      {
        id: 'lg-5',
        prompt: 'An adult purple belt applies a knee bar.',
        choices: ['Legal', 'Illegal — knee bars are brown/black level', 'Legal only in no-gi', 'Legal if the legs are not reaped'],
        answer: 1,
        feedback: 'Knee bars are brown/black level.'
      },
      {
        id: 'lg-6',
        prompt: 'An adult purple belt enters a knee reap position.',
        choices: ['Legal', 'Legal only in gi', 'Illegal — below adult brown/black no-gi', 'Legal with an advantage'],
        answer: 2,
        feedback: 'Knee reaping is prohibited below adult brown/black no-gi.'
      },
      {
        id: 'lg-7',
        prompt: 'A white belt jumps closed guard.',
        choices: ['Legal', 'Illegal — serious foul', 'Legal in no-gi only', 'Legal if the opponent agrees'],
        answer: 1,
        feedback: 'White belts cannot jump closed guard.'
      },
      {
        id: 'lg-8',
        prompt: 'Any belt slams to escape a triangle.',
        choices: ['Legal above purple belt', 'Legal if the triangle is fully locked', 'Illegal — disqualification', 'Legal in no-gi'],
        answer: 2,
        feedback: 'Slams are prohibited at every belt — disqualification.'
      }
    ]
  },

  'legal-2': {
    unitId: 'legal',
    title: 'Brown, Black & the No-Gi Exception',
    questions: [
      {
        id: 'lg-9',
        prompt: 'An adult brown belt in gi applies a toe hold.',
        choices: ['Legal — toe holds are allowed at brown/black', 'Illegal in gi', 'Illegal at brown, legal at black', 'Advantage only'],
        answer: 0,
        feedback: 'Toe holds are allowed at brown/black, gi and no-gi.'
      },
      {
        id: 'lg-10',
        prompt: 'An adult brown belt in gi applies a heel hook.',
        choices: ['Legal at brown/black', 'Illegal — heel hooks are not legal in gi', 'Legal with control', 'Legal only at black belt'],
        answer: 1,
        feedback: 'Heel hooks are never legal in gi — only adult brown/black no-gi.'
      },
      {
        id: 'lg-11',
        prompt: 'An adult black belt in no-gi applies a heel hook.',
        choices: ['Illegal everywhere under IBJJF', 'Legal — adult brown/black no-gi allows heel hooks', 'Legal only with a straight foot', 'Penalty first, then DQ'],
        answer: 1,
        feedback: 'Adult brown/black no-gi allows heel hooks.'
      },
      {
        id: 'lg-12',
        prompt: 'A Masters black belt in no-gi applies a heel hook.',
        choices: ['Legal — same as adult', 'Illegal — the adult no-gi exception does not apply to Masters', 'Legal with a penalty', 'Legal only in finals'],
        answer: 1,
        feedback: 'The adult no-gi exception does not apply to Masters divisions.'
      },
      {
        id: 'lg-13',
        prompt: 'An adult brown belt in no-gi enters a knee reap position.',
        choices: ['Illegal at every belt', 'Legal — adult brown/black no-gi allows it', 'Legal in gi too', 'Penalty, not DQ'],
        answer: 1,
        feedback: 'Knee reaping is legal only in the adult brown/black no-gi ruleset.'
      },
      {
        id: 'lg-14',
        prompt: 'An adult brown belt in gi applies a bicep slicer.',
        choices: ['Illegal in gi', 'Legal — bicep slicers unlock at brown/black', 'Legal only at black belt', 'Legal only in no-gi'],
        answer: 1,
        feedback: 'Bicep slicers unlock at brown/black.'
      },
      {
        id: 'lg-15',
        prompt: 'Any belt bends fingers backwards to break a grip.',
        choices: ['Legal grip fighting', 'Penalty only', 'Illegal — disqualification', 'Legal above blue belt'],
        answer: 2,
        feedback: 'Finger bending is prohibited at every belt — disqualification.'
      }
    ]
  }
};

// ── Legality matrix + checker ──────────────────────────────────

const RULES_BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];

// Belts from `belt` upwards are legal, lower belts illegal
function rulesLegalFrom(belt) {
  const idx = RULES_BELT_ORDER.indexOf(belt);
  const map = {};
  RULES_BELT_ORDER.forEach((b, i) => { map[b] = i >= idx ? 'legal' : 'illegal'; });
  return map;
}

function rulesAllIllegal() {
  const map = {};
  RULES_BELT_ORDER.forEach(b => { map[b] = 'illegal'; });
  return map;
}

const RULES_LEGALITY = {
  ageGroups: [
    { id: 'adult', label: 'Adult' },
    { id: 'master', label: 'Masters' }
  ],
  giModes: [
    { id: 'gi', label: 'Gi' },
    { id: 'nogi', label: 'No-Gi' }
  ],
  belts: [
    { id: 'white', label: 'White' },
    { id: 'blue', label: 'Blue' },
    { id: 'purple', label: 'Purple' },
    { id: 'brown', label: 'Brown' },
    { id: 'black', label: 'Black' }
  ],
  techniques: [
    { id: 'armbar', name: 'Armbar',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') } },
    { id: 'triangle', name: 'Triangle',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') } },
    { id: 'kimura', name: 'Kimura / Americana',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') } },
    { id: 'guillotine', name: 'Guillotine',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') } },
    { id: 'omoplata', name: 'Omoplata',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') } },
    { id: 'straight-ankle', name: 'Straight Ankle Lock',
      base: { gi: rulesLegalFrom('white'), nogi: rulesLegalFrom('white') },
      note: 'Allowed from white belt when applied correctly (no reaping the knee).' },
    { id: 'wrist-lock', name: 'Wrist Lock',
      base: { gi: rulesLegalFrom('blue'), nogi: rulesLegalFrom('blue') },
      note: 'Wrist locks start at blue belt.' },
    { id: 'bicep-slicer', name: 'Bicep Slicer',
      base: { gi: rulesLegalFrom('brown'), nogi: rulesLegalFrom('brown') },
      note: 'Unlocks at brown/black.' },
    { id: 'calf-slicer', name: 'Calf Slicer',
      base: { gi: rulesLegalFrom('brown'), nogi: rulesLegalFrom('brown') },
      note: 'Unlocks at brown/black.' },
    { id: 'knee-bar', name: 'Knee Bar',
      base: { gi: rulesLegalFrom('brown'), nogi: rulesLegalFrom('brown') },
      note: 'Unlocks at brown/black.' },
    { id: 'toe-hold', name: 'Toe Hold',
      base: { gi: rulesLegalFrom('brown'), nogi: rulesLegalFrom('brown') },
      note: 'Unlocks at brown/black.' },
    { id: 'heel-hook', name: 'Heel Hook',
      base: { gi: rulesAllIllegal(), nogi: rulesLegalFrom('brown') },
      exceptions: [
        { match: { age: 'master' }, result: 'illegal',
          note: 'The adult brown/black no-gi exception does not apply to Masters divisions.' }
      ],
      note: 'Legal only for Adult Brown & Black belts in No-Gi.',
      image: 'rules_illegal_heel_hook' },
    { id: 'knee-reap', name: 'Knee Reap',
      base: { gi: rulesAllIllegal(), nogi: rulesLegalFrom('brown') },
      exceptions: [
        { match: { age: 'master' }, result: 'illegal',
          note: 'The adult brown/black no-gi exception does not apply to Masters divisions.' }
      ],
      note: 'Legal only for Adult Brown & Black belts in No-Gi.',
      image: 'rules_illegal_knee_reap' },
    { id: 'slam', name: 'Slam', dq: true,
      base: { gi: rulesAllIllegal(), nogi: rulesAllIllegal() },
      note: 'Dangerous universal foul — disqualification at every belt.',
      image: 'rules_illegal_slam' },
    { id: 'scissor-takedown', name: 'Scissor Takedown', dq: true,
      base: { gi: rulesAllIllegal(), nogi: rulesAllIllegal() },
      note: 'Dangerous universal foul (kani basami) — disqualification at every belt.',
      image: 'rules_illegal_scissor' },
    { id: 'spinal-lock', name: 'Spinal Lock (no choke)', dq: true,
      base: { gi: rulesAllIllegal(), nogi: rulesAllIllegal() },
      note: 'Twisting the spine without a choke is a dangerous universal foul — disqualification.',
      image: 'rules_illegal_spinal' }
  ]
};

function rulesCheckLegality(age, gi, belt, techId) {
  const t = RULES_LEGALITY.techniques.find(x => x.id === techId);
  if (!t) return null;
  const ctx = { age, gi, belt };
  for (const ex of (t.exceptions || [])) {
    const hit = Object.keys(ex.match).every(k => ctx[k] === ex.match[k]);
    // Exceptions only tighten the base ruling where the base would allow it
    if (hit && t.base[gi][belt] === 'legal') {
      return { status: ex.result, note: ex.note, technique: t };
    }
  }
  return { status: t.base[gi][belt], note: t.note || '', technique: t };
}

// ── Friendly feedback copy ─────────────────────────────────────

const RULES_COPY = {
  correct: [
    'Well done — points on the board!',
    'Nice call, ref!',
    'That\'s it. You saw the control.',
    'Sharp eyes — correct!',
    'The scoreboard agrees with you.'
  ],
  wrong: [
    'Not quite — here\'s the rule:',
    'Close one. Here\'s why:',
    'Good try — the detail matters here:',
    'Not this time. The key detail:'
  ],
  result: {
    perfect: 'Flawless! The ref would be proud.',
    great: 'Well done — you know your rules!',
    good: 'Solid effort. One more run and you\'ll have it.',
    keepGoing: 'Good start — the rule cards can help. Try again!'
  }
};

function rulesRandomCopy(list) {
  return list[Math.floor(Math.random() * list.length)];
}
