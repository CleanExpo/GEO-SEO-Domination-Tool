'use client';

/**
 * New Client Onboarding Page V2
 * Uses Path E Hybrid implementation with React Hook Form
 */

import { ClientIntakeFormV2 } from '@/components/onboarding/ClientIntakeFormV2';

export default function OnboardingNewV2Page() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">New Client Onboarding</h1>
          <p className="text-muted-foreground">
            Path E Implementation - React Hook Form + Zod Validation
          </p>
        </div>

        <ClientIntakeFormV2 />
      </div>
    </div>
  );
}
