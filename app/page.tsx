import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Globe2,
  Layers3,
  Lightbulb,
  NotebookPen,
  ShieldCheck,
  Smartphone,
  Video,
} from 'lucide-react';
import { Header, Footer } from '@/components/public-shell';
import { Countdown } from '@/components/countdown';
import { LearningHeadline } from '@/components/learning-headline';
import { runtime, course, site, all, providersReady } from '@/lib/db';
import { quote, money } from '@/lib/domain';
import { defaultSite, weekSummaries } from '@/lib/defaults';
import './home.css';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const e = runtime();
  return {
    alternates: { canonical: e.APP_URL },
    openGraph: {
      url: e.APP_URL,
      images: [
        {
          url: `${e.APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Sanaa Academy — learn to build what’s next.',
        },
      ],
    },
    twitter: { card: 'summary_large_image', images: [`${e.APP_URL}/og-image.png`] },
  };
}
export default async function Home() {
  const e = runtime();
  const [c, s, weeks] = await Promise.all([
    course(e),
    site(e),
    all<{ id: string; title: string; description: string; position: number }>(
      e,
      'SELECT id,title,description,position FROM weeks WHERE course_id=? ORDER BY position',
      'ai-web-2026',
    ),
  ]);
  const price = quote(c),
    ready = providersReady(e);
  const date = (d: string) =>
    new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const defaultHeadline = [defaultSite.heroHeadline, 'Learn to build what’s next.'].includes(
    s.heroHeadline,
  );
  const saving = Math.round((1 - price.amount / c.regular_price) * 100);
  return (
    <div style={{ '--accent': s.accentColor } as React.CSSProperties}>
      <Header text={s.logoText} image={s.logoUrl} />
      <main id="main" className="stitch-home">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Course',
              name: c.title,
              description:
                'A beginner-friendly, live online course in planning, building, testing, and launching websites with AI coding agents.',
              provider: { '@type': 'Organization', name: 'Sanaa Academy', url: e.APP_URL },
              url: e.APP_URL + '/#curriculum',
              hasCourseInstance: {
                '@type': 'CourseInstance',
                courseMode: 'online',
                startDate: c.start_date,
                endDate: c.end_date,
              },
            }).replaceAll('<', String.fromCharCode(92) + 'u003c'),
          }}
        />
        <section className="learning-hero">
          <div className="learning-container">
            <div className="learning-pill">
              <span className="learning-dot" /> LEARN. BUILD. CREATE.
            </div>
            <h1>
              {defaultHeadline ? (
                <>
                  Complex ideas become
                  <br />
                  <LearningHeadline />
                </>
              ) : (
                s.heroHeadline
              )}
            </h1>
            <p>{s.heroDescription}</p>
            <div className="learning-actions">
              <a className="learning-button learning-button-primary" href="/register">
                Register now <ArrowUpRight size={17} />
              </a>
              <a className="learning-button learning-button-secondary" href="#curriculum">
                View curriculum <ArrowRight size={17} />
              </a>
            </div>
            <div className="learning-hero-notes">
              <span>
                <CheckCircle2 size={14} /> Beginner friendly
              </span>
              <span>
                <CheckCircle2 size={14} /> Project-first learning
              </span>
            </div>
          </div>
        </section>
        <section className="learning-content">
          <div className="learning-container learning-editorial-layout">
            <aside className="learning-faculty" aria-label="Learning guidance">
              <div className="learning-portrait">
                <img
                  src={s.instructorImage || '/images/faculty-reference.png'}
                  alt={
                    s.instructorImage
                      ? s.instructorName
                      : 'Portrait supplied with the homepage design reference'
                  }
                  width="382"
                  height="512"
                />
              </div>
              <div className="learning-faculty-card">
                <div className="learning-faculty-meta">
                  <span>
                    <span className="learning-dot" /> HUMAN GUIDANCE
                  </span>
                  <span className="learning-blue-badge">Live online</span>
                </div>
                <h2>{s.instructorName}</h2>
                <p className="learning-faculty-role">Practical learning. Personal direction.</p>
                <p>{s.instructorBio}</p>
                <div className="learning-faculty-footer">
                  <span>
                    <Video size={15} /> Instructor-led
                  </span>
                  <span>
                    <BookOpen size={15} /> Learn by doing
                  </span>
                </div>
                <small>{s.instructorExperience}</small>
              </div>
            </aside>
            <div className="learning-editorial">
              <header className="learning-editorial-header">
                <div className="learning-pill">
                  <NotebookPen size={15} /> THE SANAA APPROACH
                </div>
                <h2>
                  A better way to learn
                  <br className="learning-desktop-break" /> is to build.
                </h2>
                <p>
                  Understand the essentials, work with modern tools, and turn what you learn into
                  something real.
                </p>
                <div className="learning-byline">
                  <span>Sanaa Academy</span>
                  <span aria-hidden="true">·</span>
                  <span>From curiosity to capability</span>
                </div>
              </header>
              <article className="learning-article">
                <p className="learning-lead">
                  You don’t need to know everything before you begin. You need a useful idea, a
                  willingness to explore, and a clear next step.
                </p>
                <p>
                  At Sanaa Academy, you learn through practical projects. AI coding agents help you
                  create, while you develop the understanding to plan the work, make decisions, test
                  the results, and improve what you build.
                </p>
                <div className="learning-callout">
                  <h3>
                    <Lightbulb size={19} /> Start with understanding, not memorizing.
                  </h3>
                  <p>
                    Learn how the pieces fit together. Ask better questions, give your tools clear
                    direction, and check that your project works for real people.
                  </p>
                </div>
                <div className="learning-curriculum" id="curriculum">
                  <div className="learning-label">AVAILABLE NOW · WEB DEVELOPMENT</div>
                  <h3>Your first website, from idea to launch.</h3>
                  <p>
                    A guided {c.duration_weeks}-week journey through the foundations, design, data,
                    deployment, and your own final project.
                  </p>
                  <div className="learning-course-facts">
                    <span>
                      <CalendarDays size={14} /> {date(c.start_date)} – {date(c.end_date)}
                    </span>
                    <span>
                      <Clock3 size={14} /> {c.duration_weeks} weeks
                    </span>
                    <span>
                      <Video size={14} /> Live online
                    </span>
                  </div>
                  <div className="learning-milestones">
                    {weeks.map((w, i) => (
                      <section className="learning-milestone" key={w.id}>
                        <div className="learning-milestone-heading">
                          <span className="learning-week">
                            {String(w.position).padStart(2, '0')}
                          </span>
                          <h4>{w.title}</h4>
                          {i < 2 && (
                            <span className="learning-milestone-tag">{weekSummaries[i]?.tag}</span>
                          )}
                        </div>
                        <p>{w.description}</p>
                      </section>
                    ))}
                  </div>
                </div>
                <div className="learning-callout learning-callout-blue">
                  <h3>
                    <ShieldCheck size={19} /> AI helps you build. Your judgment matters.
                  </h3>
                  <p>
                    You stay responsible for understanding the essentials, testing your work, and
                    maintaining what you launch. We help you build that confidence, step by step.
                  </p>
                </div>
                <div className="learning-programs" id="programs">
                  <h3>More ways to build your future.</h3>
                  <p>Web development is our first program. These are the chapters ahead.</p>
                  <div className="learning-program-row">
                    <Globe2 size={18} />
                    <span>Web development</span>
                    <a href="#curriculum">
                      Available now <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <div className="learning-program-row">
                    <Layers3 size={18} />
                    <span>Web apps & software development</span>
                    <span className="learning-coming">Coming soon</span>
                  </div>
                  <div className="learning-program-row">
                    <Smartphone size={18} />
                    <span>Mobile app development</span>
                    <span className="learning-coming">Coming soon</span>
                  </div>
                </div>
                <div className="learning-signoff">
                  <div>
                    <strong>Your next chapter starts here.</strong>
                    <span>A laptop, an internet connection, and your curiosity.</span>
                  </div>
                  <a className="learning-button learning-button-primary" href="#pricing">
                    Explore enrollment <ArrowRight size={15} />
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section className="learning-pricing" id="pricing">
          <div className="learning-container">
            <div className="learning-price-card">
              <div className="learning-price-details">
                <div className="learning-pill">
                  WEB DEVELOPMENT · {c.duration_weeks}-WEEK PROGRAM
                </div>
                <div className="learning-price-line">
                  <h2>
                    <small>KES</small> {(price.amount / 100).toLocaleString('en-KE')}
                  </h2>
                  {price.early && <del>{money(c.regular_price)}</del>}
                </div>
                <p className="learning-price-saving">
                  {price.early
                    ? `Save ${saving}% with early-bird registration`
                    : 'One payment for the full program'}
                </p>
                {price.early && <Countdown deadline={c.early_deadline} variant="tiles" />}
                <ul className="learning-inclusions">
                  {[
                    'Live, instructor-led online classes',
                    'Frontend, backend, databases & deployment',
                    'Your own individual website project',
                    'Student portal, curriculum & progress tracking',
                  ].map((t) => (
                    <li key={t}>
                      <CheckCircle2 size={17} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="learning-checkout">
                <Code2 size={25} className="learning-checkout-icon" />
                <span className="learning-label">YOUR NEXT CHAPTER</span>
                <h3>Ready to build?</h3>
                <p>Join the next web development cohort.</p>
                <a className="learning-button learning-button-primary" href="/register">
                  Register & enroll <ArrowRight size={16} />
                </a>
                <div className="learning-payment-methods">
                  <span>M-PESA</span>
                  <span>Visa / Mastercard</span>
                </div>
                <div className="learning-secure">
                  <ShieldCheck size={14} /> Secure checkout with Paystack
                </div>
                {!ready && (
                  <p className="learning-checkout-notice">
                    Checkout is being configured. Explore the program in the meantime.
                  </p>
                )}
                <p className="learning-cost-note">
                  AI subscriptions and optional custom domains are separate. {c.timetable}
                </p>
                <a className="learning-faq-link" href="/faq">
                  Questions? Read the FAQs <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer site={s} />
    </div>
  );
}
