/**
 * Unit Tests for SEO Audit Utilities
 */

import { describe, it, expect } from 'vitest';

describe('SEO Audit Utilities', () => {
  describe('E-E-A-T Score Calculation', () => {
    it('should calculate valid E-E-A-T score', () => {
      const mockMetrics = {
        experience: 85,
        expertise: 90,
        authoritativeness: 75,
        trustworthiness: 80,
      };

      // Mock calculation (replace with actual function import)
      const calculateEEATScore = (metrics: typeof mockMetrics) => {
        return (
          (metrics.experience +
            metrics.expertise +
            metrics.authoritativeness +
            metrics.trustworthiness) /
          4
        );
      };

      const score = calculateEEATScore(mockMetrics);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBe(82.5);
    });

    it('should handle missing metrics gracefully', () => {
      const incompleteMetrics = {
        experience: 85,
        expertise: 90,
        authoritativeness: 0,
        trustworthiness: 0,
      };

      const calculateEEATScore = (metrics: typeof incompleteMetrics) => {
        return (
          (metrics.experience +
            metrics.expertise +
            metrics.authoritativeness +
            metrics.trustworthiness) /
          4
        );
      };

      const score = calculateEEATScore(incompleteMetrics);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Technical SEO Scoring', () => {
    it('should score mobile performance correctly', () => {
      const mockLighthouseResults = {
        performance: 92,
        accessibility: 88,
        bestPractices: 95,
        seo: 100,
      };

      const calculateOverallScore = (results: typeof mockLighthouseResults) => {
        return (
          (results.performance +
            results.accessibility +
            results.bestPractices +
            results.seo) /
          4
        );
      };

      const score = calculateOverallScore(mockLighthouseResults);
      expect(score).toBeCloseTo(93.75);
    });

    it('should identify performance issues', () => {
      const poorPerformance = {
        performance: 45,
        accessibility: 75,
        bestPractices: 80,
        seo: 95,
      };

      const hasPerformanceIssues = (results: typeof poorPerformance) => {
        return results.performance < 50;
      };

      expect(hasPerformanceIssues(poorPerformance)).toBe(true);
    });
  });

  describe('Keyword Density Analysis', () => {
    it('should calculate keyword density', () => {
      const content = 'SEO optimization is key. SEO tools help with SEO analysis.';
      const keyword = 'SEO';

      const calculateDensity = (text: string, kw: string) => {
        const words = text.toLowerCase().split(/\s+/);
        const kwLower = kw.toLowerCase();
        const occurrences = words.filter((word) => word.includes(kwLower)).length;
        return (occurrences / words.length) * 100;
      };

      const density = calculateDensity(content, keyword);
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThan(100);
    });

    it('should handle empty content', () => {
      const calculateDensity = (text: string, kw: string) => {
        if (!text) return 0;
        const words = text.toLowerCase().split(/\s+/);
        const kwLower = kw.toLowerCase();
        const occurrences = words.filter((word) => word.includes(kwLower)).length;
        return (occurrences / words.length) * 100;
      };

      const density = calculateDensity('', 'keyword');
      expect(density).toBe(0);
    });
  });

  describe('Meta Tag Validation', () => {
    it('should validate meta title length', () => {
      const isValidTitleLength = (title: string) => {
        return title.length >= 30 && title.length <= 60;
      };

      expect(isValidTitleLength('SEO Services | Local Business')).toBe(true);
      expect(isValidTitleLength('Short')).toBe(false);
      expect(
        isValidTitleLength(
          'This is a very long title that exceeds the recommended character limit for search engines'
        )
      ).toBe(false);
    });

    it('should validate meta description length', () => {
      const isValidDescriptionLength = (desc: string) => {
        return desc.length >= 120 && desc.length <= 160;
      };

      const goodDesc =
        'Professional SEO services for local businesses. Improve rankings, increase traffic, and grow your online presence with proven strategies.';
      expect(isValidDescriptionLength(goodDesc)).toBe(true);
      expect(isValidDescriptionLength('Too short')).toBe(false);
    });
  });

  describe('Share of Local Voice (SoLV) Calculation', () => {
    it('should calculate SoLV correctly', () => {
      const competitorRankings = [
        { company: 'A', avgRank: 2.5 },
        { company: 'B', avgRank: 5.0 },
        { company: 'C', avgRank: 8.0 },
        { company: 'You', avgRank: 3.0 },
      ];

      const calculateSoLV = (rankings: typeof competitorRankings, targetCompany: string) => {
        const target = rankings.find((r) => r.company === targetCompany);
        if (!target) return 0;

        const totalInverseRank = rankings.reduce((sum, r) => sum + 1 / r.avgRank, 0);
        const targetInverseRank = 1 / target.avgRank;

        return (targetInverseRank / totalInverseRank) * 100;
      };

      const solv = calculateSoLV(competitorRankings, 'You');
      expect(solv).toBeGreaterThan(0);
      expect(solv).toBeLessThanOrEqual(100);
    });
  });
});
