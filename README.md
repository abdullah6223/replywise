# Replywise

Self-hostable AI support for online communities: it drafts answers from your own documentation, has a second AI pass check every draft, and lets your team approve replies before they are sent.

## What This Project Does

Teams that run a Discord server, a Slack workspace, a forum or a GitHub project end up answering the same questions again and again, in several places at once. Replywise collects those questions into one inbox, answers the ones your knowledge base already covers, and hands the rest to a person with a draft and the sources it used.

It is built for open-source maintainers, developer-tool companies and community teams who want AI help with support without giving up control of what gets posted.

Main features:

- **One inbox for many channels.** Questions from Discord, Slack, GitHub Issues and Discussions, Telegram, Google Chat, Discourse, Circle, email and an embeddable website chat widget all become tickets.
- **Answers grounded in your knowledge base.** Articles come from uploaded files (PDF, DOCX, CSV, Markdown, ZIP), crawled URLs, Notion pages and GitHub repositories, stored with vector embeddings for semantic search.
- **Two-agent review.** One agent drafts a reply; a separate agent grades the draft against the evidence and gives it a confidence score.
- **Human approval or automatic replies.** Low-confidence drafts wait in a review queue; teams can let high-confidence answers post automatically per channel.
- **A knowledge base that improves itself.** Approved answers can be captured as new articles, and the dashboard shows knowledge gaps, article usage and coverage.
- **Ticket workflow.** AI triage (category, severity, priority), SLA deadlines, related-question search, ticket threads, CSV export and an activity log.
- **Analytics and simulation.** Deflection rate, response times and estimated time saved, plus a dry-run mode that replays past questions without posting anything.
- **Agent access.** An MCP server, a REST Agent API with OpenAPI docs, a TypeScript SDK (`@replywise/agent-sdk`) and installable agent skills.
- **Embeddable chat widget.** A `<script>` tag or the `@replywise/widget` React package, with optional lead capture.
- **Teams and billing.** Google sign-in, workspaces with invites and roles, browser push and email notifications, and Stripe billing for a managed deployment (self-hosted installs have no plan limits).
- **Built-in documentation site** under `/docs`.

## How It Works

The project has two processes that share one PostgreSQL database:

- **Web app** (Next.js): the dashboard, the public API routes, webhook receivers for each channel, the chat widget, the MCP server and the docs site.
- **Bot worker** (`bot/index.ts`): a long-running Node process that holds the Discord gateway connection, polls Slack, and runs background jobs such as knowledge-base syncs, retries for stuck tickets and data-retention sweeps. It forwards new messages to the web app's ingest endpoint.

Every channel feeds the same pipeline in `lib/ingest/pipeline.ts`:

1. **Validate and de-duplicate** the incoming message.
2. **Triage** it with a fast model: category, severity and priority (`lib/ai/triage.ts`).
3. **Create a ticket** with SLA deadlines and notify the team.
4. **Embed** the question and find related tickets and articles (`lib/ai/embed.ts`, `lib/ai/related.ts`).
5. **Draft an answer** from the knowledge base, past answers and, if connected, the GitHub repository (`lib/ai/agent.ts`).
6. **Review the draft** with a second agent that scores confidence (`lib/ai/assess.ts`).
7. **Reply or route**: above the workspace's threshold the answer is posted back to the original channel (`lib/channels/post-reply.ts`); otherwise it waits in the dashboard for a person to edit and approve.

If any AI step fails, the ticket is still created and goes to the human queue, so a question is never dropped or answered on error.

```mermaid
flowchart LR
    subgraph Channels
        D[Discord / Slack<br/>via bot worker]
        W[Webhooks<br/>GitHub, Telegram, email,<br/>Google Chat, Discourse, Circle]
        X[Chat widget]
        M[MCP / Agent API]
    end
    D --> I[/api/ingest/]
    W --> I
    X --> P
    M --> P
    I --> P[Ingest pipeline<br/>lib/ingest/pipeline.ts]
    P --> T[Triage + ticket + SLA]
    T --> E[Embed + related search]
    E --> A[Draft agent]
    A --> R[Review agent<br/>confidence score]
    R -->|high confidence| O[Post reply to channel]
    R -->|low confidence| Q[Human review queue<br/>dashboard]
    Q --> O
    KB[(PostgreSQL + pgvector<br/>tickets, KB articles, embeddings)] <--> E
    KB <--> A
```

Data lives in PostgreSQL with the `pgvector` extension, accessed through Drizzle ORM (`lib/db/schema.ts`). SQL migrations in `drizzle/` run automatically when the web app starts (`instrumentation.ts` → `lib/db/migrate.ts`). Channel tokens and AI provider keys are encrypted at rest with `ENCRYPTION_KEY`. Each workspace can bring its own AI provider key; otherwise the server-wide key is used.

## Project Structure

