/**
 * Data Export Utilities
 * Export data in various formats (CSV, JSON, Excel)
 */

import { supabase } from '@/lib/supabase';

export type ExportFormat = 'csv' | 'json' | 'excel';

export class DataExporter {
  /**
   * Export companies data
   */
  async exportCompanies(format: ExportFormat = 'csv'): Promise<string> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      throw new Error('Failed to fetch companies data');
    }

    switch (format) {
      case 'csv':
        return this.toCSV(data, ['id', 'name', 'website', 'industry', 'location', 'created_at']);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export keywords with rankings
   */
  async exportKeywords(companyId?: string, format: ExportFormat = 'csv'): Promise<string> {
    let query = supabase
      .from('keywords')
      .select('*, companies(name, website)')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error || !data) {
      throw new Error('Failed to fetch keywords data');
    }

    // Flatten nested data
    const flatData = data.map(item => ({
      id: item.id,
      company_name: item.companies?.name,
      keyword: item.keyword,
      location: item.location,
      search_volume: item.search_volume,
      difficulty: item.difficulty,
      current_rank: item.current_rank,
      target_rank: item.target_rank,
      last_checked: item.last_checked,
      created_at: item.created_at,
    }));

    switch (format) {
      case 'csv':
        return this.toCSV(flatData, Object.keys(flatData[0] || {}));
      case 'json':
        return JSON.stringify(flatData, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export rankings history
   */
  async exportRankings(keywordId?: string, format: ExportFormat = 'csv'): Promise<string> {
    let query = supabase
      .from('rankings')
      .select('*, keywords(keyword), companies(name)')
      .order('checked_at', { ascending: false });

    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }

    const { data, error } = await query;

    if (error || !data) {
      throw new Error('Failed to fetch rankings data');
    }

    const flatData = data.map(item => ({
      company_name: item.companies?.name,
      keyword: item.keywords?.keyword,
      position: item.position,
      url: item.url,
      checked_at: item.checked_at,
    }));

    switch (format) {
      case 'csv':
        return this.toCSV(flatData, Object.keys(flatData[0] || {}));
      case 'json':
        return JSON.stringify(flatData, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export SEO audits
   */
  async exportAudits(companyId?: string, format: ExportFormat = 'csv'): Promise<string> {
    let query = supabase
      .from('seo_audits')
      .select('*, companies(name, website)')
      .order('audit_date', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error || !data) {
      throw new Error('Failed to fetch audit data');
    }

    const flatData = data.map(item => ({
      company_name: item.companies?.name,
      url: item.url,
      audit_date: item.audit_date,
      performance_score: item.performance_score,
      accessibility_score: item.accessibility_score,
      seo_score: item.seo_score,
      experience_score: item.experience_score,
      expertise_score: item.expertise_score,
      authoritativeness_score: item.authoritativeness_score,
      trustworthiness_score: item.trustworthiness_score,
      page_speed_mobile: item.page_speed_mobile,
      mobile_friendly: item.mobile_friendly,
      https_enabled: item.https_enabled,
    }));

    switch (format) {
      case 'csv':
        return this.toCSV(flatData, Object.keys(flatData[0] || {}));
      case 'json':
        return JSON.stringify(flatData, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private toCSV(data: any[], columns: string[]): string {
    if (data.length === 0) {
      return '';
    }

    // Header row
    const header = columns.join(',');

    // Data rows
    const rows = data.map(item => {
      return columns
        .map(col => {
          const value = item[col];
          // Escape commas and quotes
          if (value === null || value === undefined) {
            return '';
          }
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Generate comprehensive company report
   */
  async generateCompanyReport(companyId: string): Promise<{
    company: any;
    keywords: any[];
    rankings: any[];
    audits: any[];
  }> {
    const [company, keywords, rankings, audits] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('keywords').select('*').eq('company_id', companyId),
      supabase
        .from('rankings')
        .select('*, keywords(keyword)')
        .eq('company_id', companyId)
        .order('checked_at', { ascending: false })
        .limit(100),
      supabase
        .from('seo_audits')
        .select('*')
        .eq('company_id', companyId)
        .order('audit_date', { ascending: false })
        .limit(10),
    ]);

    return {
      company: company.data,
      keywords: keywords.data || [],
      rankings: rankings.data || [],
      audits: audits.data || [],
    };
  }
}

export const dataExporter = new DataExporter();
