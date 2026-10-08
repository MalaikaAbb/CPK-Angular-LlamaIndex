/**
 * "Rendering a live delegation log", from
 * https://docs.copilotkit.ai/angular/llamaindex/multi-agent/subagents
 *
 * The class body between the region markers is the page's TypeScript sample,
 * verbatim. That sample is a fragment of the Angular Showcase's
 * agent-state-feature.component.ts, so three things around it are not on the
 * page:
 *
 * - `readDelegations`, `SubAgentName`, `subAgentRendererConfig`, and the two
 *   components rendered here come from the showcase files the page names —
 *   see the DOC GAP FILL header on each file in this folder.
 * - `agentId` and `feature`. The showcase derives them from route data and an
 *   integration lookup that the page does not print. Here they are the literal
 *   values that showcase path resolves to for this page: the `subagents`
 *   agent (registered in frontend/server.ts) and the `subagents` feature.
 * - The template. The page shows none; this one mounts the delegation log
 *   beside a chat, which is what the showcase does for this feature.
 */
import { Component, computed } from '@angular/core';
import {
  CopilotChat,
  injectAgentStore,
  registerRenderToolCall,
} from '@copilotkit/angular';

import { DelegationLogComponent } from './agent-state-cards';
import type { SubAgentName } from './agent-state-model';
import { readDelegations } from './agent-state-model';
import { subAgentRendererConfig } from './subagent-renderer-config';

@Component({
  selector: 'app-subagents-chat',
  imports: [CopilotChat, DelegationLogComponent],
  template: `
    <div class="subagents">
      <aside aria-label="Live supervisor delegation state">
        <showcase-delegation-log [delegations]="delegations()" />
      </aside>
      <section class="chat-surface" aria-label="CopilotKit assistant">
        <copilot-chat agentId="subagents" />
      </section>
    </div>
  `,
  styles: `
    .subagents {
      display: grid;
      grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.35fr);
      gap: 1rem;
      height: 100%;
      padding: 1rem;
    }
    .subagents aside {
      min-width: 0;
      overflow: auto;
    }
    .chat-surface {
      min-width: 0;
      overflow: hidden;
      border: 1px solid #d8e0ea;
      border-radius: 1rem;
    }
  `,
})
export class SubagentsChatComponent {
  // Not on the page — see the file header.
  private readonly agentId = 'subagents';
  protected readonly feature = 'subagents';

  // @region[subagent-delegation-state] — verbatim from the doc page.
  private readonly agentStore = injectAgentStore(this.agentId);
  protected readonly delegations = computed(() =>
    readDelegations(this.agentStore().state()),
  );

  constructor() {
    if (this.feature === "subagents") {
      this.registerSubAgent("research_agent");
      this.registerSubAgent("writing_agent");
      this.registerSubAgent("critique_agent");
    }
  }

  private registerSubAgent(name: SubAgentName): void {
    registerRenderToolCall(subAgentRendererConfig(name));
  }
  // @endregion[subagent-delegation-state]
}
