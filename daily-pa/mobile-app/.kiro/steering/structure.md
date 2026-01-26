# Project Structure

## Directory Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI primitives
│   └── navigation/     # Navigation-specific components
├── screens/            # Screen-level components (one per route)
├── services/           # Business logic and external integrations
│   ├── repositories/   # Data access layer
│   └── sync/          # Sync engine for offline-first
├── store/             # Zustand state management stores
├── models/            # Data models and types
├── navigation/        # Navigation configuration
├── hooks/             # Custom React hooks
├── contexts/          # React context providers
├── utils/             # Utility functions
├── theme/             # Design system (colors, spacing, etc.)
├── types/             # TypeScript type definitions
└── config/            # App configuration and env validation
```

## Code Organization Patterns

### Components (`src/components/`)
- Reusable UI components with TypeScript interfaces
- Use functional components with hooks
- Export named components (e.g., `export const Button`)
- Include JSDoc comments for complex components
- Co-locate styles using StyleSheet.create()

### Screens (`src/screens/`)
- One screen per file, named `*Screen.tsx`
- Handle navigation and screen-level state
- Compose smaller components from `src/components/`
- Use navigation hooks from React Navigation

### Services (`src/services/`)
- Business logic layer between UI and data
- Singleton pattern with exported instances (e.g., `export const todoService`)
- Handle API calls, data transformations, and side effects
- Services use repositories for data access
- Include error handling and offline support

### Repositories (`src/services/repositories/`)
- Data access layer for CRUD operations
- Abstract storage implementation details
- Return domain models, not raw data
- Handle local storage operations

### Stores (`src/store/`)
- Zustand stores for global state
- Named `*Store.ts` (e.g., `authStore.ts`)
- Export custom hooks (e.g., `useAuthStore`)
- Keep stores focused and minimal

### Models (`src/models/`)
- TypeScript interfaces and types for domain entities
- Enums for constants (TodoStatus, TodoColor, etc.)
- Export from `index.ts` for centralized imports

## File Naming Conventions

- **Components**: PascalCase (e.g., `Button.tsx`, `TodoForm.tsx`)
- **Screens**: PascalCase with `Screen` suffix (e.g., `LoginScreen.tsx`)
- **Services**: camelCase with `Service` suffix (e.g., `todoService.ts`)
- **Stores**: camelCase with `Store` suffix (e.g., `authStore.ts`)
- **Utilities**: camelCase (e.g., `validation.ts`)
- **Tests**: Same name as file with `.test.ts` or `.property.test.ts`

## Import Patterns

Use path aliases for cleaner imports:
```typescript
// Good
import { Button } from '@/components';
import { todoService } from '@/services/TodoService';
import { useAuthStore } from '@/store/authStore';

// Avoid
import { Button } from '../../../components';
```

## Testing Structure

- **Unit tests**: `*.test.ts` files co-located with source
- **Property tests**: `*.property.test.ts` for fast-check tests
- **Test directories**: `__tests__/` folders for grouped tests
- Property tests should validate universal properties, not specific examples

## Configuration Files

- **app.json**: Expo configuration (app name, permissions, plugins)
- **babel.config.js**: Babel setup with module resolver
- **tsconfig.json**: TypeScript configuration with path aliases
- **jest.config.js**: Test configuration for React Native
- **jest.property.config.js**: Isolated config for property tests
- **.env**: Environment variables (not committed)
- **.env.example**: Template for required env vars

## Key Architectural Patterns

1. **Offline-First**: Local storage is source of truth, sync happens in background
2. **Service Layer**: Business logic isolated from UI components
3. **Repository Pattern**: Data access abstraction
4. **Singleton Services**: Shared service instances (e.g., `todoService`)
5. **Zustand Stores**: Minimal global state, prefer local state when possible
6. **Type Safety**: Strict TypeScript, interfaces for all data structures

## Platform-Specific Code

- Use `Platform.OS` checks for platform-specific logic
- iOS-only features: Apple Sign In, native calendar sync
- Android-only features: Widget support
- Keep platform differences in services, not components when possible
