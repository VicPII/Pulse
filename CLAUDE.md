# Pulse

Pulse is a web interface that reduces social friction in college group projects. Instead of rigid task software (Jira, Asana, Trello) or awkward group chats, it uses micro-interactions and visual status indicators so students can check in, remind each other, and ask for help without feeling bossy or vulnerable.

This file is the working brief for building the prototype. Read it fully before making changes.

## Context

- Course: Human-Computer Interaction (HCI) project. Deliverable 1A (proposal) is done, now building the prototype
- One person is designing and building the whole product, so there is no handoff between roles. Make design and implementation decisions together, and keep the work in a single consistent voice
- The prototype will be used for task-based usability tests with students (Dec 1 to Dec 7) and for the live class presentation demo (Dec 8)
- This is a prototype for demonstration and evaluation, not a production product. Optimize for a smooth, reliable demo and a clear interaction story, not scale or security

## Problem we are solving

- Students avoid asking "Are you done yet?" because they fear being labeled bossy
- Students avoid admitting they are stuck because it feels vulnerable
- Group chats (iMessage, Discord) require open-ended drafting, which raises the anxiety of sending a "Where are you on this?" text
- Existing tools (Jira, Trello, Canvas Groups) are built for professional oversight, not peer to peer collaboration
- Result: communication stalls until deadline pressure forces it, and some students take a grade hit rather than push a peer

## Target users

Undergraduate college students who do group projects, across majors and experience levels. Many have never used project management software, so the interface must be understandable on first use with no onboarding. Assume mixed schedules, jobs, and comfort levels with teamwork. Key needs: quick communication, clear feedback about team progress, easy ways to ask for help, and interactions that do not feel aggressive or formal.

## Core features (build in this priority order)

1. Pulse meters
   - Individual meter: a visual indicator of one member's progress on their task
   - Project meter: an aggregate indicator of overall project progress
   - Should read at a glance, with color and motion, not numbers alone
2. Guilt-Free Nudge
   - One tap or swipe on a teammate's avatar sends an anonymous, friendly reminder
   - The recipient's avatar animates to signal that the rest of the group is waiting on an update
   - No typing, no sender shown, and the tone must stay friendly and never read as nagging
   - Add a light cooldown so nudges cannot be spammed (for example one per member per few hours)
3. SOS button
   - A member taps SOS on a task to tell the group they are struggling, without writing a message
   - Teammates see a clear but non-alarming "needs help" state on that task and can respond with an offer to help
4. Question / flag
   - Quick preset questions or flags on a task (for example "Need clarification", "Blocked") instead of free text
5. Congratulate
   - One tap positive reaction when someone finishes a task, so the tool feels supportive and not only corrective

Everything above should have a low interaction cost. If a flow takes more than two taps, simplify it.

## Design principles

- Low friction first: prefer taps, swipes, and presets over text input
- Friendly, never punitive: no red "overdue shame" states, no public leaderboards, no blame language
- Anonymous nudges, visible support: reminders are anonymous, but help offers and congratulations can show who sent them
- Glanceable status: color, shape, and animation carry meaning, with text as backup
- Zero learning curve: a student who has never seen project software should complete the main tasks unaided
- Accessible by default: do not rely on color alone, keep contrast at WCAG AA, support keyboard use and `prefers-reduced-motion`, and give animations a non-motion fallback

## Tech stack and decisions

The requirement is Java and JavaScript, plus a permanent link to present from. Static hosting cannot run Java, so the project is split so the demo never depends on a running server.

- Frontend (the deployed product for the demo): plain HTML, CSS, and JavaScript (ES modules), no build step. Keep it dependency light.
- Backend (optional, Java): Spring Boot 3 on Java 21 with an in-memory store, exposing a small REST API. Used for local development and as the story for how this would scale.
- Data layer abstraction: the frontend talks to a single `api` module with two interchangeable adapters:
  - `localAdapter` (default): reads and writes `localStorage` with seeded demo data. This is what runs on the static link.
  - `httpAdapter`: calls the Java backend. Enabled by a flag in `config.js` (`USE_BACKEND = false` by default).
- Rule: the deployed static site must always work with `USE_BACKEND = false`. Never make a core demo flow depend on the Java server.

## Suggested structure

```
pulse/
  CLAUDE.md
  README.md
  docs/                    # static site root (served by GitHub Pages)
    index.html
    css/
      tokens.css           # colors, spacing, motion variables
      styles.css
    js/
      main.js
      config.js            # USE_BACKEND flag, cooldown values
      api/
        index.js           # picks adapter
        localAdapter.js
        httpAdapter.js
      components/
        pulseMeter.js
        avatar.js
        nudge.js
        sos.js
        taskCard.js
      state/
        store.js
        seed.js            # demo project, members, tasks
      demo/
        simulator.js       # simulated teammate behavior
    assets/
  server/                  # optional Java backend
    pom.xml
    src/main/java/...
```

