'use client';

/**
 * Social Media Credentials Step (Step 6)
 * Collects OAuth tokens and credentials for social media platforms
 * Supports: Facebook, Instagram, LinkedIn, Twitter, YouTube, TikTok, Pinterest
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Facebook, Instagram, Linkedin, Twitter, Youtube, Music, Image as ImageIcon, Lock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function SocialMediaStep() {
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch checkbox states
  const hasFacebookBusiness = watch('socialMedia.hasFacebookBusiness');
  const hasInstagramBusiness = watch('socialMedia.hasInstagramBusiness');
  const hasLinkedInPage = watch('socialMedia.hasLinkedInPage');
  const hasTwitter = watch('socialMedia.hasTwitter');
  const hasYouTube = watch('socialMedia.hasYouTube');
  const hasTikTok = watch('socialMedia.hasTikTok');
  const hasPinterest = watch('socialMedia.hasPinterest');

  const FormField = ({ name, label, required = false, children }: FormFieldProps) => {
    const fieldName = name.split('.').pop() as string;
    const error = errors.socialMedia?.[fieldName];

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
              Secure Social Media Integration
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            All access tokens are encrypted with AES-256-GCM encryption and stored securely.
            We use OAuth where possible for enhanced security and easy revocation.
          </p>
          <p className="mt-2 font-medium">
            ✓ OAuth-first approach  ✓ Token refresh automation  ✓ Revoke access anytime
          </p>
        </CardContent>
      </Card>

      {/* OAuth Instructions */}
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-amber-900 dark:text-amber-100">
            How to Get Your Access Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>For OAuth platforms (Facebook, Instagram, LinkedIn), you can:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Click "Connect with [Platform]" button (coming soon)</li>
            <li>Or manually create an app in the platform's developer portal</li>
            <li>Copy the access token and paste it below</li>
          </ol>
          <p className="mt-2">
            <strong>Note:</strong> Full OAuth integration is in development. Manual token entry works now.
          </p>
        </CardContent>
      </Card>

      {/* Facebook Business */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Facebook Business</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your Facebook Business Page for automated posting and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasFacebookBusiness"
              {...register('socialMedia.hasFacebookBusiness')}
            />
            <label
              htmlFor="hasFacebookBusiness"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Facebook Business Page
            </label>
          </div>

          {hasFacebookBusiness && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">📘 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">developers.facebook.com <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Create an App → Business Type</li>
                  <li>Add Facebook Login product</li>
                  <li>Get Page Access Token from Graph API Explorer</li>
                </ol>
              </div>

              <FormField name="socialMedia.facebookBusinessId" label="Facebook Business ID">
                <Input
                  {...register('socialMedia.facebookBusinessId')}
                  placeholder="e.g., 123456789012345"
                />
              </FormField>

              <FormField name="socialMedia.facebookPageId" label="Facebook Page ID">
                <Input
                  {...register('socialMedia.facebookPageId')}
                  placeholder="e.g., 987654321098765"
                />
              </FormField>

              <FormField name="socialMedia.facebookAccessToken" label="Page Access Token">
                <Input
                  {...register('socialMedia.facebookAccessToken')}
                  type="password"
                  placeholder="EAAxxxxxxxxx..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Business */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <CardTitle className="text-lg">Instagram Business</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your Instagram Business account (requires Facebook Page connection)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasInstagramBusiness"
              {...register('socialMedia.hasInstagramBusiness')}
            />
            <label
              htmlFor="hasInstagramBusiness"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Instagram Business Account
            </label>
          </div>

          {hasInstagramBusiness && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">📷 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Convert your Instagram to Business Account (in app settings)</li>
                  <li>Link to your Facebook Page</li>
                  <li>Use the same Facebook access token from above</li>
                  <li>Get Instagram Business Account ID from Graph API</li>
                </ol>
              </div>

              <FormField name="socialMedia.instagramBusinessId" label="Instagram Business Account ID">
                <Input
                  {...register('socialMedia.instagramBusinessId')}
                  placeholder="e.g., 17841400123456789"
                />
              </FormField>

              <FormField name="socialMedia.instagramAccessToken" label="Access Token">
                <Input
                  {...register('socialMedia.instagramAccessToken')}
                  type="password"
                  placeholder="Same as Facebook or separate token"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Company Page */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-lg">LinkedIn Company Page</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your LinkedIn Company Page for professional content posting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLinkedInPage"
              {...register('socialMedia.hasLinkedInPage')}
            />
            <label
              htmlFor="hasLinkedInPage"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect LinkedIn Company Page
            </label>
          </div>

          {hasLinkedInPage && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">💼 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">LinkedIn Developers <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Create an App and request Marketing Developer Platform access</li>
                  <li>Add OAuth 2.0 scopes: w_organization_social</li>
                  <li>Generate access token with organization write permissions</li>
                </ol>
              </div>

              <FormField name="socialMedia.linkedInPageId" label="LinkedIn Organization ID">
                <Input
                  {...register('socialMedia.linkedInPageId')}
                  placeholder="e.g., 12345678"
                />
              </FormField>

              <FormField name="socialMedia.linkedInAccessToken" label="Access Token">
                <Input
                  {...register('socialMedia.linkedInAccessToken')}
                  type="password"
                  placeholder="AQV..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Twitter/X */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5" />
              <CardTitle className="text-lg">Twitter (X)</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your Twitter/X account for automated tweeting and engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasTwitter"
              {...register('socialMedia.hasTwitter')}
            />
            <label
              htmlFor="hasTwitter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Twitter/X Account
            </label>
          </div>

          {hasTwitter && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">🐦 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://developer.twitter.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Twitter Developer Portal <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Create a Project and App with Read & Write permissions</li>
                  <li>Generate API Key, API Secret, Access Token, and Access Token Secret</li>
                  <li>Note: Elevated access may be required for posting</li>
                </ol>
              </div>

              <FormField name="socialMedia.twitterApiKey" label="API Key">
                <Input
                  {...register('socialMedia.twitterApiKey')}
                  placeholder="Your Twitter API Key"
                />
              </FormField>

              <FormField name="socialMedia.twitterApiSecret" label="API Secret">
                <Input
                  {...register('socialMedia.twitterApiSecret')}
                  type="password"
                  placeholder="Your Twitter API Secret"
                />
              </FormField>

              <FormField name="socialMedia.twitterAccessToken" label="Access Token">
                <Input
                  {...register('socialMedia.twitterAccessToken')}
                  placeholder="Your Access Token"
                />
              </FormField>

              <FormField name="socialMedia.twitterAccessSecret" label="Access Token Secret">
                <Input
                  {...register('socialMedia.twitterAccessSecret')}
                  type="password"
                  placeholder="Your Access Token Secret"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* YouTube */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">YouTube Channel</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your YouTube channel for video analytics and community management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasYouTube"
              {...register('socialMedia.hasYouTube')}
            />
            <label
              htmlFor="hasYouTube"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect YouTube Channel
            </label>
          </div>

          {hasYouTube && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">📹 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Enable YouTube Data API v3</li>
                  <li>Create OAuth 2.0 credentials or API key</li>
                  <li>Find your Channel ID in YouTube Studio settings</li>
                </ol>
              </div>

              <FormField name="socialMedia.youTubeChannelId" label="YouTube Channel ID">
                <Input
                  {...register('socialMedia.youTubeChannelId')}
                  placeholder="e.g., UC1234567890abcdef"
                />
              </FormField>

              <FormField name="socialMedia.youTubeApiKey" label="YouTube API Key">
                <Input
                  {...register('socialMedia.youTubeApiKey')}
                  type="password"
                  placeholder="AIza..."
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TikTok */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              <CardTitle className="text-lg">TikTok Business</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your TikTok Business account for short-form video management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasTikTok"
              {...register('socialMedia.hasTikTok')}
            />
            <label
              htmlFor="hasTikTok"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect TikTok Business Account
            </label>
          </div>

          {hasTikTok && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">🎵 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Convert to TikTok Business Account (in app)</li>
                  <li>Apply for TikTok Developer access at developers.tiktok.com</li>
                  <li>Create an app and get approval</li>
                  <li>Generate access token with video.publish scope</li>
                </ol>
              </div>

              <FormField name="socialMedia.tiktokUsername" label="TikTok Username">
                <Input
                  {...register('socialMedia.tiktokUsername')}
                  placeholder="@yourusername"
                />
              </FormField>

              <FormField name="socialMedia.tiktokAccessToken" label="Access Token">
                <Input
                  {...register('socialMedia.tiktokAccessToken')}
                  type="password"
                  placeholder="Your TikTok access token"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pinterest */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Pinterest Business</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Connect your Pinterest Business account for pin management and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPinterest"
              {...register('socialMedia.hasPinterest')}
            />
            <label
              htmlFor="hasPinterest"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Connect Pinterest Business Account
            </label>
          </div>

          {hasPinterest && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">📌 How to get credentials:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Convert to Pinterest Business Account</li>
                  <li>Go to <a href="https://developers.pinterest.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Pinterest Developers <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Create an app and request production access</li>
                  <li>Generate access token with pins:write scope</li>
                </ol>
              </div>

              <FormField name="socialMedia.pinterestUsername" label="Pinterest Username">
                <Input
                  {...register('socialMedia.pinterestUsername')}
                  placeholder="Your Pinterest username"
                />
              </FormField>

              <FormField name="socialMedia.pinterestAccessToken" label="Access Token">
                <Input
                  {...register('socialMedia.pinterestAccessToken')}
                  type="password"
                  placeholder="pina_..."
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
            What We Can Do With Social Media Access
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
          <ul className="space-y-2">
            <li>✓ Automatically post content across all connected platforms</li>
            <li>✓ Schedule posts for optimal engagement times</li>
            <li>✓ Monitor mentions and engagement metrics</li>
            <li>✓ Respond to comments and messages (with approval)</li>
            <li>✓ Track hashtag performance and trends</li>
            <li>✓ Generate analytics reports across all platforms</li>
            <li>✓ Cross-post content with platform-specific formatting</li>
            <li>✓ Manage multiple accounts from one dashboard</li>
          </ul>
          <p className="mt-4 font-medium">
            You control posting permissions and can require approval for each post.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
