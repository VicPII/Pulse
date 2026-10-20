import { activityFeed, winsPanel } from './components/feed.js';
import { burst } from './components/cheer.js';
import { memberCard } from './components/memberCard.js';
import { nudgeBanner } from './components/nudge.js';
import { projectMeter, settleMeters } from './components/pulseMeter.js';
import { taskCard } from './components/taskCard.js';
import { announce, toast } from './components/toast.js';
import { CLEAN, DEBUG } from './config.js';
import { startSimulator } from './demo/simulator.js';
import * as sel from './state/selectors.js';
import * as store from './state/store.js';
import { esc, firstName, formatDue, formatWait, prefersReducedMotion } from './util.js';

const app = document.getElementById('app');
const ui = { flagMenu: null };
const played = new Set(); // nudge events whose receive animation already ran
const announced = new Set(); // nudges already announced to screen readers
let replay = new Set(); // nudge ids to animate again (when switching to the recipient)
let focusOverride = null;

// ---------- view ----------

const STATUS_RANK = { needs_help: 0, in_progress: 1, todo: 2, done: 3 };

function sortedTasks(ctx) {
  const key = (t) => (t.ownerId === ctx.me && t.status !== 'done' ? 0 : 10) + STATUS_RANK[t.status];
  return [...ctx.data.tasks].sort((a, b) => key(a) - key(b));
}

function demoBar(ctx) {
  if (CLEAN) return '';
  const options = ctx.data.members
    .map((m) => `<option value="${esc(m.id)}"${m.id === ctx.me ? ' selected' : ''}>${esc(m.name)}</option>`)
    .join('');
  return `<div class="demo-bar">
    <span class="demo-tag">Demo</span>
    <label>Viewing as <select data-action="switch-user">${options}</select></label>
    <button type="button" class="btn btn-ghost btn-sm" data-action="reset">Reset demo</button>
  </div>`;
}

function view(ctx) {
  const { data } = ctx;
  const tasks = sortedTasks(ctx);
  return `${demoBar(ctx)}
  <div class="shell">
    <header class="top">
      <span class="logo" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2 17h7l3-9 5 17 4-12 2 4h7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <div>
        <p class="brand">Pulse</p>
        <h1>${esc(data.project.name)}</h1>
        <p class="sub">${esc(data.project.course)} · due ${formatDue(data.project.dueDate)}</p>
      </div>
    </header>
    <main id="main" tabindex="-1">
      ${nudgeBanner(ctx)}
      ${projectMeter(ctx)}
      <div class="columns">
        <div class="primary">
          <section aria-labelledby="team-title">
            <h2 id="team-title">Team</h2>
            <ul class="team">${data.members.map((m) => memberCard(ctx, m)).join('')}</ul>
          </section>
          <section aria-labelledby="tasks-title">
            <h2 id="tasks-title">Tasks</h2>
            ${tasks.length ? `<ul class="tasks">${tasks.map((t) => taskCard(ctx, t)).join('')}</ul>` : '<p class="empty card">No tasks yet. This prototype comes with a ready-made project; use Reset demo to restore it.</p>'}
          </section>
        </div>
        <aside class="side" aria-label="Cheers and team activity">
          ${winsPanel(ctx)}
          ${activityFeed(ctx)}
        </aside>
      </div>
    </main>
  </div>`;
}

// ---------- render ----------

const SIG_KEYS = ['action', 'task', 'member', 'event', 'label'];
const signature = (el) => (el?.dataset?.action ? SIG_KEYS.map((k) => el.dataset[k] ?? '').join('|') : null);

function restoreFocus(sig) {
  if (!sig) return;
  [...app.querySelectorAll('[data-action]')].find((el) => signature(el) === sig)?.focus({ preventScroll: true });
}

function render() {
  const data = store.getData();
  if (!data) return;
  const session = store.getSession();
  const now = Date.now();
  const nudges = data.events.filter((e) => e.type === 'nudge');
  const fresh = new Set(nudges.filter((e) => replay.has(e.id) || (!played.has(e.id) && now - e.createdAt < 15000)).map((e) => e.id));
  const ctx = { data, now, me: session.currentUserId, nudgeLog: session.nudgeLog, fresh, openFlagMenu: ui.flagMenu };

  const focus = focusOverride ?? signature(document.activeElement);
  focusOverride = null;
  app.innerHTML = view(ctx);
  settleMeters(app);
  restoreFocus(focus);

  nudges.forEach((e) => played.add(e.id));
  replay = new Set();

  const waiting = sel.pendingNudges(data, ctx.me).filter((e) => !announced.has(e.id));
  if (waiting.length) {
    waiting.forEach((e) => announced.add(e.id));
    announce('Your group is waiting on an update from you.');
  }
}

