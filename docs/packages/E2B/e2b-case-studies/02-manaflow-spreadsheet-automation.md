# Automating Spreadsheet Workflows with AI - Manaflow

## Overview

Interview with Lawrence Chen, CTO of Manaflow, a YC startup automating repetitive office work using AI agents and spreadsheet-like interfaces.

## The Problem

**Target Market**: Small-to-mid-sized businesses (SMBs)

**Challenge**: Millions of white-collar workers spend time on manual, repetitive spreadsheet workflows where:
- Each column represents a step in a task
- Each row represents an instance of that task
- Processes are manual, time-consuming, and tedious
- Scalability is hindered

**Solution**: Manaflow automates these workflows, enabling:
- More efficient scalability
- Freed-up human resources for strategic work
- Reduced errors

## How Manaflow Works

### Core Interface: Manasheet

A spreadsheet-like interface where:
- Each column represents a workflow step
- Each row corresponds to a task instance
- Workflows are programmed using natural language (no coding required)

### AI Agents & Tools

**Custom Tools**: Users can call or create custom tools that AI agents execute for different workflow steps

**Dependency Graph**: Internal graph determines execution order for each column, enabling:
- Checkpoints for human intervention
- Audit trails

**Integrations**: Seamless connections with:
- External services and APIs
- Authenticated platforms
- Google searches, Stripe invoices, etc.

**Real-time Monitoring**: Admin dashboards show workflow progress with transparency

### Agent Execution

Operation managers can program AI agents to:
- Populate data into cells
- Execute Manasheets automatically
- Run on cron schedules or via button triggers

## Tech Stack

**Frontend**: TypeScript, Next.js, Tailwind CSS

**Backend**: Python

**Infrastructure**: 
- Postgres (each Manasheet backed by a table)
- PartyKit (Durable Objects)
- **E2B Sandboxes** (code execution for each cell)

### Why E2B?

**Initial Approach**: 
- Pyodide for Python evaluation
- StackBlitz for JS/TS evaluation
- Both ran in user's browser

**Limitations Encountered**:
- Users needed to install dependencies
- Compute-intensive code execution required
- Scheduled task execution needed
- CORS restrictions on external services

**Solution**: Moved code execution to cloud using E2B

**Alternatives Considered**:
- Fly.io Machines
- Modal
- Google Cloud Run
- Custom Jupyter clusters

**Why E2B Won**:
- Significantly faster startup times than alternatives
- Easy-to-use @e2b/code-interpreter package
- Perfect fit for the use case

## Vision & Roadmap

### Future Direction

**Empowerment Model**: Knowledge workers will automate their own tasks without coding

**Shift in Roles**: Operations managers will transition from orchestrating manual tasks to directing AI agents

**Internal Tools Evolution**: AI agents will take over operation of internal tools, with humans overseeing

**Unified Platform**: Instead of building physical internal tools, AI agents will automate processes end-to-end on one consolidated platform

### Infrastructure Layer

Manaflow aims to be the infrastructure layer above foundation models, enabling businesses to seamlessly integrate state-of-the-art AI models into current workflows.

## Key Takeaways

1. **Natural Language Programming** - Non-technical users can describe workflows in plain English
2. **Spreadsheet Familiarity** - Leveraging familiar spreadsheet interface reduces learning curve
3. **Flexible Tool System** - Custom tools enable diverse automation scenarios
4. **Reliable Code Execution** - Sandboxed environments (E2B) are essential for safe code execution
5. **Scalability Through Automation** - Parallel execution and scheduling enable massive workflow scaling
6. **Human Oversight** - Checkpoints and monitoring keep humans in control

---

**Source:** [Automating spreadsheet workflows with AI (Manaflow)](https://e2b.dev/blog/automating-spreadsheet-workflows-with-ai)
