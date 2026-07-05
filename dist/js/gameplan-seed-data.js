// Starter default library — ~107 standard BJJ positions, transitions,
// submissions, and opponent reactions. Fixed 'seed-*' ids keep variantOf /
// fromPosition / toPosition references valid and make re-seeding idempotent.
// Ids carried over from the previous 48-move seed are preserved so existing
// gameplans that reference them keep working.

const GAMEPLAN_SEED = (() => {
  const e = (id, type, label, opts) => {
    opts = opts || {};
    return {
      id: 'seed-' + id,
      type: type,
      label: label,
      notes: [],
      links: [],
      tags: opts.tags || [],
      aliases: opts.aliases || [],
      variantOf: opts.variantOf ? 'seed-' + opts.variantOf : null,
      category: opts.cat || null,
      fromPositionId: opts.from ? 'seed-' + opts.from : null,
      toPositionId: opts.to ? 'seed-' + opts.to : null
    };
  };

  return [
    // ── Positions · Standing ────────────────────────────────────
    e('standing', 'position', 'Neutral Standing', { cat: 'Standing', tags: ['neutral'] }),
    e('collar-tie-range', 'position', 'Collar-Tie Range', { cat: 'Standing', tags: ['neutral'] }),
    e('grip-fighting-range', 'position', 'Grip-Fighting Range', { cat: 'Standing', tags: ['neutral', 'gi'] }),
    e('over-under-clinch', 'position', 'Over-Under Clinch', { cat: 'Standing', tags: ['neutral'] }),
    e('front-headlock', 'position', 'Front Headlock', { cat: 'Standing', tags: ['top'] }),
    e('sprawl-position', 'position', 'Sprawl Position', { cat: 'Standing', tags: ['top'] }),

    // ── Positions · Guards (bottom) ─────────────────────────────
    e('closed-guard', 'position', 'Closed Guard', { cat: 'Guards', tags: ['bottom'], aliases: ['Full Guard'] }),
    e('open-guard', 'position', 'Open Guard', { cat: 'Guards', tags: ['bottom'] }),
    e('seated-guard', 'position', 'Seated Guard', { cat: 'Guards', tags: ['bottom'], variantOf: 'open-guard' }),
    e('butterfly-guard', 'position', 'Butterfly Guard', { cat: 'Guards', tags: ['bottom'], variantOf: 'open-guard' }),
    e('half-guard', 'position', 'Half Guard', { cat: 'Guards', tags: ['bottom'] }),
    e('knee-shield', 'position', 'Knee Shield Half Guard', { cat: 'Guards', tags: ['bottom'], aliases: ['Z-Guard'], variantOf: 'half-guard' }),
    e('de-la-riva', 'position', 'De La Riva', { cat: 'Guards', tags: ['bottom', 'gi'], aliases: ['DLR'], variantOf: 'open-guard' }),
    e('single-leg-x', 'position', 'Single Leg X', { cat: 'Guards', tags: ['bottom'], aliases: ['SLX', 'Ashi Garami'], variantOf: 'open-guard' }),
    e('x-guard', 'position', 'X-Guard', { cat: 'Guards', tags: ['bottom'], variantOf: 'open-guard' }),
    e('fifty-fifty', 'position', '50/50', { cat: 'Guards', tags: ['bottom'], aliases: ['Fifty Fifty'] }),

    // ── Positions · Top control ─────────────────────────────────
    e('closed-guard-top', 'position', 'Closed Guard Top', { cat: 'Top control', tags: ['top'] }),
    e('half-guard-top', 'position', 'Half Guard Top', { cat: 'Top control', tags: ['top'] }),
    e('headquarters', 'position', 'Headquarters', { cat: 'Top control', tags: ['top'], aliases: ['HQ'] }),
    e('leg-drag-pos', 'position', 'Leg Drag', { cat: 'Top control', tags: ['top'] }),
    e('side-control', 'position', 'Side Control', { cat: 'Top control', tags: ['top'], aliases: ['Side Mount', 'Cross Side'] }),
    e('north-south', 'position', 'North-South', { cat: 'Top control', tags: ['top'] }),
    e('knee-on-belly', 'position', 'Knee on Belly', { cat: 'Top control', tags: ['top'], aliases: ['KOB', 'Knee Ride'] }),
    e('mount', 'position', 'Mount', { cat: 'Top control', tags: ['top'] }),
    e('technical-mount', 'position', 'Technical Mount', { cat: 'Top control', tags: ['top'], variantOf: 'mount' }),
    e('back-control', 'position', 'Back Control', { cat: 'Top control', tags: ['top'], aliases: ['Rear Mount', 'Back Mount'] }),
    e('turtle-top', 'position', 'Turtle Top', { cat: 'Top control', tags: ['top'] }),

    // ── Positions · Bad positions (bottom) ──────────────────────
    e('side-control-bottom', 'position', 'Side Control Bottom', { cat: 'Bad positions', tags: ['bottom'] }),
    e('mount-bottom', 'position', 'Mount Bottom', { cat: 'Bad positions', tags: ['bottom'] }),
    e('back-control-bottom', 'position', 'Back Control Bottom', { cat: 'Bad positions', tags: ['bottom'] }),
    e('turtle', 'position', 'Turtle Bottom', { cat: 'Bad positions', tags: ['bottom'] }),
    e('front-headlock-bottom', 'position', 'Front Headlock Bottom', { cat: 'Bad positions', tags: ['bottom'] }),

    // ── Transitions · Takedowns & standing ──────────────────────
    e('single-leg', 'transition', 'Single Leg Takedown', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'standing' }),
    e('double-leg', 'transition', 'Double Leg Takedown', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'standing' }),
    e('ankle-pick', 'transition', 'Ankle Pick', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'grip-fighting-range' }),
    e('body-lock-trip', 'transition', 'Body-Lock Trip', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'over-under-clinch' }),
    e('snap-down', 'transition', 'Snap Down', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'collar-tie-range', to: 'front-headlock' }),
    e('arm-drag', 'transition', 'Arm Drag', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'standing' }),
    e('sprawl', 'transition', 'Sprawl', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'standing', to: 'front-headlock' }),
    e('go-behind', 'transition', 'Go-Behind', { cat: 'Takedowns & standing', tags: ['takedown'], from: 'front-headlock', to: 'back-control' }),
    e('guard-pull', 'transition', 'Guard Pull', { cat: 'Takedowns & standing', tags: ['guard-pull'], from: 'standing', to: 'closed-guard' }),

    // ── Transitions · Passing ───────────────────────────────────
    e('knee-cut', 'transition', 'Knee Cut Pass', { cat: 'Passing', tags: ['pass'], aliases: ['Knee Slice'], from: 'headquarters', to: 'side-control' }),
    e('toreando', 'transition', 'Toreando Pass', { cat: 'Passing', tags: ['pass'], aliases: ['Bullfighter Pass'], to: 'side-control' }),
    e('leg-drag-pass', 'transition', 'Leg Drag Pass', { cat: 'Passing', tags: ['pass'], from: 'headquarters', to: 'leg-drag-pos' }),
    e('body-lock-pass', 'transition', 'Body-Lock Pass', { cat: 'Passing', tags: ['pass', 'no-gi'], to: 'side-control' }),
    e('over-under', 'transition', 'Over-Under Pass', { cat: 'Passing', tags: ['pass'], from: 'closed-guard-top', to: 'side-control' }),
    e('stack-pass', 'transition', 'Stack Pass', { cat: 'Passing', tags: ['pass'], from: 'closed-guard-top', to: 'side-control' }),
    e('smash-pass', 'transition', 'Smash Pass', { cat: 'Passing', tags: ['pass'], from: 'half-guard-top', to: 'side-control' }),
    e('half-guard-pass', 'transition', 'Half-Guard Pass', { cat: 'Passing', tags: ['pass'], from: 'half-guard-top', to: 'side-control' }),

    // ── Transitions · Sweeps ────────────────────────────────────
    e('scissor-sweep', 'transition', 'Scissor Sweep', { cat: 'Sweeps', tags: ['sweep'], from: 'closed-guard', to: 'mount' }),
    e('hip-bump', 'transition', 'Hip-Bump Sweep', { cat: 'Sweeps', tags: ['sweep'], from: 'closed-guard', to: 'mount' }),
    e('flower-sweep', 'transition', 'Flower Sweep', { cat: 'Sweeps', tags: ['sweep'], aliases: ['Pendulum Sweep'], from: 'closed-guard', to: 'mount' }),
    e('butterfly-sweep', 'transition', 'Butterfly Sweep', { cat: 'Sweeps', tags: ['sweep'], from: 'butterfly-guard', to: 'mount' }),
    e('tripod-sweep', 'transition', 'Tripod Sweep', { cat: 'Sweeps', tags: ['sweep'], from: 'de-la-riva' }),
    e('slx-sweep', 'transition', 'Single-Leg X Sweep', { cat: 'Sweeps', tags: ['sweep'], from: 'single-leg-x' }),
    e('wrestle-up', 'transition', 'Wrestle-Up', { cat: 'Sweeps', tags: ['sweep'], from: 'seated-guard' }),
    e('underhook-sweep', 'transition', 'Half-Guard Underhook Sweep', { cat: 'Sweeps', tags: ['sweep'], aliases: ['Old School Sweep'], from: 'half-guard', to: 'half-guard-top' }),

    // ── Transitions · Escapes ───────────────────────────────────
    e('elbow-escape', 'transition', 'Elbow-Knee Escape', { cat: 'Escapes', tags: ['escape'], aliases: ['Shrimp Escape', 'Hip Escape'], from: 'mount-bottom', to: 'half-guard' }),
    e('upa', 'transition', 'Trap-and-Roll Escape', { cat: 'Escapes', tags: ['escape'], aliases: ['Upa', 'Bridge and Roll'], from: 'mount-bottom', to: 'closed-guard-top' }),
    e('frame-escape', 'transition', 'Side-Control Frame Escape', { cat: 'Escapes', tags: ['escape'], from: 'side-control-bottom', to: 'open-guard' }),
    e('turtle-recovery', 'transition', 'Turtle Recovery', { cat: 'Escapes', tags: ['escape'], aliases: ['Granby Roll'], from: 'turtle', to: 'open-guard' }),
    e('back-escape', 'transition', 'Back Escape', { cat: 'Escapes', tags: ['escape'], from: 'back-control-bottom' }),
    e('leg-lock-escape', 'transition', 'Leg-Lock Escape', { cat: 'Escapes', tags: ['escape'] }),

    // ── Transitions · Back takes ────────────────────────────────
    e('arm-drag-back', 'transition', 'Arm Drag to Back', { cat: 'Back takes', tags: ['back-take'], to: 'back-control' }),
    e('turtle-back-take', 'transition', 'Turtle Back Take', { cat: 'Back takes', tags: ['back-take'], from: 'turtle-top', to: 'back-control' }),
    e('gift-wrap-back-take', 'transition', 'Gift-Wrap Back Take', { cat: 'Back takes', tags: ['back-take'], from: 'mount', to: 'back-control' }),
    e('leg-drag-back-take', 'transition', 'Leg-Drag Back Take', { cat: 'Back takes', tags: ['back-take'], from: 'leg-drag-pos', to: 'back-control' }),
    e('tech-mount-back-take', 'transition', 'Technical Mount Back Take', { cat: 'Back takes', tags: ['back-take'], from: 'technical-mount', to: 'back-control' }),

    // ── Submissions · Chokes ────────────────────────────────────
    e('rnc', 'submission', 'Rear Naked Choke', { cat: 'Chokes', tags: ['choke'], aliases: ['RNC', 'Mata Leao'], from: 'back-control' }),
    e('guillotine', 'submission', 'Guillotine', { cat: 'Chokes', tags: ['choke'] }),
    e('triangle', 'submission', 'Triangle Choke', { cat: 'Chokes', tags: ['choke'], aliases: ['Sankaku'] }),
    e('arm-triangle', 'submission', 'Arm Triangle', { cat: 'Chokes', tags: ['choke'], aliases: ['Kata Gatame', 'Head and Arm'] }),
    e('darce', 'submission', "D'Arce Choke", { cat: 'Chokes', tags: ['choke'], aliases: ['Brabo'] }),
    e('anaconda', 'submission', 'Anaconda Choke', { cat: 'Chokes', tags: ['choke'] }),
    e('cross-collar', 'submission', 'Cross-Collar Choke', { cat: 'Chokes', tags: ['choke', 'gi'], aliases: ['X-Choke'] }),
    e('bow-and-arrow', 'submission', 'Bow-and-Arrow Choke', { cat: 'Chokes', tags: ['choke', 'gi'], from: 'back-control' }),
    e('baseball-bat', 'submission', 'Baseball Bat Choke', { cat: 'Chokes', tags: ['choke', 'gi'] }),

    // ── Submissions · Arm attacks ───────────────────────────────
    e('armbar', 'submission', 'Armbar', { cat: 'Arm attacks', tags: ['arm-lock'], aliases: ['Juji Gatame'] }),
    e('kimura', 'submission', 'Kimura', { cat: 'Arm attacks', tags: ['shoulder-lock'], aliases: ['Double Wristlock'] }),
    e('americana', 'submission', 'Americana', { cat: 'Arm attacks', tags: ['shoulder-lock'], aliases: ['Keylock'] }),
    e('omoplata', 'submission', 'Omoplata', { cat: 'Arm attacks', tags: ['shoulder-lock'] }),
    e('wrist-lock', 'submission', 'Wrist Lock', { cat: 'Arm attacks', tags: ['wrist-lock'] }),

    // ── Submissions · Leg attacks ───────────────────────────────
    e('straight-ankle', 'submission', 'Straight Ankle Lock', { cat: 'Leg attacks', tags: ['leg-lock'], aliases: ['Achilles Lock'] }),
    e('kneebar', 'submission', 'Kneebar', { cat: 'Leg attacks', tags: ['leg-lock', 'advanced'] }),
    e('toe-hold', 'submission', 'Toe Hold', { cat: 'Leg attacks', tags: ['leg-lock', 'advanced'] }),
    e('inside-heel-hook', 'submission', 'Inside Heel Hook', { cat: 'Leg attacks', tags: ['leg-lock', 'no-gi', 'advanced'] }),
    e('outside-heel-hook', 'submission', 'Outside Heel Hook', { cat: 'Leg attacks', tags: ['leg-lock', 'no-gi', 'advanced'] }),
    e('calf-slicer', 'submission', 'Calf Slicer', { cat: 'Leg attacks', tags: ['leg-lock', 'advanced'] }),

    // ── Reactions · General ─────────────────────────────────────
    e('react-postures-up', 'reaction', 'Postures Up', { cat: 'General reactions', aliases: ['Opponent postures up'] }),
    e('react-frames', 'reaction', 'Frames', { cat: 'General reactions', aliases: ['Opponent frames'] }),
    e('react-posts-hand', 'reaction', 'Posts Hand', { cat: 'General reactions', aliases: ['Opponent posts hand'] }),
    e('react-turns-away', 'reaction', 'Turns Away', { cat: 'General reactions', aliases: ['Opponent turns away'] }),
    e('react-turns-in', 'reaction', 'Turns In', { cat: 'General reactions', aliases: ['Opponent turns in'] }),
    e('react-turtles', 'reaction', 'Turtles', { cat: 'General reactions', aliases: ['Opponent turtles'] }),
    e('react-stands-up', 'reaction', 'Stands Up', { cat: 'General reactions', aliases: ['Opponent stands up'] }),
    e('react-backs-away', 'reaction', 'Backs Away', { cat: 'General reactions', aliases: ['Opponent backs away'] }),

    // ── Reactions · Submission defence ──────────────────────────
    e('react-hides-arm', 'reaction', 'Hides Arm', { cat: 'Submission defence', aliases: ['Opponent hides arm'] }),
    e('react-locks-hands', 'reaction', 'Locks Hands', { cat: 'Submission defence', aliases: ['Opponent locks hands'] }),
    e('react-tucks-chin', 'reaction', 'Tucks Chin', { cat: 'Submission defence', aliases: ['Opponent tucks chin'] }),
    e('react-peels-grip', 'reaction', 'Peels Grip', { cat: 'Submission defence', aliases: ['Opponent peels grip'] }),
    e('react-clears-knee-line', 'reaction', 'Clears Knee Line', { cat: 'Submission defence', aliases: ['Opponent clears knee line'] }),
    e('react-hides-heel', 'reaction', 'Hides Heel', { cat: 'Submission defence', aliases: ['Opponent hides heel'] }),

    // ── Reactions · Passing defence ─────────────────────────────
    e('react-recovers-guard', 'reaction', 'Recovers Guard', { cat: 'Passing defence', aliases: ['Opponent recovers guard'] }),
    e('react-frames-hip', 'reaction', 'Frames Hip', { cat: 'Passing defence', aliases: ['Opponent frames hip'] }),
    e('react-underhooks', 'reaction', 'Underhooks', { cat: 'Passing defence', aliases: ['Opponent underhooks'] }),
    e('react-inverts', 'reaction', 'Inverts', { cat: 'Passing defence', aliases: ['Opponent inverts'] }),
    e('react-gives-back', 'reaction', 'Gives Back', { cat: 'Passing defence', aliases: ['Opponent gives back'] })
  ];
})();
