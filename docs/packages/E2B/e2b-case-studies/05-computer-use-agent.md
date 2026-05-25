# How I Taught an AI to Use a Computer

## Overview

Technical deep-dive by James Murdza on building an open-source computer use agent that can operate a computer using mouse and keyboard, powered by LLMs and E2B sandboxes.

## What is a Computer Use Agent?

### Concept

An LLM-powered tool that can use all functionalities of a personal computer:
- Takes commands like "Search the internet for cute cat pictures"
- Uses LLM-based reasoning to operate mouse and keyboard
- Executes tasks autonomously

### Key Differentiators

- **Fully open source** - Anyone can run and modify
- **Open weight models only** - No proprietary LLMs required
- **Work in progress** - Limited accuracy but improving daily

### How It Works

1. Takes screenshots of the desktop
2. Asks Llama 3.3 LLM what to do next
3. Executes actions (click, type, etc.)
4. Repeats until task is complete

## Technical Architecture

### Core Components

1. **Vision Model** - Analyzes screenshots
2. **Reasoning Model** - Decides next actions
3. **Grounding Model** - Determines click coordinates
4. **Execution Layer** - Performs mouse/keyboard actions
5. **Display Streaming** - Shows live sandbox screen

### Models Used

- **Llama-3.2-90B-Vision-Instruct** - View sandbox display and decide next steps
- **Llama 3.3-70B-Instruct** - Rephrase decisions in tool-use format
- **OS-Atlas-Base-7B** - Perform click actions given text prompts

## Five Major Technical Challenges

### Challenge 1: Security

**Problem**: Giving AI direct access to personal computer is dangerous (file deletion, irreversible actions)

**Solution**: Use E2B sandboxes
- Cloud-based secure environment
- Isolated from host system
- Supports full Ubuntu with GUI applications
- Perfect for computer use agents

### Challenge 2: Clicking on Things

**Problem**: LLM-based computer use needs precise mouse control

**Initial Approach**: Traditional computer vision models
- Good at recognizing text and icons
- Poor at distinguishing UI elements (text field vs button)

**Solution**: Grounded Vision Language Models (VLMs)
- Output precise coordinates referencing input image
- OS-Atlas team published open-source weights
- Enables accurate UI element targeting

### Challenge 3: Reasoning

**Problem**: LLM must decide between multiple actions and make educated decisions

**Evolution**:
1. **Function Calling** - Prompt LLM to output actions in text format
2. **Tool-Use** - More sophisticated action selection
3. **Vision + Tool-Use** - Combine vision with tool-use in single LLM call (new)

**Implementation**: Multi-model approach
- Vision model analyzes screen
- Reasoning model decides actions
- Grounding model determines coordinates

### Challenge 4: Deploying Niche LLMs

**Problem**: OS-Atlas not available on standard inference providers

**Alternatives Considered**:
- OpenRouter (good for common models)
- Fireworks AI (serverless hosting)
- Official Llama API

**Solution**: Free Hugging Face Space
- Relatively slow (few seconds per call)
- Rate-limited (dozens of calls per hour)
- Works for proof-of-concept

**Lesson**: Economies of scale make serverless hosting prohibitive for niche models

### Challenge 5: Streaming the Display

**Problem**: Need live updates from sandbox screen with low latency

**Solution**: FFmpeg streaming over HTTP

**Server Command**:
```bash
ffmpeg -f x11grab -s 1024x768 -framerate 30 -i $DISPLAY \
  -vcodec libx264 -preset ultrafast -tune zerolatency \
  -f mpegts -listen 1 http://localhost:8080
```

**Client Command**:
```bash
ffmpeg -reconnect 1 -i http://servername:8080 \
  -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  -f mpegts -loglevel quiet - | tee output.ts | ffplay -autoexit -i -loglevel quiet -
```

**Limitations**: Can only stream to one client at a time

## Agent Frameworks: A Digression

### Why So Many Frameworks?

Frameworks abstract:
1. LLM input formatting and output parsing
2. Agent prompts
3. Agent run loop

### The Problem

- Most providers standardizing on OpenAI tool-use format anyway
- System prompts need constant adjustment (shouldn't be abstracted)
- Tool-use is complex hodgepodge of fine-tuning, prompts, and parsing
- Hard to maintain frameworks that handle all variations

### Conclusion

For custom implementations, building your own loop is often simpler than using a framework.

## Future Considerations

### APIs vs GUI-Only Approach

**Best Practice**: Use APIs as much as possible, but most software isn't designed for API control

**Available Interfaces**:

1. **Standard APIs** - File system, Office, Gmail REST API
2. **Code Execution** - Bash, Python scripts
3. **Accessibility APIs** - OS/desktop environment GUI interaction (Linux support weak)
4. **Document Object Model (DOM)** - Web page interaction
5. **Model Context Protocol (MCP)** - New API for agent-friendly context and actions

**Challenge**: Vision is burdensome; better accessibility APIs would help both AI and humans

### Authentication & Sensitive Information

**Insecure Approach**: Give agent same access level as user

**Secure Approach**: Scope permissions (like OAuth, iOS apps)

**Current Solution**: Fresh isolated sandbox with no credentials

**Future Needs**:
- Scoped API access for agents
- Redact sensitive information from LLM
- Restore sensitive data in LLM output

## Current Limitations

The agent is still primitive:
- Limited accuracy
- Trouble planning next steps
- Doesn't know where to focus attention
- May not notice if text field is selected
- Loses sight of original goal with full screens of text

**Not surprising** - This is expected for LLM-based reasoning

## Rapid Improvement Trajectory

- Open source models improving monthly
- New models released frequently
- Reasoning with vision improving rapidly
- Augmentation with additional APIs planned

## Key Takeaways

1. **Sandboxes are Essential** - E2B provides secure, performant environment
2. **Grounded VLMs Enable Precision** - Coordinate-based clicking is more accurate than traditional CV
3. **Multi-Model Approach Works** - Combine vision, reasoning, and grounding models
4. **Streaming Matters** - Live feedback enables debugging and monitoring
5. **APIs > Vision** - Use structured interfaces when available
6. **Security First** - Scoped permissions and sensitive data handling critical
7. **Open Source Matters** - Reproducibility and customization important for research

---

**Source:** [How I taught an AI to use a computer](https://e2b.dev/blog/how-i-taught-an-ai-to-use-a-computer)