// ---------- actions ----------

const memberOf = (id) => sel.byId(store.getData().members, id);
const taskOf = (id) => sel.byId(store.getData().tasks, id);
const ownerName = (taskId) => firstName(memberOf(taskOf(taskId).ownerId).name);
const toggleSig = (taskId) => `toggle-flag-menu|${taskId}|||`;

const handlers = {
  async nudge(el) {
    const name = firstName(memberOf(el.dataset.member).name);
    const res = await store.nudge(el.dataset.member);
    if (res.ok) toast(`Nudge sent to ${name}. It's anonymous.`, { icon: '👋', undo: res.undo });
    else if (res.reason === 'cooldown') toast(`${name} already got your nudge. You can send another in ${formatWait(res.msLeft)}.`, { icon: '✓' });
    else toast(`${name} has finished everything.`, { icon: '🎉' });
  },

  async 'check-in'() {
    await store.checkIn();
    toast("Thanks! Your group can see you're on it.", { icon: '💪' });
  },

  'goto-my-task'() {
    const slider = app.querySelector('[data-focus-slider]');
    if (!slider) return;
    slider.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    slider.focus({ preventScroll: true });
  },

  async sos(el) {
    const taskId = el.dataset.task;
    focusOverride = `unstuck|${taskId}|||`;
    const res = await store.sos(taskId);
    toast('Your group can see you could use a hand.', { icon: '🛟', undo: res.undo, duration: 6000 });
  },

  async unstuck(el) {
    focusOverride = `sos|${el.dataset.task}|||`;
    await store.unstuck(el.dataset.task);
    toast('Glad you are moving again.', { icon: '🙌' });
  },

  async 'offer-help'(el) {
    await store.offerHelp(el.dataset.task);
    toast(`Offer sent. ${ownerName(el.dataset.task)} will see it came from you.`, { icon: '🙋' });
  },

  'toggle-flag-menu'(el) {
    ui.flagMenu = ui.flagMenu === el.dataset.task ? null : el.dataset.task;
    render();
  },

  async flag(el) {
    ui.flagMenu = null;
    focusOverride = toggleSig(el.dataset.task);
    await store.flag(el.dataset.task, el.dataset.label);
    render();
    toast(`Flagged: ${el.dataset.label}`, { icon: '🚩' });
  },

  'clear-flag': (el) => store.clearFlag(el.dataset.event),

  async cheer(el) {
    burst(el);
    await store.cheer(el.dataset.task);
    toast(`Cheer sent to ${ownerName(el.dataset.task)}.`, { icon: '🎉' });
  },

  async 'mark-done'(el) {
    focusOverride = `reopen|${el.dataset.task}|||`;
    await store.markDone(el.dataset.task);
    toast('Nice work! Your group can congratulate you.', { icon: '🎉' });
  },

  async reopen(el) {
    focusOverride = `mark-done|${el.dataset.task}|||`;
    await store.reopen(el.dataset.task);
  },

  async reset() {
    ui.flagMenu = null;
    played.clear();
    announced.clear();
    await store.resetDemo();
    toast('Demo reset to its starting point.', { icon: '↺' });
  },
};

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.matches('select, input')) return;
  try { await handlers[el.dataset.action]?.(el); } catch (err) { console.error(err); }
});

app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.action === 'progress') {
    store.setProgress(el.dataset.task, Number(el.value));
  } else if (el.dataset.action === 'switch-user') {
    const id = el.value;
    ui.flagMenu = null;
    replay = new Set(sel.pendingNudges(store.getData(), id).map((n) => n.id)); // show the receive animation again
    store.switchUser(id);
    announce(`Now viewing as ${memberOf(id).name}`);
  }
});

// Live percentage while dragging, without a re-render that would drop the slider.
app.addEventListener('input', (e) => {
  if (e.target.matches('input[type="range"]')) e.target.nextElementSibling.textContent = `${e.target.value}%`;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.flagMenu) {
    focusOverride = toggleSig(ui.flagMenu);
    ui.flagMenu = null;
    render();
  }
});

// ---------- boot ----------

await store.init();
store.subscribe(render);
render();
startSimulator();

// Keep "updated 3h ago" and cooldown text fresh without disturbing a slider drag.
setInterval(() => { if (!document.activeElement?.matches('input[type="range"]')) render(); }, 60000);

if (DEBUG) (await import('./debug.js')).initDebug();

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !DEBUG) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
