'use client';

/**
 * Step 9: Advertising Platforms - Credential Capture
 *
 * Optional step for capturing advertising platform credentials:
 * - Google Ads (if not already connected in Google Ecosystem)
 * - Facebook Ads Manager
 * - Microsoft Ads (Bing)
 *
 * Created: January 15, 2025
 * Task: Phase 2 - UI Integration (Step 9)
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Megaphone,
  TrendingUp,
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

export function AdvertisingPlatformsStep() {
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch checkbox states
  const hasGoogleAdsAccount = watch('advertising.hasGoogleAdsAccount');
  const hasFacebookAds = watch('advertising.hasFacebookAds');
  const hasMicrosoftAds = watch('advertising.hasMicrosoftAds');

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lock className="h-5 w-5" />
            Secure Advertising Integration
          </CardTitle>
          <CardDescription className="text-blue-700">
            Connect your advertising platforms for campaign management and performance tracking. All credentials are encrypted with AES-256-GCM.
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
              <span>Read-only access (no campaign modifications)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Google Ads
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Google Ads Manager account for campaign tracking and optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasGoogleAdsAccount"
              {...register('advertising.hasGoogleAdsAccount')}
            />
            <Label
              htmlFor="hasGoogleAdsAccount"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have a Google Ads account (not already connected in Step 7)
            </Label>
          </div>

          {hasGoogleAdsAccount && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your Google Ads Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>Manager Account ID:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Google Ads Manager</li>
                      <li>Click on the account name in top right</li>
                      <li>Look for "Manager Account ID" (10 digits, format: 123-456-7890)</li>
                      <li>Copy the ID and paste below</li>
                    </ol>
                  </div>

                  <div>
                    <strong>Developer Token:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Go to API Center in Google Ads Manager</li>
                      <li>Click "Apply for access" if needed</li>
                      <li>Copy your Developer Token (starts with "ABCD" or similar)</li>
                      <li>Paste the token below</li>
                    </ol>
                    <a
                      href="https://developers.google.com/google-ads/api/docs/first-call/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Google Ads API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="bg-amber-100 p-3 rounded-md border border-amber-300">
                    <p className="font-semibold">Note:</p>
                    <p>If you already connected Google Ads in Step 7 (Google Ecosystem), you don't need to add it again here. This is for cases where you have a separate Google Ads Manager account.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="googleAdsManagerId">Google Ads Manager ID</Label>
                  <Input
                    id="googleAdsManagerId"
                    {...register('advertising.googleAdsManagerId')}
                    placeholder="e.g., 123-456-7890"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your 10-digit Manager Account ID
                  </p>
                </div>

                <div>
                  <Label htmlFor="googleAdsDeveloperToken">Developer Token</Label>
                  <Input
                    id="googleAdsDeveloperToken"
                    type="password"
                    {...register('advertising.googleAdsDeveloperToken')}
                    placeholder="Enter your Google Ads Developer Token"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for API access
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Facebook Ads Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Facebook Ads Manager
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Facebook Ads Manager for campaign insights and performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasFacebookAds"
              {...register('advertising.hasFacebookAds')}
            />
            <Label
              htmlFor="hasFacebookAds"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have a Facebook Ads Manager account
            </Label>
          </div>

          {hasFacebookAds && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your Facebook Ads Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>Ad Account ID:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Go to Facebook Ads Manager</li>
                      <li>Click "Ad Account Settings" in Business Settings</li>
                      <li>Find "Ad Account ID" (starts with "act_")</li>
                      <li>Copy the ID and paste below</li>
                    </ol>
                  </div>

                  <div>
                    <strong>Access Token:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Go to Facebook for Developers (developers.facebook.com)</li>
                      <li>Navigate to Tools → Access Token Tool</li>
                      <li>Select your app and generate a User Access Token</li>
                      <li>Grant "ads_read" and "business_management" permissions</li>
                      <li>Copy the token and paste below</li>
                    </ol>
                    <a
                      href="https://developers.facebook.com/docs/marketing-api/get-started"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Facebook Marketing API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="bg-amber-100 p-3 rounded-md border border-amber-300">
                    <p className="font-semibold">Security Note:</p>
                    <p>We only request read-only permissions. We will never modify your campaigns without your explicit approval.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="facebookAdsAccountId">Facebook Ad Account ID</Label>
                  <Input
                    id="facebookAdsAccountId"
                    {...register('advertising.facebookAdsAccountId')}
                    placeholder="e.g., act_1234567890"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Starts with "act_"
                  </p>
                </div>

                <div>
                  <Label htmlFor="facebookAdsAccessToken">Access Token</Label>
                  <Input
                    id="facebookAdsAccessToken"
                    type="password"
                    {...register('advertising.facebookAdsAccessToken')}
                    placeholder="Enter your Facebook access token"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    User access token with ads_read permission
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Microsoft Ads (Bing) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Microsoft Ads (Bing)
            <Badge variant="outline" className="ml-auto">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect Microsoft Advertising for Bing campaign management and reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasMicrosoftAds"
              {...register('advertising.hasMicrosoftAds')}
            />
            <Label
              htmlFor="hasMicrosoftAds"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have a Microsoft Advertising account
            </Label>
          </div>

          {hasMicrosoftAds && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                    <AlertCircle className="h-4 w-4" />
                    How to Get Your Microsoft Ads Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-amber-800">
                  <div>
                    <strong>Account ID:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Log in to Microsoft Advertising</li>
                      <li>Go to Accounts & Billing → Accounts Summary</li>
                      <li>Find your Account ID (numeric, e.g., 12345678)</li>
                      <li>Copy the ID and paste below</li>
                    </ol>
                  </div>

                  <div>
                    <strong>Access Token:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                      <li>Go to Microsoft Azure Portal</li>
                      <li>Register an application in Azure AD</li>
                      <li>Grant Microsoft Advertising API permissions</li>
                      <li>Generate a client secret</li>
                      <li>Use OAuth 2.0 to get an access token</li>
                      <li>Copy the token and paste below</li>
                    </ol>
                    <a
                      href="https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline flex items-center gap-1 mt-2"
                    >
                      Microsoft Ads API Documentation
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="bg-amber-100 p-3 rounded-md border border-amber-300">
                    <p className="font-semibold">Note:</p>
                    <p>Microsoft Ads API requires Azure AD application registration. This is a more complex setup than other platforms. We're happy to assist you with the integration.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="microsoftAdsAccountId">Microsoft Ads Account ID</Label>
                  <Input
                    id="microsoftAdsAccountId"
                    {...register('advertising.microsoftAdsAccountId')}
                    placeholder="e.g., 12345678"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Microsoft Advertising account ID
                  </p>
                </div>

                <div>
                  <Label htmlFor="microsoftAdsAccessToken">Access Token</Label>
                  <Input
                    id="microsoftAdsAccessToken"
                    type="password"
                    {...register('advertising.microsoftAdsAccessToken')}
                    placeholder="Enter your Microsoft Ads access token"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    OAuth 2.0 access token from Azure AD
                  </p>
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
            What We Can Do With Advertising Platform Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Monitor campaign performance in real-time</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Track ROI and cost-per-acquisition</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Generate unified advertising reports</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Identify high-performing keywords and ads</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Compare performance across platforms</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Analyze audience demographics and behavior</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Set up automated alerts for budget thresholds</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Provide optimization recommendations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip Message */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            You can skip this step and add advertising platform credentials later from your dashboard settings.
          </p>
        </CardContent>
      </Card>

      {/* Final Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Ready to Complete Onboarding!</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-purple-800">
          <p className="mb-2">
            This is the final step of the onboarding process. Once you click "Complete Onboarding" below:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Your company profile will be created</li>
            <li>All credentials will be encrypted and stored securely</li>
            <li>Your initial SEO audit will be scheduled</li>
            <li>You'll be redirected to your personalized dashboard</li>
          </ul>
          <p className="mt-3 font-semibold">
            Click "Complete Onboarding" when you're ready!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
