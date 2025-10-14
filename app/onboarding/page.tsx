'use client';

/**
 * Main Client Onboarding Page
 *
 * 10-Step comprehensive client intake with credential capture:
 * Steps 0-4: Business data (info, website, goals, content, services)
 * Steps 5-9: Credential capture (website, social, Google, marketing, ads)
 *
 * All credentials encrypted with AES-256-GCM before storage
 * Automatic setup of SEO monitoring and automation workflows
 */

import { ClientIntakeFormV2 } from '@/components/onboarding/ClientIntakeFormV2';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = (data: any) => {
    console.log('Onboarding completed:', data);
    // The form itself handles the redirect after API success
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  New Client Onboarding
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Complete setup in 10 steps • Credentials securely encrypted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>AES-256-GCM Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4 text-amber-600" />
                <span>Auto-Setup Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="py-8">
        <ClientIntakeFormV2 onComplete={handleComplete} />
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What Happens After Submission?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <strong>Company Created</strong>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Your client profile is set up in our system
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <strong>Credentials Encrypted</strong>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  All access credentials secured with military-grade encryption
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                3
              </div>
              <div>
                <strong>Initial Audit Scheduled</strong>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Comprehensive SEO audit queued to run immediately
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                4
              </div>
              <div>
                <strong>Automation Activated</strong>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  AI agents begin monitoring and optimization workflows
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
