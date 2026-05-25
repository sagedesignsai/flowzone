# AI Elements - Philosophy

## The Principles That Guide AI Elements Design and Development

AI Elements is built on core principles that shape every component and decision.

## Composability

Components are building blocks, not black boxes. You combine small, focused pieces to create exactly what you need.

```tsx
<Message from="assistant">
  <MessageContent>
    <MessageResponse>{text}</MessageResponse>
  </MessageContent>
  <MessageActions>
    <MessageAction label="Copy" onClick={handleCopy}>
      <CopyIcon />
    </MessageAction>
  </MessageActions>
</Message>
```

### Benefits

- **Flexibility** - Add, remove, or rearrange pieces
- **Control** - Style and configure each part independently
- **Clarity** - Understand exactly what renders
- **Reusability** - Combine pieces in different ways

### Why It Matters

Composability gives you the power to build exactly what you need without being constrained by rigid component structures. You're not locked into a specific layout or behavior.

## Simplicity

Do one thing well. Components have a clear purpose and minimal API surface. We avoid:

- Unnecessary props and options
- Complex configuration objects
- Hidden behavior

When in doubt, we leave it out. You can always extend components in your codebase.

### Benefits

- **Easy to understand** - Clear purpose and behavior
- **Easy to use** - Minimal learning curve
- **Easy to extend** - Add functionality as needed
- **Easy to maintain** - Less code to maintain

### Why It Matters

Simple components are easier to understand, use, and maintain. They're also more flexible because you can extend them for your specific needs without fighting against complex APIs.

## Accessibility

Every component follows accessibility best practices:

- Semantic HTML elements
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Sufficient color contrast

Accessibility isn't an afterthought—it's built into component architecture from the start.

### Benefits

- **Inclusive** - Works for everyone
- **Legal compliance** - Meets WCAG 2.1 AA standards
- **Better UX** - Benefits all users
- **SEO friendly** - Better search engine visibility

### Why It Matters

Accessibility is a fundamental right. Building accessible components from the start ensures your AI applications work for everyone, regardless of ability.

## Performance

Components are optimized for real-world AI applications:

- Minimal re-renders during streaming
- Efficient DOM updates
- Tree-shakeable exports
- No runtime CSS-in-JS

### Benefits

- **Fast** - Smooth user experience
- **Efficient** - Lower resource usage
- **Scalable** - Handles large conversations
- **Mobile-friendly** - Works well on all devices

### Why It Matters

Performance matters for user experience. Streaming AI responses require efficient rendering to avoid jank and provide smooth interactions.

## Developer Experience

Building AI interfaces should feel natural:

- **Familiar patterns** - Standard React props and hooks
- **TypeScript first** - Full type safety and autocomplete
- **Good defaults** - Works out of the box
- **Full control** - Customize when needed

### Benefits

- **Quick to learn** - Familiar React patterns
- **Type safe** - Catch errors early
- **Productive** - Get started quickly
- **Flexible** - Customize as needed

### Why It Matters

Developers spend most of their time reading and modifying code. Good developer experience means faster development, fewer bugs, and happier developers.

## AI SDK Alignment

Components integrate deeply with the AI SDK:

- Props match AI SDK types
- Hooks work seamlessly
- Streaming behavior is handled correctly
- Status states are built-in

### Benefits

- **Seamless integration** - Works naturally with AI SDK
- **Type safety** - Props align with AI SDK types
- **Less boilerplate** - Less code to write
- **Better streaming** - Optimized for streaming responses

### Why It Matters

AI Elements is built specifically for AI applications. Deep integration with the AI SDK means less friction and more natural development experience.

## shadcn/ui Foundation

AI Elements builds on shadcn/ui conventions:

- Components live in your codebase
- CSS variables for theming
- Tailwind CSS for styling
- Copy-paste friendly

### Benefits

- **Full control** - Components are in your codebase
- **Easy theming** - CSS variables for customization
- **Consistent** - Works with existing shadcn/ui setup
- **No lock-in** - You own the code

### Why It Matters

shadcn/ui's approach of putting components in your codebase gives you full control and flexibility. You can modify components without waiting for library updates.

## Open Source

AI Elements is open source and community-driven:

- Transparent development
- Community contributions welcome
- No vendor lock-in
- Apache 2.0 license

### Benefits

- **Transparent** - See how components are built
- **Community-driven** - Shaped by users
- **No lock-in** - Use anywhere
- **Sustainable** - Community support

### Why It Matters

Open source means you're not locked into a vendor. You can contribute, fork, or use the code however you need. The community helps ensure the project stays relevant and useful.

## Design Decisions

### Why Composability Over Configuration

We chose composability over configuration because:
- Configuration objects become complex quickly
- Composability is more flexible
- You can see exactly what renders
- It's easier to understand and modify

### Why shadcn/ui Over npm Package

We chose shadcn/ui's approach because:
- You own the code
- You can modify components freely
- No hidden dependencies
- Full control over updates

### Why TypeScript First

We chose TypeScript because:
- Catches errors early
- Better developer experience
- Self-documenting code
- Easier to maintain

### Why Tailwind CSS

We chose Tailwind CSS because:
- Utility-first approach is flexible
- CSS variables for theming
- Great performance
- Large community

## Guiding Questions

When making decisions about AI Elements, we ask:

1. **Does it solve an AI-specific problem?** - Is this unique to AI applications?
2. **Is it composable?** - Can it be broken into smaller pieces?
3. **Is it simple?** - Does it have a clear purpose and minimal API?
4. **Is it accessible?** - Does it work for everyone?
5. **Is it performant?** - Does it work well with streaming?
6. **Is it developer-friendly?** - Is it easy to use and understand?
7. **Does it align with AI SDK?** - Does it work naturally with the AI SDK?
8. **Is it open source?** - Can the community contribute?

## Evolution

AI Elements will continue to evolve based on:

- Community feedback
- Real-world usage patterns
- New AI capabilities
- Best practices in web development

We're committed to maintaining these principles while adapting to new needs and technologies.

## Contributing

If you're contributing to AI Elements, keep these principles in mind:

- Build composable components
- Keep it simple
- Ensure accessibility
- Optimize for performance
- Provide great developer experience
- Align with AI SDK
- Maintain open source values

## Summary

AI Elements is built on principles that prioritize:

1. **Composability** - Build exactly what you need
2. **Simplicity** - Clear purpose, minimal API
3. **Accessibility** - Works for everyone
4. **Performance** - Optimized for streaming
5. **Developer Experience** - Familiar and productive
6. **AI SDK Alignment** - Natural integration
7. **shadcn/ui Foundation** - Full control
8. **Open Source** - Community-driven

These principles guide every decision and ensure AI Elements remains a powerful, flexible, and user-friendly library for building AI applications.
