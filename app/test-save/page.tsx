'use client';

/**
 * Test page for debugging the save API
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSavePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSave = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Frontend Test Company',
          email: 'frontendtest@example.com',
          formData: {
            businessName: 'Frontend Test Company',
            email: 'frontendtest@example.com',
            industry: 'Technology',
            contactName: 'Test User'
          },
          currentStep: 2
        })
      });

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data
      });
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const testLoad = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        '/api/onboarding/save?businessName=Frontend Test Company&email=frontendtest@example.com'
      );

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data
      });
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Test Save/Load API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testSave} disabled={loading}>
              {loading ? 'Testing...' : 'Test Save'}
            </Button>
            <Button onClick={testLoad} disabled={loading} variant="outline">
              {loading ? 'Testing...' : 'Test Load'}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
