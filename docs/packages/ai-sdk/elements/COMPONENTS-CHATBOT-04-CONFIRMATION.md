# Confirmation Component

An alert-based component for managing tool execution approval workflows with request, accept, and reject states.

## Overview

The `Confirmation` component provides a flexible system for displaying tool approval requests and their outcomes. Perfect for showing users when AI tools require approval before execution, and displaying the approval status afterward.

## Installation

```bash
npx ai-elements@latest add confirmation
```

## Features

- **Context-based state management**: Approval workflow handling
- **Conditional rendering**: Based on approval state
- **Multiple states**: approval-requested, approval-responded, output-denied, output-available
- **Built on shadcn/ui**: Alert and Button components
- **TypeScript support**: Comprehensive type definitions
- **Customizable styling**: Tailwind CSS integration
- **Keyboard navigation**: Full accessibility support
- **Theme-aware**: Automatic dark mode support

## Usage with AI SDK

Build a chat UI with tool approval workflow:

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Confirmation,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { MessageResponse } from "@/components/ai-elements/message";

type DeleteFileInput = {
  filePath: string;
  confirm: boolean;
};

type DeleteFileToolUIPart = ToolUIPart<{
  delete_file: {
    input: DeleteFileInput;
    output: { success: boolean; message: string };
  };
}>;

const Example = () => {
  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleDeleteFile = () => {
    sendMessage({ text: "Delete the file at /tmp/example.txt" });
  };

  const latestMessage = messages[messages.length - 1];
  const deleteTool = latestMessage?.parts?.find(
    (part) => part.type === "tool-delete_file"
  ) as DeleteFileToolUIPart | undefined;

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full space-y-4">
        <Button onClick={handleDeleteFile} disabled={status !== "ready"}>
          Delete Example File
        </Button>

        {deleteTool?.approval && (
          <Confirmation approval={deleteTool.approval} state={deleteTool.state}>
            <ConfirmationRequest>
              This tool wants to delete:{" "}
              <code>{deleteTool.input?.filePath}</code>
              <br />
              Do you approve this action?
            </ConfirmationRequest>

            <ConfirmationAccepted>
              <CheckIcon className="size-4" />
              <span>You approved this tool execution</span>
            </ConfirmationAccepted>

            <ConfirmationRejected>
              <XIcon className="size-4" />
              <span>You rejected this tool execution</span>
            </ConfirmationRejected>

            <ConfirmationActions>
              <ConfirmationAction
                variant="outline"
                onClick={() =>
                  addToolApprovalResponse({
                    id: deleteTool.approval!.id,
                    approved: false,
                  })
                }
              >
                Reject
              </ConfirmationAction>

              <ConfirmationAction
                variant="default"
                onClick={() =>
                  addToolApprovalResponse({
                    id: deleteTool.approval!.id,
                    approved: true,
                  })
                }
              >
                Approve
              </ConfirmationAction>
            </ConfirmationActions>
          </Confirmation>
        )}

        {deleteTool?.output && (
          <MessageResponse>
            {deleteTool.output.success
              ? deleteTool.output.message
              : `Error: ${deleteTool.output.message}`}
          </MessageResponse>
        )}
      </div>
    </div>
  );
};

