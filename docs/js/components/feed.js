import * as sel from '../state/selectors.js';
import { esc, firstName, timeAgo } from '../util.js';
import { avatar } from './avatar.js';
import { cheerButton } from './cheer.js';

function line(ctx, e) {
  const who = (id) => (id === ctx.me ? 'You' : esc(firstName(sel.byId(ctx.data.members, id)?.name ?? 'Someone')));
  const task = sel.byId(ctx.data.tasks, e.taskId);
  const title = task ? `“${esc(task.title)}”` : 'a task';
  switch (e.type) {
    case 'sos': return ['🛟', `${who(e.fromMemberId)} could use a hand with ${title}`];
    case 'help_offer': return ['🙋', `${who(e.fromMemberId)} offered to help with ${title}`];
    case 'cheer': return ['🎉', `${who(e.fromMemberId)} cheered on ${title}`];
    case 'flag': return ['🚩', `${who(e.fromMemberId)} flagged ${title}: ${esc(e.label)}`];
    default: return ['•', ''];
  }
}

// Finished tasks, with a one-tap Congratulate right beside the team.
export function winsPanel(ctx) {
  const done = ctx.data.tasks.filter((t) => t.status === 'done').sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const rows = done.map((t) => {
    const owner = sel.byId(ctx.data.members, t.ownerId);
    const mine = t.ownerId === ctx.me;
    const count = sel.cheers(ctx.data, t.id).length;
    const action = mine
      ? `<span class="win-count">${count ? `🎉 ${count} cheer${count === 1 ? '' : 's'}` : 'Waiting for cheers'}</span>`
      : cheerButton(ctx, t);
    return `<li class="win">
      ${avatar(owner, { size: 'sm' })}
      <div class="win-text"><strong>${mine ? 'You' : esc(firstName(owner.name))}</strong> finished<br><span>“${esc(t.title)}”</span></div>
      ${action}
    </li>`;
  });
  return `<section class="card wins" aria-labelledby="wins-title">
    <h2 id="wins-title">Recent wins</h2>
    ${rows.length ? `<ul>${rows.join('')}</ul>` : '<p class="empty">Finished tasks show up here so the team can cheer them on.</p>'}
  </section>`;
}

export function activityFeed(ctx) {
  const items = sel.feed(ctx.data).map((e) => {
    const [icon, text] = line(ctx, e);
    return `<li><span class="feed-icon" aria-hidden="true">${icon}</span><span>${text}</span><time>${timeAgo(e.createdAt, ctx.now)}</time></li>`;
  });
  return `<section class="card feed" aria-labelledby="feed-title">
    <h2 id="feed-title">Team activity</h2>
    ${items.length ? `<ul>${items.join('')}</ul>` : '<p class="empty">Nothing yet. Cheers and offers to help will show up here.</p>'}
  </section>`;
}
