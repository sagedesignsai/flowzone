# Examples: Expo

## Overview
Expo web app running in the sandbox using Node.js.

## Template Definition

```typescript
// template.ts
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromNodeImage()
  .setWorkdir("/home/user/expo-app")
  .runCmd("npx create-expo-app@latest . --yes")
  .runCmd("mv /home/user/expo-app/* /home/user/ && rm -rf /home/user/expo-app")
  .setWorkdir("/home/user")
  .setStartCmd("npx expo start", waitForURL("http://localhost:8081"));
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as expoTemplate } from './template';

Template.build(expoTemplate, 'expo-app', {
  cpuCount: 4,
  memoryMB: 8192,
  onBuildLogs: defaultBuildLogger(),
});
```

## Features

- Expo development server running on port 8081
- React Native web development environment
- Hot module reloading
- Development tools and debugging capabilities
- Automatic app initialization

## Use Cases

1. React Native web development
2. Mobile app testing
3. Cross-platform app development
4. Expo project testing
5. Mobile app CI/CD

## Access Expo

Once the sandbox is running:
- **Web URL**: http://localhost:8081
- **Development Server**: Automatically started
- **Hot Reload**: Enabled by default

## Common Expo Commands

```bash
# Start development server
npx expo start

# Build for web
npx expo export --platform web

# Run on specific platform
npx expo start --web
npx expo start --ios
npx expo start --android

# Clear cache
npx expo start --clear
```

## Performance Considerations

- Allocate 4 CPU cores and 8GB memory for optimal performance
- Build process takes several minutes
- Hot reload requires file watching
- Consider network bandwidth for development

## Development Workflow

1. Create Expo project
2. Modify app code
3. Hot reload automatically updates
4. Test on web platform
5. Build for production

## Troubleshooting

- Clear cache if experiencing issues: `npx expo start --clear`
- Check port 8081 availability
- Verify Node.js version compatibility
- Review Expo documentation for specific issues
