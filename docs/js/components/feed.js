import * as sel from '../state/selectors.js';
import { esc, firstName, timeAgo } from '../util.js';

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
