# Contributing to Discord Bots Hub

Thanks for considering a contribution! We want Discord Bots Hub to be the go-to open source solution for managing Discord bots and forwarding events to automation platforms. Follow the guidelines below to help us review and merge changes quickly.

## Table of contents

1. [Behaviour & communication](#behaviour--communication)
2. [Development workflow](#development-workflow)
3. [Project structure overview](#project-structure-overview)
4. [Coding standards](#coding-standards)
5. [Submitting changes](#submitting-changes)
6. [Release checklist](#release-checklist)

---

## Behaviour & communication

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md). Respectful communication, constructive feedback and inclusive language are expected.

Use GitHub Discussions/issues for questions, ideas and feature requests. For security-related reports, see [SECURITY.md](SECURITY.md).

---

## Development workflow

1. **Fork** the repository and clone your fork.
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Copy env template**:
   ```bash
   cp env.example .env.local
   ```
4. **Run the dev server**:
   ```bash
   pnpm dev
   ```
5. Make your changes on a dedicated branch:
   ```bash
   git checkout -b feat/my-awesome-feature
   ```
6. Run linters/tests before committing:
   ```bash
   pnpm lint
   # add pnpm test when test suite lands
   ```

---

## Project structure overview

```
src/
  app/                  # Next.js App Router routes
  components/           # React components (client/server)
  lib/                  # Shared libraries (discord manager, storage, crypto)
  modules/              # Domain logic (bots, integrations)
public/uploads/         # Bot avatars (gitignored except for sample images)
data/                   # JSON stores (bots, message logs)
```

- **discord-bot-manager.ts** hosts the singleton DiscordBotManager (starts/stops clients, forwards messages).
- **bots-store.ts** persists bot metadata and encrypted tokens.
- **message-logs.ts** appends audit logs (DMs, mentions).
- **app/(dashboard)/bots** contains the main UI.

---

## Coding standards

| Area | Rule |
|------|------|
| TypeScript | Strict mode, favour explicit types, avoid `any`. |
| React | Prefer client components only when necessary. Keep server components for data fetching. |
| Styling | Tailwind via `globals.css` (no inline styles unless necessary). |
| Logging | Use concise logs in production paths; avoid leaking secrets. |
| i18n | Fetch copy from translation files (`src/i18n/messages`). English strings must have counterparts in es/pt-br. |

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add webhook retry queue`
- `fix: handle duplicate DM events`
- `docs: update README with deployment guide`
- `refactor: split bot form routes`

---

## Submitting changes

1. **Rebase** your branch on top of `main` before opening the PR.
2. **Prepare screenshots** for UI changes (desktop + mobile if relevant).
3. **Reference issues** when applicable (`Fixes #123`).
4. Fill out the PR template (if active) describing:
   - What was changed and why.
   - How to test.
   - Screenshots/logs.
5. Address review comments and re-run `pnpm lint` before requesting another review.

---

## Release checklist

Maintainers should verify the following before tagging a release:

- [ ] `pnpm lint` passes.
- [ ] Message logs and Discord token encryption still work end-to-end.
- [ ] README & docs reflect new features.
- [ ] `CHANGELOG.md` (if present) is updated.
- [ ] Version bump in `package.json`.

Happy hacking! ✨


