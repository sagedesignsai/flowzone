# Build LangChain Agent with Code Interpreter

## Overview

Complete guide to adding code interpreting capabilities to an LLM using the E2B Code Interpreter SDK and LangChain.

## Why Code Interpreter SDK?

### What It Does

The E2B Code Interpreter SDK quickly creates a secure cloud sandbox powered by Firecracker with a running Jupyter server that LLMs can use.

### Capabilities

- Install custom packages
- Access the internet
- Use the filesystem
- Connect cloud storage
- Works with any LLM

### Example Use Case

Using OpenAI's GPT-3.5 Turbo to plot a sine wave in a Jupyter environment.

## Setup Steps

### 1. Install Dependencies

```bash
pip install e2b-code-interpreter langchain langchainhub langchain-openai
```

### 2. Configure API Keys

```python
import os

# Get from https://platform.openai.com/api-keys
os.environ["OPENAI_API_KEY"] = ""

# Get from https://e2b.dev/docs
os.environ["E2B_API_KEY"] = ""
```

### 3. Implement Code Interpreting

**Define Input Schema** using Pydantic:

```python
from pydantic.v1 import BaseModel, Field

class LangchainCodeInterpreterToolInput(BaseModel):
    code: str = Field(description="Python code to execute.")
```

**Create Tool Class**:

```python
from e2b_code_interpreter import CodeInterpreter
from langchain_core.tools import Tool

class CodeInterpreterFunctionTool:
    tool_name: str = "code_interpreter"
    
    def __init__(self):
        # Creates long-lived sandbox instance
        self.sandbox = CodeInterpreter()
    
    def call(self, parameters: dict):
        code = parameters.get("code", "")
        execution = self.sandbox.run(code)
        
        return {
            "results": execution.results,
            "stdout": execution.logs.stdout,
            "stderr": execution.logs.stderr,
            "error": execution.error,
        }
    
    def to_langchain_tool(self) -> Tool:
        return Tool(
            name=self.tool_name,
            description="Execute python code in a Jupyter notebook cell",
            func=self.langchain_call,
            args_schema=LangchainCodeInterpreterToolInput,
        )
```

**Important**: Filter out `results` key from observations to avoid context bloat, as results can contain multiple data types (text, images, plots) that are difficult for LLMs to process.

### 4. Format Messages & Create Agent

**Format Tool Messages**:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain.agents import AgentExecutor
from langchain_openai import ChatOpenAI

def format_to_tool_messages(intermediate_steps):
    messages = []
    for agent_action, observation in intermediate_steps:
        if agent_action.tool == CodeInterpreterFunctionTool.tool_name:
            # Format code interpreter results
            new_messages = CodeInterpreterFunctionTool.format_to_tool_message(
                agent_action, observation
            )
            messages.extend([m for m in new_messages if m not in messages])
    return messages
```

**Create Agent**:

```python
llm = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0)
code_interpreter_tool = CodeInterpreterFunctionTool()

prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = prompt | llm | tool_parser

agent_executor = AgentExecutor(
    agent=agent,
    tools=[code_interpreter_tool.to_langchain_tool()],
    verbose=True,
    return_intermediate_steps=True,
)
```

### 5. Invoke the Agent

```python
result = agent_executor.invoke({
    "input": "plot and show sinus"
})

# Access results
plot_image = result["intermediate_steps"][0][1]["results"][0]
```

## Example Output

When asked to "plot and show sinus", the agent:

1. Generates Python code to create a sine wave plot
2. Executes code in the sandbox
3. Returns the plot image and any stdout/stderr

```
> Entering new AgentExecutor chain...
Invoking: `code_interpreter` with `{'code': 'import matplotlib.pyplot as plt\nimport numpy as np\n\nx = np.linspace(0, 2*np.pi, 100)\ny = np.sin(x)\n\nplt.plot(x, y)\nplt.title('Sine Wave')\nplt.xlabel('x')\nplt.ylabel('sin(x)')\nplt.grid(True)\nplt.show()'}`

Here is a plot of the sine wave.
> Finished chain.
```

## Key Concepts

### Sandbox Lifecycle

- **Long-lived**: Sandbox instance persists across multiple code executions
- **Stateful**: Variables and imports persist between calls
- **Secure**: Isolated environment prevents damage to host system

### Tool Integration

- **Pydantic Schema**: Defines input structure for LangChain
- **Execution Handling**: Captures stdout, stderr, results, and errors
- **Message Formatting**: Filters unnecessary data to keep context window manageable

### LLM Reasoning

The LLM can:
- Decide when to execute code
- Write appropriate Python code
- Interpret results and provide explanations
- Iterate if needed

## Resources

- [E2B Documentation](/docs)
- [LangChain Documentation](https://python.langchain.com/v0.2/docs/introduction/)
- [Full Code on GitHub](https://github.com/e2b-dev/e2b-cookbook/tree/main/examples/langchain-python)

---

**Source:** [Build LangChain agent with code interpreter](https://e2b.dev/blog/build-langchain-agent-with-code-interpreter)
