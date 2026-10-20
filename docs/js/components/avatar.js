import { esc } from '../util.js';

// Avatar with an optional progress ring (the individual pulse meter).
// pct === null draws no ring. anim plays the one-shot "your group is waiting" receive animation.
export function avatar(member, { size = 'md', pct = null, tone = 'ok', badge = '', anim = false } = {}) {
  const ring =
    pct === null
      ? ''
      : `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="ring-track" cx="50" cy="50" r="44"/>
          <circle class="ring-fill" data-meter="${esc(member.id)}" data-pct="${pct}" cx="50" cy="50" r="44" pathLength="100"/>
        </svg>`;
  return `<span class="avatar avatar-${size} tone-${tone}${anim ? ' nudge-anim' : ''}" style="--avatar-color:${esc(member.avatarColor)}">
    ${anim ? '<span class="ripple" aria-hidden="true"></span>' : ''}${ring}
    <span class="avatar-face" aria-hidden="true">${esc(member.initials)}</span>
    ${badge ? `<span class="avatar-badge" aria-hidden="true">${badge}</span>` : ''}
  </span>`;
}
