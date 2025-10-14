'use client';

/**
 * Google Ecosystem Step (Step 7)
 * Collects OAuth credentials for Google services
 * GBP, GA4, Search Console, Google Ads, Tag Manager
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Lock, ExternalLink, Chrome } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function GoogleEcosystemStep() {
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch checkbox states
  const hasGoogleBusinessProfile = watch('googleEcosystem.hasGoogleBusinessProfile');
  const hasGoogleAnalytics = watch('googleEcosystem.hasGoogleAnalytics');
  const hasSearchConsole = watch('googleEcosystem.hasSearchConsole');
  const hasGoogleAds = watch('googleEcosystem.hasGoogleAds');
  const hasTagManager = watch('googleEcosystem.hasTagManager');

  const FormField = ({ name, label, required = false, children }: FormFieldProps) => {
    const fieldName = name.split('.').pop() as string;
    const error = errors.googleEcosystem?.[fieldName];

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        {children}
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span>{error.message as string}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base text-blue-900 dark:text-blue-100">
              Google OAuth Integration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            All Google service credentials use OAuth 2.0 for secure authentication.
            We recommend using Google Sign-In for automatic token generation.
          </p>
          <p className="mt-2 font-medium">
            ✓ OAuth 2.0 tokens  ✓ Automatic refresh  ✓ Revoke anytime from Google Account
          </p>
        </CardContent>
      </Card>

      {/* OAuth Instructions */}
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-amber-900 dark:text-amber-100">
            How to Get Google Access Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>All Google services use the same Google Cloud Console project:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
            <li>Create a project (or select existing)</li>
            <li>Enable APIs: Business Profile, Analytics, Search Console, Ads, Tag Manager</li>
            <li>Create OAuth 2.0 credentials</li>
            <li>Generate access tokens for each service</li>
          </ol>
          <p className="mt-2">
            <strong>Note:</strong> Full OAuth integration is in development. Manual token entry works now.
          </p>
        </CardContent>
      </Card>

      {/* Google Business Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Google Business Profile (GBP)</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your Google Business Profile for local SEO management and automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGoogleBusinessProfile"
              {...register('googleEcosystem.hasGoogleBusinessProfile')}
            />
            <label
              htmlFor="hasGoogleBusinessProfile"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Google Business Profile
            </label>
          </div>

          {hasGoogleBusinessProfile && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">🏪 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://business.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Business <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Find your Location ID in the URL or API Explorer</li>
                  <li>Enable Google My Business API in Cloud Console</li>
                  <li>Generate OAuth 2.0 credentials with mybusiness scope</li>
                </ol>
              </div>

              <FormField name="googleEcosystem.gbpEmail" label="Google Account Email">
                <Input
                  {...register('googleEcosystem.gbpEmail')}
                  type="email"
                  placeholder="account@gmail.com"
                />
              </FormField>

              <FormField name="googleEcosystem.gbpLocationId" label="Location ID">
                <Input
                  {...register('googleEcosystem.gbpLocationId')}
                  placeholder="e.g., 1234567890123456789"
                />
              </FormField>

              <FormField name="googleEcosystem.gbpAccessToken" label="OAuth 2.0 Access Token">
                <Input
                  {...register('googleEcosystem.gbpAccessToken')}
                  type="password"
                  placeholder="ya29.a0..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Analytics 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Google Analytics 4 (GA4)</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect GA4 for advanced traffic analytics and conversion tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGoogleAnalytics"
              {...register('googleEcosystem.hasGoogleAnalytics')}
            />
            <label
              htmlFor="hasGoogleAnalytics"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Google Analytics 4
            </label>
          </div>

          {hasGoogleAnalytics && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">📊 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Analytics <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Find Property ID in Admin → Property Settings</li>
                  <li>Enable Analytics Data API in Cloud Console</li>
                  <li>Create OAuth 2.0 credentials with analytics.readonly scope</li>
                </ol>
              </div>

              <FormField name="googleEcosystem.ga4PropertyId" label="GA4 Property ID">
                <Input
                  {...register('googleEcosystem.ga4PropertyId')}
                  placeholder="e.g., 123456789"
                />
              </FormField>

              <FormField name="googleEcosystem.ga4PropertyName" label="Property Name">
                <Input
                  {...register('googleEcosystem.ga4PropertyName')}
                  placeholder="e.g., My Website"
                />
              </FormField>

              <FormField name="googleEcosystem.ga4AccessToken" label="OAuth 2.0 Access Token">
                <Input
                  {...register('googleEcosystem.ga4AccessToken')}
                  type="password"
                  placeholder="ya29.a0..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Google Search Console</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect Search Console for search performance data and indexing management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSearchConsole"
              {...register('googleEcosystem.hasSearchConsole')}
            />
            <label
              htmlFor="hasSearchConsole"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Google Search Console
            </label>
          </div>

          {hasSearchConsole && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">🔍 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Search Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Verify your site ownership</li>
                  <li>Enable Search Console API in Cloud Console</li>
                  <li>Create OAuth 2.0 credentials with webmasters scope</li>
                </ol>
              </div>

              <FormField name="googleEcosystem.gscSiteUrl" label="Verified Site URL">
                <Input
                  {...register('googleEcosystem.gscSiteUrl')}
                  type="url"
                  placeholder="https://example.com"
                />
              </FormField>

              <FormField name="googleEcosystem.gscAccessToken" label="OAuth 2.0 Access Token">
                <Input
                  {...register('googleEcosystem.gscAccessToken')}
                  type="password"
                  placeholder="ya29.a0..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Google Ads</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect Google Ads for campaign management and performance tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGoogleAds"
              {...register('googleEcosystem.hasGoogleAds')}
            />
            <label
              htmlFor="hasGoogleAds"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Google Ads Account
            </label>
          </div>

          {hasGoogleAds && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">💰 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://ads.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Ads <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Find Customer ID (10 digits) in top right corner</li>
                  <li>Enable Google Ads API in Cloud Console</li>
                  <li>Apply for API access (may require approval)</li>
                  <li>Create OAuth 2.0 credentials with adwords scope</li>
                </ol>
              </div>

              <FormField name="googleEcosystem.gadsCustomerId" label="Customer ID (10 digits)">
                <Input
                  {...register('googleEcosystem.gadsCustomerId')}
                  placeholder="e.g., 1234567890"
                />
              </FormField>

              <FormField name="googleEcosystem.gadsAccountName" label="Account Name">
                <Input
                  {...register('googleEcosystem.gadsAccountName')}
                  placeholder="e.g., My Business Ads"
                />
              </FormField>

              <FormField name="googleEcosystem.gadsAccessToken" label="OAuth 2.0 Access Token">
                <Input
                  {...register('googleEcosystem.gadsAccessToken')}
                  type="password"
                  placeholder="ya29.a0..."
                />
              </FormField>

              <FormField name="googleEcosystem.gadsDeveloperToken" label="Developer Token">
                <Input
                  {...register('googleEcosystem.gadsDeveloperToken')}
                  type="password"
                  placeholder="Developer token from MCC account"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Tag Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Google Tag Manager</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect Tag Manager for tag deployment and tracking management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasTagManager"
              {...register('googleEcosystem.hasTagManager')}
            />
            <label
              htmlFor="hasTagManager"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Google Tag Manager
            </label>
          </div>

          {hasTagManager && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">🏷️ How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://tagmanager.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Tag Manager <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Find Container ID (GTM-XXXXXX) in Admin</li>
                  <li>Enable Tag Manager API in Cloud Console</li>
                  <li>Create OAuth 2.0 credentials with tagmanager scope</li>
                </ol>
              </div>

              <FormField name="googleEcosystem.gtmContainerId" label="Container ID">
                <Input
                  {...register('googleEcosystem.gtmContainerId')}
                  placeholder="e.g., GTM-XXXXXX"
                />
              </FormField>

              <FormField name="googleEcosystem.gtmContainerName" label="Container Name">
                <Input
                  {...register('googleEcosystem.gtmContainerName')}
                  placeholder="e.g., My Website Container"
                />
              </FormField>

              <FormField name="googleEcosystem.gtmAccessToken" label="OAuth 2.0 Access Token">
                <Input
                  {...register('googleEcosystem.gtmAccessToken')}
                  type="password"
                  placeholder="ya29.a0..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What We Can Do */}
      <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">
            What We Can Do With Google Ecosystem Access
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
          <ul className="space-y-2">
            <li>✓ Monitor and optimize Google Business Profile listings</li>
            <li>✓ Track website traffic and user behavior in GA4</li>
            <li>✓ Analyze search performance and keyword rankings</li>
            <li>✓ Submit sitemaps and request indexing automatically</li>
            <li>✓ Manage Google Ads campaigns and budgets</li>
            <li>✓ Deploy tracking tags without code changes</li>
            <li>✓ Generate comprehensive reports across all Google services</li>
            <li>✓ Automate local SEO tasks and GBP updates</li>
          </ul>
          <p className="mt-4 font-medium">
            All Google services are managed through secure OAuth 2.0 with automatic token refresh.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