Using `docs/` as the static root keeps GitHub Pages setup simple. All asset paths must be relative (no leading `/`) so the site works under a repo subpath like `username.github.io/pulse/`.

## Data model

- Project: id, name, course, dueDate
- Member: id, name, avatarColor, initials
- Task: id, projectId, ownerId, title, progress (0 to 100), status (`todo`, `in_progress`, `needs_help`, `done`), dueDate
- Event: id, type (`nudge`, `sos`, `flag`, `cheer`, `help_offer`), taskId, fromMemberId (hidden for nudges), toMemberId, createdAt

Derived values: individual meter from the member's tasks, project meter from all tasks.

## Demo mode (important for the presentation)

The prototype has to be demoable by one person on one screen.

- Seed a realistic fake project (for example "Marketing Class Final Presentation") with 4 to 5 teammates in different states: one on track, one stalled, one asking for help, one finished
- A "Switch user" control lets the presenter act as any teammate, so both sending and receiving a nudge can be shown live
- `simulator.js` makes fake teammates react after a short delay (acknowledge a nudge, offer help on an SOS, update progress) so the app feels alive
- A visible but unobtrusive "Reset demo" button restores seed data in one click
- Works offline once loaded, and never requires login

## Usability test support

Design the prototype so these tasks can be run with participants (Dec 1 to Dec 7):

1. Find out how far along the whole project is
2. Remind a teammate who has not updated in a while, without sending a message
3. Tell the group you are stuck on your task
4. Congratulate a teammate who finished

Keep the UI free of hints that give away the answer, but make sure each task is doable in about two taps. Optionally log timestamps and taps locally (behind a hidden query flag like `?debug=1`) to help measure time on task.

## Deployment: permanent static link

Goal: one URL that stays the same and can be opened for every presentation and test.

Recommended: GitHub Pages.

1. Push the repo to GitHub
2. Repo Settings, Pages, Source: "Deploy from a branch", branch `main`, folder `/docs`
3. The site publishes at `https://<github-username>.github.io/<repo-name>/`
4. Every push to `main` redeploys automatically, and the URL never changes

Alternatives: Netlify or Vercel (drag and drop the `docs` folder, free, also give a stable URL).

Before presenting: open the live URL on the presentation machine, confirm it loads, run the full demo flow once, and keep a local copy runnable as a backup (`python -m http.server` inside `docs/`).

## Local development

- Frontend: open `docs/index.html` with VS Code Live Server, or run `python -m http.server 8000` inside `docs/`
- Backend (optional): `cd server` then `./mvnw spring-boot:run` (default port 8080), and set `USE_BACKEND = true` in `docs/js/config.js` for local testing only
- Enable CORS on the backend for the local frontend origin

## Coding conventions

- Vanilla JS with ES modules, small focused files, no framework unless the team agrees
- CSS custom properties in `tokens.css` for all colors, spacing, and motion timing
- Animations use CSS transforms and opacity, and respect `prefers-reduced-motion`
- Semantic HTML, real `<button>` elements, visible focus states, aria labels on icon-only controls
- Java: standard Spring Boot layout, records for DTOs, no database for the prototype
- Keep comments short and useful, and prefer clear names over explanation

## Build order

1. Static layout, design tokens, seed data, and the project dashboard with pulse meters
2. Avatar component and the Guilt-Free Nudge flow including the receive animation
3. SOS button and help-offer response
4. Question / flag presets and Congratulate
5. Demo mode: switch user, simulator, reset
6. Polish: accessibility pass, motion, empty and edge states
7. Deploy to the static link and test it in a clean browser
8. Optional: Java backend and `httpAdapter`

## Timeline (from the proposal)

| Phase | Dates |
| --- | --- |
| Proposal | Sep 1 to Sep 15 (done) |
| User research, peer interviews | Sep 16 to Oct 1 (done) |
| Design and prototype (Figma and digital) | Oct 2 to Nov 18 (current phase) |
| User evaluation, task-based usability tests | Dec 1 to Dec 7 |
| Class presentation demo | Dec 8 |
| Final document submission | Dec 13 |

The working prototype should be deployed and stable by Nov 18, leaving Nov 19 to Nov 30 as buffer for fixes before testing begins.

## Out of scope for the prototype

- Real authentication, accounts, or multi-user sync
- Real notifications (email, push, SMS)
- Integrations with Canvas, Discord, or other tools
- Production security, scaling, or a real database

## Working agreements for Claude

- Check this file before suggesting new features, and flag anything that goes beyond the scope above
- Prefer the simplest implementation that makes the interaction feel good in a demo
- Never break the static `USE_BACKEND = false` path
- When adding a feature, also say how it would be demonstrated and how a participant would discover it
- Ask before adding dependencies or restructuring folders
