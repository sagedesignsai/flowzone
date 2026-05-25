# Markdown

AST builder functions and utilities for programmatic message formatting.

The SDK uses mdast (Markdown AST) as the canonical format for message formatting.

```typescript
import {
  root, paragraph, text, strong, emphasis, strikethrough,
  inlineCode, codeBlock, link, blockquote,
  parseMarkdown, stringifyMarkdown, toPlainText, walkAst,
  tableToAscii, tableElementToAscii,
} from "chat";
```

## Node builders

### root

Root node — the required top-level wrapper for an AST.

```typescript
root([paragraph([text("Hello, world!")])])
```

### paragraph

A paragraph block.

```typescript
paragraph([text("Hello "), strong([text("world")])])
```

### text

Plain text node.

```typescript
text("Hello, world!")
```

### strong

**Bold** text.

```typescript
strong([text("important")])
```

### emphasis

*Italic* text.

```typescript
emphasis([text("emphasized")])
```

### strikethrough

~~Strikethrough~~ text.

```typescript
strikethrough([text("removed")])
```

### inlineCode

`Inline code` span.

```typescript
inlineCode("const x = 1")
```

### codeBlock

Fenced code block with optional language.

```typescript
codeBlock("const x = 1;", "typescript")
```

### link

Hyperlink.

```typescript
link("https://example.com", [text("click here")])
link("https://example.com", [text("click here")], "tooltip title")
```

### blockquote

Block quotation.

```typescript
blockquote([paragraph([text("Quoted text")])])
```

## Parsing and stringifying

### parseMarkdown

Parse a markdown string into an mdast AST.

```typescript
const ast = parseMarkdown("**Hello** world");
```

### stringifyMarkdown

Convert an mdast AST back to a markdown string.

```typescript
const md = stringifyMarkdown(ast); // "**Hello** world"
```

### toPlainText

Strip all formatting and return plain text.

```typescript
const plain = toPlainText(ast); // "Hello world"
```

### markdownToPlainText

Shorthand for parsing markdown and extracting plain text.

```typescript
const plain = markdownToPlainText("**Hello** world"); // "Hello world"
```

## AST utilities

### walkAst

Transform an AST by visiting each node.

```typescript
const transformed = walkAst(ast, (node) => {
  if (isStrongNode(node)) {
    return emphasis(getNodeChildren(node));
  }
  return undefined;
});
```

### Type guards

Functions for checking node types:

- `isTextNode(node)` - Plain text
- `isParagraphNode(node)` - Paragraph
- `isStrongNode(node)` - Bold
- `isEmphasisNode(node)` - Italic
- `isDeleteNode(node)` - Strikethrough
- `isInlineCodeNode(node)` - Inline code
- `isCodeNode(node)` - Code block
- `isLinkNode(node)` - Link
- `isBlockquoteNode(node)` - Blockquote
- `isListNode(node)` - List
- `isTableNode(node)` - Table

### getNodeChildren / getNodeValue

Safely access node properties without type narrowing.

```typescript
const children = getNodeChildren(node); // Content[] | undefined
const value = getNodeValue(node); // string | undefined
```

## Table utilities

### tableToAscii

Render an mdast `Table` node as a padded ASCII table string.

### tableElementToAscii

Render a table from headers and string row arrays as a padded ASCII table.

---

**Source:** https://chat-sdk.dev/docs/api/markdown
