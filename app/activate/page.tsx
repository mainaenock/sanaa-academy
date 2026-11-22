import { Header } from '@/components/public-shell';
import { StudentActivationForm } from '@/components/student-activation-form';

export const metadata = { title: 'Set up student access', robots: { index: false, follow: false } };

export default function Activate() {
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <div className="narrow" style={{ maxWidth: 530, paddingTop: 28 }}>
          <StudentActivationForm />
        </div>
      </main>
    </>
  );
}
