import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Sanaa Academy — Learn to build what’s next', template: '%s | Sanaa Academy' },
  description:
    'Build practical technology skills with Sanaa Academy. Web development enrolling now. Web apps, software, and mobile app development coming soon.',
  robots: { index: true, follow: true },
  icons: { icon: '/sanaa-academy-mark.svg' },
  openGraph: {
    type: 'website',
    siteName: 'Sanaa Academy',
    title: 'Sanaa Academy — Learn to build what’s next.',
    description: 'Practical technology skills. Human guidance. New possibilities.',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
