import { Component, signal } from '@angular/core';

interface Probe {
  label: string;
  url: string;
  hint: string;
  ok: boolean | null;
  detail: string;
}

/**
 * Live connection check for the two processes this harness talks to.
 *
 * The runtime probe is the check the Angular quickstart's troubleshooting box
 * prescribes: `/api/copilotkit/info` should report the registered agents.
 *
 * Both probes are ordinary cross-origin fetches, which means both servers have
 * to send CORS headers: the runtime through `cors: true` in server.ts, the
 * agent through the CORSMiddleware in backend/main.py. Drop the middleware and
 * this probe goes red while the chat keeps working — the browser never calls
 * the agent, the runtime does, server-side, where CORS does not apply.
 */
@Component({
  selector: 'app-backend-health',
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-900">Connection check</h2>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          [disabled]="checking()"
          (click)="check()"
        >
          {{ checking() ? 'Checking…' : 'Recheck' }}
        </button>
      </div>

      <ul class="space-y-2">
        @for (probe of probes(); track probe.url) {
          <li
            class="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <span
              class="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              [class]="
                probe.ok === null
                  ? 'bg-slate-300'
                  : probe.ok
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
              "
              [attr.aria-label]="
                probe.ok === null
                  ? 'not checked'
                  : probe.ok
                    ? 'reachable'
                    : 'unreachable'
              "
            ></span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900">
                {{ probe.label }}
              </p>
              <p class="font-mono text-xs break-all text-slate-500">
                {{ probe.url }}
              </p>
              <p class="mt-1 text-xs text-slate-600">
                {{ probe.detail || probe.hint }}
              </p>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class BackendHealth {
  protected readonly checking = signal(false);
  protected readonly probes = signal<Probe[]>([
    {
      label: 'Copilot Runtime',
      url: 'http://localhost:8201/api/copilotkit/info',
      hint: 'Start it with: npm run runtime',
      ok: null,
      detail: '',
    },
    {
      // The LlamaIndex AG-UI endpoint (`POST /run`) is POST-only, so it cannot
      // be probed with a GET. backend/main.py exposes `GET /health` alongside
      // it as the reachability signal that the agent process is up.
      label: 'LlamaIndex agent',
      url: 'http://localhost:8000/health',
      hint: 'Start it with: uv run main.py (from backend/)',
      ok: null,
      detail: '',
    },
  ]);

  constructor() {
    void this.check();
  }

  protected async check(): Promise<void> {
    this.checking.set(true);
    const next = await Promise.all(
      this.probes().map(async (probe) => {
        try {
          const response = await fetch(probe.url, { method: 'GET' });
          return {
            ...probe,
            ok: response.ok,
            detail: `${response.status} from ${probe.url}`,
          };
        } catch {
          return { ...probe, ok: false, detail: `unreachable — ${probe.hint}` };
        }
      }),
    );
    this.probes.set(next);
    this.checking.set(false);
  }
}
