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
  |  agents: { default, support } -> new LlamaIndexAgent({ url })
  |  POST http://localhost:8000/run       <- AG-UI over SSE
  v
LlamaIndex  ·  localhost:8000             <- Python / FastAPI, backend/main.py
  |  app.include_router(get_ag_ui_workflow_router(...))
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
curl http://localhost:8201/api/copilotkit/info   # should list agents: default, support
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

## Other frontend commands

```bash
npm run build          # production build into dist/
npm test               # Vitest via ng test
npm run serve:ssr:frontend   # run the SSR build from dist/
```
