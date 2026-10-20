import { HOUR, NUDGE_COOLDOWN_MS, STALE_AFTER_MS } from '../config.js';

export const byId = (list, id) => list.find((x) => x.id === id);
export const memberTasks = (d, memberId) => d.tasks.filter((t) => t.ownerId === memberId);

const average = (tasks) => (tasks.length ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : null);
export const memberProgress = (d, memberId) => average(memberTasks(d, memberId));
export const projectProgress = (d) => average(d.tasks) ?? 0;

export const lastUpdate = (d, memberId) => Math.max(0, ...memberTasks(d, memberId).map((t) => t.updatedAt));

// A nudge is "pending" until its recipient updates any of their tasks.
export function pendingNudges(d, memberId) {
  const since = lastUpdate(d, memberId);
  return d.events.filter((e) => e.type === 'nudge' && e.toMemberId === memberId && e.createdAt > since);
}

// One of: done, needs_help, quiet, on_track, idle
export function memberStatus(d, memberId, now) {
  const tasks = memberTasks(d, memberId);
  if (!tasks.length) return 'idle';
  if (tasks.every((t) => t.status === 'done')) return 'done';
  if (tasks.some((t) => t.status === 'needs_help')) return 'needs_help';
  if (now - lastUpdate(d, memberId) > STALE_AFTER_MS) return 'quiet';
  return 'on_track';
}

export function nudgeCooldownLeft(nudgeLog, fromId, toId, now) {
  const sent = nudgeLog[`${fromId}>${toId}`];
  return sent ? Math.max(0, NUDGE_COOLDOWN_MS - (now - sent.at)) : 0;
}

const eventsFor = (d, type, taskId) => d.events.filter((e) => e.type === type && e.taskId === taskId);

export const activeFlags = (d, taskId) => eventsFor(d, 'flag', taskId);
export const cheers = (d, taskId) => eventsFor(d, 'cheer', taskId);

// Offers only count for the current SOS; once the owner is unstuck they reset.
export function helpOffers(d, task) {
  if (task.status !== 'needs_help') return [];
  const sosAt = Math.max(0, ...eventsFor(d, 'sos', task.id).map((e) => e.createdAt));
  return eventsFor(d, 'help_offer', task.id).filter((e) => e.createdAt >= sosAt);
}

export function projectMood(d, now) {
  const pct = projectProgress(d);
  const title =
    pct >= 100 ? 'All done!' : pct >= 75 ? 'Nearly there' : pct >= 40 ? 'Making progress' : pct > 0 ? 'Getting started' : 'Ready to begin';
  const recent = d.members.filter((m) => now - lastUpdate(d, m.id) < 24 * HOUR).length;
  const share = d.members.length ? recent / d.members.length : 0;
  const rhythm = share >= 0.5 ? { label: 'lively', seconds: 1.5 } : share >= 0.25 ? { label: 'steady', seconds: 2.4 } : { label: 'quiet', seconds: 3.6 };
  return {
    pct,
    title,
    rhythm,
    done: d.tasks.filter((t) => t.status === 'done').length,
    inProgress: d.tasks.filter((t) => t.status === 'in_progress').length,
    needsHelp: d.tasks.filter((t) => t.status === 'needs_help').length,
    total: d.tasks.length,
  };
}

// Support and questions only. Nudges stay out so the feed never points at anyone.
export function feed(d, limit = 6) {
  return d.events
    .filter((e) => e.type !== 'nudge')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
