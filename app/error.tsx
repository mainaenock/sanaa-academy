'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="narrow page-content">
      <div className="card">
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>We couldn’t load this page.</h1>
        <p>
          Please try again. If this is a new installation, the operator should check the database
          migrations and service configuration.
        </p>
        <div className="form-actions">
          <button className="btn" onClick={reset}>
            Try again
          </button>
          <a className="text-link" href="/">
            Academy home
          </a>
        </div>
      </div>
    </main>
  );
}
