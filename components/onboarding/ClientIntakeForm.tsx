'use client';

/**
 * Client Intake Form Component
 *
 * Comprehensive form to capture all client requirements for onboarding:
 * - Business information
 * - Website details
 * - SEO goals and keywords
 * - Content preferences
 * - Competitor information
 * - Service selection
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  Target,
  FileText,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Save,
  FolderOpen,
  Search,
  Sparkle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ClientIntakeData {
  // Business Information
  businessName: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;

  // Website Details
  website: string;
  hasExistingWebsite: boolean;
  websitePlatform?: string;

  // SEO Goals
  primaryGoals: string[];
  targetKeywords: string[];
  targetLocations: string[];
  monthlyTrafficGoal?: number;

  // Content Preferences
  contentTypes: string[];
  contentFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  brandVoice: string;

  // Competitors
  competitors: string[];

  // Services
  selectedServices: string[];
  budget: string;
}

export function ClientIntakeForm({ onComplete }: { onComplete?: (data: ClientIntakeData) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [formData, setFormData] = useState<ClientIntakeData>({
    businessName: '',
    industry: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    hasExistingWebsite: true,
    websitePlatform: '',
    primaryGoals: [],
    targetKeywords: [],
    targetLocations: [],
    contentTypes: [],
    contentFrequency: 'weekly',
    brandVoice: '',
    competitors: [],
    selectedServices: [],
    budget: ''
  });

  const updateField = <K extends keyof ClientIntakeData>(
    field: K,
    value: ClientIntakeData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: keyof ClientIntakeData, value: string) => {
    const currentArray = formData[field] as string[];
    if (value && !currentArray.includes(value)) {
      updateField(field, [...currentArray, value] as any);
    }
  };

  const removeFromArray = (field: keyof ClientIntakeData, value: string) => {
    const currentArray = formData[field] as string[];
    updateField(field, currentArray.filter(item => item !== value) as any);
  };

  // Save progress function
  const saveProgress = async () => {
    if (!formData.businessName || !formData.email) {
      toast({
        title: 'Cannot Save',
        description: 'Please enter Business Name and Email first',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          email: formData.email,
          formData,
          currentStep
        })
      });

      if (response.ok) {
        setLastSaved(new Date());
        toast({
          title: 'Progress Saved!',
          description: 'Your onboarding progress has been saved'
        });
      } else {
        // Get actual error details from response
        const errorData = await response.json();
        throw new Error(
          `Save failed (${response.status}): ${errorData.error || errorData.details || 'Unknown error'}\n${JSON.stringify(errorData, null, 2)}`
        );
      }
    } catch (error: any) {
      // Show the actual error, not a generic message
      toast({
        title: 'Save Failed',
        description: error.message || String(error),
        variant: 'destructive'
      });
      // Also log to console for debugging
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Load saved progress function
  const loadSavedProgress = async () => {
    const businessName = prompt('Enter your Business Name:');
    const email = prompt('Enter your Email:');

    if (!businessName || !email) {
      console.log('[Load] Cancelled - no business name or email provided');
      return;
    }

    console.log('[Load] Attempting to load:', { businessName, email });
    setSaving(true);

    try {
      const url = `/api/onboarding/save?businessName=${encodeURIComponent(businessName)}&email=${encodeURIComponent(email)}`;
      console.log('[Load] Fetching:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('[Load] Response status:', response.status);
      console.log('[Load] Response data:', data);

      if (data.found) {
        console.log('[Load] Data found! Setting form data:', data.formData);
        console.log('[Load] Current step:', data.currentStep);

        setFormData(data.formData);
        setCurrentStep(data.currentStep);
        setLastSaved(new Date(data.lastSaved));

        console.log('[Load] State updated successfully');

        toast({
          title: 'Progress Loaded!',
          description: `Resumed from step ${data.currentStep + 1} of 5. Business: ${data.formData.businessName}`
        });
      } else {
        console.log('[Load] No saved data found');
        toast({
          title: 'No Saved Progress',
          description: 'No saved data found for this business and email',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('[Load] Error:', error);

      // Show actual error details
      toast({
        title: 'Load Failed',
        description: error.message || String(error),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      console.log('[Load] Finished');
    }
  };

  // Business lookup function - auto-populate from Google Business Profile
  const lookupBusiness = async () => {
    const query = prompt('Enter business name and location (e.g., "Joe\'s Pizza Brisbane")');

    if (!query || query.trim().length < 3) {
      console.log('[Lookup] Cancelled or invalid query');
      return;
    }

    console.log('[Lookup] Searching for:', query);
    setLookingUp(true);

    try {
      const response = await fetch('/api/onboarding/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      console.log('[Lookup] Response:', data);

      if (data.found) {
        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          businessName: data.businessName || prev.businessName,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          industry: data.industry || prev.industry,
          website: data.website || prev.website,
          websitePlatform: data.websitePlatform || prev.websitePlatform,
          competitors: data.competitors?.map((c: any) => c.name || c.website).filter(Boolean) || prev.competitors,
          targetKeywords: data.keywords || prev.targetKeywords,
          targetLocations: data.location?.formatted ? [data.location.formatted.split(',')[1]?.trim() || ''] : prev.targetLocations
        }));

        toast({
          title: 'Business Found!',
          description: `Auto-populated ${data.businessName} details from Google Business Profile`,
          duration: 5000
        });

        console.log('[Lookup] Form auto-populated successfully');
      } else {
        toast({
          title: 'Business Not Found',
          description: 'Could not find business in Google. Please enter details manually.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('[Lookup] Error:', error);
      toast({
        title: 'Lookup Failed',
        description: error.message || 'Failed to lookup business',
        variant: 'destructive'
      });
    } finally {
      setLookingUp(false);
      console.log('[Lookup] Finished');
    }
  };

  // Auto-save on form changes (with debounce)
  useEffect(() => {
    if (formData.businessName && formData.email && !saving) {
      const timer = setTimeout(() => {
        saveProgress();
      }, 3000); // Auto-save 3 seconds after changes

      return () => clearTimeout(timer);
    }
  }, [formData, currentStep]); // saveProgress excluded intentionally to prevent loop

  const steps = [
    { id: 'business', title: 'Business Info', icon: Building2 },
    { id: 'website', title: 'Website', icon: Globe },
    { id: 'goals', title: 'SEO Goals', icon: Target },
    { id: 'content', title: 'Content', icon: FileText },
    { id: 'services', title: 'Services', icon: Sparkles }
  ];

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Onboarding Started!',
          description: 'Setting up your workspace and running initial SEO audit...'
        });

        if (onComplete) {
          onComplete(formData);
        } else {
          router.push(`/onboarding/${data.onboardingId}`);
        }
      } else {
        // Show full error details including status and response
        throw new Error(
          `Onboarding failed (${response.status}): ${data.error || 'Unknown error'}\nDetails: ${JSON.stringify(data, null, 2)}`
        );
      }
    } catch (error: any) {
      // Show full error message
      toast({
        title: 'Error',
        description: error.message || String(error),
        variant: 'destructive'
      });
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Business Info
        return !!(formData.businessName && formData.email && formData.contactName);
      case 1: // Website
        return formData.hasExistingWebsite ? !!formData.website : true;
      case 2: // Goals
        return formData.primaryGoals.length > 0 && formData.targetKeywords.length > 0;
      case 3: // Content
        return formData.contentTypes.length > 0;
      case 4: // Services
        return formData.selectedServices.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center h-12 w-12 rounded-full border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-2 font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep].title}
              <Badge variant="outline">Step {currentStep + 1} of {steps.length}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={saveProgress}
                disabled={saving || !formData.businessName || !formData.email}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadSavedProgress}
                disabled={saving}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Load
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={lookupBusiness}
                disabled={lookingUp}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkle className="h-4 w-4 mr-2" />
                {lookingUp ? 'Looking up...' : 'Auto-Fill from Google'}
              </Button>
            </div>
          </div>

          <CardDescription>
            {currentStep === 0 && 'Tell us about your business'}
            {currentStep === 1 && 'Website information and platform details'}
            {currentStep === 2 && 'Your SEO goals and target keywords'}
            {currentStep === 3 && 'Content strategy and preferences'}
            {currentStep === 4 && 'Select services and set budget'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Business Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                    placeholder="E-commerce, Healthcare, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@acme.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Website Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasWebsite"
                  checked={formData.hasExistingWebsite}
                  onCheckedChange={(checked) =>
                    updateField('hasExistingWebsite', checked as boolean)
                  }
                />
                <Label htmlFor="hasWebsite">I have an existing website</Label>
              </div>

              {formData.hasExistingWebsite && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL *</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://www.acme.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Website Platform</Label>
                    <Input
                      id="platform"
                      value={formData.websitePlatform}
                      onChange={(e) => updateField('websitePlatform', e.target.value)}
                      placeholder="WordPress, Shopify, Custom, etc."
                    />
                  </div>
                </>
              )}

              {!formData.hasExistingWebsite && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    No problem! We'll help you create a professional website as part of your onboarding.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: SEO Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Primary SEO Goals *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Increase organic traffic',
                    'Improve search rankings',
                    'Generate more leads',
                    'Boost local visibility',
                    'Enhance brand awareness',
                    'Drive online sales'
                  ].map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={formData.primaryGoals.includes(goal)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addToArray('primaryGoals', goal);
                          } else {
                            removeFromArray('primaryGoals', goal);
                          }
                        }}
                      />
                      <Label htmlFor={goal} className="text-sm">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Keywords * (Press Enter to add)</Label>
                <Input
                  placeholder="e.g., 'digital marketing services'"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addToArray('targetKeywords', input.value);
                      input.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.targetKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFromArray('targetKeywords', keyword)}
                    >
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Locations (Press Enter to add)</Label>
                <Input
                  placeholder="e.g., 'New York, NY'"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addToArray('targetLocations', input.value);
                      input.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.targetLocations.map((location) => (
                    <Badge
                      key={location}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFromArray('targetLocations', location)}
                    >
                      {location} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Competitors (Press Enter to add)</Label>
                <Input
                  placeholder="Competitor website URL"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addToArray('competitors', input.value);
                      input.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.competitors.map((competitor) => (
                    <Badge
                      key={competitor}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => removeFromArray('competitors', competitor)}
                    >
                      {competitor} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Content Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Content Types *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Blog posts',
                    'Landing pages',
                    'Product descriptions',
                    'Service pages',
                    'Case studies',
                    'News articles',
                    'FAQ content',
                    'Video scripts'
                  ].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={formData.contentTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addToArray('contentTypes', type);
                          } else {
                            removeFromArray('contentTypes', type);
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content Frequency</Label>
                <RadioGroup
                  value={formData.contentFrequency}
                  onValueChange={(value) =>
                    updateField('contentFrequency', value as any)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly (Recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                    <Label htmlFor="bi-weekly">Bi-weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Monthly</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Brand Voice & Tone</Label>
                <Textarea
                  value={formData.brandVoice}
                  onChange={(e) => updateField('brandVoice', e.target.value)}
                  placeholder="Professional, friendly, authoritative... Describe how you want to communicate with your audience."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Services & Budget */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Services *</Label>
                <div className="space-y-3">
                  {[
                    { name: 'SEO Audit & Optimization', desc: 'Complete technical and on-page SEO' },
                    { name: 'Content Creation', desc: 'Blog posts, articles, and web content' },
                    { name: 'Local SEO', desc: 'Google Business Profile and local citations' },
                    { name: 'Link Building', desc: 'Quality backlinks and authority building' },
                    { name: 'Reporting & Analytics', desc: 'Monthly reports and performance tracking' },
                    { name: 'Social Media Management', desc: 'Content and engagement on social platforms' }
                  ].map((service) => (
                    <Card
                      key={service.name}
                      className={`cursor-pointer transition-colors ${
                        formData.selectedServices.includes(service.name)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        if (formData.selectedServices.includes(service.name)) {
                          removeFromArray('selectedServices', service.name);
                        } else {
                          addToArray('selectedServices', service.name);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={formData.selectedServices.includes(service.name)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Budget</Label>
                <RadioGroup
                  value={formData.budget}
                  onValueChange={(value) => updateField('budget', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="<1000" id="budget1" />
                    <Label htmlFor="budget1">Under $1,000/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1000-2500" id="budget2" />
                    <Label htmlFor="budget2">$1,000 - $2,500/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2500-5000" id="budget3" />
                    <Label htmlFor="budget3">$2,500 - $5,000/month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5000+" id="budget4" />
                    <Label htmlFor="budget4">$5,000+/month</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep) || loading}
              >
                {loading ? 'Starting Onboarding...' : 'Start Onboarding'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
