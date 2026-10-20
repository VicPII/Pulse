import { HOUR } from '../config.js';

const DAY = 24 * HOUR;

// Timestamps are relative to "now" so the demo always looks current after a reset.
export function createSeed(now = Date.now()) {
  const ago = (ms) => now - ms;
  const due = (days) => now + days * DAY;
  const task = (id, ownerId, title, progress, status, updatedAgo, dueDays) => ({
    id, projectId: 'p1', ownerId, title, progress, status, dueDate: due(dueDays), updatedAt: ago(updatedAgo),
  });

  return {
    project: {
      id: 'p1',
      name: 'Marketing Class Final Presentation',
      course: 'MKT 301 · Group 4',
      dueDate: due(9),
    },
    members: [
      { id: 'm-alex', name: 'Alex Kim', initials: 'AK', avatarColor: '#6d28d9' },
      { id: 'm-maya', name: 'Maya Okafor', initials: 'MO', avatarColor: '#0e7490' },
      { id: 'm-devon', name: 'Devon Park', initials: 'DP', avatarColor: '#b45309' },
      { id: 'm-priya', name: 'Priya Nair', initials: 'PN', avatarColor: '#be185d' },
      { id: 'm-sam', name: 'Sam Rivera', initials: 'SR', avatarColor: '#15803d' },
    ],
    tasks: [
      task('t1', 'm-alex', 'Outline the 10-minute talk', 60, 'in_progress', 2 * HOUR, 4),
      task('t2', 'm-alex', 'Rehearse transitions', 0, 'todo', 3 * DAY, 8),
      task('t3', 'm-maya', 'Design the slide deck', 70, 'in_progress', 3 * HOUR, 5),
      task('t4', 'm-maya', 'Pick brand visuals', 100, 'done', 2 * DAY, 3),
      task('t5', 'm-devon', 'Summarize customer survey', 25, 'in_progress', 4 * DAY, 3),
      task('t6', 'm-priya', 'Competitor analysis', 40, 'needs_help', 5 * HOUR, 4),
      task('t7', 'm-sam', 'Write the intro script', 100, 'done', 30 * HOUR, 2),
    ],
    events: [
      { id: 'e-seed-1', type: 'sos', taskId: 't6', fromMemberId: 'm-priya', toMemberId: null, createdAt: ago(5 * HOUR) },
      { id: 'e-seed-2', type: 'cheer', taskId: 't7', fromMemberId: 'm-maya', toMemberId: 'm-sam', createdAt: ago(20 * HOUR) },
      { id: 'e-seed-3', type: 'cheer', taskId: 't4', fromMemberId: 'm-sam', toMemberId: 'm-maya', createdAt: ago(1.5 * DAY) },
    ],
  };
}
