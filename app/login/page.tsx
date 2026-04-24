import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto grim-card p-6 text-parchment/70 text-sm">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
