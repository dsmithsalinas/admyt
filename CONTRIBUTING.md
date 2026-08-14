# Contributing

`CLAUDE.md` is the source of truth for product behavior, Sage's voice, architecture, and the design system. Read it before making changes.

## Development workflow

1. Create a branch from `main`.
2. Install locked dependencies with `npm ci`.
3. Make the smallest focused change that solves the problem.
4. Run `npm run check` and the relevant Playwright tests.
5. Include migration files for every database change and verify them with `npm run db:reset` on a local Supabase stack.
6. Open a pull request describing behavior changes, verification, and any manual deployment step.

Do not commit secrets, call Anthropic from the browser, expose a service-role key, or introduce Tailwind/shadcn. Preserve unrelated working-tree changes.
