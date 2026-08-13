from fastapi import FastAPI
from llama_index.llms.openai import OpenAI
from llama_index.protocols.ag_ui.router import get_ag_ui_workflow_router

# Initialize the LLM
llm = OpenAI(model="gpt-5.4")

def getWeather(location: str) -> str:
    """Get the weather for a given location."""
    return f"The weather in {location} is sunny and 70 degrees."


# Create the AG-UI workflow router
agentic_chat_router = get_ag_ui_workflow_router(
    llm=llm,
    system_prompt="You are a helpful AI assistant with access to various tools and capabilities.",
    backend_tools=[getWeather],
)

# Create FastAPI app
app = FastAPI(
    title="LlamaIndex Agent",
    description="A LlamaIndex agent integrated with CopilotKit",
    version="1.0.0"
)

# Include the router
app.include_router(agentic_chat_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent": "llamaindex"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)