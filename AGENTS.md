# AGENTS.md

Welcome to the **tcocalc** codebase! This document outlines operational protocols, environment setup, planning workflows, and commit conventions for all AI agents and contributors working in this repository.

---

## 1. Environment Setup & Node Versioning

When working with Node.js and npm in this repository:

- Initialize the Node environment using **`nvm use lts`** before running npm commands.
- If NVM is not loaded in your shell subshell, ensure it is sourced:

  ```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm use lts
  ```

- Go commands require Go 1.22+ (local environment uses Go 1.27+).

---

## 2. Planning & Specification Guidelines

All major features, architectural decisions, and initialization plans must be documented under `docs/specs/`:

- **File Naming Pattern**: `docs/specs/YYYY-MM-DD-<topic>.md` (e.g., `2026-10-02-initialization.md`).
- **Relative Path Convention**: All Markdown documentation and cross-references must use relative paths relative to the repository root (e.g., `docs/specs/...`) rather than machine-specific absolute paths.
- **Index Maintenance**: Whenever a new plan or specification is created or updated, update the table in [docs/specs/README.md](docs/specs/README.md) with the relative file link, status, and concise description.
- **Content Requirements**:
  - Context & Motivation
  - Explicit architectural decisions
  - Domain models / data structures
  - Implementation & verification roadmap
  - Testing & quality criteria

---

## 3. Git Commit Conventions & Required Trailers

All commits in this repository must strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standard and **must** include three mandatory git trailers:

1. `Signed-off-by`: Contributor name and email.
2. `Assisted-by`: Tool name and model identifier (`<tool>/<model>`).
3. `Conversation`: The unique conversation / session UUID.

### Format

```
<type>(<scope>): <short description>

[optional body explaining context, rationale, and tradeoffs]

Signed-off-by: <Name> <<email>>
Assisted-by: <tool>/<model>
Conversation: <uuid>
```

### Supported Commit Types

- `feat`: A new feature or capability
- `fix`: A bug fix
- `docs`: Documentation updates or new specifications
- `test`: Adding or refactoring tests
- `refactor`: Code changes that neither fix a bug nor add a feature
- `style`: Changes that do not affect code meaning (formatting, whitespace)
- `chore`: Build process, dependency updates, or auxiliary tool configuration

### Concrete Example

```
feat(tco): add EV electricity efficiency calculation model

Add battery charging efficiency and kWh/100mi cost calculations
to the core Go calculation package.

Signed-off-by: Gideon Tong <gideon@gideontong.com>
Assisted-by: agy/gemini-3.8-flash
Conversation: 4592d7f6-1f6d-470e-914f-821c68dc8a05
```

---

## 4. Code Quality, Testing, and Linting Standards

### Backend (Go)

- All shared business logic belongs in `backend/pkg/tco` and must have accompanying unit tests in `*_test.go`.
- Run tests:

  ```bash
  cd backend && go test -v -race -cover ./...
  ```

- Run linter:

  ```bash
  cd backend && golangci-lint run
  ```

### Frontend (Next.js)

- Next.js App Router with TypeScript and Tailwind CSS / shadcn/ui elements.
- Run tests:

  ```bash
  cd frontend && npm test
  ```

- Run linter:

  ```bash
  cd frontend && npm run lint
  ```

### Markdown Formatting

- Prettier must be used for Markdown linting and formatting across the repository:

  ```bash
  npx prettier --check "**/*.md"
  # or to automatically format:
  npx prettier --write "**/*.md"
  ```

### Repository Orchestration & Local Development

- Start both frontend and backend concurrently:
  ```bash
  ./start.sh
  ```
- Use the root `Makefile` where possible:
  - `make test`: Run all unit tests (Go + Next.js)
  - `make lint`: Run all linters (Go + Next.js + Prettier Markdown)
  - `make format`: Auto-format Markdown and source files
