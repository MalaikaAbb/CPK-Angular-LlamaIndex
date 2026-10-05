/**
 * Mounts the guide's WebMCP tool beside a chat, so both of its callers can be
 * exercised from one page.
 * https://docs.copilotkit.ai/angular/llamaindex/webmcp
 *
 * - `<app-order-search />` is the page's component. It renders nothing; its
 *   constructor registers `searchOrders` with `webmcp` enabled.
 * - `<copilot-chat />` drives the `default` agent, which receives
 *   `searchOrders` as an ordinary frontend tool. This path works in any
 *   browser.
 * - The panel checks for `document.modelContext` — step 3 of the page's
 *   "Test the complete path". When it is missing, CopilotKit registers nothing
 *   with WebMCP and the browser-agent path cannot be tested here.
 */
import { Component, afterNextRender, signal } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

import { OrderSearchComponent } from './order-search.component';

@Component({
  selector: 'app-webmcp-chat',
  imports: [CopilotChat, OrderSearchComponent],
  template: `
    <app-order-search />
    <div style="display: flex; flex-direction: column; height: 100%">
      <p
        role="status"
        style="margin: 0; padding: 0.6rem 1rem; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0"
        [style.background]="modelContext() ? '#ecfdf5' : '#fffbeb'"
      >
        <code>document.modelContext</code>:
        @switch (modelContext()) {
          @case (true) {
            <strong>available</strong> — <code>searchOrders</code> is
            registered with WebMCP. Inspect it with Chrome's Model Context Tool
            Inspector.
          }
          @case (false) {
            <strong>not available</strong> — WebMCP registration is a no-op in
            this browser. The chat path below still works.
          }
          @default {
            checking…
          }
        }
      </p>
      <div style="flex: 1; min-height: 0">
        <copilot-chat />
      </div>
    </div>
  `,
})
export class WebmcpChatComponent {
  /** `null` until the browser has rendered — `document` does not exist under SSR. */
  protected readonly modelContext = signal<boolean | null>(null);

  constructor() {
    afterNextRender(() => {
      this.modelContext.set('modelContext' in document);
    });
  }
}
