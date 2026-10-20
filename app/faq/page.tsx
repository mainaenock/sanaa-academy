import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { Header, Footer } from '@/components/public-shell';
import { runtime, site } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Frequently asked questions',
    description:
      'Answers about Sanaa Academy’s current web development program, classes, equipment, fees, and joining the student portal.',
    alternates: { canonical: runtime().APP_URL + '/faq' },
  };
}
export default async function FAQ() {
  const s = await site(runtime());
  return (
    <div style={{ '--accent': s.accentColor } as React.CSSProperties}>
      <Header text={s.logoText} image={s.logoUrl} />
      <main id="main">
        <section className="page-hero">
          <div className="wrap">
            <div className="eyebrow">BEFORE YOUR NEXT CHAPTER</div>
            <h1>
              Good questions.
              <br />
              Honest answers.
            </h1>
            <p>
              Everything to know about our current web development program. Web apps, software, and
              mobile app programs are coming soon.
            </p>
          </div>
        </section>
        <section className="section faq-section">
          <div className="wrap faq-layout">
            <div className="faq-intro">
              <h2>We’re here to help.</h2>
              <p>From your first class to your final project, here’s what to expect.</p>
              {s.supportEmail && (
                <a className="text-link" href={`mailto:${s.supportEmail}`}>
                  Contact support <ArrowUpRight size={15} />
                </a>
              )}
              <p>
                <a className="text-link" href="/#curriculum">
                  Explore the curriculum <ArrowUpRight size={15} />
                </a>
              </p>
            </div>
            <div className="faq-list">
              {s.faqs.map((f) => (
                <details key={f.question}>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer site={s} />
    </div>
  );
}
