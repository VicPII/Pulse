import { createSeed } from '../state/seed.js';

const KEY = 'pulse.data.v1';
let data = null;

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.members)) return parsed;
  } catch { /* missing or corrupt: fall through to seed */ }
  return null;
}

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked: stay in memory */ }
}

const snapshot = () => JSON.parse(JSON.stringify(data));

// Every method resolves to the full, updated project state.
export const localAdapter = {
  async load() {
    data ??= read() ?? createSeed();
    write();
    return snapshot();
  },

  async updateTask(taskId, patch) {
    const task = data.tasks.find((t) => t.id === taskId);
    if (task) Object.assign(task, { updatedAt: Date.now() }, patch);
    write();
    return snapshot();
  },

  async addEvent(event) {
    data.events.push(event);
    write();
    return snapshot();
  },

  async removeEvent(eventId) {
    data.events = data.events.filter((e) => e.id !== eventId);
    write();
    return snapshot();
  },

  async reset() {
    data = createSeed();
    write();
    return snapshot();
  },
};
