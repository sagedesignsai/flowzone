# Cards

Send rich interactive cards with buttons, fields, and images across all platforms.

Cards let you send structured, interactive messages that render natively on each platform — Block Kit on Slack, Adaptive Cards on Teams, and Google Chat Cards.

## Setup

Configure your `tsconfig.json` to use the Chat SDK JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "chat"
  }
}
```

Or use a per-file pragma:

```typescript
/** @jsxImportSource chat */
```

## Basic card

```typescript
import { Card, CardText, Button, Actions } from "chat";

await thread.post(
  <Card title="Order #1234">
    <CardText>Your order has been received!</CardText>
    <Actions>
      <Button id="approve" style="primary">Approve</Button>
      <Button id="reject" style="danger">Reject</Button>
    </Actions>
  </Card>
);
```

## Components

### Card

The top-level container. Accepts `title` and optional `subtitle`.

```typescript
<Card title="My Card" subtitle="Optional subtitle">
  {/* children */}
</Card>
```

### CardText

Renders formatted text. Supports a subset of markdown.

```typescript
<CardText>**Bold** and _italic_ text</CardText>
<CardText style="bold">Bold section header</CardText>
```

Use `CardText` instead of `Text` when using JSX to avoid conflicts with React's built-in types.

### Section

Groups related content together.

```typescript
<Section>
  <CardText>Section content here</CardText>
</Section>
```

### Fields

Renders key-value pairs in a compact layout.

```typescript
<Fields>
  <Field label="Name" value="John Doe" />
  <Field label="Role" value="Developer" />
  <Field label="Team" value="Platform" />
</Fields>
```

### Button

An action button that triggers an `onAction` handler.

```typescript
<Button id="approve" style="primary">Approve</Button>
<Button id="reject" style="danger">Reject</Button>
<Button id="details">View Details</Button>
```

The `id` maps to your `onAction` handler. Optional `value` passes extra data:

```typescript
<Button id="report" value="bug">Report Bug</Button>
```

### CardLink

Inline hyperlink rendered as text. Unlike `LinkButton`, `CardLink` can be placed directly in a card alongside other content.

```typescript
<CardLink url="https://example.com/order/1234" label="View order details" />
```

Or with children as the label:

```typescript
<CardLink url="https://example.com/docs">Read the docs</CardLink>
```

### LinkButton

Opens an external URL. No `onAction` handler needed.

```typescript
<LinkButton url="https://example.com/order/1234">View Order</LinkButton>
```

### Actions

Container for buttons and interactive elements.

```typescript
<Actions>
  <Button id="approve" style="primary">Approve</Button>
  <Button id="reject" style="danger">Reject</Button>
  <LinkButton url="https://example.com">View</LinkButton>
</Actions>
```

### Select

Inline dropdown menu.

```typescript
<Actions>
  <Select id="priority" label="Priority" placeholder="Select priority">
    <SelectOption label="High" value="high" description="Urgent tasks" />
    <SelectOption label="Medium" value="medium" />
    <SelectOption label="Low" value="low" />
  </Select>
</Actions>
```

### RadioSelect

Radio button group for mutually exclusive choices.

```typescript
<Actions>
  <RadioSelect id="status" label="Status">
    <SelectOption label="Open" value="open" />
    <SelectOption label="In Progress" value="in_progress" />
    <SelectOption label="Done" value="done" />
  </RadioSelect>
</Actions>
```

### Table

Structured data display with column headers and rows.

```typescript
<Table
  headers={["Name", "Age", "Role"]}
  rows={[
    ["Alice", "30", "Engineer"],
    ["Bob", "25", "Designer"],
  ]}
/>
```

Optional column alignment:

```typescript
<Table
  headers={["Name", "Amount"]}
  rows={[["Alice", "$100"], ["Bob", "$200"]]}
  align={["left", "right"]}
/>
```

### Image

Embeds an image in the card.

```typescript
<Image url="https://example.com/screenshot.png" alt="Screenshot" />
```

### Divider

A visual separator between sections.

```typescript
<CardText>Above the line</CardText>
<Divider />
<CardText>Below the line</CardText>
```

## Full example

```typescript
import {
  Card, CardText, CardLink, Button, LinkButton, Actions,
  Section, Fields, Field, Divider, Image,
  Select, SelectOption, RadioSelect,
} from "chat";

await thread.post(
  <Card title="User Profile" subtitle="Account details">
    <Image url="https://example.com/avatar.png" alt="User avatar" />
    <Fields>
      <Field label="Name" value="Jane Smith" />
      <Field label="Role" value="Engineer" />
      <Field label="Team" value="Platform" />
    </Fields>
    <CardLink url="https://example.com/profile/123">View full profile</CardLink>
    <Divider />
    <Section>
      <CardText>Select an action below to manage this profile.</CardText>
    </Section>
    <Actions>
      <Select id="role" label="Change Role" placeholder="Select role">
        <SelectOption label="Engineer" value="engineer" />
        <SelectOption label="Manager" value="manager" />
        <SelectOption label="Admin" value="admin" />
      </Select>
      <Button id="edit" style="primary">Edit Profile</Button>
      <Button id="deactivate" style="danger">Deactivate</Button>
      <LinkButton url="https://example.com/profile/123">View Full Profile</LinkButton>
    </Actions>
  </Card>
);
```

---

**Source:** https://chat-sdk.dev/docs/cards
