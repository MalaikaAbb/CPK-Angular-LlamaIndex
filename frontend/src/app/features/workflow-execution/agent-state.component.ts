/**
 * "Use the state in your frontend", verbatim from
 * https://docs.copilotkit.ai/angular/llamaindex/shared-state/workflow-execution
 *
 * `my_agent` is registered in server.ts and points at the guide's agent,
 * mounted by backend/main.py at /workflow-execution.
 */
import { Component, computed, inject, signal } from "@angular/core";
import { CopilotKit, injectAgentStore } from "@copilotkit/angular";

type AgentState = {
  question?: string;
  answer?: string;
};

@Component({
  selector: "app-agent-state",
  template: `
    <button type="button" (click)="askQuestion(question())">
      Ask agent
    </button>
    <p>{{ answer() || "Waiting for an answer..." }}</p>
  `,
})
export class AgentStateComponent {
  private readonly copilotKit = inject(CopilotKit);
  readonly store = injectAgentStore("my_agent");
  readonly question = signal("What's the capital of France?");
  readonly state = computed(
    () => (this.store().state() as AgentState | undefined) ?? {},
  );
  readonly answer = computed(() => this.state().answer);

  async askQuestion(question: string): Promise<void> {
    const agent = this.store().agent;
    agent.setState({ ...this.state(), question, answer: "" });
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    });
    await this.copilotKit.core.runAgent({ agent });
  }
}
