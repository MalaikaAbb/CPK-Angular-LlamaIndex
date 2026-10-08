import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subagents-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subagents" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send one of the demo's own suggestion prompts:
          <br />
          <em
            >Produce a short blog post about the benefits of cold exposure
            training. Research first, then write, then critique.</em
          >
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the chat shows a Researcher, then a Writer,
          then a Critic card, each going from <em>Working</em> to
          <em>Complete</em> with its result; the log on the left grows to
          <code>3 calls</code> and lights up all three role chips; the
          supervisor ends with a short summary.
          <strong>Fail:</strong> the cards render but the log stays at
          <code>0 calls</code> (state not reaching the frontend), no cards
          render (the <code>subagents</code> agent is not registered — check
          <code>/api/copilotkit/info</code>), or the run errors (check the
          LlamaIndex terminal; the doc code calls <code>gpt-5-mini</code>).
        </p>
      </ui-try-it>

      <ui-panel heading="1 · Sub-agents and the supervisor (backend)">
        <p class="text-sm text-slate-700">
          <code>backend/subagents_agent.py</code> is the
          <code>subagents_agent.py</code> from the Code tab of the page's
          interactive demo, copied byte for byte. Three
          <code>FunctionAgent</code>s (research, writing, critique), each
          wrapped in a supervisor tool that appends a <code>running</code>
          entry to <code>state["delegations"]</code>, runs the sub-agent, and
          marks the entry <code>completed</code> or <code>failed</code>. The
          supervisor is a stock <code>get_ag_ui_workflow_router</code> with
          those three tools and <code>initial_state</code> of
          <code>{{ '{' }}"delegations": []{{ '}' }}</code>.
          <code>backend/main.py</code> mounts it at <code>/subagents</code>,
          because the router always registers <code>POST /run</code>.
        </p>
      </ui-panel>

      <ui-panel heading="2 · Register the supervisor in the runtime">
        <p class="mb-3 text-sm text-slate-700">
          A third <code>LlamaIndexAgent</code>, <code>subagents</code>, pointed
          at <code>/subagents/run</code>. The page does not show this step for
          Angular; it is the same binding this harness uses for every agent.
        </p>
        <ui-source path="server.ts" />
      </ui-panel>

      <ui-panel heading="3 · Render the live delegation log">
        <p class="mb-3 text-sm text-slate-700">
          The class body between the region markers is the page's sample.
          <code>injectAgentStore</code> reads the agent's state,
          <code>computed</code> derives the delegations, and one
          <code>registerRenderToolCall</code> per sub-agent tool puts an
          activity card in the chat.
        </p>
        <ui-source
          path="src/app/features/subagents/subagents-chat.component.ts"
        />
      </ui-panel>

      <ui-panel heading="4 · Helpers the sample calls (doc gap fills)">
        <p class="mb-3 text-sm text-slate-700">
          Not on the page. Copied from the Angular Showcase files the page
          names as its source.
        </p>
        <div class="space-y-4">
          <ui-source path="src/app/features/subagents/agent-state-model.ts" />
          <ui-source
            path="src/app/features/subagents/subagent-renderer-config.ts"
          />
          <ui-source path="src/app/features/subagents/agent-state-cards.ts" />
        </div>
      </ui-panel>

      <ui-callout title="Doc gaps — what the page does not print" tone="warn">
        <p>
          <strong>Python:</strong> the second sample calls
          <code>_stringify_outcome</code>, which is never defined, and imports
          <code>get_ag_ui_workflow_router</code> but never builds the
          supervisor. Both are in the demo's Code tab, which is what runs here.
          The page's "Setting up sub-agents" section is also empty for
          LlamaIndex (the source marks it as not bundled).
        </p>
        <p class="mt-2">
          <strong>TypeScript:</strong> the sample is a fragment of a class.
          <code>readDelegations</code>, <code>SubAgentName</code>,
          <code>subAgentRendererConfig</code>, <code>this.agentId</code> and
          <code>this.feature</code> are never defined, and no template is
          shown. The demo's Code tab does not help here — it is the React
          demo. The helpers come from the Angular Showcase on GitHub.
        </p>
      </ui-callout>

      <ui-callout title="The log only lists finished delegations">
        The backend writes a <code>running</code> entry before each sub-agent
        call and finalizes it as <code>completed</code> or
        <code>failed</code>. The showcase's <code>readDelegations</code> drops
        every entry whose status is not <code>completed</code>, so a running
        delegation shows up only as the in-chat card, and a failed one never
        appears in the log.
      </ui-callout>
    </div>
  `,
})
export default class SubagentsPage {}
