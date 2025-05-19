import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// NEXT_PUBLIC_APP_URL is read when the module loads, so each case sets the
// environment first and imports a fresh copy.
beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('DOCS_HREF', () => {
  it('stays the in-app docs route when an app host is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com')
    const { DOCS_HREF } = await import('@/components/marketing/nav-shared')

    expect(DOCS_HREF).toBe('/docs')
  })

  it('stays the in-app docs route when no app host is configured, so self-hosted and local builds never leave the site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    const { DOCS_HREF } = await import('@/components/marketing/nav-shared')

    expect(DOCS_HREF).toBe('/docs')
  })
})
