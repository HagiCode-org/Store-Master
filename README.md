# Store Master

A cross-platform desktop application for store management, built with Electron, React, and TypeScript.

## Features

- Cross-platform support (Windows, macOS, Linux)
- Modern React UI with shadcn/ui components
- Internationalization support (English, Chinese)
- Electron Forge for packaging and distribution
- Tailwind CSS for styling
- Redux Toolkit for state management

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Desktop**: Electron 41
- **UI Components**: shadcn/ui
- **State Management**: Redux Toolkit
- **Build Tools**: Vite 8, Electron Forge
- **Internationalization**: i18next

## Development

### Prerequisites

- Node.js 22+
- npm 10+

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start:
- Renderer development server on `http://127.0.0.1:36599`
- TypeScript compiler in watch mode
- Preload script compiler in watch mode
- Electron app

### Build

```bash
# Build all targets
npm run build:prod

# Build for specific platforms
npm run build:linux
npm run build:win
npm run build:mac
```

### Type Checking

```bash
npm run typecheck:main
npm run typecheck:preload
npm run typecheck:renderer
```

## Project Structure

```
Store-Master/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   ├── renderer/       # React application
│   │   ├── components/ # React components
│   │   │   └── ui/     # shadcn/ui components
│   │   ├── lib/        # Utilities
│   │   ├── locales/    # Internationalization
│   │   └── store/      # Redux store
│   └── shared/         # Shared types and utilities
├── scripts/            # Build and utility scripts
├── resources/          # App resources (icons, etc.)
├── .github/            # GitHub workflows
└── package.json
```

## License

AGPL-3.0