# Store Master - Agent Configuration

## Project Overview

Store Master is a cross-platform desktop application for store management, built with Electron, React, and TypeScript.

## Development Commands

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm run dev

# Start renderer only
npm run dev:renderer

# Start main process watch
npm run dev:main
```

### Building

```bash
# Build for production
npm run build:prod

# Build for Linux
npm run build:linux

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac
```

### Type Checking

```bash
npm run typecheck:main
npm run typecheck:preload
npm run typecheck:renderer
```

## Key Files

- `package.json` - Project dependencies and scripts
- `forge.config.js` - Electron Forge configuration
- `tsconfig.json` - TypeScript configuration for main process
- `tsconfig.renderer.json` - TypeScript configuration for renderer
- `tsconfig.preload.json` - TypeScript configuration for preload
- `vite.config.mjs` - Vite configuration for renderer
- `vite.preload.config.ts` - Vite configuration for preload
- `tailwind.config.js` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration

## Architecture

- **Main Process** (`src/main/`) - Electron main process code
- **Preload** (`src/preload/`) - Bridge between main and renderer
- **Renderer** (`src/renderer/`) - React application
- **Shared** (`src/shared/`) - Shared types and utilities

## UI Components

The project uses shadcn/ui components located in `src/renderer/components/ui/`. To add new components:

```bash
cd src/renderer
npx shadcn@latest add [component-name]
```

## Internationalization

The project supports English and Chinese. Translation files are located in `src/renderer/locales/`.