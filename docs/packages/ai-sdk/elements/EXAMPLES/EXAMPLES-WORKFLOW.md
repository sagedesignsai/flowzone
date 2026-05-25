# AI Elements - Workflow Example

Build a workflow visualization with interactive nodes and animated connections.

## Overview

This example demonstrates how to create a workflow visualization interface using AI Elements. It includes:

- **Custom Node Components** - Structured layouts with headers, content, and footers
- **Node Toolbars** - Contextual actions for individual nodes
- **Handle Configuration** - Control which connections are possible
- **Multiple Edge Types** - Animated and temporary edge types
- **Custom Connection Lines** - Styled bezier curves
- **Interactive Controls** - Zoom and fit view buttons
- **Custom UI Panels** - Position UI elements anywhere on canvas
- **Automatic Layout** - Auto-fit view with pan/zoom controls

## Setup

Create a new Next.js project with Tailwind CSS:

```bash
npx create-next-app@latest ai-workflow && cd ai-workflow
```

Install AI Elements:

```bash
npx ai-elements@latest
```

Install React Flow dependency:

```bash
npm i @xyflow/react
```

## Key Components

### Canvas
The main container for the workflow visualization with pan/zoom support.

```tsx
<Canvas
  edges={edges}
  edgeTypes={edgeTypes}
  fitView
  nodes={nodes}
  nodeTypes={nodeTypes}
/>
```

### Node Components
Create custom node layouts with compound components.

```tsx
<Node handles={data.handles}>
  <NodeHeader>
    <NodeTitle>{data.label}</NodeTitle>
    <NodeDescription>{data.description}</NodeDescription>
  </NodeHeader>
  <NodeContent>
    {/* Node content */}
  </NodeContent>
  <NodeFooter>
    {/* Node footer */}
  </NodeFooter>
</Node>
```

### Edge Types
Define different edge visualization styles.

```tsx
const edgeTypes = {
  animated: Edge.Animated,    // Active data flow
  temporary: Edge.Temporary,  // Conditional/error paths
};
```

### Node Configuration

Nodes can have source and/or target handles:

```tsx
const nodes = [
  {
    id: "start",
    position: { x: 0, y: 0 },
    data: {
      label: "Start",
      description: "Initialize workflow",
      handles: { source: true, target: false },
    },
    type: "workflow",
  },
  {
    id: "decision",
    position: { x: 1000, y: 0 },
    data: {
      label: "Decision Point",
      description: "Route based on conditions",
      handles: { source: true, target: true },
    },
    type: "workflow",
  },
];
```

### Edge Configuration

Connect nodes with different edge types:

```tsx
const edges = [
  {
    id: "edge-1",
    source: "start",
    target: "process",
    type: "animated",
  },
  {
    id: "edge-2",
    source: "decision",
    target: "error",
    type: "temporary",
  },
];
```

## Workflow Patterns

### Sequential Flow
Connect nodes in a linear sequence:

```
Start → Process → Decision → Complete
```

### Branching Flow
Split execution into multiple paths:

```
Decision → Success Path
        → Error Path
```

### Merging Flow
Combine multiple paths back together:

```
Success Path ↘
             → Complete
Error Path  ↗
```

## Interactive Features

- **Pan & Zoom** - Navigate the workflow canvas
- **Node Selection** - Click nodes to select them
- **Connection Dragging** - Create new connections between nodes
- **Keyboard Navigation** - Use arrow keys to move selected nodes
- **Delete Operations** - Remove nodes and edges

## Styling

Customize node and edge appearance using Tailwind CSS classes and React Flow styling options.

## Next Steps

- Connect to AI-generated process flows
- Add interactive editing capabilities
- Implement workflow execution visualization
- Add node validation and error handling
- Create workflow templates
