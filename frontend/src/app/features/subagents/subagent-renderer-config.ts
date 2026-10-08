/**
 * DOC GAP FILL — `subAgentRendererConfig`.
 *
 * The Sub-Agents page prints only a fragment of the Angular Showcase's
 * agent-state-feature.component.ts, which calls helpers it never shows. This
 * file is that helper, copied verbatim (below this comment) from the source
 * the page names:
 * https://github.com/CopilotKit/CopilotKit/blob/main/showcase/angular/src/app/features/agent-state/subagent-renderer-config.ts
 *
 * Doc page: https://docs.copilotkit.ai/angular/llamaindex/multi-agent/subagents
 */
import type { RenderToolCallConfig } from "@copilotkit/angular";
import { z } from "zod";

import { SubAgentActivityCard } from "./agent-state-cards";
import type { SubAgentName } from "./agent-state-model";

/**
 * Build a route-lifetime subagent renderer that also matches runtimes whose
 * assistant messages do not carry an agent identifier.
 */
export function subAgentRendererConfig(
  name: SubAgentName,
): RenderToolCallConfig<{ task: string }> {
  return {
    name,
    args: z.object({ task: z.string() }),
    component: SubAgentActivityCard as unknown as RenderToolCallConfig<{
      task: string;
    }>["component"],
  };
}
