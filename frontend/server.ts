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
 * `subagents` is a separate LlamaIndex router — the supervisor from the
 * Sub-Agents page — mounted by backend/main.py at `/subagents`, so its
 * `delegations` state never mixes with the `default` agent's.
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
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LlamaIndexAgent } from "@ag-ui/llamaindex";

const agentUrl =
  process.env["LLAMAINDEX_AGENT_URL"] ?? "http://localhost:8000/run";

// The Sub-Agents supervisor, mounted by backend/main.py at `/subagents`.
const subagentsUrl =
  process.env["LLAMAINDEX_SUBAGENTS_URL"] ??
  "http://localhost:8000/subagents/run";

// The Workflow Execution agent, mounted by backend/main.py at
// `/workflow-execution`.
const workflowExecutionUrl =
  process.env["LLAMAINDEX_WORKFLOW_EXECUTION_URL"] ??
  "http://localhost:8000/workflow-execution/run";

// Create the Intelligence client with your project API key. Keep this key on the server.
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env["CPK_INTELLIGENCE_API_KEY"]!,
});

async function authenticateApplicationUser(
  _request: Request,
): Promise<{ id: string; name: string } | null> {
  return { id: "local-user", name: "Local user" };
}

const runtime = new CopilotRuntime({
  agents: {
    default: new LlamaIndexAgent({ url: agentUrl }),
    support: new LlamaIndexAgent({ url: agentUrl }),
    subagents: new LlamaIndexAgent({ url: subagentsUrl }),
    // The name the Workflow Execution guide's component asks for. It points at
    // the guide's agent, mounted by backend/main.py at `/workflow-execution`.
    // https://docs.copilotkit.ai/angular/llamaindex/shared-state/workflow-execution
    my_agent: new LlamaIndexAgent({ url: workflowExecutionUrl }),
  },
  a2ui: {},
  intelligence,
  // Identify the user from a verified session or token
  identifyUser: async (request) => {
    const user = await authenticateApplicationUser(request);
    if (!user) throw new Error("Unauthorized");
    return { id: user.id, name: user.name };
  },
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
