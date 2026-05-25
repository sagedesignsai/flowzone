# AI Elements - How to Contribute

## Learn How to Contribute to AI Elements

AI Elements welcomes contributions from the community. Here's how you can help.

## Types of Contributions

### Bug Reports
Found something broken? Open an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node version, framework, etc.)

### Documentation
Help improve the docs by:
- Fixing typos and unclear explanations
- Adding code examples
- Improving component documentation
- Writing tutorials

### Bug Fixes
Fix issues in existing components. Check the open issues for bugs to tackle.

### New Components
Add components that help developers build AI interfaces. See New Components guide for requirements.

### Enhancements
Improve existing components with:
- Better accessibility
- New features
- Performance improvements
- Improved TypeScript types

## Getting Started

### 1. Fork the Repository
Create a fork of the AI Elements repository on GitHub.

### 2. Clone Your Fork
```bash
git clone https://github.com/your_username_here/ai-elements.git
cd ai-elements
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Create a Branch
```bash
git checkout -b feature/your_feature_name_here
```

Use descriptive branch names:
- `fix/component-name-issue` for bug fixes
- `feat/new-component-name` for new components
- `docs/improve-section` for documentation
- `perf/optimization-description` for performance improvements

### 5. Make Your Changes
- Follow the project's code style
- Write clear, descriptive commit messages
- Keep changes focused and atomic

### 6. Run Tests and Linting
```bash
pnpm test
pnpm run check
```

Ensure all tests pass and linting is clean before submitting.

### 7. Submit a Pull Request
Push your branch and create a pull request with:
- Clear title describing the change
- Detailed description of what changed and why
- Screenshots for visual changes
- Reference to related issues

## Pull Request Guidelines

### One Feature or Fix Per PR
Keep pull requests focused on a single change. This makes review easier and faster.

### Write a Clear Description
Explain:
- What problem does this solve?
- How does it solve it?
- Are there any breaking changes?
- What testing was done?

### Include Screenshots for Visual Changes
If your change affects UI, include before/after screenshots.

### Update Documentation if Needed
- Update component docs if changing component behavior
- Update README if changing setup process
- Add examples if adding new features

### Ensure Tests Pass
- All existing tests must pass
- Add new tests for new functionality
- Aim for good test coverage

## Code Style Guidelines

### TypeScript
- Export all prop types
- Use proper generics where needed
- Avoid `any` types
- Use strict mode

### Component Patterns
- Use `cn()` for class merging
- Extend HTML primitive attributes
- Use CSS variables for theming
- Match existing naming conventions

### Accessibility
- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers

### Performance
- Minimize re-renders
- Use React.memo where appropriate
- Avoid unnecessary state updates
- Profile before optimizing

## Development Workflow

### Local Development
```bash
# Start development server
pnpm dev

# Run tests in watch mode
pnpm test --watch

# Run linting
pnpm run lint

# Run type checking
pnpm run type-check
```

### Testing Your Changes
1. Test in the example applications
2. Test with different browsers
3. Test keyboard navigation
4. Test with screen readers
5. Test responsive design

## Commit Message Guidelines

Write clear, descriptive commit messages:

```
feat: add new component feature
fix: resolve component styling issue
docs: improve setup documentation
perf: optimize component rendering
test: add tests for component behavior
```

## Review Process

Maintainers will review for:
- Alignment with library goals
- Code quality and patterns
- Documentation completeness
- Accessibility compliance
- AI SDK integration
- Test coverage

Expect feedback and iteration. Quality components take time to get right.

## Common Issues

### Tests Failing
- Run `pnpm test` to see detailed errors
- Check that dependencies are installed
- Ensure Node.js version is 18+

### Linting Errors
- Run `pnpm run check` to see issues
- Most can be auto-fixed with `pnpm run format`
- Follow the project's Biome configuration

### Build Errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check TypeScript errors: `pnpm run type-check`
- Verify all imports are correct

## Getting Help

If you need help:
1. Check existing issues and discussions
2. Ask in GitHub discussions
3. Comment on related issues
4. Reach out to maintainers

## Recognition

Contributors are recognized in:
- Release notes for significant contributions
- GitHub contributors page
- Project documentation

Your work helps developers worldwide build better AI applications.

## Thank You

Thank you for contributing to AI Elements! Your efforts make the library better for everyone.
