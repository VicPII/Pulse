import * as sel from '../state/selectors.js';
import { chip } from './status.js';

const lastShown = new Map(); // meter key -> last rendered percent, so rings animate from where they were

// Project pulse: a large ring that "breathes" faster when the team has been active recently.
export function projectMeter(ctx) {
  const m = sel.projectMood(ctx.data, ctx.now);
  const tone = m.pct >= 100 ? 'done' : 'ok';
  const stats = [
    chip({ tone: 'done', icon: '✓', label: `${m.done} of ${m.total} tasks done` }),
    m.inProgress ? chip({ tone: 'ok', icon: '◐', label: `${m.inProgress} in progress` }) : '',
    m.needsHelp ? chip({ tone: 'help', icon: '🛟', label: `${m.needsHelp} could use a hand` }) : '',
  ].join('');

  return `<section class="hero card" aria-labelledby="hero-title">
    <div class="pulse-meter tone-${tone}" style="--pulse-duration:${m.rhythm.seconds}s">
      <span class="pulse-halo" aria-hidden="true"></span>
      <svg class="pulse-svg" viewBox="0 0 200 200" role="img" aria-label="Project is ${m.pct} percent complete">
        <circle class="ring-track" cx="100" cy="100" r="86"/>
        <circle class="ring-fill" data-meter="project" data-pct="${m.pct}" cx="100" cy="100" r="86" pathLength="100"/>
      </svg>
      <div class="pulse-center" aria-hidden="true"><span class="pulse-pct">${m.pct}<small>%</small></span><span class="pulse-caption">complete</span></div>
    </div>
    <div class="hero-text">
      <p class="eyebrow">Project pulse</p>
      <h2 id="hero-title">${m.title}${m.pct >= 100 ? ' <span aria-hidden="true">🎉</span>' : ''}</h2>
      <div class="chip-row">${stats}</div>
      <p class="rhythm">Team rhythm: <strong>${m.rhythm.label}</strong></p>
    </div>
  </section>`;
}

// Call after each render: rings start at their previous value, then transition to the new one.
export function settleMeters(root) {
  const rings = [...root.querySelectorAll('.ring-fill[data-meter]')];
  rings.forEach((el) => {
    const key = el.dataset.meter;
    el.style.strokeDasharray = `${lastShown.get(key) ?? 0} 100`;
  });
  void root.offsetWidth; // flush so the next change transitions
  rings.forEach((el) => {
    const pct = Number(el.dataset.pct);
    el.style.strokeDasharray = `${pct} 100`;
    lastShown.set(el.dataset.meter, pct);
  });
}
