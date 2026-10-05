/**
 * "Angular frontend tool", verbatim — everything down to the DOC GAP FILL
 * marker is the page's `src/app/order-search.component.ts` sample, unchanged
 * (including its `standalone: true`).
 * https://docs.copilotkit.ai/angular/llamaindex/webmcp
 *
 * Mounted once, the tool is visible to two callers through the same handler:
 * the CopilotKit agent (as an ordinary frontend tool forwarded over AG-UI) and,
 * in a WebMCP-capable browser, any browser agent reading
 * `document.modelContext`.
 */
import { Component } from "@angular/core";
import { registerFrontendTool } from "@copilotkit/angular";
import { z } from "zod";

@Component({
  selector: "app-order-search",
  standalone: true,
  template: "",
})
export class OrderSearchComponent {
  constructor() {
    registerFrontendTool({
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
    });
  }
}

// ---------------------------------------------------------------------------
// DOC GAP FILL — not on the page.
//
// Both samples on the page call `searchOrders(status)` and neither defines it;
// in the doc it stands for "your app's existing order lookup". This stub is
// the smallest thing that lets the sample compile and return a result a
// caller can check: a fixed in-memory list, filtered by status. It reads
// only, which keeps the sample's `readOnlyHint: true` honest.
// ---------------------------------------------------------------------------
type OrderStatus = "open" | "shipped" | "delivered";

const SAMPLE_ORDERS: { id: string; item: string; status: OrderStatus }[] = [
  { id: "ORD-1001", item: "Desk lamp", status: "open" },
  { id: "ORD-1002", item: "Monitor arm", status: "shipped" },
  { id: "ORD-1003", item: "Keyboard", status: "delivered" },
  { id: "ORD-1004", item: "USB-C hub", status: "open" },
];

async function searchOrders(status: OrderStatus) {
  return SAMPLE_ORDERS.filter((order) => order.status === status);
}
