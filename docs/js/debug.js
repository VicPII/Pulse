import { onAction } from './state/store.js';

// ?debug=1: logs taps and actions with timestamps, plus T1-T4 buttons to mark task start/end.
const KEY = 'pulse.debug.v1';

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; } };
const log = [];
function push(entry) {
  log.push({ at: new Date().toISOString(), ...entry });
  try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* ignore */ }
  render();
}

let panel;
const running = {};

function render() {
  const taps = log.filter((e) => e.type === 'tap').length;
  panel.querySelector('.dbg-count').textContent = `${taps} taps`;
  panel.querySelectorAll('[data-task]').forEach((b) => (b.setAttribute('aria-pressed', String(Boolean(running[b.dataset.task])))));
}

const describe = (el) =>
  el.dataset.action ? `${el.dataset.action}${el.dataset.task ? ':' + el.dataset.task : ''}${el.dataset.member ? ':' + el.dataset.member : ''}` : el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40);

export function initDebug() {
  log.push(...read());
  panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.innerHTML = `<strong>Debug</strong> <span class="dbg-count"></span>
    ${[1, 2, 3, 4].map((n) => `<button type="button" data-task="T${n}" aria-pressed="false">T${n}</button>`).join('')}
    <button type="button" data-do="copy">Copy</button><button type="button" data-do="download">Save</button><button type="button" data-do="clear">Clear</button>`;
  document.body.append(panel);

  panel.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.task) {
      const t = b.dataset.task;
      running[t] = !running[t];
      push({ type: running[t] ? 'task_start' : 'task_end', task: t });
    } else if (b.dataset.do === 'copy') {
      await navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
    } else if (b.dataset.do === 'download') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' }));
      a.download = 'pulse-debug-log.json';
      a.click();
    } else if (b.dataset.do === 'clear') {
      log.length = 0;
      localStorage.removeItem(KEY);
      render();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#debug-panel')) return;
    const el = e.target.closest('button, a, select, input') ?? e.target;
    push({ type: 'tap', target: describe(el) });
  }, true);
  onAction(({ type, ...detail }) => push({ type: 'action', action: type, ...detail }));
  render();
}
