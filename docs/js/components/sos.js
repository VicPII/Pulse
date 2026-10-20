import * as sel from '../state/selectors.js';
import { esc, firstName } from '../util.js';
import { avatar } from './avatar.js';

export function sosButton(task) {
  if (task.status === 'needs_help') {
    return `<button type="button" class="btn btn-soft" data-action="unstuck" data-task="${task.id}">I'm unstuck now</button>`;
  }
  return `<button type="button" class="btn btn-help" data-action="sos" data-task="${task.id}"
    aria-label="SOS: tell the group you are stuck on ${esc(task.title)}"><span aria-hidden="true">🛟</span> SOS · I'm stuck</button>`;
}

// Teammates' way to respond: one tap, shows who offered.
export function helpButton(ctx, task) {
  const offered = sel.helpOffers(ctx.data, task).some((e) => e.fromMemberId === ctx.me);
  return offered
    ? `<button type="button" class="btn btn-soft" disabled><span aria-hidden="true">🙋</span> You offered to help ✓</button>`
    : `<button type="button" class="btn btn-help" data-action="offer-help" data-task="${task.id}"><span aria-hidden="true">🙋</span> I can help</button>`;
}

export function helpPanel(ctx, task, owner, mine) {
  if (task.status !== 'needs_help') return '';
  const offers = sel.helpOffers(ctx.data, task);
  const line = mine ? 'Your group knows you could use a hand.' : `${esc(firstName(owner.name))} could use a hand with this.`;
  const list = offers
    .map((e) => {
      const from = sel.byId(ctx.data.members, e.fromMemberId);
      return `<li>${avatar(from, { size: 'xs' })} <span>${e.fromMemberId === ctx.me ? 'You' : esc(firstName(from.name))} offered to help</span></li>`;
    })
    .join('');
  return `<div class="help-panel"><p><span aria-hidden="true">🛟</span> ${line}</p>${list ? `<ul class="offers">${list}</ul>` : ''}</div>`;
}
