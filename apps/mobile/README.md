# Papra Mobile App

React Native mobile application for Papra document management platform, built with Expo.

## Features

- **Multi-server support**: Connect to managed cloud or self-hosted instances
- **Authentication**: Email/password and OAuth providers (Google, GitHub, custom OAuth2)
- **Organization management**: Create and switch between organizations
- **Document management**: Browse, search, upload, and delete documents
- **Dark/Light mode**: Automatic theme support
- **Modern architecture**: Built with TypeScript, TanStack Query, and functional programming principles

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: TanStack Query for server state
- **Forms**: TanStack Form with Valibot validation
- **Authentication**: Better Auth with Expo integration
- **Storage**: Expo Secure Store for sensitive data, AsyncStorage for app config
- **Styling**: StyleSheet with dynamic theming

## Architecture

### Module-Based Structure

The app follows a business-oriented module architecture:

```
src/
├── modules/
│   ├── auth/           # Authentication screens and services
│   ├── config/         # Server configuration
│   ├── documents/      # Document management
│   └── organizations/  # Organization selection and management
├── lib/               # Core utilities (API client, auth client, storage)
├── providers/         # React context providers
└── types/            # TypeScript type definitions
```

Each module contains:
- `screens/` - Screen components
- `services/` - API interaction layer
- `components/` - Module-specific components (optional)
- `hooks/` - Module-specific hooks (optional)

### Routing

File-based routing with Expo Router:

- `/` - Entry point, checks config and redirects
- `/config/server-selection` - Choose managed vs self-hosted
- `/auth/login` - Login screen
- `/auth/signup` - Signup screen
- `/organizations/select` - Organization selection
- `/(tabs)/index` - Documents list (main screen)
- `/(tabs)/explore` - Settings screen

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# From the monorepo root
pnpm install

# Or from apps/mobile
cd apps/mobile
pnpm install
```

### Development

```bash
# Start the dev server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web
```

### Building

```bash
# Create development build
eas build --profile development

# Create production build
eas build --profile production
```

## Configuration

### Server Selection

On first launch, users choose between:
1. **Managed Cloud** - Official Papra instance at `https://api.papra.app`
2. **Self-Hosted** - Custom server URL with validation

The app validates server connectivity using `/api/ping` before saving configuration.

### Authentication

The app dynamically adapts to server authentication configuration fetched from `/api/config`:

- Email/password authentication
- OAuth providers (Google, GitHub)
- Custom OAuth2 providers
- Email verification requirements
- Registration availability

### Deep Linking

App scheme: `papra://`

Used for OAuth callbacks and deep linking to specific screens.

## Key Services

### API Client (`src/lib/api-client.ts`)

Centralized HTTP client with:
- Dynamic base URL configuration
- Automatic authentication headers
- Error handling
- Type-safe requests

### Auth Client (`src/lib/auth-client.ts`)

Better Auth integration with:
- Expo Secure Store for session persistence
- Dynamic initialization based on server URL
- Support for multiple auth providers

### Storage (`src/lib/storage.ts`)

Abstracted storage layer using AsyncStorage for:
- App configuration
- Current organization
- Other non-sensitive data

## State Management

### Server State (TanStack Query)

All server data is managed through TanStack Query with:
- Automatic caching and revalidation
- Optimistic updates
- Background refetching
- Error handling

### Local State

React hooks for component-level state, with context providers for:
- Authentication state (`AuthProvider`)
- Theme/color scheme (built-in React Native)

## Styling

The app uses React Native StyleSheet with:
- Dynamic dark/light mode support via `useColorScheme()`
- Inline style creation functions per component
- Consistent color palette and spacing

## Best Practices

- **Functional programming**: Pure functions, no classes
- **Type safety**: Full TypeScript coverage
- **Error handling**: User-friendly alerts for all errors
- **Loading states**: Activity indicators during async operations
- **Validation**: Valibot schemas for form validation
- **Code organization**: Module-based architecture for scalability

## API Integration

The app expects these endpoints from the server:

- `GET /api/ping` - Health check
- `GET /api/config` - Server configuration
- `POST /api/auth/sign-in` - Email/password login
- `POST /api/auth/sign-up` - Email registration
- `GET /api/auth/session` - Get current session
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id/documents` - List documents
- `POST /api/organizations/:id/documents` - Upload document
- `DELETE /api/organizations/:id/documents/:docId` - Delete document

## Future Enhancements

- [ ] Document preview/viewer
- [ ] Offline support with local caching
- [ ] Push notifications
- [ ] Advanced search with filters
- [ ] Batch operations (multi-select, bulk delete)
- [ ] Document sharing
- [ ] Tagging interface
- [ ] Organization settings
- [ ] User profile management

## Contributing

Follow the main repository's contributing guidelines. Key points:

- Use functional programming patterns
- Follow TypeScript strict mode
- Add proper error handling
- Test on both iOS and Android
- Maintain dark/light mode support

## License

Same as the main Papra repository.
