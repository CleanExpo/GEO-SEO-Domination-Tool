import axios from 'axios'

const SEMRUSH_API_BASE = 'https://api.semrush.com'

export class SEMrushService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getDomainOverview(domain: string, database = 'us') {
    try {
      const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
        params: {
          type: 'domain_ranks',
          key: this.apiKey,
          export_columns: 'Ot,Oc,Or,Xn,Rk',
          domain,
          database,
        },
      })
      return this.parseCSVResponse(response.data)
    } catch (error) {
      console.error('SEMrush API error:', error)
      throw error
    }
  }

  async getOrganicKeywords(domain: string, database = 'us', limit = 100) {
    try {
      const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
        params: {
          type: 'domain_organic',
          key: this.apiKey,
          export_columns: 'Ph,Po,Nq,Cp,Co,Kd,Tr,Tc,Nr,Td',
          domain,
          database,
          display_limit: limit,
        },
      })
      return this.parseCSVResponse(response.data)
    } catch (error) {
      console.error('SEMrush organic keywords error:', error)
      throw error
    }
  }

  async getBacklinks(domain: string, limit = 100) {
    try {
      const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
        params: {
          type: 'backlinks',
          key: this.apiKey,
          target: domain,
          target_type: 'root_domain',
          export_columns: 'source_url,source_title,target_url,anchor,response_code',
          display_limit: limit,
        },
      })
      return this.parseCSVResponse(response.data)
    } catch (error) {
      console.error('SEMrush backlinks error:', error)
      throw error
    }
  }

  async getCompetitors(domain: string, database = 'us', limit = 10) {
    try {
      const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
        params: {
          type: 'domain_organic_organic',
          key: this.apiKey,
          export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
          domain,
          database,
          display_limit: limit,
        },
      })
      return this.parseCSVResponse(response.data)
    } catch (error) {
      console.error('SEMrush competitors error:', error)
      throw error
    }
  }

  async getKeywordDifficulty(keywords: string[], database = 'us') {
    try {
      const response = await axios.get(`${SEMRUSH_API_BASE}/`, {
        params: {
          type: 'phrase_kdi',
          key: this.apiKey,
          export_columns: 'Ph,Kd',
          phrase: keywords.join(','),
          database,
        },
      })
      return this.parseCSVResponse(response.data)
    } catch (error) {
      console.error('SEMrush keyword difficulty error:', error)
      throw error
    }
  }

  private parseCSVResponse(csvData: string) {
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(';')
    const results = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';')
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      results.push(row)
    }

    return results
  }
}