```
.
├── app/                    # Next.js App Router: pages, layouts and route handlers
│   ├── (dashboard)/        # Signed-in dashboard: tickets, KB, analytics, settings, team, billing
│   ├── api/                # API routes: ingest, webhooks per channel, MCP, Agent API (v1), widget, billing
│   ├── docs/               # Documentation site (Fumadocs) rendered from content/docs
│   ├── widget/             # Embeddable chat widget pages
│   └── ...                 # Marketing pages, login, onboarding, checkout
├── bot/                    # Long-running worker: Discord gateway, Slack polling, scheduled jobs
├── components/             # React components (dashboard, tickets, settings, marketing, docs, UI)
├── content/docs/           # MDX documentation: quickstarts, integrations, product, self-hosting, reference
├── drizzle/                # SQL migrations, applied automatically on startup
├── e2e/                    # Playwright end-to-end tests and fixtures
├── lib/                    # Server-side logic
│   ├── ai/                 # Triage, drafting agent, review agent, embeddings, model config
│   ├── ingest/             # The shared ingest pipeline and file/URL parsers
│   ├── kb/, kb-sync/       # Knowledge base: articles, review, coverage, background sync
│   ├── channels/           # Posting replies back to each platform
│   ├── discord/, slack/, github/, telegram/, google-chat/, discourse/, circle/, notion/, email/
│   │                       # Per-platform clients and helpers
│   ├── db/                 # Drizzle schema, queries and migration runner
│   ├── mcp/, agent/        # MCP server tools and the REST Agent API
│   ├── billing/            # Plans, entitlements, Stripe integration, AI usage budgets
│   └── auth/, crypto/, http/, sla/, tickets/, push/, analytics/, widget/
├── packages/
│   ├── agent-sdk/          # @replywise/agent-sdk: TypeScript client and CLI (setup, skills)
│   └── widget/             # @replywise/widget: chat widget for plain JS and React sites
├── public/                 # Static assets, widget loader script, llms.txt, docs screenshots
├── scripts/                # Maintenance scripts: docs generation, llms.txt sync, git hooks, evals
├── skills/                 # Agent skills installed by the SDK CLI (setup and operate)
├── tests/unit/             # Vitest unit tests
├── types/                  # Shared TypeScript declarations
├── auth.ts                 # Auth.js configuration and the route access gate
├── proxy.ts                # Next.js request proxy (routing and auth middleware)
├── instrumentation.ts      # Startup hook: runs migrations, initialises error tracking
├── Dockerfile              # Multi-stage image used for both the web app and the bot
├── docker-compose.yml      # Local development: Postgres + app + bot with live reload
├── docker-compose.prod.yml # Self-hosted production stack built from source
├── docker-compose.ghcr.yml # Self-hosted stack using a prebuilt image
├── .env.example            # Every environment variable, with comments
└── package.json            # Scripts and dependencies (pnpm workspace root)
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 22 | Runs the web app and the bot worker |
| Package manager | pnpm 10 (workspaces) | Installs dependencies for the app and `packages/*` |
| Frontend | Next.js 15.3, React 19.1 | App Router pages, server components and route handlers |
| Styling | Tailwind CSS 4.1, lucide-react | Styling and icons |
| Documentation | Fumadocs 15.8, fumadocs-openapi 9.5, Mermaid 11.12 | `/docs` site, API reference and diagrams |
| Database | PostgreSQL 16 with pgvector | Tickets, knowledge base and vector search |
| ORM | Drizzle ORM 0.41, drizzle-kit 0.30, postgres 3.4 | Schema, queries and migrations |
| Auth | Auth.js (next-auth 5.0.0-beta.25) | Google OAuth sign-in and sessions |
| AI | Vercel AI SDK 4.3, Mastra 0.9 | Model calls, agents and memory |
| AI providers | `@ai-sdk/openai`, `anthropic`, `google`, `groq`, `mistral` | Pluggable chat and embedding models |
| Chat widget | CopilotKit 1.10, AG-UI client | Streaming website chat |
| Channels | discord.js 14.19, Octokit (app 16, rest 22), google-auth-library 10.5 | Discord bot, GitHub App, Google Chat |
| Ingest | Firecrawl 1.25, mammoth 1.9, pdf-parse 1.1, csv-parse 5.6 | URL crawling and document parsing |
| Email | Resend 4.2 | Transactional email and inbound email channel |
| Notifications | web-push 3.6 | Browser push notifications |
| Billing | Stripe 18.5, Stripe.js 7.9 | Subscriptions on a managed deployment |
| Validation | Zod 3.24 | Input and config validation |
| Monitoring | Sentry (`@sentry/nextjs` 10.32) | Optional error tracking |
| Testing | Vitest 3.1, Testing Library, happy-dom 17.4, Playwright 1.57 | Unit, component and end-to-end tests |
| Linting | oxlint 0.16, TypeScript 5 | Lint and type checking |
| Packaging | tsup 8.5 | Builds the SDK and widget packages |
| Deployment | Docker, Docker Compose | Local development and self-hosting |

## How to Run This Project

### 1. Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **pnpm 10** or newer
- **PostgreSQL 16 with the `pgvector` extension**, or **Docker** to run the bundled `pgvector/pgvector:pg16` container
- A **Google OAuth client** (sign-in is Google-only)
- An **AI provider API key** (OpenAI is the default; Anthropic, Google, Groq and Mistral are also supported)

### 2. Clone

```bash
git clone https://github.com/abdullah6223/replywise.git
cd replywise
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Environment variables

Copy the example file and fill in what you need:

```bash
cp .env.example .env
```

Required:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://community:community@localhost:5432/community` |
| `AUTH_SECRET` | Secret used to sign sessions | `generate-with-openssl-rand-base64-32` |
| `AUTH_URL` | Public URL of the app | `http://localhost:3000` |
| `ENCRYPTION_KEY` | Key for encrypting stored tokens and API keys (64 hex characters) | `generate-with-openssl-rand-hex-32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | `your-google-client-secret` |
| `OPENAI_API_KEY` | Server-wide AI key, used until a workspace sets its own | `sk-your-key` |

Optional, grouped by feature (all except the managed-service group are listed in `.env.example`):

| Group | Variables | Purpose |
|---|---|---|
| Bot worker | `BOT_SECRET`, `BOT_TARGET_URL` | Shared secret and app URL the bot forwards messages to |
| Database | `DIRECT_DATABASE_URL` | Non-pooled connection for LISTEN/NOTIFY when `DATABASE_URL` points at a pooler |
| Networking | `TRUST_PROXY_HOPS`, `ORIGIN_VERIFY_SECRET`, `NEXT_PUBLIC_APP_URL`, `AUTH_COOKIE_DOMAIN` | Reverse proxy and split-subdomain setups |
| Discord | `DISCORD_APPLICATION_ID`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_IDS` | Discord bot and one-click connect |
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, `SLACK_POLL_INTERVAL_SECONDS` | Slack app and polling interval |
| Google Chat | `GOOGLE_CHAT_SERVICE_ACCOUNT_JSON`, `GOOGLE_CHAT_ENDPOINT_URL` | Google Chat app |
| Telegram | `TELEGRAM_WEBHOOK_BASE_URL` | Override for the Telegram webhook base URL (e.g. a local tunnel) |
| GitHub App | `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET` | Code-aware answers and GitHub ticket ingest |
| AI providers | `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY` | Additional server-wide provider keys |
| Knowledge base | `FIRECRAWL_API_KEY`, `FIRECRAWL_API_URL`, `ALLOW_PRIVATE_OUTBOUND_URLS` | URL crawling; allow private-network URLs on self-hosted installs |
| Email | `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_WEBHOOK_SECRET`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI` | Outbound/inbound email and Gmail/Outlook sending |
| Push | `VAPID_EMAIL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Browser push notifications |
| Widget | `NEXT_PUBLIC_DOCS_WIDGET_TOKEN` | Show the chat widget on the docs site |
| Analytics | `ROI_MINUTES_PER_TICKET`, `ROI_STAFF_HOURLY_RATE` | Time-saved estimates |
| Feedback board | `FEEDBACK_WIDGET_ENABLED`, `FEEDBACK_NOTIFY_EMAIL` | In-app product feedback widget |
| Monitoring | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `CLOUDFLARE_WEB_ANALYTICS` | Error tracking and web analytics |
| Managed service only | `DEPLOYMENT_MODE`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `SIGNUP_ALERT_EMAIL` | Billing and plan limits; leave unset when self-hosting |

The full reference is in `content/docs/reference/environment-variables.mdx`, also served at `/docs/reference/environment-variables`.

### 5. Database setup

Start PostgreSQL with pgvector. The quickest way is the bundled container:

```bash
docker compose up -d postgres
```

There is no separate migration command: the migrations in `drizzle/` are applied automatically every time the web app starts. The first person to sign in gets a new workspace.

### 6. Run

Start the web app:

```bash
pnpm dev
```

Open <http://localhost:3000>. In a second terminal, start the bot worker if you use Discord, Slack polling or background knowledge-base syncs:

```bash
pnpm bot
```

Or run both together with `pnpm dev:all`.

For a production build:

```bash
pnpm build
pnpm start        # web app
pnpm bot:start    # bot worker
```

### 7. Run tests

```bash
pnpm test          # unit tests (Vitest)
pnpm lint          # oxlint
pnpm typecheck     # TypeScript
pnpm test:e2e      # end-to-end tests (Playwright), needs a local Postgres
```

The end-to-end suite builds the app and runs it on port 3100 with all external services mocked, so no AI key is needed. It uses the `community_test` database on the local Postgres and creates it if it is missing.

### 8. Docker

Local development (Postgres, app and bot, with the source mounted for live reload):

```bash
docker compose up
```

Self-hosted production stack built from source (needs a `.env` with at least `DATABASE_URL`):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Self-hosted stack from a prebuilt image (set `REPLYWISE_IMAGE` to the image you published):

```bash
docker compose -f docker-compose.ghcr.yml up -d
```

Check health with `curl http://localhost:3000/api/health`, which returns `{"ok":true}`.

## License

Replywise is licensed under the [GNU Affero General Public License v3.0](./LICENSE).
