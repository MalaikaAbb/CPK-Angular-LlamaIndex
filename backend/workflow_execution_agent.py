"""Workflow Execution agent, verbatim from
https://docs.copilotkit.ai/angular/llamaindex/shared-state/workflow-execution

The guide's agent.py is a standalone server. Everything up to and including
`agentic_chat_router` is kept as published; its FastAPI app, `/health` route
and `__main__` block are left out, because backend/main.py already provides
the server and mounts this router at `/workflow-execution`.
"""

from typing import Annotated, List
from fastapi import FastAPI
from llama_index.llms.openai import OpenAI
from llama_index.core.workflow import Context
from llama_index.protocols.ag_ui.router import get_ag_ui_workflow_router
from llama_index.protocols.ag_ui.events import StateSnapshotWorkflowEvent

async def answerQuestion(
    ctx: Context,
    answer: Annotated[str, "The answer to store in state."]
) -> str:
    """Stores the answer to the user's question in shared state.

    Args:
        ctx: The workflow context for state management.
        answer: The answer to store in state.

    Returns:
        str: A message indicating the answer was stored.
    """
    async with ctx.store.edit_state() as global_state:
        state = global_state.get("state", {})
        if state is None:
            state = {}
        
        state["answer"] = answer
        
        # Emit state update to frontend
        ctx.write_event_to_stream(
            StateSnapshotWorkflowEvent(snapshot=state)
        )
        
        global_state["state"] = state
    
    return f"Answer stored: {answer}"

async def addResource(
    ctx: Context,
    resource: Annotated[str, "The resource URL or reference to add."]
) -> str:
    """Adds a resource to the internal resources list in shared state.

    Args:
        ctx: The workflow context for state management.
        resource: The resource URL or reference to add.

    Returns:
        str: A message indicating the resource was added.
    """
    async with ctx.store.edit_state() as global_state:
        state = global_state.get("state", {})
        if state is None:
            state = {}
        
        resources = state.get("resources", [])
        resources.append(resource)
        state["resources"] = resources
        
        global_state["state"] = state
    
    return f"Resource added: {resource}"

# Initialize the LLM
llm = OpenAI(model="gpt-5.4")

# Create the AG-UI workflow router
agentic_chat_router = get_ag_ui_workflow_router(
    llm=llm,
    system_prompt="""
    You are a helpful assistant. When the user asks a question:
    1. Think through your answer
    2. Optionally use addResource to track any sources you reference
    3. Use answerQuestion to provide your final answer - this stores it in state for the user to see
    
    Always use the answerQuestion tool to provide your response so it appears in the UI.
    """,
    backend_tools=[answerQuestion, addResource],
    initial_state={
        "question": "",       # Input: received from frontend
        "answer": "",         # Output: sent to frontend
        "resources": []       # Internal: tracking resources
    },
)

