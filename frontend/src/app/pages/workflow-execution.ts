import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-workflow-execution-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/workflow-execution" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and press <em>Ask agent</em>. The question is fixed by
          the guide's component: <em>What's the capital of France?</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> <em>Waiting for an answer...</em> is replaced
          by the agent's answer, which arrives through the
          <code>answer</code> state slot written by
          <code>answerQuestion</code>.
          <strong>Fail:</strong> the text never changes — check that
          <code>/api/copilotkit/info</code> lists <code>my_agent</code>, and
          the LlamaIndex terminal for a run error.
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Also check:</strong> whether <code>resources</code> reaches
          the browser. The guide calls it internal, but its
          <code>answerQuestion</code> emits the whole <code>state</code> dict
          as a snapshot, so if the agent called <code>addResource</code> first,
          the list may be in that snapshot.
        </p>
      </ui-try-it>

      <ui-panel heading="1 · The agent and its state (backend)">
        <p class="text-sm text-slate-700">
          <code>backend/workflow_execution_agent.py</code> is the guide's
          <code>agent.py</code> up to and including its router:
          <code>answerQuestion</code> writes <code>answer</code> and emits a
          state snapshot, <code>addResource</code> appends to
          <code>resources</code> without one, and the router starts from the
          guide's <code>initial_state</code>. The guide's own FastAPI app,
          <code>/health</code> route and <code>__main__</code> block are left
          out; <code>backend/main.py</code> mounts the router on the existing
          server at <code>/workflow-execution</code>.
        </p>
      </ui-panel>

      <ui-panel heading="2 · Register it under the name the component asks for">
        <p class="mb-3 text-sm text-slate-700">
          The guide's component asks for <code>my_agent</code>. That key is
          registered here and points at <code>/workflow-execution/run</code>.
        </p>
        <ui-source path="server.ts" />
      </ui-panel>

      <ui-panel heading="3 · Use the state in your frontend">
        <ui-source
          path="src/app/features/workflow-execution/agent-state.component.ts"
        />
      </ui-panel>

      <ui-callout title="Where this differs from the guide">
        The guide runs its agent as a standalone server on port 8000, which is
        the port this harness's agent already uses. Here the guide's router
        shares that server under the <code>/workflow-execution</code> prefix,
        the same way the sub-agents supervisor does. Every line of the tools,
        the router and the component is as published.
      </ui-callout>
    </div>
  `,
})
export default class WorkflowExecutionPage {}
