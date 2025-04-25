import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Infra coverage for the health-check DB ping:
//
// app/api/health/route.ts used to be a no-op (`return NextResponse.json({
// ok: true })` with no DB touch). Prod runs on the database host's free
// tier, which auto-pauses a project after 7 days with no database activity, so the route
// issues a real `select 1` through getDb().execute(...), and any uptime
// monitor that polls it keeps the DB warm.
//
// Next.js route modules cannot be imported in vitest (same constraint noted
// in tests/unit/circle-webhook-route.test.ts),
// so the DB round-trip is locked in via a source-file structural assertion
// rather than an invoked handler with a mocked DB client.

const ROOT = process.cwd()

function read(relPath: string): string {
  const absPath = path.join(ROOT, relPath)
  expect(fs.existsSync(absPath), `File not found: ${relPath}`).toBe(true)
  return fs.readFileSync(absPath, 'utf-8')
}

describe('app/api/health/route.ts', () => {
  it('imports getDb and the sql helper instead of just NextResponse', () => {
    const src = read('app/api/health/route.ts')
    expect(src).toContain("import { sql } from 'drizzle-orm'")
    expect(src).toContain("import { getDb } from '@/lib/db/drizzle'")
  })

  it('performs an actual DB round-trip via getDb().execute(sql`...`) before responding ok:true', () => {
    const src = read('app/api/health/route.ts')
    const execIdx = src.indexOf('getDb().execute(sql`')
    const okIdx = src.indexOf('NextResponse.json({ ok: true })')
    expect(execIdx, 'expected getDb().execute(sql`...`) call, not a no-op health check').toBeGreaterThan(-1)
    expect(okIdx).toBeGreaterThan(-1)
    // The DB round-trip must happen before the response is built, not after
    // (a no-op that merely mentions getDb without awaiting it wouldn't
    // satisfy this ordering check).
    expect(execIdx).toBeLessThan(okIdx)
  })

  it('awaits the DB round-trip rather than firing it off without waiting', () => {
    const src = read('app/api/health/route.ts')
    expect(src).toMatch(/await\s+getDb\(\)\.execute\(sql`/)
  })
})
