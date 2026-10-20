import * as sel from '../state/selectors.js';
import { esc, firstName, prefersReducedMotion } from '../util.js';

export function cheerButton(ctx, task) {
  const cheered = sel.cheers(ctx.data, task.id).some((e) => e.fromMemberId === ctx.me);
  return cheered
    ? `<button type="button" class="btn btn-soft" disabled><span aria-hidden="true">🎉</span> You cheered ✓</button>`
    : `<button type="button" class="btn btn-cheer" data-action="cheer" data-task="${task.id}"><span aria-hidden="true">🎉</span> Congratulate</button>`;
}

export function cheerPanel(ctx, task) {
  const names = sel.cheers(ctx.data, task.id).map((e) =>
    e.fromMemberId === ctx.me ? 'You' : esc(firstName(sel.byId(ctx.data.members, e.fromMemberId).name)),
  );
  if (!names.length) return '';
  return `<p class="cheer-line"><span aria-hidden="true">🎉</span> ${names.join(', ')} cheered</p>`;
}

// Little emoji pop from the button. Reduced motion users get the text change only.
export function burst(el) {
  if (prefersReducedMotion()) return;
  const box = el.getBoundingClientRect();
  ['🎉', '✨', '🎊', '⭐', '✨', '🎉'].forEach((emoji, i) => {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = emoji;
    s.setAttribute('aria-hidden', 'true');
    s.style.left = `${box.left + box.width / 2}px`;
    s.style.top = `${box.top + box.height / 2}px`;
    s.style.setProperty('--dx', `${(i - 2.5) * 22}px`);
    s.style.setProperty('--dy', `${-50 - Math.random() * 40}px`);
    document.body.append(s);
    setTimeout(() => s.remove(), 1000);
  });
}
