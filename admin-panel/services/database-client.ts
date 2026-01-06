/**
 * Database Client Interface
 * Framework-agnostic database abstraction layer
 * Can be implemented with Supabase, Firebase, REST API, etc.
 */

export interface QueryOptions {
  select?: string
  filters?: Record<string, any>
  order?: { column: string; ascending?: boolean }
  limit?: number
  offset?: number
  single?: boolean
}

export interface DatabaseResult<T> {
  data: T | null
  error: Error | null
  count?: number
}

export interface DatabaseClient {
  // Query operations
  from(table: string): QueryBuilder
  
  // Raw SQL (if supported)
  rpc?(functionName: string, params?: Record<string, any>): Promise<DatabaseResult<any>>
}

export interface QueryBuilder {
  select(columns?: string): QueryBuilder
  insert(data: Record<string, any> | Record<string, any>[]): QueryBuilder
  update(data: Record<string, any>): QueryBuilder
  delete(): QueryBuilder
  upsert(data: Record<string, any>, options?: { onConflict?: string }): QueryBuilder
  
  // Filters
  eq(column: string, value: any): QueryBuilder
  neq(column: string, value: any): QueryBuilder
  gt(column: string, value: any): QueryBuilder
  gte(column: string, value: any): QueryBuilder
  lt(column: string, value: any): QueryBuilder
  lte(column: string, value: any): QueryBuilder
  like(column: string, pattern: string): QueryBuilder
  ilike(column: string, pattern: string): QueryBuilder
  is(column: string, value: any): QueryBuilder
  in(column: string, values: any[]): QueryBuilder
  contains(column: string, value: any): QueryBuilder
  containedBy(column: string, value: any): QueryBuilder
  
  // Ordering & Pagination
  order(column: string, options?: { ascending?: boolean }): QueryBuilder
  limit(count: number): QueryBuilder
  range(from: number, to: number): QueryBuilder
  
  // Execution
  single(): QueryBuilder
  maybeSingle(): QueryBuilder
  
  // Execute and return result
  then<TResult>(
    onfulfilled?: (value: DatabaseResult<any>) => TResult | PromiseLike<TResult>
  ): Promise<TResult>
}

/**
 * Supabase implementation of DatabaseClient
 */
export function createSupabaseClient(supabaseClient: any): DatabaseClient {
  return {
    from(table: string) {
      return supabaseClient.from(table)
    },
    async rpc(functionName: string, params?: Record<string, any>) {
      return supabaseClient.rpc(functionName, params)
    }
  }
}

/**
 * Mock implementation for testing
 */
