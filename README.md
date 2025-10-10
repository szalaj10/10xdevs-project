# 10xDevs Flashcards

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://github.com/your-org/10xdevs-project) [![License: MIT](https://img.shields.io/badge/license-MIT-green)]

> A web application for quickly creating and learning flashcards using a simple spaced-repetition system and AI-assisted card generation.

## Table of Contents

1. [Tech Stack](#tech-stack)  
2. [Getting Started](#getting-started)  
3. [Available Scripts](#available-scripts)  
4. [Project Scope](#project-scope)  
   - [In Scope](#in-scope)  
   - [Out of Scope](#out-of-scope)  
5. [Project Status](#project-status)  
6. [License](#license)  

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

### Development

```bash
npm run dev
```

Open your browser at `http://localhost:3000` to view the app.

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
- Core flashcard flows implemented  
- AI generation & candidate review in progress  
- SRS session & analytics upcoming  

Contributions and feedback are welcome!

---

## License

This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.
