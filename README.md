# Replywise

Self-hostable AI support for online communities: it drafts answers from your own documentation, has a second AI pass check every draft, and lets your team approve replies before they are sent.

## What This Project Does


Teams that run a Discord server, a Slack workspace, a forum or a GitHub project end up answering the same questions again and again, in several places at once. Replywise collects those questions into one inbox, answers the ones your knowledge base already covers, and hands the rest to a person with a draft and the sources it used.

Main features:

- **One inbox for many channels.** Questions from Discord all become tickets.
- **Two-agent review.** One agent drafts a reply; a separate agent grades the draft against the evidence and gives it a confidence score.
- **Human approval or automatic replies.** Low-confidence drafts wait in a review queue; teams can let high-confidence answers post automatically per channel.
- **Ticket workflow.** AI triage (category, severity, priority), SLA deadlines, related-question search, ticket threads, CSV export and an activity log.
- **Workspaces and teams.** Google sign-in, workspaces with invites and roles, and email notifications.

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
