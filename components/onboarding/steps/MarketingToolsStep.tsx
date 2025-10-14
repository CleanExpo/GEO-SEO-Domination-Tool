'use client';

/**
 * Step 8: Marketing Tools - Credential Capture
 *
 * Optional step for capturing marketing automation credentials:
 * - Email Marketing Platform (Mailchimp, Klaviyo, etc.)
 * - CRM System (Salesforce, HubSpot, etc.)
 * - Call Tracking (CallRail, CallTrackingMetrics)
 * - Analytics Tools (Hotjar)
 *
 * Created: January 15, 2025
 * Task: Phase 2 - UI Integration (Step 8)
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Mail,
  Users,
  Phone,
  BarChart3,
  Lock,
  ExternalLink,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function MarketingToolsStep() {
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch checkbox states
  const hasEmailMarketing = watch('marketingTools.hasEmailMarketing');
  const hasCrm = watch('marketingTools.hasCrm');
  const hasCallTracking = watch('marketingTools.hasCallTracking');
  const hasHotjar = watch('marketingTools.hasHotjar');

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lock className="h-5 w-5" />
            Secure Marketing Integration
          </CardTitle>
          <CardDescription className="text-blue-700">
            Connect your marketing tools for automation and reporting. All credentials are encrypted with AES-256-GCM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Military-grade encryption (AES-256-GCM)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Complete audit trail of access</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Automatic token refresh (OAuth)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Secure API-only access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Marketing Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Marketing Platform
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Mailchimp, Klaviyo, Constant Contact, or other email platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEmailMarketing"
              {...register('marketingTools.hasEmailMarketing')}
            />
            <Label
              htmlFor="hasEmailMarketing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have an email marketing platform
            </Label>
          </div>

          {hasEmailMarketing && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>Mailchimp:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Mailchimp account</li>
                      <li>Go to Account → Extras → API keys</li>
                      <li>Click "Create A Key"</li>
                      <li>Copy the API key and paste below</li>
                    </ol>
                    <a
                      href="https://mailchimp.com/help/about-api-keys/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Mailchimp API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <strong>Klaviyo:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Klaviyo account</li>
                      <li>Go to Account → Settings → API Keys</li>
                      <li>Click "Create Private API Key"</li>
                      <li>Select "Full Access" permissions</li>
                      <li>Copy the key and paste below</li>
                    </ol>
                    <a
                      href="https://developers.klaviyo.com/en/docs/retrieve_api_credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Klaviyo API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailPlatform">Platform Name</Label>
                  <Input
                    id="emailPlatform"
                    {...register('marketingTools.emailPlatform')}
                    placeholder="e.g., Mailchimp, Klaviyo, Constant Contact"
                  />
                </div>

                <div>
                  <Label htmlFor="emailApiKey">API Key</Label>
                  <Input
                    id="emailApiKey"
                    type="password"
                    {...register('marketingTools.emailApiKey')}
                    placeholder="Enter your email platform API key"
                  />
                </div>

                <div>
                  <Label htmlFor="emailListId">List/Audience ID (Optional)</Label>
                  <Input
                    id="emailListId"
                    {...register('marketingTools.emailListId')}
                    placeholder="e.g., a1b2c3d4e5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The ID of your main email list/audience
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CRM System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            CRM System
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Salesforce, HubSpot, Pipedrive, or other CRM platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasCrm"
              {...register('marketingTools.hasCrm')}
            />
            <Label
              htmlFor="hasCrm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have a CRM system
            </Label>
          </div>

          {hasCrm && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>HubSpot:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to HubSpot account</li>
                      <li>Go to Settings → Integrations → Private Apps</li>
                      <li>Click "Create a private app"</li>
                      <li>Select required scopes (contacts, companies, deals)</li>
                      <li>Copy the access token and paste below</li>
                    </ol>
                    <a
                      href="https://developers.hubspot.com/docs/api/private-apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      HubSpot API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <strong>Salesforce:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Salesforce</li>
                      <li>Go to Setup → Apps → App Manager</li>
                      <li>Create a "Connected App"</li>
                      <li>Enable OAuth settings</li>
                      <li>Copy Consumer Key (Client ID) and paste below</li>
                    </ol>
                    <a
                      href="https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Salesforce API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="crmPlatform">CRM Platform</Label>
                  <Input
                    id="crmPlatform"
                    {...register('marketingTools.crmPlatform')}
                    placeholder="e.g., HubSpot, Salesforce, Pipedrive"
                  />
                </div>

                <div>
                  <Label htmlFor="crmApiKey">API Key / Access Token</Label>
                  <Input
                    id="crmApiKey"
                    type="password"
                    {...register('marketingTools.crmApiKey')}
                    placeholder="Enter your CRM API key or access token"
                  />
                </div>

                <div>
                  <Label htmlFor="crmDomain">CRM Domain (Optional)</Label>
                  <Input
                    id="crmDomain"
                    {...register('marketingTools.crmDomain')}
                    placeholder="e.g., yourcompany.salesforce.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your CRM instance URL (for Salesforce, HubSpot portal, etc.)
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Call Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Tracking
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect CallRail, CallTrackingMetrics, or other call tracking services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasCallTracking"
              {...register('marketingTools.hasCallTracking')}
            />
            <Label
              htmlFor="hasCallTracking"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have call tracking software
            </Label>
          </div>

          {hasCallTracking && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>CallRail:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to CallRail account</li>
                      <li>Go to Settings → API</li>
                      <li>Click "Generate New Key"</li>
                      <li>Copy the API key and paste below</li>
                    </ol>
                    <a
                      href="https://apidocs.callrail.com/#authentication"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      CallRail API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <strong>CallTrackingMetrics:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to CallTrackingMetrics account</li>
                      <li>Go to Account → API Settings</li>
                      <li>Generate a new API access token</li>
                      <li>Copy the token and paste below</li>
                    </ol>
                    <a
                      href="https://api.calltrackingmetrics.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      CTM API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="callTrackingProvider">Call Tracking Provider</Label>
                  <Input
                    id="callTrackingProvider"
                    {...register('marketingTools.callTrackingProvider')}
                    placeholder="e.g., CallRail, CallTrackingMetrics"
                  />
                </div>

                <div>
                  <Label htmlFor="callTrackingApiKey">API Key / Access Token</Label>
                  <Input
                    id="callTrackingApiKey"
                    type="password"
                    {...register('marketingTools.callTrackingApiKey')}
                    placeholder="Enter your call tracking API key"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hotjar (Heat Maps & Session Recordings) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hotjar (Heat Maps & Session Recordings)
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Hotjar for visitor behavior analytics and session recordings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHotjar"
              {...register('marketingTools.hasHotjar')}
            />
            <Label
              htmlFor="hasHotjar"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have a Hotjar account
            </Label>
          </div>

          {hasHotjar && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your Hotjar Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>Site ID:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Hotjar account</li>
                      <li>Go to Sites & Organizations</li>
                      <li>Find your Site ID in the tracking code (6-7 digits)</li>
                      <li>Copy and paste below</li>
                    </ol>
                  </div>

                  <div>
                    <strong>API Key:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Go to Account Settings → API</li>
                      <li>Click "Generate new API key"</li>
                      <li>Copy the key and paste below</li>
                    </ol>
                    <a
                      href="https://help.hotjar.com/hc/en-us/articles/115011639927-API-Getting-Started"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Hotjar API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hotjarSiteId">Hotjar Site ID</Label>
                  <Input
                    id="hotjarSiteId"
                    {...register('marketingTools.hotjarSiteId')}
                    placeholder="e.g., 1234567"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in your Hotjar tracking code
                  </p>
                </div>

                <div>
                  <Label htmlFor="hotjarApiKey">Hotjar API Key</Label>
                  <Input
                    id="hotjarApiKey"
                    type="password"
                    {...register('marketingTools.hotjarApiKey')}
                    placeholder="Enter your Hotjar API key"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* What We Can Do Card */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            What We Can Do With Marketing Tools Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Sync contacts between CRM and email platform</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Track email campaign performance metrics</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Automate lead scoring and segmentation</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Monitor call quality and conversion rates</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Analyze visitor behavior and heat maps</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Generate unified marketing reports</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Set up automated marketing workflows</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Track ROI across all marketing channels</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip Message */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            You can skip this step and add marketing tool credentials later from your dashboard settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
