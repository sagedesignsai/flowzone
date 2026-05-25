# AI Elements - Skill Guide

## Enhance Your AI Coding Agent with Knowledge About AI Elements

We maintain a skill that gives your AI coding agent procedural knowledge about how to use AI Elements.

## What is a Skill?

Skills are curated knowledge packages that enhance AI coding agents. When you install a skill, your agent gains context about specific libraries, patterns, and best practices—so it can help you more effectively.

### Benefits of Skills

- **Contextual Knowledge** - Your AI agent understands library-specific patterns
- **Better Suggestions** - Get more accurate code suggestions and completions
- **Faster Development** - Reduce time spent looking up documentation
- **Best Practices** - Learn recommended patterns and conventions
- **Troubleshooting** - Get help with common issues and solutions

## Installation

Install the AI Elements skill with:

```bash
npx skills add vercel/ai-elements
```

### What Gets Installed

Once installed, your agent understands:

- **Component Installation** - How to install and use AI Elements components
- **Composable Patterns** - How to compose components together
- **AI SDK Integration** - How to integrate with AI SDK hooks
- **shadcn/ui Theming** - How to customize themes and styling
- **Troubleshooting** - Solutions to common issues

## Using the Skill

After installation, your AI coding agent can:

### Generate Component Code

Ask your agent to create components:
```
"Create a chat interface with AI Elements components"
"Build a message component that handles streaming"
"Generate a prompt input with file attachments"
```

### Suggest Improvements

Get suggestions for your code:
```
"How can I improve this message component?"
"What's the best way to handle streaming in AI Elements?"
"How do I customize the theme for my chat interface?"
```

### Troubleshoot Issues

Get help with problems:
```
"Why aren't my components styled?"
"How do I fix theme switching?"
"What's wrong with my component imports?"
```

### Explain Patterns

Learn about best practices:
```
"Explain composability in AI Elements"
"What are the best practices for using AI Elements?"
"How do I integrate AI Elements with the AI SDK?"
```

## Supported AI Agents

The AI Elements skill works with:

- **Cursor** - AI-powered code editor
- **Codeium** - AI code completion
- **GitHub Copilot** - AI pair programmer
- **Other LLM-based tools** - Any tool that supports skills

### Setting Up with Cursor

1. Install the skill:
```bash
npx skills add vercel/ai-elements
```

2. The skill is automatically available in Cursor

3. Use Cursor's AI features to get AI Elements suggestions

### Setting Up with Codeium

1. Install the skill:
```bash
npx skills add vercel/ai-elements
```

2. Configure Codeium to use the skill

3. Get AI Elements suggestions in your editor

## Skill Contents

The AI Elements skill includes:

### Component Documentation
- All available components
- Component props and types
- Usage examples
- Integration patterns

### Best Practices
- Composability patterns
- Accessibility guidelines
- Performance optimization
- Theming and customization

### Common Patterns
- Chat interfaces
- Message handling
- Streaming content
- File attachments

### Troubleshooting Guides
- Common issues and solutions
- Setup problems
- Styling issues
- Integration problems

## Updating the Skill

Keep your skill up to date:

```bash
# Update to the latest version
npx skills update vercel/ai-elements
```

### Check Skill Version

```bash
# List installed skills
npx skills list

# Check specific skill version
npx skills info vercel/ai-elements
```

## Browse More Skills

Visit [skills.sh](https://skills.sh) to discover skills for other libraries and frameworks:

- **React** - React patterns and best practices
- **Next.js** - Next.js framework guidance
- **TypeScript** - TypeScript type patterns
- **Tailwind CSS** - Tailwind CSS utilities
- **shadcn/ui** - shadcn/ui components
- And many more...

## Creating Custom Skills

You can create custom skills for your own libraries:

1. **Define Knowledge** - Document your library's patterns
2. **Create Skill Package** - Package the knowledge
3. **Publish** - Share with your team or community
4. **Maintain** - Keep the skill updated

See the [skills.sh documentation](https://skills.sh/docs) for more information.

## Troubleshooting Skills

### Skill Not Found

If the skill isn't found:

```bash
# Verify skill is installed
npx skills list

# Reinstall the skill
npx skills add vercel/ai-elements
```

### Agent Not Using Skill

If your AI agent isn't using the skill:

1. Verify the skill is installed
2. Restart your editor/IDE
3. Check that your AI tool supports skills
4. Update to the latest version of the skill

### Outdated Information

If the skill provides outdated information:

1. Update the skill: `npx skills update vercel/ai-elements`
2. Restart your editor
3. Clear any caches
4. Report the issue on GitHub

## Contributing to the Skill

Help improve the AI Elements skill:

1. **Report Issues** - Found incorrect information? Open an issue
2. **Suggest Improvements** - Have ideas for better suggestions?
3. **Add Examples** - Contribute new usage examples
4. **Improve Documentation** - Help clarify confusing sections

## Feedback

We'd love to hear your feedback about the skill:

- What's working well?
- What could be improved?
- What information is missing?
- How can we make it more helpful?

Share your feedback on [GitHub](https://github.com/vercel/ai-elements/issues).

## Related Resources

- **AI Elements Documentation** - Full documentation at [elements.ai-sdk.dev](https://elements.ai-sdk.dev)
- **AI SDK Documentation** - Learn about the AI SDK at [ai-sdk.dev](https://ai-sdk.dev)
- **shadcn/ui** - Component library at [ui.shadcn.com](https://ui.shadcn.com)
- **Skills.sh** - Discover more skills at [skills.sh](https://skills.sh)

## Next Steps

1. Install the skill: `npx skills add vercel/ai-elements`
2. Start using your AI agent to build with AI Elements
3. Explore the [component library](/components)
4. Check out the [examples](/examples)
