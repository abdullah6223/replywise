import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/drizzle'

export const dynamic = 'force-dynamic'

// The Docker HEALTHCHECK probes this path (see docker-compose.prod.yml), as
// can any platform deploy healthcheck. The DB query is intentional here:
// prod runs on the database which can auto-pauses a project
// so to ensure it stays healthy, an endpoint needs to touch the
// database, not just report the process is up.
export async function GET() {
  await getDb().execute(sql`select 1`)
  return NextResponse.json({ ok: true })
}
