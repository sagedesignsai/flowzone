# AI Elements - Setup Guide

## Get AI Elements Installed and Running in Your Project

This guide walks you through setting up AI Elements in your project.

## Prerequisites

Before installing AI Elements, ensure your environment meets these requirements:

- **Node.js** 18 or later
- **React** 19
- **Next.js** 14+ (App Router recommended)
- **AI SDK** installed and configured
- **shadcn/ui** initialized in your project
- **Tailwind CSS** 4

If you don't have shadcn/ui installed, running any AI Elements install command will automatically set it up for you.

## AI Gateway (Recommended)

We recommend using AI Gateway for model access as it offers:
- Single API key for multiple model providers
- Built-in fallback support
- Unified billing
- Better observability

### Setup AI Gateway

1. Add `AI_GATEWAY_API_KEY` to your `.env.local` file:
```
AI_GATEWAY_API_KEY=your_api_key_here
```

2. Get your API key from the Vercel dashboard

3. Use it with the AI SDK by specifying a model string:
```typescript
const model = "anthropic/claude-sonnet-4.5";
```

## Installing Components

Use the AI Elements CLI to add components:

### Using AI Elements CLI
```bash
npx ai-elements@latest add message
```

### Using shadcn CLI
```bash
npx shadcn@latest add @ai-elements/message
```

Components are added to `@/components/ai-elements/` by default.

### Installing Multiple Components
```bash
npx ai-elements@latest add message conversation prompt-input
```

### Viewing Available Components
```bash
npx ai-elements@latest list
```

## Verify Installation

After installing a component, verify it works:

### 1. Check File Exists
Verify the component file exists in your components directory:
```
components/ai-elements/message.tsx
```

### 2. Import and Use in a Page
Create a test page to verify the component:

```tsx
// app/page.tsx
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export default function Page() {
  return (
    <Message from="assistant">
      <MessageContent>
        <MessageResponse>Hello, world!</MessageResponse>
      </MessageContent>
    </Message>
  );
}
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and confirm the component renders correctly.

## Project Structure

After installation, your project structure should look like:

```
your-project/
├── app/
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── ai-elements/
│   │   ├── message.tsx
│   │   ├── conversation.tsx
│   │   └── prompt-input.tsx
│   └── ui/
│       └── button.tsx
├── lib/
│   └── utils.ts
├── .env.local
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Configuration Files

### tailwind.config.ts
Ensure your Tailwind config includes the components directory:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

### tsconfig.json
Ensure path aliases are configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Environment Variables

Create a `.env.local` file in your project root:

```
# AI Gateway
AI_GATEWAY_API_KEY=your_api_key_here

# Optional: API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Troubleshooting

### Components Not Styled
Make sure your project is configured correctly for shadcn/ui in Tailwind 4:
- Check that `globals.css` imports Tailwind
- Verify shadcn/ui base styles are included
- Ensure Tailwind CSS 4 is installed

### CLI Command Not Working
- Verify you're in the project root directory
- Check that `package.json` exists
- Update to latest version: `npx ai-elements@latest`

### Import Errors
- Verify the component file exists
- Check `tsconfig.json` has correct path aliases
- Ensure `@/` alias points to project root

## Next Steps

- [Usage Guide](/docs/usage) - Learn how to use components
- [Component Library](/components) - Browse all available components
- [Examples](/examples) - See real-world implementations
- [Troubleshooting](/docs/troubleshooting) - Get help with common issues

## Getting Help

If you run into issues:
1. Check the troubleshooting guide
2. Review the documentation
3. Search GitHub issues
4. Open a new issue with details about your problem
