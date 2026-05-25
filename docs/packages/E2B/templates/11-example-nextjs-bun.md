# Examples: Next.js App (Bun)

## Overview
Next.js web app running in the sandbox using Bun runtime with Tailwind CSS and shadcn UI.

## Template Definition

```typescript
// template.ts
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromBunImage('1.3')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'bun create next-app --app --ts --tailwind --turbopack --yes --use-bun .'
  )
  .runCmd('bunx --bun shadcn@latest init -d')
  .runCmd('bunx --bun shadcn@latest add --all')
  .runCmd(
    'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app'
  )
  .setWorkdir('/home/user')
  .setStartCmd('bun --bun run dev --turbo', waitForURL('http://localhost:3000'));
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as nextJSTemplate } from './template';

Template.build(nextJSTemplate, 'nextjs-app-bun', {
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
});
```

## Features

- Bun 1.3 runtime for faster execution
- Next.js with TypeScript
- Tailwind CSS for styling
- shadcn UI component library
- Turbopack for ultra-fast builds
- Hot module reloading
- Development server on port 3000

## Advantages of Bun

- **Faster startup**: Bun starts significantly faster than Node.js
- **Better performance**: Optimized JavaScript runtime
- **Built-in tools**: Includes bundler, transpiler, and package manager
- **Drop-in replacement**: Compatible with Node.js APIs
- **Improved build times**: Faster compilation and bundling

## Use Cases

1. High-performance Next.js applications
2. Rapid development iteration
3. Performance-critical applications
4. Full-stack web application testing
5. API route testing
6. Web application CI/CD with faster builds

## Access Application

Once the sandbox is running:
- **Web URL**: http://localhost:3000
- **Development Server**: Automatically started
- **Hot Reload**: Enabled by default

## Common Bun Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Run linting
bun run lint

# Format code
bun run format

# Install dependencies
bun install

# Run scripts
bun run script-name
```

## Project Structure

```
/home/user/
├── app/                 # App router directory
├── components/          # React components
├── lib/                 # Utility functions
├── public/              # Static assets
├── styles/              # Global styles
├── bunfig.toml          # Bun configuration
├── package.json
├── tsconfig.json
└── next.config.js
```

## Development Workflow

1. Modify component files
2. Changes automatically reload (faster with Bun)
3. View updates in browser
4. Test API routes
5. Build for production

## Performance Considerations

- Allocate 4 CPU cores and 4GB memory for optimal performance
- Bun provides significantly faster build times
- Turbopack with Bun offers exceptional performance
- Hot reload is faster with Bun's optimized runtime

## Troubleshooting

- Clear `.next` directory if experiencing issues
- Check port 3000 availability
- Verify Bun version compatibility
- Review Bun documentation for specific issues

## Customization

- Add environment variables in `.env.local`
- Configure Next.js in `next.config.js`
- Configure Bun in `bunfig.toml`
- Add custom components to `components/` directory
- Extend Tailwind configuration in `tailwind.config.js`

## Migration from Node.js

If migrating from Node.js:
1. Replace `npm` with `bun`
2. Update scripts in `package.json`
3. Test thoroughly for compatibility
4. Enjoy improved performance