export function createMockClient(mockData: Record<string, any[]> = {}): DatabaseClient & { auth: any } {
  // Clear the store and initialize with new data
  mockDataStore.clear()
  Object.entries(mockData).forEach(([table, data]) => {
    mockDataStore.set(table, [...data])
  })
  
  // Mock auth state
  let currentSession: any = null
  
  const mockAuth = {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      // Find user in admin_users mock data
      const adminUsers = mockData.admin_users || []
      const user = adminUsers.find(u => u.email === email && u.password_hash === password && u.is_active)
      
      if (!user) {
        return {
          data: { session: null, user: null },
          error: { message: 'Invalid email or password' }
        }
      }
      
      // Create mock session
      const session = {
        access_token: `mock-token-${user.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        user: {
          id: user.id,
          email: user.email
        }
      }
      
      currentSession = session
      
      return {
        data: { session, user: session.user },
        error: null
      }
    },
    
    async signOut() {
      currentSession = null
      return { error: null }
    },
    
    async getSession() {
      return {
        data: { session: currentSession },
        error: null
      }
    }
  }
  
  return {
    from(table: string) {
      return createMockQueryBuilder(mockData[table] || [], table)
    },
    async rpc(functionName: string, params?: Record<string, any>) {
      return { data: null, error: null }
    },
    auth: mockAuth
  } as any
}

// Store for mock data that persists across operations
const mockDataStore: Map<string, any[]> = new Map()

function createMockQueryBuilder(data: any[], tableName?: string): QueryBuilder {
  // Initialize store if needed
  if (tableName && !mockDataStore.has(tableName)) {
    mockDataStore.set(tableName, [...data])
  }
  
  const getStoreData = () => tableName ? mockDataStore.get(tableName) || data : data
  
  let selectedColumns: string | undefined
  let filters: Array<(item: any) => boolean> = []
  let orderBy: { column: string; ascending: boolean } | undefined
  let limitCount: number | undefined
  let offsetCount = 0
  let isSingle = false
  let operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  let insertData: any
  let updateData: any
  let returnData = false  // Track if we want to return data after insert/update

  const builder: QueryBuilder = {
    select(columns?: string) {
      selectedColumns = columns
      // If called after insert/update, mark that we want to return data
      if (operation === 'insert' || operation === 'update') {
        returnData = true
      } else {
        operation = 'select'
      }
      return builder
    },
    insert(newData: any) {
      operation = 'insert'
      insertData = newData
      return builder
    },
    update(newData: any) {
      operation = 'update'
      updateData = newData
      return builder
    },
    delete() {
      operation = 'delete'
      return builder
    },
    upsert(newData: any, options?: { onConflict?: string }) {
      operation = 'insert'
      insertData = newData
      return builder
    },
    eq(column: string, value: any) {
      filters.push((item) => item[column] === value)
      return builder
    },
    neq(column: string, value: any) {
      filters.push((item) => item[column] !== value)
      return builder
    },
    gt(column: string, value: any) {
      filters.push((item) => item[column] > value)
      return builder
    },
    gte(column: string, value: any) {
      filters.push((item) => item[column] >= value)
      return builder
    },
    lt(column: string, value: any) {
      filters.push((item) => item[column] < value)
      return builder
    },
    lte(column: string, value: any) {
      filters.push((item) => item[column] <= value)
      return builder
    },
    like(column: string, pattern: string) {
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
      filters.push((item) => regex.test(item[column]))
      return builder
    },
    ilike(column: string, pattern: string) {
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
      filters.push((item) => regex.test(item[column]))
      return builder
    },
    is(column: string, value: any) {
      filters.push((item) => item[column] === value)
      return builder
    },
    in(column: string, values: any[]) {
      filters.push((item) => values.includes(item[column]))
      return builder
    },
    contains(column: string, value: any) {
      filters.push((item) => {
        const col = item[column]
        if (Array.isArray(col)) return col.includes(value)
        if (typeof col === 'object') return JSON.stringify(col).includes(JSON.stringify(value))
        return false
      })
      return builder
    },
    containedBy(column: string, value: any) {
      return builder
    },
    order(column: string, options?: { ascending?: boolean }) {
      orderBy = { column, ascending: options?.ascending ?? true }
      return builder
    },
    limit(count: number) {
      limitCount = count
      return builder
    },
    range(from: number, to: number) {
      offsetCount = from
      limitCount = to - from + 1
      return builder
    },
    single() {
      isSingle = true
      return builder
    },
    maybeSingle() {
      isSingle = true
      return builder
    },
    then(onfulfilled) {
      return Promise.resolve().then(() => {
        let storeData = getStoreData()
        let resultData: any
        
        if (operation === 'insert' && insertData) {
          // Handle insert - add to store and return inserted data
          const newItem = { 
            id: `mock-${Date.now()}`, 
            ...insertData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          if (tableName) {
            storeData.push(newItem)
            mockDataStore.set(tableName, storeData)
          }
          resultData = isSingle ? newItem : [newItem]
        } else if (operation === 'update' && updateData) {
          // Handle update - find matching items and update them
          let updated: any = null
          storeData = storeData.map(item => {
            if (filters.every(f => f(item))) {
              updated = { ...item, ...updateData, updated_at: new Date().toISOString() }
              return updated
            }
            return item
          })
          if (tableName) {
            mockDataStore.set(tableName, storeData)
          }
          resultData = isSingle ? updated : storeData.filter(item => filters.every(f => f(item)))
        } else if (operation === 'delete') {
          // Handle delete - remove matching items
          const before = storeData.length
          storeData = storeData.filter(item => !filters.every(f => f(item)))
          if (tableName) {
            mockDataStore.set(tableName, storeData)
          }
          resultData = null
        } else {
          // Handle select
          let filtered = storeData.filter((item) => filters.every((f) => f(item)))
          
          // Apply ordering
          if (orderBy) {
            filtered.sort((a, b) => {
              const aVal = a[orderBy!.column]
              const bVal = b[orderBy!.column]
              const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
              return orderBy!.ascending ? cmp : -cmp
            })
          }
          
          // Apply pagination
          if (offsetCount > 0) {
            filtered = filtered.slice(offsetCount)
          }
          if (limitCount !== undefined) {
            filtered = filtered.slice(0, limitCount)
          }
          
          resultData = isSingle ? (filtered[0] || null) : filtered
        }
        
        const dbResult: DatabaseResult<any> = {
          data: resultData,
          error: null,
          count: storeData.length
        }
        
        return onfulfilled ? onfulfilled(dbResult) : dbResult
      })
    }
  }

  return builder
}
