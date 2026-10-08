# CopilotKit + LlamaIndex — Angular test harness

A navigable harness for the Angular + LlamaIndex section of the CopilotKit docs
(<https://docs.copilotkit.ai/angular/llamaindex>). Every guide in the sidebar is
a route, and each route runs the thing its doc page teaches rather than
restating it.

Routes with a live feature are split in two: the route itself holds the notes,
pass/fail criteria, and the exact source that runs; `<route>/demo` holds just
the running feature with no page chrome.

## Architecture

Three processes, not two. Unlike the React quickstart — where the runtime lives
inside the Next app — Angular has no server route, so the Copilot Runtime is its
own Node process. The model key only ever reaches the LlamaIndex process.

```
Browser (Angular 22, zoneless)  ·  localhost:4200
  |  @copilotkit/angular — provideCopilotKit, copilot-chat, signal APIs
  |  POST http://localhost:8201/api/copilotkit
  v
Copilot Runtime  ·  localhost:8201        <- Node, frontend/server.ts
  |  agents: { default, support, subagents } -> new LlamaIndexAgent({ url })
  |  POST http://localhost:8000/run       <- AG-UI over SSE (default, support)
  |  POST http://localhost:8000/subagents/run              (subagents)
  v
LlamaIndex  ·  localhost:8000             <- Python / FastAPI, backend/main.py
  |  app.include_router(get_ag_ui_workflow_router(...))
  |  app.include_router(subagents_router, prefix="/subagents")
  v
OpenAI
```

| Process | Port | Started with | Directory |
| --- | --- | --- | --- |
| LlamaIndex agent | 8000 | `uv run main.py` | `backend/` |
| Copilot Runtime | 8201 | `npm run runtime` | `frontend/` |
| Angular dev server | 4200 | `npm start` | `frontend/` |

## Prerequisites

- **Node.js** `^22.22.3 || ^24.15.0 || >=26` — the range `@angular/cli` 22
  requires — and npm (the repo pins `npm@12.0.1` via `packageManager`).
- **Python 3.13** and [uv](https://docs.astral.sh/uv/) — `backend/.python-version`
  pins 3.13 and `pyproject.toml` requires `>=3.13`.
- An **OpenAI API key**.

## Running it

Both backends must be up or the chat will not stream. Use two terminals.

### 1. The LlamaIndex agent

`backend/main.py` reads the key straight from the environment — there is no
`.env` loading — so export it in the shell you start the agent from.

```bash
cd backend
export OPENAI_API_KEY=sk-...
uv run main.py
```

`uv run` creates `.venv` and installs from `uv.lock` on first use. The agent
serves `POST /run` (the AG-UI endpoint) and `GET /health` on
<http://localhost:8000>.

### 2. The runtime and the Angular app

```bash
cd frontend
npm install
npm run dev
```

`npm run dev` runs both Node processes together under `concurrently`: the
Copilot Runtime (`server.ts`) and `ng serve`. To run them separately instead:

```bash
npm run runtime   # Copilot Runtime on 8201
npm start         # Angular dev server on 4200
```

Then open <http://localhost:4200>.

`npm start` and `npm run build` are preceded by `npm run gen:sources`, which
reads the harness's real implementation files off disk and emits them as
`src/app/lib/generated-sources.ts`, so what a route displays is byte-identical
to what runs. Regenerate by hand with `npm run gen:sources` after editing
anything under `src/app/features`, `server.ts`, `src/styles.css`, or
`src/app/app.config.ts`.

## Verifying the connection

The Introduction route (`/`) has a live connection check that probes both
processes. The same two checks by hand:

```bash
curl http://localhost:8201/api/copilotkit/info   # should list agents: default, support, subagents
curl http://localhost:8000/health                # {"status":"healthy","agent":"llamaindex"}
```

`/api/copilotkit/info` is the check the Angular quickstart's troubleshooting box
prescribes. If it reports the agents but nothing streams, the LlamaIndex process
is the one that is down.

Both probes are ordinary cross-origin fetches, so both servers have to send
CORS headers: the runtime through `cors: true` in `frontend/server.ts`, the
agent through the `CORSMiddleware` in `backend/main.py`, which allows
`http://localhost:4200` (ng serve) and `http://localhost:4000` (SSR build).
Serving the app from some other origin means adding it to `allow_origins`, or
the LlamaIndex probe goes red.

That affects the probe only — the chat does not need CORS at all. The browser
never calls the agent directly; the runtime does, server-side, where CORS does
not apply. A red LlamaIndex probe next to a working chat means the CORS config
is wrong, not the agent.

## Configuration

| Variable | Default | Read by |
| --- | --- | --- |
| `OPENAI_API_KEY` | — (required) | `backend/main.py` |
| `LLAMAINDEX_AGENT_URL` | `http://localhost:8000/run` | `frontend/server.ts` |
| `LLAMAINDEX_SUBAGENTS_URL` | `http://localhost:8000/subagents/run` | `frontend/server.ts` |
| `OPENAI_BASE_URL` | — (optional) | `backend/subagents_agent.py` — passed as `api_base` when set |
| `PORT` | `8201` | `frontend/server.ts` |

The browser's `runtimeUrl` is hardcoded to `http://localhost:8201/api/copilotkit`
in `frontend/src/app/app.config.ts`; change it there if you move the runtime.

## Route status

| Route | Status | Notes |
| --- | --- | --- |
| `/` Introduction | Reference | Orientation and the live connection check. |
| `/quickstart` | Working | |
| `/chat-ui` | Working | |
| `/frontend-tools-generative-ui` | Working | See the `getWeather` argument mismatch below. |
| `/a2ui` | Partial | Inert until a catalog is supplied. |
| `/voice-multimodal` | Partial | Microphone records; transcription is not configured. |
| `/human-in-the-loop` | Working | Tool path is live; the interrupt panel stays idle. |
| `/shared-state` | Working | See the state-shape mismatch below. |
| `/threads` | Partial | Needs an Enterprise Intelligence license. |
| `/memory` | Partial | Needs an Enterprise Intelligence license. |
| `/attachments` | Working | |
| `/headless` | Working | |
| `/webmcp` | Partial | Agent path runs anywhere; browser-agent path needs Chrome 149+ with WebMCP enabled. See the WebMCP notes below. |
| `/subagents` | Partial | Implemented as published; not yet verified end to end. See the Sub-Agents doc gaps below. |

## Known issues

**A2UI is inert until a catalog is supplied.** `/info` reports
`a2uiEnabled: true` because `server.ts` passes `a2ui: {}`, but supplying
`a2ui.catalog` on the client is what actually registers the `render_a2ui`
renderer. The guide's catalog snippet is not self-contained, so no catalog is
set and the A2UI route renders nothing.

**`sandboxFunctions` needs a cast.** The option is typed
`SandboxFunction[]`, i.e. `SandboxFunction<Record<string, unknown>>[]`, so the
guide's `SandboxFunction<{ filter: string }>` is not assignable to it as
written. `app.config.ts` casts at the array site — the same idiom the docs use
for the equivalent `component` variance problem.

**Voice transcription fails by design.** The microphone control renders and
records, but this runtime has no transcription service configured
(`audioFileTranscriptionEnabled: false` in `/info`).

**Threads and memory need a license.** Thread and memory endpoints come from
the CopilotKit Enterprise Intelligence Platform. Unlicensed, the thread list
stays empty, the drawer renders its locked state, and `injectMemories`
`isAvailable()` is false — which is the expected result here.

**`getWeather` argument mismatch.** `backend/main.py` declares
`getWeather(location)` while `tools-chat.component.ts` registers the renderer
with `z.object({ city: z.string() })`. The names line up so the weather card
renders, but `city` arrives undefined. Rename one side to fix it.

**Shared state has no agreed shape.** The guide's component expects
`{ notes, priority }`, but `backend/main.py` passes no `initial_state` to
`get_ag_ui_workflow_router`, so the panel sits on its `EMPTY_STATE` defaults.

**Interrupts are never emitted.** The interrupt controller is mounted but
headless. The backend runs the stock workflow from
`get_ag_ui_workflow_router`, which never emits an AG-UI interrupt, so that half
of the human-in-the-loop route stays idle.

**WebMCP's samples call an undefined `searchOrders`.**
[WebMCP](https://docs.copilotkit.ai/angular/llamaindex/webmcp). Both samples
call `searchOrders(status)` and neither defines it. The Angular sample in
`frontend/src/app/features/webmcp/order-search.component.ts` is verbatim, with
a stub appended below it and marked `DOC GAP FILL`: it filters four in-memory
orders, so it stays read-only to match the sample's `readOnlyHint: true`. The
sample also sets `standalone: true`, which this repo's AGENTS.md says to omit;
it is kept as published.

**WebMCP's "no agent" sample is reference only.** The page's second sample
builds its own `CopilotKitCore` for apps without a framework provider. This app
has one, so mounting the sample would register a second `searchOrders`, and
the page says CopilotKit then exposes only the first and logs a warning. It
also imports `@copilotkit/core`, which `frontend/package.json` does not declare
(it is only present as a dependency of `@copilotkit/angular`). The route shows
it as code and does not run it.

**WebMCP needs a browser that implements it.** `document.modelContext` exists
only in Chrome 149+ with the WebMCP origin trial or
`chrome://flags/#enable-webmcp-testing`. Elsewhere CopilotKit skips the WebMCP
registration silently, so only the CopilotKit-agent half of `/webmcp` can be
tested. The demo shows which case applies.
**Sub-Agents prints fragments on both sides.**
[Sub-Agents](https://docs.copilotkit.ai/angular/llamaindex/multi-agent/subagents).
The Python samples call `_stringify_outcome`, which is never defined, and never
build the supervisor router they import `get_ag_ui_workflow_router` for; the
"Setting up sub-agents" section is empty for LlamaIndex. The complete file is
in the Code tab of the page's interactive demo, and
`backend/subagents_agent.py` is that file byte for byte. The TypeScript sample
is a fragment of the Angular Showcase's `agent-state-feature.component.ts`:
`readDelegations`, `SubAgentName`, `subAgentRendererConfig`, `this.agentId`
and `this.feature` are never defined and no template is shown. The demo's
Code tab is the React demo, so the three helper files in
`frontend/src/app/features/subagents/` are copied from the Angular Showcase on
GitHub, each marked `DOC GAP FILL`; `agentId` and `feature` are the literal
`'subagents'`.

**Sub-Agents hardcodes `gpt-5-mini`.** `backend/subagents_agent.py` uses
`OpenAI(model="gpt-5-mini")` for the supervisor and all three sub-agents,
independent of the `gpt-5.4` in `backend/main.py`.

**The delegation log only lists finished delegations.** The backend writes a
`running` entry before each sub-agent call, then marks it `completed` or
`failed`. The showcase's `readDelegations` drops every entry that is not
`completed`, so in-flight work appears only as the in-chat activity card and a
failed delegation never appears in the log.

## Other frontend commands

```bash
npm run build          # production build into dist/
npm test               # Vitest via ng test
npm run serve:ssr:frontend   # run the SSR build from dist/
```

## Doc drift detection

`/doc-sync` keeps this repo honest about the docs it mirrors. Press **Sync docs now** (on the landing page or on `/doc-sync`) and it fetches the markdown source behind all 10 tracked doc pages, diffs each against the copy stored in `doc-snapshot/`, replaces that copy, and reports what moved — ranked by whether the change can actually break an implementation.

Doc pages are fetched by appending `.md` to their URL, which returns the authored MDX rather than the rendered HTML. Every response is checked for `text/markdown` before it is allowed near the snapshot: a URL that misses the markdown handler still answers `200` with the HTML app shell, and writing that in would destroy the baseline. A run commits all pages or none.

**Severity is decided by where the edit landed**, not how big it was:

| Level | Trigger |
|---|---|
| **High** | a changed line inside a fenced code block, a changed fence count, or a page that now 404s and is gone from the sitemap |
| **Medium** | a changed heading, changed frontmatter `title`/`description`, or prose in the same section as changed code |
| **Low** | other prose |

**Sections checked** lists every tracked page in nav order with a mark — `✓` unchanged, `!` changed, `+` stored, `✗` 404, `~` unstable, `·` not checked. Expanding a row shows the comparison: for a changed page the diff (`−` existing snapshot, `+` newly fetched), and for an unchanged one the two matching hashes, which is the evidence the check ran.

**`doc-snapshot/CHANGELOG.md`** is the record that survives a re-sync. Because syncing replaces the copy it just compared against, the run *after* a change reports nothing — so the changelog is written at the moment of discovery and never rewritten later. Only changed pages are recorded; a clean run does not touch the file. It keeps the three most recent dated entries, counted rather than aged.

**One sync date.** `syncedAt` in `doc-snapshot/manifest.json`, rewritten on every run. There is no hand-maintained date to keep in step with it.

### How it is wired on Angular

Angular has no server-action equivalent, so the boundary is plain HTTP. Everything that fetches docs or touches the snapshot lives in `frontend/src/app/lib/doc-sync/` and is imported **only** from `frontend/src/server.ts`, which exposes two endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/doc-sync` | current manifest summary + the latest report |
| `POST /api/doc-sync/run` | runs the sync, returns the result |

They sit on the SSR server rather than the Copilot Runtime because that is the Angular app's own server: `ng serve` routes through it in development (`ssr.entry` in `angular.json`) and it ships in `dist/`, so the button works in both without a second process. The browser half is `DocSyncClient`, a root-provided service holding signals — nothing in the browser bundle imports `node:fs`, which the build verifies by never resolving those modules into `dist/browser`.

**To test it**, edit any `doc-snapshot/pages/*.md` file and press the button — a line inside a code fence for High, a `##` heading for Medium, a sentence for Low. The comparison reads the stored file itself, so nothing else needs changing. Both `/doc-sync` and the changelog label the result as a local snapshot edit rather than upstream drift.

Commit `doc-snapshot/` — `pages/`, `manifest.json` and `CHANGELOG.md` are the baseline every diff is taken against. `reports/` is gitignored.

---

