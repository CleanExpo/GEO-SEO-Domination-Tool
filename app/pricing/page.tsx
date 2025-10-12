/**
 * 3-Tier Pricing Page
 *
 * Addresses Question #1: "How does the CRM use data within the 3-tier scale?"
 *
 * Tiers:
 * - Basic ($499/mo): Manual audits, basic reports, human approval required
 * - Advanced ($1,499/mo): Semi-autonomous, scheduled tasks, AI recommendations
 * - Empire ($2,999/mo): Full autopilot, AI swarm, autonomous execution
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Shield,
  ChevronRight,
  ArrowRight,
  Crown,
  Rocket,
  Star,
  Users,
  Clock,
  BarChart3,
  Brain,
  Globe,
  Lock,
  Settings
} from 'lucide-react';

type BillingCycle = 'monthly' | 'annual';

interface PricingTier {
  id: 'basic' | 'advanced' | 'empire';
  name: string;
  tagline: string;
  price: {
    monthly: number;
    annual: number;
  };
  popular?: boolean;
  gradient: string;
  icon: typeof Star;
  features: {
    category: string;
    items: {
      name: string;
      included: boolean;
      limit?: string;
    }[];
  }[];
  automationLevel: {
    level: string;
    description: string;
    approval: string;
  };
  cta: string;
}

const tiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for getting started',
    price: { monthly: 499, annual: 4990 },
    gradient: 'from-blue-500 to-cyan-500',
    icon: Star,
    features: [
      {
        category: 'SEO Tools',
        items: [
          { name: '1 Website', included: true },
          { name: 'Monthly SEO Audits', included: true },
          { name: '50 Keywords Tracked', included: true },
          { name: 'Basic Backlink Analysis', included: true, limit: '100 backlinks' },
          { name: 'Competitor Tracking', included: true, limit: '2 competitors' },
        ]
      },
      {
        category: 'Automation',
        items: [
          { name: 'AI Recommendations', included: true },
          { name: 'Manual Task Approval', included: true },
          { name: 'Scheduled Reports', included: false },
          { name: 'Auto-Publishing', included: false },
        ]
      },
      {
        category: 'Support',
        items: [
          { name: 'Email Support', included: true },
          { name: 'Knowledge Base', included: true },
          { name: 'Priority Support', included: false },
        ]
      }
    ],
    automationLevel: {
      level: 'Manual',
      description: 'AI provides recommendations, you approve all actions',
      approval: 'Human approval required'
    },
    cta: 'Start Basic Plan'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    tagline: 'Most popular for growing businesses',
    price: { monthly: 1499, annual: 14990 },
    popular: true,
    gradient: 'from-purple-500 to-pink-500',
    icon: Rocket,
    features: [
      {
        category: 'SEO Tools',
        items: [
          { name: '5 Websites', included: true },
          { name: 'Weekly SEO Audits', included: true },
          { name: '500 Keywords Tracked', included: true },
          { name: 'Advanced Backlink Analysis', included: true, limit: '10,000 backlinks' },
          { name: 'Competitor Tracking', included: true, limit: '10 competitors' },
        ]
      },
      {
        category: 'Automation',
        items: [
          { name: 'AI Recommendations', included: true },
          { name: 'Scheduled Task Execution', included: true },
          { name: 'Auto-Publishing (with approval)', included: true },
          { name: 'AI Content Generation', included: true },
        ]
      },
      {
        category: 'Support',
        items: [
          { name: 'Priority Email Support', included: true },
          { name: 'Dedicated Account Manager', included: true },
          { name: '24/7 Chat Support', included: true },
        ]
      }
    ],
    automationLevel: {
      level: 'Semi-Autonomous',
      description: 'AI executes scheduled tasks, you approve publishing',
      approval: 'Approval for content publishing only'
    },
    cta: 'Start Advanced Plan'
  },
  {
    id: 'empire',
    name: 'Empire',
    tagline: 'Full AI autonomy for enterprises',
    price: { monthly: 2999, annual: 29990 },
    gradient: 'from-orange-500 to-red-500',
    icon: Crown,
    features: [
      {
        category: 'SEO Tools',
        items: [
          { name: 'Unlimited Websites', included: true },
          { name: 'Daily SEO Audits', included: true },
          { name: 'Unlimited Keywords', included: true },
          { name: 'Enterprise Backlink Analysis', included: true, limit: 'Unlimited' },
          { name: 'Competitor Intelligence', included: true, limit: 'Unlimited' },
        ]
      },
      {
        category: 'Automation',
        items: [
          { name: 'Full AI Autopilot', included: true },
          { name: 'Autonomous Execution', included: true },
          { name: 'Auto-Publishing (no approval)', included: true },
          { name: 'AI Swarm Coordination', included: true },
        ]
      },
      {
        category: 'Support',
        items: [
          { name: 'White-Glove Onboarding', included: true },
          { name: 'Dedicated Success Team', included: true },
          { name: 'Custom Integrations', included: true },
        ]
      }
    ],
    automationLevel: {
      level: 'Full Autopilot',
      description: 'AI swarm operates autonomously, no approval needed',
      approval: 'No approval required - full autonomy'
    },
    cta: 'Start Empire Plan'
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.price.monthly : Math.round(tier.price.annual / 12);
  };

  const getSavings = (tier: PricingTier) => {
    const monthlyTotal = tier.price.monthly * 12;
    const annualSavings = monthlyTotal - tier.price.annual;
    return annualSavings;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Choose Your SEO Automation Level</h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            From manual recommendations to full AI autopilot. Scale your SEO with the power of autonomous AI agents.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-lg font-semibold transition relative ${
                billingCycle === 'annual'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                  tier.popular ? 'ring-4 ring-purple-500 scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div className={`bg-gradient-to-r ${tier.gradient} text-white p-8`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{tier.name}</h3>
                      <p className="text-white/80 text-sm">{tier.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">${getPrice(tier)}</span>
                      <span className="text-white/80">/mo</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-white/80 mt-2">
                        Save ${getSavings(tier).toLocaleString()}/year
                      </p>
                    )}
                  </div>

                  {/* Automation Level Badge */}
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-semibold text-sm">Automation Level</span>
                    </div>
                    <p className="text-2xl font-bold mb-1">{tier.automationLevel.level}</p>
                    <p className="text-sm text-white/90">{tier.automationLevel.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs">{tier.automationLevel.approval}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="p-8">
                  {tier.features.map((category, idx) => (
                    <div key={idx} className="mb-6">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-purple-600" />
                        {category.category}
                      </h4>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2">
                            {item.included ? (
                              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={item.included ? 'text-gray-700' : 'text-gray-400'}>
                              {item.name}
                              {item.limit && (
                                <span className="text-xs text-gray-500 ml-2">({item.limit})</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* CTA Button */}
                  <Link
                    href={`/signup?tier=${tier.id}`}
                    className={`block w-full bg-gradient-to-r ${tier.gradient} text-white py-4 rounded-lg font-bold text-center hover:opacity-90 transition`}
                  >
                    {tier.cta}
                    <ArrowRight className="inline-block ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Basic</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Advanced</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Empire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-purple-50">
                <td className="px-6 py-4 font-semibold text-gray-900" colSpan={4}>
                  Automation & AI
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-700">AI Recommendations</td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-700">Manual Approval Required</td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><span className="text-sm text-gray-600">Publishing only</span></td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-700">Scheduled Task Execution</td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-700">Full Autopilot Mode</td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-700">AI Swarm Coordination</td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-300 mx-auto" /></td>
                <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ / Trust Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our SEO Automation?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
              <p className="text-gray-300">AES-256 encryption, SOC 2 compliant, never expose credentials</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Proven Results</h3>
              <p className="text-gray-300">99% cheaper than Ahrefs, 100% of the features, AI-powered insights</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dedicated Support</h3>
              <p className="text-gray-300">24/7 support, account managers, white-glove onboarding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
