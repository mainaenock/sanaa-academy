import { Header } from '@/components/public-shell';
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="narrow page-content">
        <div className="card">
          <div className="eyebrow">A SMALL DETOUR</div>
          <h1 style={{ fontSize: 32, margin: '20px 0', fontWeight: 700 }}>
            This page hasn’t been built here.
          </h1>
          <p className="muted">
            The link may have changed. Head back to the academy to find your next step.
          </p>
          <a className="btn" href="/">
            Return to Sanaa Academy ↗
          </a>
        </div>
      </main>
    </>
  );
}
