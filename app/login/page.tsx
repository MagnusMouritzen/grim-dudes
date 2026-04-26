import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grim-page max-w-md mx-auto grim-card p-6 text-parchment-200/90 text-sm motion-safe:animate-fade-in">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
