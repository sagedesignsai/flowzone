# Examples: Next.js App

## Overview
Next.js web app running in the sandbox using Node.js with Tailwind CSS and shadcn UI.

## Template Definition

```typescript
// template.ts
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromNodeImage('21-slim')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir'
  )
  .runCmd('npx shadcn@2.1.7 init -d')
  .runCmd('npx shadcn@2.1.7 add --all')
  .runCmd(
    'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app'
  )
  .setWorkdir('/home/user')
  .setStartCmd('npx next --turbo', waitForURL('http://localhost:3000'));
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as nextJSTemplate } from './template';

Template.build(nextJSTemplate, 'nextjs-app', {
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
});
```

## Features

- Next.js 14.2.30 with TypeScript
- Tailwind CSS for styling
- shadcn UI component library
- Turbopack for fast development
- Hot module reloading
- Development server on port 3000

## Use Cases

1. Next.js application development
2. Full-stack web application testing
3. API route testing
4. Server-side rendering testing
5. Static site generation testing
6. Web application CI/CD

## Access Application

Once the sandbox is running:
- **Web URL**: http://localhost:3000
- **Development Server**: Automatically started
- **Hot Reload**: Enabled by default

## Common Next.js Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format
```

## Project Structure

```
/home/user/
├── app/                 # App router directory
├── components/          # React components
├── lib/                 # Utility functions
├── public/              # Static assets
├── styles/              # Global styles
├── package.json
├── tsconfig.json
└── next.config.js
```

## Development Workflow

1. Modify component files
2. Changes automatically reload
3. View updates in browser
4. Test API routes
5. Build for production

## Performance Considerations

- Allocate 4 CPU cores and 4GB memory for optimal performance
- Build process takes several minutes
- Turbopack provides faster development builds
- Hot reload requires file watching

## Troubleshooting

- Clear `.next` directory if experiencing issues
- Check port 3000 availability
- Verify Node.js version compatibility
- Review Next.js documentation for specific issues

## Customization

- Add environment variables in `.env.local`
- Configure Next.js in `next.config.js`
- Add custom components to `components/` directory
- Extend Tailwind configuration in `tailwind.config.js`
