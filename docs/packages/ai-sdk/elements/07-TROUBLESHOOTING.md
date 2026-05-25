# AI Elements - Troubleshooting Guide

## What to Do If You Run Into Issues with AI Elements

## Why Are My Components Not Styled?

Make sure your project is configured correctly for shadcn/ui in Tailwind 4. This means having a `globals.css` file that imports Tailwind and includes the shadcn/ui base styles.

### Check Your globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    /* ... more CSS variables */
  }
}
```

### Verify Tailwind Configuration

Ensure your `tailwind.config.ts` includes the components directory:

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

### Check Next.js Layout

Verify your layout imports the global styles:

```tsx
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## I Ran the AI Elements CLI but Nothing Was Added to My Project

Double-check that:

### 1. Correct Working Directory
Your current working directory is the root of your project (where `package.json` lives).

```bash
# Verify you're in the right directory
ls package.json
```

### 2. components.json Configuration
Your `components.json` file (if using shadcn-style config) is set up correctly.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "aliasPrefix": "@",
  "components": "@/components/ai-elements",
  "utils": "@/lib/utils"
}
```

### 3. Latest CLI Version
You're using the latest version of the AI Elements CLI:

```bash
npx ai-elements@latest
```

### 4. Check for Errors
Look for error messages in the terminal output. Common issues:
- Missing dependencies
- Permission errors
- Invalid configuration

### 5. Manual Installation
If the CLI fails, you can manually copy components:

1. Visit the AI Elements GitHub repository
2. Copy the component file from `packages/elements/src/`
3. Paste into your `components/ai-elements/` directory
4. Install any missing dependencies

## Theme Switching Doesn't Work — My App Stays in Light Mode

Ensure your app is using the same data-theme system that shadcn/ui and AI Elements expect. The default implementation toggles a `data-theme` attribute on the `<html>` element.

### Check Your Theme Provider

```tsx
"use client"

import { useEffect, useState } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  return (
    <div>
      {children}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}
```

### Verify Tailwind Configuration

Make sure your `tailwind.config.ts` uses class or data- selectors:

```typescript
const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  // ... rest of config
}
```

### Check CSS Variables

Ensure dark mode CSS variables are defined:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    /* ... more variables */
  }
}

[data-theme="dark"] {
  --background: 0 0% 3.6%;
  --foreground: 0 0% 98%;
  /* ... more variables */
}
```

## The Component Imports Fail with "Module Not Found"

Check that the file exists. If it does, make sure your `tsconfig.json` has a proper paths alias for `@/`.

### Verify File Exists

```bash
# Check if the component file exists
ls components/ai-elements/message.tsx
```

### Check tsconfig.json

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

### Verify Import Path

Make sure you're using the correct import path:

```tsx
// Correct
import { Message } from "@/components/ai-elements/message"

// Incorrect
import { Message } from "./components/ai-elements/message"
import { Message } from "ai-elements/message"
```

### Clear Cache

Sometimes the TypeScript cache needs to be cleared:

```bash
# Remove .next directory
rm -rf .next

# Restart development server
npm run dev
```

## My AI Coding Assistant Can't Access AI Elements Components

If your AI coding assistant (like Cursor or Codeium) can't find AI Elements components:

### 1. Verify Config File Syntax
Ensure your configuration file is valid JSON:

```bash
# Validate JSON
cat components.json | jq .
```

### 2. Check File Path
Verify the file path is correct for your AI tool:

```bash
# For Cursor
~/.cursor/rules/ai-elements.json

# For Codeium
~/.codeium/rules/ai-elements.json
```

### 3. Restart AI Tool
Restart your coding assistant after making changes:
- Close and reopen your editor
- Restart the AI tool process
- Clear any caches

### 4. Check Internet Connection
Ensure you have a stable internet connection for the AI tool to fetch component information.

### 5. Verify Component Installation
Make sure components are actually installed:

```bash
# List installed components
ls components/ai-elements/
```

## Still Stuck?

If none of these answers help:

### 1. Check Documentation
Review the [setup guide](/docs/setup) and [usage guide](/docs/usage) for additional information.

### 2. Search GitHub Issues
Search the [GitHub issues](https://github.com/vercel/ai-elements/issues) to see if others have encountered the same problem.

### 3. Open a New Issue
If you can't find a solution, [open an issue on GitHub](https://github.com/vercel/ai-elements/issues) with:
- Clear description of the problem
- Steps to reproduce
- Your environment (Node version, OS, etc.)
- Error messages or screenshots
- Minimal code example

### 4. Ask for Help
- Comment on related issues
- Ask in GitHub discussions
- Reach out to the maintainers

## Common Error Messages

### "Cannot find module '@/components/ai-elements/message'"
- Check that the file exists
- Verify path alias in `tsconfig.json`
- Clear `.next` directory and restart dev server

### "Tailwind CSS classes not applied"
- Verify `globals.css` imports Tailwind
- Check `tailwind.config.ts` includes components directory
- Ensure Tailwind CSS 4 is installed

### "Component not rendering"
- Check browser console for errors
- Verify component is imported correctly
- Check that required props are provided
- Ensure parent components are set up correctly

### "Type errors in component"
- Verify TypeScript types are imported
- Check prop types match component interface
- Update TypeScript version if needed

## Performance Issues

### Components Rendering Slowly
- Check for unnecessary re-renders
- Use React DevTools Profiler to identify bottlenecks
- Verify AI SDK hooks are configured correctly
- Check for large message lists (consider virtualization)

### High Memory Usage
- Monitor message history size
- Implement message pagination
- Clear old messages periodically
- Check for memory leaks in custom code

## Accessibility Issues

### Screen Reader Not Reading Content
- Verify semantic HTML is used
- Check ARIA attributes are present
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Review accessibility guidelines

### Keyboard Navigation Not Working
- Test Tab key navigation
- Verify focus management
- Check for keyboard event handlers
- Test with keyboard only

## Getting More Help

- **Documentation**: Review the full documentation at [elements.ai-sdk.dev](https://elements.ai-sdk.dev)
- **Examples**: Check the examples for working implementations
- **Community**: Join the community and ask questions
- **GitHub**: Open issues and discussions on GitHub
