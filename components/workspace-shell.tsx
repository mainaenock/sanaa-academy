'use client';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Settings2,
  Users,
  Wallet,
  Megaphone,
  ShieldCheck,
  LayoutTemplate,
  Mail,
  ExternalLink,
  UserRound,
} from 'lucide-react';
import { Logo } from './brand';
import { api } from './client-api';
const portalLinks = [
  ['', 'Overview', Home],
  ['curriculum', 'My curriculum', BookOpen],
  ['sessions', 'Live classes', CalendarDays],
  ['resources', 'Resources', FolderOpen],
  ['assignments', 'My projects', ClipboardList],
  ['profile', 'My profile', UserRound],
] as const;
const adminLinks = [
  ['', 'Overview', Home],
  ['students', 'Students', Users],
  ['curriculum', 'Curriculum', BookOpen],
  ['sessions', 'Live sessions', CalendarDays],
  ['payments', 'Payments', Wallet],
  ['announcements', 'Announcements', Megaphone],
  ['website', 'Website content', LayoutTemplate],
  ['settings', 'Program settings', Settings2],
  ['emails', 'Email outbox', Mail],
  ['privacy', 'Privacy requests', ShieldCheck],
  ['audit', 'Audit log', ClipboardList],
] as const;
export function WorkspaceShell({
  children,
  admin = false,
  section,
  name,
  email,
  csrf,
}: {
  children: React.ReactNode;
  admin?: boolean;
  section: string;
  name: string;
  email: string;
  csrf: string;
}) {
  const links = admin ? adminLinks : portalLinks,
    base = admin ? '/admin' : '/portal';
  async function logout() {
    try {
      await api('auth/logout', {}, csrf);
      window.location.assign('/');
    } catch {
      window.location.reload();
    }
  }
  const nav = links.map(([slug, label, Icon]) => (
    <a
      key={slug}
      href={base + (slug ? '/' + slug : '')}
      aria-current={section === slug ? 'page' : undefined}
    >
      <Icon size={17} />
      {label}
    </a>
  ));
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Logo />
        <div className="sidebar-label">{admin ? 'ACADEMY MANAGEMENT' : 'YOUR LEARNING SPACE'}</div>
        <nav className="side-links" aria-label={admin ? 'Administration' : 'Learning portal'}>
          {nav}
        </nav>
        <div className="sidebar-bottom">
          <a href="/">Visit academy website ↗</a>
          <button onClick={logout}>
            <LogOut size={13} style={{ display: 'inline', marginRight: 8 }} />
            Sign out securely
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <details className="mobile-workspace-nav">
              <summary aria-label="Open dashboard navigation">
                <Menu size={20} />
              </summary>
              <nav className="mobile-links">
                {nav}
                <a href="/">Academy website</a>
                <button onClick={logout}>Sign out</button>
              </nav>
            </details>
            <span className="muted">
              Sanaa Academy <span style={{ margin: '0 8px', color: '#c2cad8' }}>/</span>{' '}
              {admin ? 'Administration' : 'Student portal'}
            </span>
            <a href="/" className="tiny" aria-label="Open public website">
              <ExternalLink size={13} />
            </a>
          </div>
          <div>
            <span style={{ fontSize: 11 }}>{name || email}</span>
            <span className="avatar">{(name || email).slice(0, 2).toUpperCase()}</span>
          </div>
        </header>
        <main id="main" className="workspace-content">
          {children}
        </main>
      </div>
    </div>
  );
}