export default Example;
```

## Backend Setup

Add the following route to your backend:

```tsx
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o",
    messages: await convertToModelMessages(messages),
    tools: {
      delete_file: {
        description: "Delete a file from the file system",
        parameters: z.object({
          filePath: z.string().describe("The path to the file to delete"),
          confirm: z
            .boolean()
            .default(false)
            .describe("Confirmation that the user wants to delete the file"),
        }),
        requireApproval: true,
        execute: async ({ filePath, confirm }) => {
          if (!confirm) {
            return {
              success: false,
              message: "Deletion not confirmed",
            };
          }

          await new Promise((resolve) => setTimeout(resolve, 500));

          return {
            success: true,
            message: `Successfully deleted ${filePath}`,
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
```

## Component Props

### Confirmation (Root)

Root container for confirmation workflow.

| Prop | Type | Description |
|------|------|-------------|
| `approval` | `ApprovalUIPart` | Approval data |
| `state` | `ToolUIPartState` | Current approval state |
| `children` | `React.ReactNode` | Confirmation sub-components |
| `className` | `string` | Additional CSS classes |

### ConfirmationRequest

Displays the approval request.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Request content |
| `className` | `string` | Additional CSS classes |

### ConfirmationAccepted

Displays when user approves.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Accepted content |
| `className` | `string` | Additional CSS classes |

### ConfirmationRejected

Displays when user rejects.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Rejected content |
| `className` | `string` | Additional CSS classes |

### ConfirmationActions

Container for action buttons.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Action buttons |
| `className` | `string` | Additional CSS classes |

### ConfirmationAction

Individual action button.

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `"default" \| "outline"` | Button variant |
| `onClick` | `() => void` | Click handler |
| `children` | `React.ReactNode` | Button text |
| `className` | `string` | Additional CSS classes |

## Approval States

### Approval Request State

Shows the approval request with action buttons when state is `approval-requested`.

```tsx
<Confirmation approval={approval} state="approval-requested">
  <ConfirmationRequest>
    This tool wants to execute a query on the production database:
    <code>SELECT * FROM users WHERE role = 'admin'</code>
  </ConfirmationRequest>
  <ConfirmationActions>
    <ConfirmationAction variant="outline" onClick={handleReject}>
      Reject
    </ConfirmationAction>
    <ConfirmationAction variant="default" onClick={handleApprove}>
      Approve
    </ConfirmationAction>
  </ConfirmationActions>
</Confirmation>
```

### Approved State

Shows the accepted status when user approves.

```tsx
<Confirmation approval={approval} state="approval-responded">
  <ConfirmationAccepted>
    <CheckIcon className="size-4" />
    <span>You approved this tool execution</span>
  </ConfirmationAccepted>
</Confirmation>
```

### Rejected State

Shows the rejected status when user rejects.

```tsx
<Confirmation approval={approval} state="output-denied">
  <ConfirmationRejected>
    <XIcon className="size-4" />
    <span>You rejected this tool execution</span>
  </ConfirmationRejected>
</Confirmation>
```

## Examples

### File Operations

Request approval for file operations:

```tsx
<Confirmation approval={approval} state={state}>
  <ConfirmationRequest>
    This tool wants to delete the file: <code>{filePath}</code>
    <p className="text-sm text-muted-foreground mt-2">
      This action cannot be undone.
    </p>
  </ConfirmationRequest>
  <ConfirmationActions>
    <ConfirmationAction variant="outline" onClick={handleReject}>
      Cancel
    </ConfirmationAction>
    <ConfirmationAction variant="destructive" onClick={handleApprove}>
      Delete
    </ConfirmationAction>
  </ConfirmationActions>
</Confirmation>
```

### Database Operations

Request approval for database changes:

```tsx
<Confirmation approval={approval} state={state}>
  <ConfirmationRequest>
    This tool wants to execute a database query:
    <pre className="bg-muted p-2 rounded mt-2 text-sm overflow-auto">
      {query}
    </pre>
  </ConfirmationRequest>
  <ConfirmationActions>
    <ConfirmationAction variant="outline" onClick={handleReject}>
      Reject
    </ConfirmationAction>
    <ConfirmationAction variant="default" onClick={handleApprove}>
      Execute
    </ConfirmationAction>
  </ConfirmationActions>
</Confirmation>
```

### API Calls

Request approval for external API calls:

```tsx
<Confirmation approval={approval} state={state}>
  <ConfirmationRequest>
    This tool wants to call: <code>{apiEndpoint}</code>
    <p className="text-sm text-muted-foreground mt-2">
      Method: {method}
    </p>
  </ConfirmationRequest>
  <ConfirmationActions>
    <ConfirmationAction variant="outline" onClick={handleReject}>
      Deny
    </ConfirmationAction>
    <ConfirmationAction variant="default" onClick={handleApprove}>
      Allow
    </ConfirmationAction>
  </ConfirmationActions>
</Confirmation>
```

## Styling

The component uses Tailwind CSS:

- Automatic dark mode support
- CSS variable integration
- Customizable through className prop
- Alert-based styling
- Responsive layout

## Accessibility

- Semantic HTML structure
- ARIA labels for buttons
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios
- Focus management

## Best Practices

1. **Clear descriptions**: Explain what the tool will do
2. **Show details**: Display relevant parameters or data
3. **Warn about consequences**: Highlight potential impacts
4. **Provide context**: Show why approval is needed
5. **Quick actions**: Make approve/reject buttons prominent
6. **Feedback**: Confirm user's choice with visual feedback

## Security Considerations

- Always require approval for dangerous operations
- Display full details of what will be executed
- Log approval decisions for audit trails
- Implement rate limiting for repeated requests
- Consider timeout for approval requests

## Related Components

- [Message](/docs/components/message) - Display messages
- [Tool](/docs/components/tool) - Tool display
- [Conversation](/docs/components/conversation) - Chat interface

---

**Last Updated:** February 2026
**Component Version:** Latest
