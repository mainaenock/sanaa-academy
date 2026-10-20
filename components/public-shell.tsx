import { ArrowUpRight, Menu } from 'lucide-react';
import { Logo } from './brand';
import type { SiteContent } from '@/lib/defaults';
export function Header({ text, image }: { text?: string; image?: string }) {
  return (
    <header className="site-header">
      <nav className="wrap nav" aria-label="Main navigation">
        <Logo text={text} image={image} />
        <div className="nav-links">
          <a href="/#programs">Programs</a>
          <a href="/#curriculum">Curriculum</a>
          <a href="/#pricing">Pricing</a>
          <a href="/faq">FAQs</a>
        </div>
        <div className="nav-actions">
          <a href="/portal">Student portal ↗</a>
          <a className="btn btn-lime" href="/register">
            Register now <ArrowUpRight size={14} />
          </a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <Menu size={23} />
          </summary>
          <div className="mobile-links">
            <a href="/#programs">Programs</a>
            <a href="/#curriculum">Curriculum</a>
            <a href="/#pricing">Pricing</a>
            <a href="/faq">FAQs</a>
            <a href="/portal">Student portal</a>
            <a href="/register">Register now ↗</a>
          </div>
        </details>
      </nav>
    </header>
  );
}
export function Footer({ site }: { site: SiteContent }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo text={site.logoText} image={site.logoUrl} />
            <p>{site.tagline}</p>
            <p>{site.footerText}</p>
          </div>
          <div className="footer-links">
            <div>
              <strong>EXPLORE</strong>
              <a href="/#programs">Our programs</a>
              <a href="/faq">FAQs</a>
              <a href="/register">Register now</a>
              <a href="/portal">Student portal</a>
            </div>
            <div>
              <strong>LET’S CONNECT</strong>
              {site.supportEmail ? (
                <a href={`mailto:${site.supportEmail}`}>Email support ↗</a>
              ) : (
                <span>Contact details coming soon</span>
              )}
              {site.whatsapp && (
                <a href={site.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp ↗
                </a>
              )}
              {site.socialLinks.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              ))}
            </div>
            <div>
              <strong>THE DETAILS</strong>
              <a href="/policies/privacy">Privacy policy</a>
              <a href="/policies/terms">Terms & conditions</a>
              <a href="/policies/refunds">Refund policy</a>
              <a href="/admin">Administration</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sanaa Academy. All rights reserved.</span>
          <span>Built on curiosity. Powered by possibility.</span>
        </div>
      </div>
    </footer>
  );
}
