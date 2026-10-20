// Toasts and the screen reader announcer live outside #app so re-renders never interrupt them.
const host = () => document.getElementById('toasts');

export function announce(message) {
  const live = document.getElementById('sr-live');
  live.textContent = '';
  setTimeout(() => (live.textContent = message), 50);
}

export function toast(message, { icon = '', undo = null, duration = 5000 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon ? `<span aria-hidden="true">${icon}</span>` : ''}<span class="toast-text"></span>`;
  el.querySelector('.toast-text').textContent = message;

  const close = () => el.remove();
  if (undo) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-undo';
    btn.textContent = 'Undo';
    btn.addEventListener('click', async () => { close(); await undo(); });
    el.append(btn);
  }
  host().append(el);
  setTimeout(close, duration);
}
