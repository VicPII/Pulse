import { api } from '../api/index.js';
import { DEFAULT_USER_ID } from '../config.js';
import * as sel from './selectors.js';

const SESSION_KEY = 'pulse.session.v1';

let data = null;
let session = null; // { currentUserId, nudgeLog } lives only in this browser
const subscribers = new Set();
const actionListeners = new Set();

export const getData = () => data;
export const getSession = () => session;
export const subscribe = (fn) => (subscribers.add(fn), () => subscribers.delete(fn));
// Fired after user-initiated actions so the simulator and debug log can react.
export const onAction = (fn) => (actionListeners.add(fn), () => actionListeners.delete(fn));

const emit = () => subscribers.forEach((fn) => fn());
const announceAction = (type, payload = {}) => actionListeners.forEach((fn) => fn({ type, ...payload }));
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (saved && saved.currentUserId && saved.nudgeLog) return saved;
  } catch { /* use defaults */ }
  return { currentUserId: DEFAULT_USER_ID, nudgeLog: {} };
}

function saveSession() {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* in-memory only */ }
}

async function commit(promise) {
  data = await promise;
  emit();
}

export async function init() {
  session = loadSession();
  data = await api.load();
  if (!sel.byId(data.members, session.currentUserId)) session.currentUserId = data.members[0].id;
  saveSession();
  emit();
}

export function switchUser(memberId) {
  session.currentUserId = memberId;
  saveSession();
  announceAction('switch-user', { memberId });
  emit();
}

export async function resetDemo() {
  session = { currentUserId: DEFAULT_USER_ID, nudgeLog: {} };
  saveSession();
  announceAction('reset');
  await commit(api.reset());
}

const me = () => session.currentUserId;
const task = (id) => sel.byId(data.tasks, id);

const addEvent = (event) =>
  commit(api.addEvent({ id: newId('e'), createdAt: Date.now(), taskId: null, fromMemberId: null, toMemberId: null, ...event }));

// ---- Nudge: anonymous, rate limited per sender and recipient ----

export async function nudge(toMemberId) {
  const now = Date.now();
  const msLeft = sel.nudgeCooldownLeft(session.nudgeLog, me(), toMemberId, now);
  if (msLeft > 0) return { ok: false, reason: 'cooldown', msLeft };
  if (sel.memberStatus(data, toMemberId, now) === 'done') return { ok: false, reason: 'finished' };

  const eventId = newId('e');
  const logKey = `${me()}>${toMemberId}`;
  session.nudgeLog[logKey] = { at: now, eventId };
  saveSession();
  // fromMemberId stays null: the sender is never stored on the event.
  await commit(api.addEvent({ id: eventId, type: 'nudge', taskId: null, fromMemberId: null, toMemberId, createdAt: now }));
  announceAction('nudge', { toMemberId });

  return {
    ok: true,
    undo: async () => {
      delete session.nudgeLog[logKey];
      saveSession();
      await commit(api.removeEvent(eventId));
    },
  };
}

// A quick "I'm on it": touches the member's open tasks so the group sees fresh activity.
export async function checkIn(memberId = me()) {
  const open = sel.memberTasks(data, memberId).filter((t) => t.status !== 'done');
  for (const t of open) await commit(api.updateTask(t.id, {}));
  announceAction('check-in', { memberId });
}

// ---- Progress ----

export async function setProgress(taskId, progress) {
  const t = task(taskId);
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  let status = t.status;
  if (pct >= 100) status = 'done';
  else if (t.status === 'done') status = 'in_progress';
  else if (t.status !== 'needs_help') status = pct === 0 ? 'todo' : 'in_progress';
  await commit(api.updateTask(taskId, { progress: pct, status }));
  announceAction('progress', { taskId, progress: pct });
}

export const markDone = (taskId) => setProgress(taskId, 100);
export const reopen = (taskId) => setProgress(taskId, 90);

// ---- SOS and help offers ----

export async function sos(taskId) {
  const before = task(taskId);
  const prev = { status: before.status, updatedAt: before.updatedAt };
  await commit(api.updateTask(taskId, { status: 'needs_help' }));
  const eventId = newId('e');
  await commit(api.addEvent({ id: eventId, type: 'sos', taskId, fromMemberId: me(), toMemberId: null, createdAt: Date.now() }));
  announceAction('sos', { taskId });
  return {
    undo: async () => {
      await commit(api.removeEvent(eventId));
      await commit(api.updateTask(taskId, prev));
    },
  };
}

export async function unstuck(taskId) {
  const t = task(taskId);
  await commit(api.updateTask(taskId, { status: t.progress > 0 ? 'in_progress' : 'todo' }));
  announceAction('unstuck', { taskId });
}

export async function offerHelp(taskId, fromId = me()) {
  const t = task(taskId);
  if (sel.helpOffers(data, t).some((e) => e.fromMemberId === fromId)) return;
  await addEvent({ type: 'help_offer', taskId, fromMemberId: fromId, toMemberId: t.ownerId });
  announceAction('offer-help', { taskId });
}

// ---- Question / flag ----

export async function flag(taskId, label) {
  if (sel.activeFlags(data, taskId).some((e) => e.label === label && e.fromMemberId === me())) return;
  await addEvent({ type: 'flag', taskId, label, fromMemberId: me(), toMemberId: task(taskId).ownerId });
  announceAction('flag', { taskId, label });
}

export const clearFlag = (eventId) => commit(api.removeEvent(eventId));

// ---- Congratulate ----

export async function cheer(taskId) {
  if (sel.cheers(data, taskId).some((e) => e.fromMemberId === me())) return;
  await addEvent({ type: 'cheer', taskId, fromMemberId: me(), toMemberId: task(taskId).ownerId });
  announceAction('cheer', { taskId });
}
