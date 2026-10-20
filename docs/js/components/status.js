// Every status pairs a tone (color) with an icon and a label, so color is never the only signal.
export const TASK_STATUS = {
  todo: { label: 'To do', icon: '○', tone: 'quiet' },
  in_progress: { label: 'In progress', icon: '◐', tone: 'ok' },
  needs_help: { label: 'Needs a hand', icon: '🛟', tone: 'help' },
  done: { label: 'Done', icon: '✓', tone: 'done' },
};

export const MEMBER_STATE = {
  on_track: { label: 'On track', icon: '↗', tone: 'ok' },
  needs_help: { label: 'Could use a hand', icon: '🛟', tone: 'help' },
  quiet: { label: 'Quiet lately', icon: '💤', tone: 'quiet' },
  done: { label: 'Finished', icon: '✓', tone: 'done' },
  idle: { label: 'No tasks yet', icon: '○', tone: 'quiet' },
};

export const chip = ({ tone, icon, label }) =>
  `<span class="chip chip-${tone}"><span aria-hidden="true">${icon}</span> ${label}</span>`;
