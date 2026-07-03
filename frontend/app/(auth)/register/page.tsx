import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterForm } from '@/components/auth/register-form';
import { buildMetadata } from '@/config/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Create account',
  description: 'Create your FWorld account.',
  path: '/register',
  noIndex: true,
});

export default function RegisterPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
