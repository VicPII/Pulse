import * as sel from '../state/selectors.js';
import { esc, firstName, formatWait } from '../util.js';

export function nudgeState(ctx, member) {
  if (member.id === ctx.me) return { kind: 'self' };
  if (sel.memberStatus(ctx.data, member.id, ctx.now) === 'done') return { kind: 'finished' };
  const msLeft = sel.nudgeCooldownLeft(ctx.nudgeLog, ctx.me, member.id, ctx.now);
  return msLeft > 0 ? { kind: 'cooldown', msLeft } : { kind: 'ready' };
}

// The avatar is the nudge button: one tap sends an anonymous reminder.
export function nudgeButton(ctx, member, avatarHtml) {
  const name = firstName(member.name);
  const s = nudgeState(ctx, member);
  if (s.kind === 'self') {
    return `<div class="nudge-slot">${avatarHtml}<span class="nudge-caption">You</span></div>`;
  }
  const label = {
    ready: `Send ${name} a friendly nudge. It is anonymous.`,
    cooldown: `You nudged ${name} recently. You can nudge again in ${formatWait(s.msLeft || 0)}.`,
    finished: `${name} has finished everything.`,
  }[s.kind];
  const caption = { ready: 'Nudge', cooldown: 'Nudged ✓', finished: 'All done' }[s.kind];
  return `<button type="button" class="nudge-slot nudge-btn is-${s.kind}" data-action="nudge" data-member="${esc(member.id)}"
      aria-label="${esc(label)}"${s.kind === 'ready' ? '' : ' aria-disabled="true"'}>
    ${avatarHtml}<span class="nudge-caption">${caption}</span>
  </button>`;
}

// What the recipient sees: friendly, no sender, and one tap to respond.
export function nudgeBanner(ctx) {
  if (!sel.pendingNudges(ctx.data, ctx.me).length) return '';
  return `<section class="banner" aria-label="Your group is waiting on an update">
    <span class="banner-icon" aria-hidden="true">👋</span>
    <div class="banner-text">
      <h2>Your group is waiting on an update</h2>
      <p>No rush. A quick check-in lets everyone know you're on it.</p>
    </div>
    <div class="banner-actions">
      <button type="button" class="btn btn-primary" data-action="check-in">I'm on it</button>
      <button type="button" class="btn btn-ghost" data-action="goto-my-task">Update progress</button>
    </div>
  </section>`;
}
