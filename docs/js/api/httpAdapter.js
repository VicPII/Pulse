import { API_BASE } from '../config.js';

// Same contract as localAdapter, backed by the optional Java server (not built yet).
// Expected endpoints: GET /state, PATCH /tasks/{id}, POST /events, DELETE /events/{id}, POST /reset.
async function call(path, method = 'GET', body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  return method === 'GET' ? res.json() : call('/state');
}

export const httpAdapter = {
  load: () => call('/state'),
  updateTask: (taskId, patch) => call(`/tasks/${taskId}`, 'PATCH', patch),
  addEvent: (event) => call('/events', 'POST', event),
  removeEvent: (eventId) => call(`/events/${eventId}`, 'DELETE'),
  reset: () => call('/reset', 'POST'),
};
