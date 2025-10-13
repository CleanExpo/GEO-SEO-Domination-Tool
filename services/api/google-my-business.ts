import axios from '@/lib/axios-config';
import { TIMEOUT_DEFAULTS } from '@/lib/timeout-wrapper';

// Google My Business (Google Business Profile) API Client
// Docs: https://developers.google.com/my-business/reference/rest

const GMB_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GMB_INSIGHTS_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';

export interface GMBLocation {
  name: string; // Resource name (e.g., "locations/12345")
  title: string; // Business name
  phoneNumbers?: {
    primaryPhone?: string;
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string; // City
    administrativeArea?: string; // State
    postalCode?: string;
    regionCode?: string; // Country code
  };
  categories?: {
    primaryCategory?: {
      displayName: string;
      categoryId: string;
    };
    additionalCategories?: Array<{
      displayName: string;
      categoryId: string;
    }>;
  };
  websiteUri?: string;
  regularHours?: any;
  profile?: {
    description?: string;
  };
  metadata?: {
    mapsUri?: string;
    newReviewUri?: string;
  };
}

export interface GMBReview {
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GMBInsight {
  locationName: string;
  timeZone: string;
  metricValues: Array<{
    metric: string;
    totalValue: {
      value: string;
    };
  }>;
}

export interface GMBMediaItem {
  name: string;
  mediaFormat: 'PHOTO' | 'VIDEO';
  sourceUrl: string;
  googleUrl?: string;
  createTime: string;
  locationAssociation?: {
    category: 'COVER' | 'PROFILE' | 'LOGO' | 'EXTERIOR' | 'INTERIOR' | 'PRODUCT' | 'AT_WORK' | 'FOOD_AND_DRINK' | 'MENU' | 'COMMON_AREA' | 'ROOMS' | 'TEAMS' | 'ADDITIONAL';
  };
}

export class GoogleMyBusinessService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get location details
   */
  async getLocation(locationName: string): Promise<GMBLocation> {
    try {
      const url = `${GMB_API_BASE}/${locationName}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        timeout: TIMEOUT_DEFAULTS.MEDIUM // 30 seconds
      });

      return response.data;
    } catch (error: any) {
      console.error('[GMB] Get location error:', error.response?.data || error.message);
      throw new Error(`GMB get location failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * List all reviews for a location
   */
  async listReviews(locationName: string, pageSize: number = 50): Promise<GMBReview[]> {
    try {
      const url = `${GMB_API_BASE}/${locationName}/reviews`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          pageSize,
        },
        timeout: TIMEOUT_DEFAULTS.MEDIUM // 30 seconds
      });

      return response.data.reviews || [];
    } catch (error: any) {
      console.error('[GMB] List reviews error:', error.response?.data || error.message);
      throw new Error(`GMB list reviews failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get insights (views, clicks, calls, directions, etc.)
   */
  async getInsights(
    locationName: string,
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
  ): Promise<GMBInsight> {
    try {
      const url = `${GMB_INSIGHTS_API}/${locationName}/locations:reportInsights`;

      const response = await axios.post(
        url,
        {
          locationNames: [locationName],
          basicRequest: {
            metricRequests: [
              { metric: 'QUERIES_DIRECT' }, // Direct searches
              { metric: 'QUERIES_INDIRECT' }, // Discovery searches
              { metric: 'VIEWS_MAPS' }, // Map views
              { metric: 'VIEWS_SEARCH' }, // Search views
              { metric: 'ACTIONS_WEBSITE' }, // Website clicks
              { metric: 'ACTIONS_PHONE' }, // Phone calls
              { metric: 'ACTIONS_DRIVING_DIRECTIONS' }, // Direction requests
            ],
            timeRange: {
              startTime: `${startDate}T00:00:00Z`,
              endTime: `${endDate}T23:59:59Z`,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: TIMEOUT_DEFAULTS.MEDIUM // 30 seconds
        }
      );

      return response.data.locationMetrics?.[0] || {};
    } catch (error: any) {
      console.error('[GMB] Get insights error:', error.response?.data || error.message);
      throw new Error(`GMB get insights failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * List media items (photos)
   */
  async listMedia(locationName: string, pageSize: number = 100): Promise<GMBMediaItem[]> {
    try {
      const url = `${GMB_API_BASE}/${locationName}/media`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          pageSize,
        },
        timeout: TIMEOUT_DEFAULTS.MEDIUM // 30 seconds
      });

      return response.data.mediaItems || [];
    } catch (error: any) {
      console.error('[GMB] List media error:', error.response?.data || error.message);
      throw new Error(`GMB list media failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Calculate profile completeness score (0-100)
   */
  calculateProfileCompleteness(location: GMBLocation): number {
    let score = 0;
    let maxScore = 100;

    // Business name (10 points)
    if (location.title) score += 10;

    // Phone number (10 points)
    if (location.phoneNumbers?.primaryPhone) score += 10;

    // Address (15 points)
    if (location.storefrontAddress?.addressLines?.length) {
      score += 15;
    }

    // Primary category (15 points)
    if (location.categories?.primaryCategory) score += 15;

    // Website (10 points)
    if (location.websiteUri) score += 10;

    // Business description (10 points)
    if (location.profile?.description) score += 10;

    // Hours (10 points)
    if (location.regularHours) score += 10;

    // Additional categories (10 points)
    if (location.categories?.additionalCategories?.length) {
      score += Math.min(10, location.categories.additionalCategories.length * 2);
    }

    // Photos handled separately (10 points)
    // Reviews handled separately (not in location object)

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate review response rate
   */
  calculateReviewResponseRate(reviews: GMBReview[]): number {
    if (reviews.length === 0) return 0;

    const respondedCount = reviews.filter(r => r.reviewReply).length;
    return Math.round((respondedCount / reviews.length) * 100);
  }

  /**
   * Get comprehensive baseline vitals from GMB
   */
  async getBaselineVitals(locationName: string) {
    try {
      console.log(`[GMB] Fetching baseline vitals for ${locationName}`);

      // Get data from last 28 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const [location, reviews, insights, media] = await Promise.all([
        this.getLocation(locationName),
        this.listReviews(locationName, 100),
        this.getInsights(
          locationName,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        this.listMedia(locationName, 100),
      ]);

      // Calculate metrics
      const profileCompleteness = this.calculateProfileCompleteness(location);
      const reviewResponseRate = this.calculateReviewResponseRate(reviews);

      const totalReviews = reviews.length;
      const starSum = reviews.reduce((sum, review) => {
        const starMap: any = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
        return sum + (starMap[review.starRating] || 0);
      }, 0);
      const avgRating = totalReviews > 0 ? starSum / totalReviews : 0;

      // Extract insights
      const getMetricValue = (metric: string) => {
        const metricData = insights.metricValues?.find(m => m.metric === metric);
        return parseInt(metricData?.totalValue?.value || '0', 10);
      };

      const searchViews = getMetricValue('VIEWS_SEARCH');
      const mapViews = getMetricValue('VIEWS_MAPS');
      const websiteClicks = getMetricValue('ACTIONS_WEBSITE');
      const phoneCalls = getMetricValue('ACTIONS_PHONE');
      const directionRequests = getMetricValue('ACTIONS_DRIVING_DIRECTIONS');

      // Extract categories
      const categories = [
        location.categories?.primaryCategory?.displayName || '',
        ...(location.categories?.additionalCategories?.map(c => c.displayName) || []),
      ].filter(Boolean);

      // NAP consistency check (basic - compare with what's expected)
      const napConsistency = !!(
        location.title &&
        location.storefrontAddress?.addressLines?.length &&
        location.phoneNumbers?.primaryPhone
      );

      return {
        profileCompleteness,
        napConsistency,
        categories,
        primaryCategory: location.categories?.primaryCategory?.displayName,
        totalReviews,
        avgRating: Math.round(avgRating * 100) / 100,
        reviewResponseRate,
        photosCount: media.length,
        postsLast30Days: 0, // Posts API requires different endpoint
        searchViews,
        mapViews,
        directionRequests,
        phoneCalls,
        websiteClicks,
        businessName: location.title,
        address: location.storefrontAddress?.addressLines?.join(', '),
        phone: location.phoneNumbers?.primaryPhone,
        website: location.websiteUri,
        description: location.profile?.description,
        capturedAt: new Date().toISOString(),
        rawData: {
          location,
          reviews: reviews.slice(0, 10), // Store first 10 reviews
          insights,
        },
      };
    } catch (error: any) {
      console.error('[GMB] Baseline vitals error:', error.message);
      throw error;
    }
  }
}

// Export factory function
export function createGMBService(accessToken?: string): GoogleMyBusinessService | null {
  if (!accessToken) {
    console.warn('[GMB] No access token provided');
    return null;
  }

  return new GoogleMyBusinessService(accessToken);
}

/**
 * Create GMB service with auto-refreshing OAuth token
 */
export async function createGMBServiceWithRefresh(): Promise<GoogleMyBusinessService | null> {
  const { getGMBAccessToken } = await import('./google-oauth-refresh');

  const accessToken = await getGMBAccessToken();
  if (!accessToken) {
    console.warn('[GMB] Could not obtain access token');
    return null;
  }

  return new GoogleMyBusinessService(accessToken);
}
