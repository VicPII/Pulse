import * as sel from '../state/selectors.js';
import { esc, timeAgo } from '../util.js';
import { avatar } from './avatar.js';
import { nudgeButton } from './nudge.js';
import { chip, MEMBER_STATE } from './status.js';

const BADGES = { done: '✓', needs_help: '🛟', quiet: '💤' };

export function memberCard(ctx, member) {
  const { data, now } = ctx;
  const status = sel.memberStatus(data, member.id, now);
  const meta = MEMBER_STATE[status];
  const pct = sel.memberProgress(data, member.id);
  const waiting = sel.pendingNudges(data, member.id);
  const anim = waiting.some((e) => ctx.fresh.has(e.id));
  const badge = status === 'done' || status === 'needs_help' ? BADGES[status] : waiting.length ? '👋' : BADGES[status] || '';

  const face = avatar(member, { size: 'lg', pct, tone: meta.tone, badge, anim });
  const last = sel.lastUpdate(data, member.id);
  return `<li class="member-card">
    ${nudgeButton(ctx, member, face)}
    <div class="member-info">
      <h3 class="member-name">${esc(member.name)}${member.id === ctx.me ? ' <span class="you-tag">you</span>' : ''}</h3>
      ${chip(meta)}
      ${waiting.length ? '<p class="member-waiting"><span aria-hidden="true">👋</span> Group is waiting on an update</p>' : ''}
      <p class="member-meta">${pct === null ? 'No tasks yet' : `${pct}% complete · updated ${timeAgo(last, now)}`}</p>
    </div>
  </li>`;
}
