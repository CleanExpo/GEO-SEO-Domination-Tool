/**
 * Tier Selector Component
 *
 * Visual tier selection during onboarding
 * Shows automation levels and feature differences
 */

'use client';

import { useState } from 'react';
import {
  Check,
  Star,
  Rocket,
  Crown,
  Settings,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';

export interface TierOption {
  id: 'basic' | 'advanced' | 'empire';
  name: string;
  price: number;
  gradient: string;
  icon: typeof Star;
  automationLevel: string;
  automationDescription: string;
  approval: string;
  highlights: string[];
  recommended?: boolean;
}

interface TierSelectorProps {
  selectedTier?: 'basic' | 'advanced' | 'empire';
  onSelect: (tierId: 'basic' | 'advanced' | 'empire') => void;
  showPricing?: boolean;
}

const tiers: TierOption[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 499,
    gradient: 'from-blue-500 to-cyan-500',
    icon: Star,
    automationLevel: 'Manual',
    automationDescription: 'AI provides recommendations, you approve all actions',
    approval: 'Human approval required',
    highlights: [
      '1 Website',
      'Monthly audits',
      '50 Keywords',
      'Manual approval for all tasks'
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 1499,
    gradient: 'from-purple-500 to-pink-500',
    icon: Rocket,
    automationLevel: 'Semi-Autonomous',
    automationDescription: 'AI executes scheduled tasks, you approve publishing',
    approval: 'Approval for publishing only',
    recommended: true,
    highlights: [
      '5 Websites',
      'Weekly audits',
      '500 Keywords',
      'Scheduled task execution',
      'Auto-publishing with approval'
    ]
  },
  {
    id: 'empire',
    name: 'Empire',
    price: 2999,
    gradient: 'from-orange-500 to-red-500',
    icon: Crown,
    automationLevel: 'Full Autopilot',
    automationDescription: 'AI swarm operates autonomously, no approval needed',
    approval: 'No approval required',
    highlights: [
      'Unlimited Websites',
      'Daily audits',
      'Unlimited Keywords',
      'Full autonomous execution',
      'AI swarm coordination'
    ]
  }
];

export default function TierSelector({
  selectedTier,
  onSelect,
  showPricing = true
}: TierSelectorProps) {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Automation Level</h2>
        <p className="text-gray-600">
          From manual recommendations to full AI autopilot. You can upgrade anytime.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.id;
          const isHovered = hoveredTier === tier.id;

          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier.id)}
              onMouseEnter={() => setHoveredTier(tier.id)}
              onMouseLeave={() => setHoveredTier(null)}
              className={`relative text-left bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                isSelected
                  ? 'ring-4 ring-purple-500 scale-105'
                  : isHovered
                  ? 'scale-102 shadow-xl'
                  : ''
              }`}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-xs font-bold">
                  RECOMMENDED
                </div>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 left-4 bg-purple-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Header */}
              <div className={`bg-gradient-to-r ${tier.gradient} text-white p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>

                {showPricing && (
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${tier.price}</span>
                      <span className="text-white/80 text-sm">/mo</span>
                    </div>
                  </div>
                )}

                {/* Automation Level */}
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-3 w-3" />
                    <span className="font-semibold text-xs">Automation</span>
                  </div>
                  <p className="text-lg font-bold">{tier.automationLevel}</p>
                  <p className="text-xs text-white/90 mt-1">{tier.automationDescription}</p>
                </div>
              </div>

              {/* Features */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{tier.approval}</span>
                </div>

                <ul className="space-y-2">
                  {tier.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-semibold">Selected</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Flexible Upgrades</h4>
            <p className="text-sm text-blue-800">
              Start with any tier and upgrade as your needs grow. All plans include 14-day free trial.
              Cancel anytime with no penalties.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Link */}
      <div className="text-center">
        <a
          href="/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
        >
          View full feature comparison
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
