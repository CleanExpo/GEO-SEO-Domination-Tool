/**
 * Usage Tracking Service
 *
 * Tracks resource consumption per organisation for billing and quota enforcement.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type EventType = 'api_call' | 'storage' | 'compute' | 'search' | 'export';

export interface UsageEvent {
  organisationId: string;
  userId?: string;
  eventType: EventType;
  resource: string;
  quantity?: number;
  metadata?: Record<string, any>;
}

export interface QuotaStatus {
  organisationId: string;
  organisationName: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';

  apiCallsUsed: number;
  apiCallsLimit: number;
  apiUsagePercentage: number;

  storageUsed: number;
  storageLimit: number;
  storageUsagePercentage: number;

  computeUsed: number;
  computeLimit: number;
  computeUsagePercentage: number;

  searchUsed: number;
  searchLimit: number;
  searchUsagePercentage: number;

  exportUsed: number;
  exportLimit: number;
  exportUsagePercentage: number;

  quotaPeriodStart: string;
  quotaPeriodEnd: string;
  timeRemaining: string;
}

export interface UsageAlert {
  id: string;
  organisationId: string;
  alertType: 'warning_80' | 'warning_90' | 'limit_reached';
  resourceType: 'api_calls' | 'storage' | 'compute' | 'search' | 'export';
  thresholdPercentage: number;
  currentUsage: number;
  limitValue: number;
  acknowledged: boolean;
  createdAt: string;
}

class UsageTracker {
  /**
   * Log a usage event
   */
  async logEvent(event: UsageEvent): Promise<void> {
    const { organisationId, userId, eventType, resource, quantity = 1, metadata = {} } = event;

    // Call the database function to log usage
    const { error } = await supabase.rpc('log_usage_event', {
      p_organisation_id: organisationId,
      p_user_id: userId || null,
      p_event_type: eventType,
      p_resource: resource,
      p_quantity: quantity,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Failed to log usage event:', error);
      throw new Error(`Usage tracking failed: ${error.message}`);
    }
  }

  /**
   * Get quota status for an organisation
   */
  async getQuotaStatus(organisationId: string): Promise<QuotaStatus | null> {
    const { data, error } = await supabase
      .from('organisation_quota_status')
      .select('*')
      .eq('organisation_id', organisationId)
      .single();

    if (error) {
      console.error('Failed to get quota status:', error);
      return null;
    }

    return {
      organisationId: data.organisation_id,
      organisationName: data.organisation_name,
      plan: data.plan,
      apiCallsUsed: data.api_calls_used,
      apiCallsLimit: data.api_calls_limit,
      apiUsagePercentage: data.api_usage_percentage || 0,
      storageUsed: data.storage_used,
      storageLimit: data.storage_limit,
      storageUsagePercentage: data.storage_usage_percentage || 0,
      computeUsed: data.compute_used,
      computeLimit: data.compute_limit,
      computeUsagePercentage: data.compute_usage_percentage || 0,
      searchUsed: data.search_used,
      searchLimit: data.search_limit,
      searchUsagePercentage: data.search_usage_percentage || 0,
      exportUsed: data.export_used,
      exportLimit: data.export_limit,
      exportUsagePercentage: data.export_usage_percentage || 0,
      quotaPeriodStart: data.quota_period_start,
      quotaPeriodEnd: data.quota_period_end,
      timeRemaining: data.time_remaining,
    };
  }

  /**
   * Check if organisation has quota available for a resource
   */
  async hasQuota(
    organisationId: string,
    resourceType: 'api_calls' | 'storage' | 'compute' | 'search' | 'export',
    requiredQuantity = 1
  ): Promise<boolean> {
    const status = await this.getQuotaStatus(organisationId);
    if (!status) return false;

    switch (resourceType) {
      case 'api_calls':
        return status.apiCallsUsed + requiredQuantity <= status.apiCallsLimit;
      case 'storage':
        return status.storageUsed + requiredQuantity <= status.storageLimit;
      case 'compute':
        return status.computeUsed + requiredQuantity <= status.computeLimit;
      case 'search':
        return status.searchUsed + requiredQuantity <= status.searchLimit;
      case 'export':
        return status.exportUsed + requiredQuantity <= status.exportLimit;
      default:
        return false;
    }
  }

  /**
   * Get unacknowledged alerts for an organisation
   */
  async getAlerts(organisationId: string): Promise<UsageAlert[]> {
    const { data, error } = await supabase
      .from('usage_alerts')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('acknowledged', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get usage alerts:', error);
      return [];
    }

    return data.map((alert) => ({
      id: alert.id,
      organisationId: alert.organisation_id,
      alertType: alert.alert_type,
      resourceType: alert.resource_type,
      thresholdPercentage: alert.threshold_percentage,
      currentUsage: alert.current_usage,
      limitValue: alert.limit_value,
      acknowledged: alert.acknowledged,
      createdAt: alert.created_at,
    }));
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('usage_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId);

    if (error) {
      console.error('Failed to acknowledge alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  /**
   * Get usage logs for an organisation (for reporting/export)
   */
  async getUsageLogs(
    organisationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      eventType?: EventType;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    const { startDate, endDate, eventType, limit = 100 } = options;

    let query = supabase
      .from('usage_logs')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get usage logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Export usage data as CSV
   */
  async exportUsageCSV(organisationId: string, startDate: Date, endDate: Date): Promise<string> {
    const logs = await this.getUsageLogs(organisationId, {
      startDate,
      endDate,
      limit: 10000,
    });

    if (logs.length === 0) {
      return 'No data available';
    }

    // CSV header
    const headers = ['Date', 'Event Type', 'Resource', 'Quantity', 'User ID', 'Metadata'];
    const csvRows = [headers.join(',')];

    // CSV data
    logs.forEach((log) => {
      const row = [
        new Date(log.created_at).toISOString(),
        log.event_type,
        `"${log.resource}"`, // Quoted in case of commas
        log.quantity,
        log.user_id || 'N/A',
        `"${JSON.stringify(log.metadata)}"`,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

export const usageTracker = new UsageTracker();
