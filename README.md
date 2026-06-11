# Admyt 🎓

> Find your fit. Feel it first.

Admyt is an AI-powered college search platform for high school students. It matches students to schools based on academics, goals, and — through the **Vibe Check** feature — campus culture and social fit.

---

## What it does

- **AI college match** — Personalized school recommendations based on your profile, interests, and goals
- **Vibe Check** — Deep-dive into a school's social scene, culture, and campus life before you apply
- **Admit Odds** — AI-estimated likelihood of admission based on your academic profile
- **School comparison** — Side-by-side views of schools you're considering

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (auth, database, edge functions) |
| AI | Anthropic Claude API |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key

### Local setup

```bash
# Clone the repo
git clone https://github.com/yourusername/admyt.git
cd admyt

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the dev server
npm run dev
```

### Environment variables

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## Project structure

```
admyt/
├── src/
│   ├── components/
│   │   ├── ui/              # Shared UI primitives (buttons, cards, inputs)
│   │   ├── layout/          # Page shells, nav, sidebar
│   │   └── features/
│   │       ├── search/      # College search + filtering
│   │       ├── vibecheck/   # Vibe Check social fit feature
│   │       └── onboarding/  # Student profile setup flow
│   ├── pages/               # Route-level page components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # API clients, Supabase, Claude integration
│   ├── styles/              # Global styles, Tailwind config
│   ├── types/               # TypeScript interfaces and types
│   └── assets/              # Icons, images, brand assets
├── public/                  # Static assets
├── docs/                    # Product docs and specs
├── tests/
│   ├── unit/                # Component and hook tests
│   └── e2e/                 # End-to-end tests (Playwright)
└── .github/
    ├── workflows/           # CI/CD pipelines
    └── ISSUE_TEMPLATE/      # Bug report and feature request templates
```

---

## Contributing

This project is in early development. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT
