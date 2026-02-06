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

## Development

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm dev
pnpm bot        # Discord bot and background jobs
pnpm test
```

Open <http://localhost:3000>. Database migrations run automatically when the app starts.

## License

Replywise is licensed under the [GNU Affero General Public License v3.0](./LICENSE).
