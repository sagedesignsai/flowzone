# Modals

Modal form components for collecting user input.

Modals display form dialogs that collect structured user input. Currently supported on Slack.

```typescript
import { Modal, TextInput, Select, RadioSelect, SelectOption } from "chat";
```

## Modal

Top-level container for a form dialog. Open a modal from an `onAction` or `onSlashCommand` handler using `event.openModal()`.

```typescript
bot.onAction("open-form", async (event) => {
  await event.openModal(
    Modal({
      callbackId: "feedback",
      title: "Submit Feedback",
      submitLabel: "Send",
      children: [
        TextInput({ id: "comment", label: "Comment", multiline: true }),
      ],
    })
  );
});
```

## TextInput

A text input field.

```typescript
TextInput({
  id: "name",
  label: "Your name",
  placeholder: "Enter your name",
})

TextInput({
  id: "description",
  label: "Description",
  multiline: true,
  maxLength: 500,
  optional: true,
})
```

## Select

Dropdown menu.

```typescript
Select({
  id: "priority",
  label: "Priority",
  placeholder: "Select priority",
  options: [
    SelectOption({ label: "High", value: "high", description: "Urgent tasks" }),
    SelectOption({ label: "Medium", value: "medium" }),
    SelectOption({ label: "Low", value: "low" }),
  ],
})
```

## RadioSelect

Radio button group for mutually exclusive choices.

```typescript
RadioSelect({
  id: "status",
  label: "Status",
  options: [
    SelectOption({ label: "Open", value: "open" }),
    SelectOption({ label: "Closed", value: "closed" }),
  ],
})
```

## SelectOption

An option used inside `Select` and `RadioSelect`.

```typescript
SelectOption({ label: "High", value: "high", description: "Urgent tasks" })
```

---

**Source:** https://chat-sdk.dev/docs/api/modals
