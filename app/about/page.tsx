import { publicPageMetadata } from '@/lib/marketing/metadata'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MarketingPage,
  PageHero,
  TrialCta,
} from '@/components/marketing/layout'
import { PageSchema } from '@/components/marketing/page-schema'
import { GITHUB_SOURCE_URL, marketingSiteEnabled } from '@/lib/site'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = publicPageMetadata({
  title: 'About Replywise',
  description:
    'Replywise helps teams answer community support questions from the documentation they already have.',
  path: '/about',
})
export default function AboutPage() {
  // Not served by a self-hosted install: there is no hosted plan to sell there,
  // and the page would be advertising our pricing from somebody else's domain.
  if (!marketingSiteEnabled()) notFound()

  return (
    <MarketingPage>
      <PageSchema
        name="About Replywise"
        description="The problem behind Replywise and how it is built."
        path="/about"
      />
      <PageHero
        eyebrow="About"
        title="We kept answering the same questions"
      >
        <p>
          Replywise exists because the same support questions keep coming back
          across every community a team runs.
        </p>
      </PageHero>
      <section className="marketing-section">
        <div className="marketing-container marketing-reading marketing-story space-y-6">
          <h2>The problem</h2>
          <p>
            Anyone running an online community ends up doing support. A question
            answered in Discord appears again in a forum or an email. Finding
            the earlier explanation, checking it, and writing it again takes
            time.
          </p>
          <p>
            We wanted a shared place for those questions and the documentation
            needed to answer them. Replywise grew out of that work: receive a
            question, prepare a reply from existing knowledge, review it, and
            keep useful resolutions available for the next person.
          </p>
          <h2>How we build it</h2>
          <p>
            The source is available under AGPL-3.0, and teams can use a hosted
            service or operate a deployment themselves.
          </p>
          <p>
            For product questions, deployment requirements, or feedback, contact
            us at{' '}
            <a
              className="marketing-text-link"
              href="mailto:hello@replywise.example.com"
            >
              hello@replywise.example.com
            </a>
            .
          </p>
          <div className="marketing-actions">
            <Link
              className="marketing-button marketing-button-secondary"
              href="/support-example"
            >
              See an example reply
            </Link>
            <Link
              className="marketing-text-link"
              href={GITHUB_SOURCE_URL}
            >
              View the source
            </Link>
          </div>
        </div>
      </section>
      <TrialCta />
    </MarketingPage>
  )
}
