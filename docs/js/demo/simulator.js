import { toast } from '../components/toast.js';
import { SIM } from '../config.js';
import * as sel from '../state/selectors.js';
import * as store from '../state/store.js';
import { firstName } from '../util.js';

const timers = new Set();

function later(ms, fn) {
  const id = setTimeout(() => { timers.delete(id); fn().catch(console.error); }, ms);
  timers.add(id);
}

const cancelAll = () => { timers.forEach(clearTimeout); timers.clear(); };
const viewing = () => store.getSession().currentUserId;

// A nudged teammate posts a small update, unless the presenter switched to them to show the receive side.
function replyToNudge(memberId) {
  later(SIM.nudgeReplyMs, async () => {
    const data = store.getData();
    if (viewing() === memberId || !sel.pendingNudges(data, memberId).length) return;
    const member = sel.byId(data.members, memberId);
    const open = sel.memberTasks(data, memberId).find((t) => t.status === 'in_progress' || t.status === 'todo');
    if (open) {
      const next = Math.min(95, open.progress + 10);
      await store.setProgress(open.id, next);
      toast(`${firstName(member.name)} updated “${open.title}” to ${next}%`, { icon: '🙌' });
    } else {
      await store.checkIn(memberId);
      toast(`${firstName(member.name)} checked in`, { icon: '🙌' });
    }
  });
}

// Teammates who are further along step in first, one by one.
function answerSos(taskId) {
  SIM.helpOfferMs.forEach((delay) =>
    later(delay, async () => {
      const data = store.getData();
      const task = sel.byId(data.tasks, taskId);
      if (!task || task.status !== 'needs_help') return;
      const offered = new Set(sel.helpOffers(data, task).map((e) => e.fromMemberId));
      const rank = { done: 0, on_track: 1, quiet: 2, needs_help: 3, idle: 4 };
      const helper = data.members
        .filter((m) => m.id !== task.ownerId && m.id !== viewing() && !offered.has(m.id))
        .sort((a, b) => rank[sel.memberStatus(data, a.id, Date.now())] - rank[sel.memberStatus(data, b.id, Date.now())])[0];
      if (!helper) return;
      await store.offerHelp(taskId, helper.id);
      toast(`${firstName(helper.name)} offered to help`, { icon: '🙋' });
    }),
  );
}

export function startSimulator() {
  if (!SIM.enabled) return;
  store.onAction((a) => {
    if (a.type === 'reset') cancelAll();
    else if (a.type === 'nudge') replyToNudge(a.toMemberId);
    else if (a.type === 'sos') answerSos(a.taskId);
  });
}
