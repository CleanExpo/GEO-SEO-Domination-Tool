'use client';

/**
 * New Client Onboarding Page
 *
 * Entry point for starting the client onboarding process
 * Includes ability to load previously saved client data
 */

import { useState, useCallback } from 'react';
import { ClientIntakeForm } from '@/components/onboarding/ClientIntakeForm';
import { LoadClientDropdown } from '@/components/onboarding/LoadClientDropdown';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function NewOnboardingPage() {
  const [loadedFormData, setLoadedFormData] = useState<any>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);

  const handleClientLoad = useCallback((formData: any, clientId: string) => {
    console.log('[Onboarding Page] Loading client:', clientId);
    setLoadedFormData(formData);
    setLoadTrigger(prev => prev + 1); // Force re-render of form
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome!</h1>
          <p className="text-xl text-muted-foreground">
            Let's get your SEO workspace set up in just a few minutes
          </p>
        </div>

        {/* Load Saved Client Section */}
        <div className="max-w-4xl mx-auto mb-6">
          <Card>
            <CardContent className="pt-6">
              <LoadClientDropdown onClientLoad={handleClientLoad} />
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground text-center">
                Or start a new client onboarding below
              </p>
            </CardContent>
          </Card>
        </div>

        <ClientIntakeForm
          key={loadTrigger}
          initialFormData={loadedFormData}
        />
      </div>
    </div>
  );
}
