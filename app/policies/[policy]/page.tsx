import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/public-shell';
import { runtime, site } from '@/lib/db';
export const dynamic = 'force-dynamic';
const names: Record<string, string> = {
  privacy: 'Privacy policy',
  terms: 'Terms & conditions',
  refunds: 'Refund policy',
};
export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  return {
    title: names[policy] ?? 'Policy',
    alternates: { canonical: runtime().APP_URL + '/policies/' + policy },
  };
}
export default async function Policy({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!names[policy]) notFound();
  const s = await site(runtime());
  const contact = s.supportEmail ? (
    <a className="text-link" href={'mailto:' + s.supportEmail}>
      {s.supportEmail}
    </a>
  ) : (
    <>the support contact shown on the academy website once enrollment opens</>
  );
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="narrow">
            <div className="eyebrow">CLEAR EXPECTATIONS. THOUGHTFUL LEARNING.</div>
            <h1>{names[policy]}</h1>
            <p>Effective 17 October 2026 · Sanaa Academy</p>
          </div>
        </section>
        <article className="narrow page-content policy">
          {policy === 'privacy' ? (
            <>
              <h2>Who processes your information</h2>
              <p>
                Sanaa Academy uses personal information to administer registrations, collect and
                verify payments, provide secure course access, support learners, and meet applicable
                obligations. Contact {contact} for privacy questions, corrections, access requests,
                or complaints.
              </p>
              <h2>What we collect and why</h2>
              <p>
                We collect the learner’s name, email, contact phone, adult/under-18 category,
                optional experience and project interests, consent records, payment references and
                status, account sessions, lesson activity and project submissions. We use the
                minimum information needed to deliver and protect the course. We do not collect
                exact dates of birth or store card numbers, PINs, or M-PESA credentials.
              </p>
              <p>
                Account and enrollment processing is necessary to provide the requested service.
                Guardian consent is required for under-18 learners. Optional course-update email is
                based on your separate choice; withdraw it in your profile or via an unsubscribe
                link. Operational security and applicable recordkeeping also require limited
                processing.
              </p>
              <h2>Children and guardians</h2>
              <p>
                A parent or guardian must use their own verified account email, provide contact
                details and confirm their authority and consent before registering a child. The
                guardian manages account access and payment. Contact us to withdraw consent or
                correct guardian information. We may seek proportionate additional verification
                where necessary and will not knowingly enroll a child without appropriate
                authorization. Third-party AI services have their own age and account rules;
                guardians must review them.
              </p>
              <h2>Service providers and international processing</h2>
              <p>
                We use Cloudflare for hosting and database services, Paystack for payment
                processing, and the configured email provider for delivery. Live classes use the
                announced meeting provider. These services may process information outside Kenya.
                The academy must configure appropriate processing agreements and safeguards for
                transfers. We do not sell learner information or publish private progress, contact
                details, submissions, or meeting links.
              </p>
              <h2>Your choices and rights</h2>
              <p>
                Use your portal profile to update basic information, manage optional email consent,
                download your data, or request account deletion. Ask support about correction,
                access, objection, restriction, consent withdrawal, or a guardian request. Identity
                will be verified before disclosing or changing account information. Requests are
                reviewed under applicable Kenyan data protection requirements. You may raise a
                complaint with Kenya’s Office of the Data Protection Commissioner.
              </p>
              <h2>Retention and deletion</h2>
              <p>
                Login codes expire after 10 minutes and are single use. Learner sessions expire
                after seven days, and admin sessions after twelve hours. Expired credentials and
                temporary login emails are routinely purged. Incomplete registrations should be
                reviewed after 30 days, and learning records after 12 months following the cohort.
                Financial and audit records are retained only for the documented period required for
                accounting, disputes, or legal obligations; the operator records the reason before
                fulfilling or declining a deletion request. Account deletion removes contact,
                guardian, session, progress, and submission data, and pseudonymizes retained
                transaction records.
              </p>
              <h2>Security, cookies, and recordings</h2>
              <p>
                Essential cookies secure your session. Turnstile helps prevent abuse on public
                forms. We do not set advertising cookies. We use access controls, encrypted
                transport, and limited administrative access. No service can guarantee absolute
                security. Recordings are shared only if specifically arranged with suitable notice
                and permissions; they are not an automatic course benefit.
              </p>
            </>
          ) : policy === 'terms' ? (
            <>
              <h2>The program</h2>
              <p>
                Sanaa Academy provides the AI-Powered Web Development Bootcamp through live online
                teaching and a private learning portal. Current course dates, prices, schedule,
                capacity, and registration availability appear on the website and may be updated by
                the academy. Final class days and times are announced in the portal. Material
                changes affecting enrolled learners will be communicated through the portal and
                appropriate direct support.
              </p>
              <h2>Enrollment and payment</h2>
              <p>
                Verify your account email, provide accurate details, accept these policies, and pay
                the full program fee through Paystack. The displayed fee covers the whole program.
                Access activates only after server verification. Early-bird eligibility is
                determined when checkout is initialized using the server clock; the approved
                transaction quote is retained for that payment. An abandoned attempt may require a
                new quote at current pricing. Do not create duplicate checkouts while payment is
                processing.
              </p>
              <h2>What you need</h2>
              <p>
                A laptop or desktop, reliable internet, and time to practice are required. AI tools,
                usage credits, domains, and third-party hosting costs are separate unless expressly
                included by the academy. Course participation does not guarantee employment, income,
                a certificate, recordings, search indexing, or a particular project result.
              </p>
              <h2>Your role as a builder</h2>
              <p>
                AI tools can produce errors and insecure or incomplete code. You remain responsible
                for understanding the basics, reviewing outputs, testing, protecting credentials,
                respecting licenses, and maintaining your work. Do not submit unlawful content,
                private information belonging to others, malicious software, or credentials. Keep
                meeting links and course access private, treat other learners respectfully, and
                obtain permission before recording anyone.
              </p>
              <h2>Minors and third-party tools</h2>
              <p>
                Learners under 18 require a parent or guardian’s verified consent. Guardians are
                responsible for supervising third-party service use and complying with those
                providers’ age requirements. Course enrollment does not override third-party terms.
              </p>
              <h2>Your work and course materials</h2>
              <p>
                You keep the rights you hold in your original project. You grant the academy
                permission to view submitted material for teaching and feedback. Public showcasing
                requires separate permission. Course materials are provided for your own learning
                and may not be redistributed without the relevant rights holder’s consent.
              </p>
              <h2>Support and changes</h2>
              <p>
                Contact {contact} for access problems, schedule concerns, conduct issues, or refund
                requests. We may suspend access for serious misuse or verified payment reversals.
                Applicable consumer and data protection rights are preserved. Please review the
                refund and privacy policies before paying.
              </p>
            </>
          ) : (
            <>
              <h2>Requesting a refund</h2>
              <p>
                Contact {contact} from your verified account email with your payment reference and a
                brief explanation. Do not send card numbers, PINs, or M-PESA credentials. Requests
                are reviewed individually under applicable consumer rights and the circumstances of
                the service delivered. This policy does not promise an automatic refund or waive
                statutory rights.
              </p>
              <h2>Duplicate charges, cancellations, and changes</h2>
              <p>
                Report duplicate or incorrect charges promptly so the academy can reconcile verified
                transaction records with Paystack. If the academy cancels the program or makes a
                material change you cannot accept, contact support for the available remedy. An
                abandoned checkout or failed payment is not a completed purchase. If money was
                deducted but your portal is inactive, use the payment verification page and contact
                support with the reference.
              </p>
              <h2>How refunds affect access</h2>
              <p>
                Approved refunds are processed through the payment provider where available.
                Processing time depends on the provider and payment method; support will communicate
                the expected timing for your case. Confirmed full refunds and charge reversals
                revoke paid portal access. Partial refunds require manual reconciliation and a
                documented access decision. Enrollment and payment records may be retained as
                necessary for accounting and dispute handling.
              </p>
            </>
          )}
          <hr className="divider" />
          <p>
            <a className="text-link" href="/register">
              Return to registration ↗
            </a>
          </p>
        </article>
      </main>
      <Footer site={s} />
    </>
  );
}
