'use client';

/**
 * Auto-Discovery Card Component
 *
 * Displays discovered information about the user's website
 * Shows inline summary with confidence indicators
 * Allows auto-fill or manual editing
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Globe,
  Server,
  ShieldCheck,
  Calendar,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';

interface DiscoveryData {
  domain: string;
  registrar?: string;
  hostingProvider?: string;
  dnsProvider?: string;
  contactEmail?: string;
  contactPhone?: string;
  organization?: string;
  platform?: string;
  platformVersion?: string;
  registrationDate?: string;
  expiryDate?: string;
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  isPrivate: boolean;
  confidence: {
    overall: number;
    domain: number;
    contact: number;
    platform: number;
    social: number;
  };
}

interface AutoDiscoveryCardProps {
  data: DiscoveryData;
  onAutoFill: (data: DiscoveryData) => void;
  onDismiss: () => void;
}

export function AutoDiscoveryCard({ data, onAutoFill, onDismiss }: AutoDiscoveryCardProps) {
  const hasContactInfo = data.contactEmail || data.contactPhone;
  const hasSocialProfiles = Object.values(data.socialProfiles || {}).some(Boolean);
  const fieldsFound = [
    data.platform,
    data.hostingProvider,
    data.registrar,
    data.contactEmail,
    data.contactPhone,
    hasSocialProfiles
  ].filter(Boolean).length;

  // Confidence color coding
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="h-5 w-5 text-blue-600" />
          We discovered these details about your website
          <Badge className={getConfidenceBadge(data.confidence.overall)}>
            {data.confidence.overall}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
          <Check className="h-4 w-4" />
          Found {fieldsFound} pieces of information automatically
        </div>

        {/* Discovered Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Website Platform */}
          {data.platform && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <Globe className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Website Platform</p>
                <p className="font-medium text-gray-900 truncate">
                  {data.platform}
                  {data.platformVersion && (
                    <span className="text-sm text-gray-500 ml-1">v{data.platformVersion}</span>
                  )}
                </p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}

          {/* Hosting Provider */}
          {data.hostingProvider && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <Server className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Hosting Provider</p>
                <p className="font-medium text-gray-900 truncate">{data.hostingProvider}</p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}

          {/* Domain Registrar */}
          {data.registrar && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Domain Registrar</p>
                <p className="font-medium text-gray-900 truncate">{data.registrar}</p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}

          {/* DNS Provider */}
          {data.dnsProvider && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">DNS Provider</p>
                <p className="font-medium text-gray-900 truncate">{data.dnsProvider}</p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}

          {/* Contact Email */}
          {data.contactEmail && !data.isPrivate && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Contact Email</p>
                <p className="font-medium text-gray-900 truncate">{data.contactEmail}</p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}

          {/* Contact Phone */}
          {data.contactPhone && !data.isPrivate && (
            <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <Phone className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Contact Phone</p>
                <p className="font-medium text-gray-900 truncate">{data.contactPhone}</p>
              </div>
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Social Media Profiles */}
        {hasSocialProfiles && (
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-xs text-gray-500 mb-2">Social Media Found</p>
            <div className="flex flex-wrap gap-2">
              {data.socialProfiles?.facebook && (
                <Badge variant="secondary" className="gap-1">
                  <Facebook className="h-3 w-3" />
                  Facebook
                </Badge>
              )}
              {data.socialProfiles?.instagram && (
                <Badge variant="secondary" className="gap-1">
                  <Instagram className="h-3 w-3" />
                  Instagram
                </Badge>
              )}
              {data.socialProfiles?.linkedin && (
                <Badge variant="secondary" className="gap-1">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </Badge>
              )}
              {data.socialProfiles?.twitter && (
                <Badge variant="secondary" className="gap-1">
                  <Twitter className="h-3 w-3" />
                  Twitter
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        {data.isPrivate && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-orange-900">Privacy Protection Detected</p>
              <p className="text-orange-700 text-xs mt-1">
                Contact information is protected by domain privacy service. You'll need to enter these details manually.
              </p>
            </div>
          </div>
        )}

        {/* What's Missing */}
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <HelpCircle className="h-4 w-4 text-gray-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-gray-900">Still Need</p>
            <ul className="text-gray-700 text-xs mt-1 space-y-1">
              {data.platform && (
                <li className="flex items-center gap-1">
                  • {data.platform} admin login credentials
                  <button className="text-blue-600 hover:text-blue-700 underline">
                    How to find →
                  </button>
                </li>
              )}
              <li>• Social media account access (if not found above)</li>
              <li>• Google Analytics/Search Console access</li>
              <li>• Marketing tools credentials</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onAutoFill(data)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Auto-fill form with this data
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
          >
            Edit manually
          </Button>
        </div>

        {/* Registration Date */}
        {data.registrationDate && (
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
            Domain registered: {new Date(data.registrationDate).toLocaleDateString()}
            {data.expiryDate && (
              <span className="ml-2">
                • Expires: {new Date(data.expiryDate).toLocaleDateString()}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
