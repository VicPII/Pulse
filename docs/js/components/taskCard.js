import { FLAG_PRESETS } from '../config.js';
import * as sel from '../state/selectors.js';
import { esc, firstName, formatDue } from '../util.js';
import { avatar } from './avatar.js';
import { cheerButton, cheerPanel } from './cheer.js';
import { helpButton, helpPanel, sosButton } from './sos.js';
import { chip, TASK_STATUS } from './status.js';

const flagIcon = (label) => FLAG_PRESETS.find((p) => p.label === label)?.icon ?? '🚩';

function flagChips(ctx, task, mine) {
  const chips = sel.activeFlags(ctx.data, task.id).map((e) => {
    const from = sel.byId(ctx.data.members, e.fromMemberId);
    const canClear = mine || e.fromMemberId === ctx.me;
    return `<span class="flag-chip"><span aria-hidden="true">${flagIcon(e.label)}</span> ${esc(e.label)}
      <small>· ${e.fromMemberId === ctx.me ? 'you' : esc(firstName(from.name))}</small>
      ${canClear ? `<button type="button" class="chip-x" data-action="clear-flag" data-event="${e.id}" aria-label="Clear flag: ${esc(e.label)}">×</button>` : ''}</span>`;
  });
  return chips.length ? `<div class="flag-row">${chips.join('')}</div>` : '';
}

function flagMenu(ctx, task) {
  if (ctx.openFlagMenu !== task.id) return '';
  const buttons = FLAG_PRESETS.map(
    (p) => `<button type="button" class="btn btn-chip" data-action="flag" data-task="${task.id}" data-label="${esc(p.label)}"><span aria-hidden="true">${p.icon}</span> ${esc(p.label)}</button>`,
  ).join('');
  return `<div class="flag-menu" role="group" aria-label="Pick a quick question or flag">${buttons}</div>`;
}

function actions(ctx, task, mine) {
  const flagBtn = `<button type="button" class="btn btn-ghost" data-action="toggle-flag-menu" data-task="${task.id}" aria-expanded="${ctx.openFlagMenu === task.id}">
    <span aria-hidden="true">🚩</span> Ask or flag</button>`;
  if (mine) {
    return task.status === 'done'
      ? `<button type="button" class="btn btn-ghost" data-action="reopen" data-task="${task.id}">Reopen</button>`
      : `${sosButton(task)}${flagBtn}<button type="button" class="btn btn-soft" data-action="mark-done" data-task="${task.id}">Mark done ✓</button>`;
  }
  if (task.status === 'done') return cheerButton(ctx, task);
  return `${task.status === 'needs_help' ? helpButton(ctx, task) : ''}${flagBtn}`;
}

export function taskCard(ctx, task) {
  const owner = sel.byId(ctx.data.members, task.ownerId);
  const mine = task.ownerId === ctx.me;
  const meta = TASK_STATUS[task.status];
  const slider = mine && task.status !== 'done'
    ? `<label class="slider"><span>Update my progress</span>
        <input type="range" min="0" max="100" step="5" value="${task.progress}" data-action="progress" data-task="${task.id}" data-focus-slider>
        <output>${task.progress}%</output></label>`
    : '';

  return `<li class="task card status-${task.status}${mine ? ' is-mine' : ''}" id="task-${task.id}">
    <div class="task-head">
      ${avatar(owner, { size: 'sm' })}
      <div class="task-title">
        <h3>${esc(task.title)}</h3>
        <p>${mine ? 'You' : esc(owner.name)} · due ${formatDue(task.dueDate)}</p>
      </div>
      ${chip(meta)}
    </div>
    <div class="bar tone-${meta.tone}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${task.progress}" aria-label="Progress on ${esc(task.title)}">
      <span class="bar-fill" style="width:${task.progress}%"></span>
    </div>
    ${slider || `<p class="bar-label">${task.progress}%</p>`}
    ${flagChips(ctx, task, mine)}
    ${helpPanel(ctx, task, owner, mine)}
    ${task.status === 'done' ? cheerPanel(ctx, task) : ''}
    <div class="task-actions">${actions(ctx, task, mine)}</div>
    ${flagMenu(ctx, task)}
  </li>`;
}
