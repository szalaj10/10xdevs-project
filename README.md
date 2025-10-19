# 10xDevs Flashcards

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://github.com/your-org/10xdevs-project) [![License: MIT](https://img.shields.io/badge/license-MIT-green)]

> A web application for quickly creating and learning flashcards using a simple spaced-repetition system and AI-assisted card generation.

## Table of Contents

1. [Tech Stack](#tech-stack)  
2. [Getting Started](#getting-started)  
3. [Available Scripts](#available-scripts)  
4. [Testing](#testing)  
5. [Project Scope](#project-scope)  
   - [In Scope](#in-scope)  
   - [Out of Scope](#out-of-scope)  
6. [Project Status](#project-status)  
7. [License](#license)  

---

## Tech Stack

- **Frontend**  
  - Astro 5.13.7  
  - React 19.1.1  
  - TypeScript 5  
  - Tailwind CSS 4.1.13  
  - Shadcn/UI (Radix) & Lucide-React  

- **Backend & Services**  
  - Supabase (Auth, Postgres, RLS, Edge Functions)  
  - OpenRouter (AI generation)  

- **Tooling**  
  - Node.js v22.14.0  
  - ESLint & Prettier (with Husky + lint-staged)  
  - GitHub Actions (CI)  
  - Vitest (unit & integration tests)  
  - Playwright (E2E tests)  

---

## Getting Started

### Prerequisites

- Node.js (v22.14.0)
- npm (>=8.x) or yarn
- [nvm](https://github.com/nvm-sh/nvm) (optional, to pin Node version)

### Installation

```bash
git clone https://github.com/your-org/10xdevs-project.git
cd 10xdevs-project
nvm use           # if you use nvm
npm install       # or yarn install
```

### Environment Setup

1. **Set up Supabase locally**

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Start local Supabase instance
supabase start

# Get your service role key
supabase status
```

2. **Create environment file**

Create a `.env` file in the root directory with the following variables:

```env
# Get these from 'supabase status' command
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# For client-side (browser) access
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=your-anon-key-here

# Optional: OpenRouter API key for AI generation
OPENROUTER_API_KEY=your-openrouter-key-here
```

3. **Run database migrations**

```bash
supabase db reset
```

### Development

```bash
npm run dev
```

Open your browser at `http://localhost:4321` to view the app.

---

## Available Scripts

In the project directory, you can run:

- `npm run dev`  
  Starts the development server with hot-reloading.

- `npm run build`  
  Builds the static site for production.

- `npm run preview`  
  Serves the production build locally.

- `npm run astro`  
  Shortcut to run any `astro` CLI command.

- `npm run lint`  
  Runs ESLint to analyze code quality.

- `npm run lint:fix`  
  Runs ESLint and auto-fixes issues.

- `npm run format`  
  Formats code with Prettier.

- `npm run test`  
  Runs unit and integration tests with Vitest.

- `npm run test:watch`  
  Runs tests in watch mode for development.

- `npm run test:coverage`  
  Generates test coverage report.

- `npm run test:e2e`  
  Runs end-to-end tests with Playwright.

- `npm run test:e2e:ui`  
  Opens Playwright UI for interactive E2E testing.

---

## Testing

The project includes comprehensive testing setup with both unit/integration tests (Vitest) and E2E tests (Playwright).

### Quick Start

```bash
# Run unit tests
npm run test

# Run E2E tests (requires dev server running)
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Documentation

- 📖 [Testing Quick Start Guide](./TESTING_QUICK_START.md) - Szybki start z testami
- 📚 [Complete Testing Setup Guide](./TESTING_SETUP.md) - Pełna dokumentacja
- 🧪 [Unit Tests README](./tests/README.md) - Testy jednostkowe
- 🎭 [E2E Tests README](./e2e/README.md) - Testy E2E

### Test Coverage

Current coverage thresholds: **≥70%** for critical modules

---

## Project Scope

### In Scope

- Web-only (desktop & mobile responsive)
- AI-assisted card generation from free-text topic (10–20 candidates)
- Candidate management (accept/edit/reject, bulk accept)
- Simple SRS session (3 ratings: hard, normal, easy; fixed intervals)
- Basic Markdown support with character limits (front ≤200, back ≤350)
- Deck & card CRUD (inline edit, duplicate warnings)
- Search & listing of decks/cards
- Analytics events for key user actions

### Out of Scope (MVP)

- Advanced import/export (APKG, Anki/Notion/Quizlet)
- Offline mode or push notifications
- Complex SRS algorithms (FSRS, SM-2 tuning)
- Collaboration, sharing, tagging
- Native mobile apps

---

## Project Status

🚧 MVP under active development  
- ✅ Core flashcard flows implemented  
- ✅ AI generation & candidate review in progress  
- ✅ **Testing environment fully configured** (Vitest + Playwright)  
- 🔄 SRS session & analytics upcoming  

### Testing Status
- ✅ Unit tests: 12/12 passing
- ✅ Vitest configured with 70% coverage threshold
- ✅ Playwright E2E tests ready
- ✅ CI/CD pipeline configured
- 📖 [See Testing Setup Complete](./TESTING_SETUP_COMPLETE.md)

Contributions and feedback are welcome!

---

## License

This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.
