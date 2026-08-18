# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-18

### 06:54 UTC — 1 page, highest severity high

**High — Frontend tools and generative UI** · _local snapshot edit, not an upstream change_

`/angular/llamaindex/guides/frontend-tools-generative-ui` · route `/frontend-tools-generative-ui` · under “Register a browser tool” · in a `typescript` block

7 code lines, 5 prose lines changed.

````diff
+ description: "Change the application background to a CSS gradient.",
- 
+ handler: async (args) => {
+ const next = resolveGradient(args.background ?? args.color);
+ background.set(next);
+ return { background: next };
+ },
- 
````
