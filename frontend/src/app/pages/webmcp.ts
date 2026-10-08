import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';
import { highlight } from '../lib/highlight';

@Component({
  selector: 'app-webmcp-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/webmcp" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 font-semibold text-slate-800">
          1 · Through the CopilotKit agent (any browser)
        </p>
        <p class="mt-1 text-slate-700">
          Open the demo and send <em>Which of my orders are still open?</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the agent calls <code>searchOrders</code> with
          <code>status: "open"</code> and answers with
          <code>ORD-1001</code> (Desk lamp) and <code>ORD-1004</code> (USB-C
          hub). <strong>Fail:</strong> the agent says it has no way to look up
          orders — the tool did not register.
        </p>

        <p class="mt-4 font-semibold text-slate-800">
          2 · Through a browser agent (Chrome 149+ only)
        </p>
        <p class="mt-1 text-slate-700">
          Enable <code>chrome://flags/#enable-webmcp-testing</code>, restart
          Chrome, and open the demo. The banner should read
          <code>document.modelContext: available</code>. In Chrome's Model
          Context Tool Inspector, find <code>searchOrders</code>, check its
          description, its <code>status</code> enum schema and its
          <code>readOnlyHint</code>, then call it with
          <code>{{ '{' }}"status": "shipped"{{ '}' }}</code>.
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the inspector lists the tool and the call
          returns <code>ORD-1002</code> (Monitor arm), with no request reaching
          the runtime or the LlamaIndex agent.
          <strong>Fail:</strong> the banner says available but the inspector
          shows no tool.
        </p>
      </ui-try-it>

      <ui-panel heading="1 · Opt a frontend tool into WebMCP">
        <p class="mb-3 text-sm text-slate-700">
          The page's Angular sample. One <code>registerFrontendTool</code> call
          with a <code>webmcp</code> block; CopilotKit mirrors the name,
          description, schema, annotations and handler onto
          <code>document.modelContext</code> when it exists, and unregisters it
          when the component is destroyed.
        </p>
        <ui-source path="src/app/features/webmcp/order-search.component.ts" />
      </ui-panel>

      <ui-panel heading="2 · Both callers, against one chat">
        <ui-source path="src/app/features/webmcp/webmcp-chat.component.ts" />
      </ui-panel>

      <ui-panel heading="3 · WebMCP only, with no agent — reference only">
        <p class="mb-3 text-sm text-slate-700">
          The page's second sample, verbatim. It is not mounted: it is for
          browser code with no framework provider, and this app has one. Run
          next to the provider it would register a second
          <code>searchOrders</code>, and the page itself says CopilotKit then
          exposes only the first and logs a warning. It also imports
          <code>&#64;copilotkit/core</code>, which this app does not declare as
          a dependency.
        </p>
        <figure class="code-figure">
          <figcaption class="code-figure__bar">
            <span class="code-figure__path">webmcp.ts (from the doc page)</span>
          </figcaption>
          <pre
            class="code-figure__pre"
          ><code [innerHTML]="coreOnlySampleHtml"></code></pre>
        </figure>
      </ui-panel>

      <ui-callout title="Doc gaps — what the page does not print" tone="warn">
        <p>
          Both samples call <code>searchOrders(status)</code> and neither
          defines it. The route uses a stub that filters four in-memory orders,
          appended below the verbatim sample and marked
          <code>DOC GAP FILL</code>.
        </p>
        <p class="mt-2">
          The Angular sample sets <code>standalone: true</code>, which is
          already the default in this Angular version and which this repo's
          AGENTS.md says to leave out. It is kept as published.
        </p>
      </ui-callout>

      <ui-callout title="agentId does not scope WebMCP">
        <code>agentId</code> only limits which CopilotKit agent receives a
        frontend tool. A WebMCP tool is page-level: every browser agent on the
        page can call it, whatever agent the tool was registered for.
      </ui-callout>
    </div>
  `,
})
export default class WebmcpPage {
  /** "WebMCP only, with no agent", verbatim from the doc page. */
  protected readonly coreOnlySample = `import { CopilotKitCore } from "@copilotkit/core";
import { z } from "zod";

export const copilotkit = new CopilotKitCore({
  tools: [
    {
      name: "searchOrders",
      description: "Search the signed-in user's orders by status",
      parameters: z.object({
        status: z.enum(["open", "shipped", "delivered"]),
      }),
      handler: async ({ status }) => {
        const orders = await searchOrders(status);
        return JSON.stringify(orders);
      },
      webmcp: {
        annotations: {
          readOnlyHint: true,
        },
      },
    },
  ],
});`;

  protected readonly coreOnlySampleHtml = highlight(
    this.coreOnlySample,
    'typescript',
  );
}
