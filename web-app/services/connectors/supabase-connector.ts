import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  projectUrl: string
  anonKey: string
  serviceRoleKey?: string
}

export interface DatabaseTable {
  name: string
  schema: string
  rowCount: number
  columns: Array<{
    name: string
    type: string
    nullable: boolean
  }>
}

export interface RealtimeSubscription {
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback: (payload: any) => void
}

export class SupabaseConnector {
  private client: SupabaseClient
  private config: SupabaseConfig

  constructor(config: SupabaseConfig) {
    this.config = config
    this.client = createClient(config.projectUrl, config.anonKey)
  }

  // Database Operations
  async getTables(): Promise<DatabaseTable[]> {
    try {
      const { data, error } = await this.client
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public')

      if (error) throw error

      // Get row counts and column info for each table
      const tables: DatabaseTable[] = await Promise.all(
        data.map(async (table) => {
          const { count } = await this.client
            .from(table.table_name)
            .select('*', { count: 'exact', head: true })

          const { data: columns } = await this.client
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', table.table_name)
            .eq('table_schema', 'public')

          return {
            name: table.table_name,
            schema: table.table_schema,
            rowCount: count || 0,
            columns: columns?.map(col => ({
              name: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable === 'YES',
            })) || [],
          }
        })
      )

      return tables
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw error
    }
  }

  async queryTable(tableName: string, options?: {
    select?: string
    limit?: number
    offset?: number
    orderBy?: string
    orderAsc?: boolean
  }): Promise<any[]> {
    try {
      let query = this.client
        .from(tableName)
        .select(options?.select || '*')

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderAsc ?? true })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error querying table:', error)
      throw error
    }
  }

  async insertData(tableName: string, data: any | any[]): Promise<any> {
    try {
      const { data: inserted, error } = await this.client
        .from(tableName)
        .insert(data)
        .select()

      if (error) throw error
      return inserted
    } catch (error) {
      console.error('Error inserting data:', error)
      throw error
    }
  }

  async updateData(tableName: string, id: string | number, data: any): Promise<any> {
    try {
      const { data: updated, error } = await this.client
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()

      if (error) throw error
      return updated
    } catch (error) {
      console.error('Error updating data:', error)
      throw error
    }
  }

  async deleteData(tableName: string, id: string | number): Promise<void> {
    try {
      const { error } = await this.client
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting data:', error)
      throw error
    }
  }

  // Realtime Subscriptions
  subscribeToTable(subscription: RealtimeSubscription) {
    const channel = this.client
      .channel(`${subscription.table}-changes`)
      .on(
        'postgres_changes',
        {
          event: subscription.event,
          schema: 'public',
          table: subscription.table,
        },
        subscription.callback
      )
      .subscribe()

    return {
      unsubscribe: () => channel.unsubscribe(),
    }
  }

  // Storage Operations
  async listBuckets(): Promise<any[]> {
    try {
      const { data, error } = await this.client.storage.listBuckets()
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error listing buckets:', error)
      throw error
    }
  }

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const { data: urlData } = this.client.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  async listFiles(bucket: string, path?: string): Promise<any[]> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(path || '')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error listing files:', error)
      throw error
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Auth Operations
  async getCurrentUser() {
    const { data: { user } } = await this.client.auth.getUser()
    return user
  }

  async listUsers() {
    // Requires service role key
    try {
      const { data, error } = await this.client.auth.admin.listUsers()
      if (error) throw error
      return data.users
    } catch (error) {
      console.error('Error listing users:', error)
      throw error
    }
  }

  // Project Info
  async getProjectMetrics(): Promise<{
    databaseSize: number
    storageSize: number
    apiRequests: number
    activeConnections: number
  }> {
    // This would typically call Supabase management API
    // For now, returning mock data
    return {
      databaseSize: 245600000, // bytes
      storageSize: 1234567890,
      apiRequests: 125430,
      activeConnections: 45,
    }
  }

  // Test Connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('_supabase_health_check')
        .select('*')
        .limit(1)

      // If table doesn't exist, that's fine - connection works
      return error ? error.code !== 'PGRST301' : true
    } catch (error) {
      return false
    }
  }
}

// Helper function to create a connector instance
export const createSupabaseConnector = (config: SupabaseConfig): SupabaseConnector => {
  return new SupabaseConnector(config)
}
