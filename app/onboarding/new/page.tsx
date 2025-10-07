'use client';

/**
 * New Client Onboarding Page
 *
 * Entry point for starting the client onboarding process
 */

import { ClientIntakeForm } from '@/components/onboarding/ClientIntakeForm';

export default function NewOnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome!</h1>
          <p className="text-xl text-muted-foreground">
            Let's get your SEO workspace set up in just a few minutes
          </p>
        </div>

        <ClientIntakeForm />
      </div>
    </div>
  );
}
