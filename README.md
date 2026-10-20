# Pulse

Group-project check-ins without the awkward. See [CLAUDE.md](CLAUDE.md) for the full brief.

## Run it

```
cd docs
python -m http.server 8000
```

Open http://localhost:8000. ES modules do not load from `file://`, so use a server (or VS Code Live Server).
State lives in `localStorage`; "Reset demo" restores the seed. No backend is needed (`USE_BACKEND = false` in `docs/js/config.js`).

## Deploy (permanent link)

Push to GitHub, then Settings, Pages, Source "Deploy from a branch", `main`, folder `/docs`.
The site is at `https://<user>.github.io/<repo>/`. All paths are relative, so the subpath works.

## Query flags

| Flag | Effect |
| --- | --- |
| `?clean=1` | Hides the demo bar. Use it for usability tests so participants act as Alex with no switcher. |
| `?debug=1` | Logs taps and actions with timestamps. T1 to T4 buttons mark task start and end. Copy or Save exports JSON. |
| `?sim=0` | Turns off simulated teammates. |

## Demo script (Dec 8)

1. Open as Alex. The project pulse shows 56%. Each avatar ring is that person's progress.
2. Tap **Devon**'s avatar. An anonymous nudge goes out. The toast offers Undo. Devon's avatar waves.
3. Switch user to **Devon**. The waving replays and a banner says the group is waiting. Tap **I'm on it**.
4. Switch back to Alex. Tap **SOS · I'm stuck** on a task. Sam, then Maya, offer to help after 4s and 10s.
5. Tap **Congratulate** on Sam's finished task. Confetti, and the cheer shows your name.
6. Tap **Reset demo**.

## Usability tasks and where they live

| Task | How a participant does it |
| --- | --- |
| Find overall progress | Read the large ring at the top. 0 taps. |
| Remind a teammate | Tap Devon's avatar. 1 tap. The card shows "Updated 4d ago". |
| Say you are stuck | Tap **SOS** on your own task. 1 tap, with Undo. |
| Congratulate a finisher | Tap **Congratulate** on Sam's or Maya's done task. 1 tap. |

## Data model additions

Beyond the brief: `Task.updatedAt` (drives "quiet lately" and pending nudges), `Event.label` (flag preset text). A nudge is pending until its recipient updates a task. The sender is never stored on a nudge. The sender's cooldown is kept only in their own browser session.

## Not built yet

- Java Spring Boot backend (`server/`). `httpAdapter.js` defines the REST contract it needs and is untested.
- Swipe-to-nudge. Tap is the only gesture.

## Tests

`tests/e2e.html` drives the real app in an iframe and prints PASS/FAIL lines (nudge, cooldown, SOS, flags, cheers, simulator, reset).
Run `python tests/serve.py`, then open http://127.0.0.1:8123/__test/e2e.html (it takes about 20 seconds because it waits on the simulator).
`tests/shot.html?s=recv` and `?s=mobile` set up the receive-nudge and phone-width views for screenshots.
