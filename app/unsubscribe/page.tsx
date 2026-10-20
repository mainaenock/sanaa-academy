import { Header } from '@/components/public-shell';
import { UnsubscribeForm } from '@/components/unsubscribe-form';
export const metadata = { title: 'Email preferences', robots: { index: false, follow: false } };
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <Header />
      <main id="main" className="narrow page-content">
        <UnsubscribeForm token={p.token ?? ''} />
      </main>
    </>
  );
}
