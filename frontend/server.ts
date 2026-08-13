/**
 * Copilot Runtime for this harness.
 *
 * Shape comes from the Angular quickstart's Node runtime server, with the
 * agent swapped for the LlamaIndex backend in `../backend`.
 *
 * That backend exposes a plain AG-UI endpoint —
 * `app.include_router(get_ag_ui_workflow_router(...))` in backend/main.py
 * mounts a single `POST /run` that streams AG-UI events over SSE.
 *
 * `LlamaIndexAgent` from `@ag-ui/llamaindex` is the binding for that endpoint.
 * It is an `HttpAgent` subclass that pins the AG-UI protocol version the
 * LlamaIndex workflow router speaks, and substitutes a placeholder body for
 * empty tool results, which that router rejects.
 *
 * `default` and `support` resolve to the same LlamaIndex process.
 * `support` exists so the doc snippets that use `agentId="support"` (Chat UI,
 * Threads) run verbatim.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/llamaindex/guides/a2ui
 * — it is a runtime-side middleware and is independent of which agent binding
 * is used.
 *
 * Ports: backend/main.py binds 8000, so the runtime sits on 8201. Override
 * either side with PORT / LLAMAINDEX_AGENT_URL.
 */
import { createServer } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LlamaIndexAgent } from "@ag-ui/llamaindex";

const agentUrl =
  process.env["LLAMAINDEX_AGENT_URL"] ?? "http://localhost:8000/run";

const runtime = new CopilotRuntime({
  agents: {
    default: new LlamaIndexAgent({ url: agentUrl }),
    support: new LlamaIndexAgent({ url: agentUrl }),
  },
  a2ui: {},
});

const port = Number(process.env["PORT"] ?? 8201);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(`LlamaIndex agent: ${agentUrl}`);
});
