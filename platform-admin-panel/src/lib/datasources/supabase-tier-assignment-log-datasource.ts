import { SupabaseClient } from '@supabase/supabase-js'
import {
  ITierAssignmentLogDatasource,
  TierAssignmentLogFilters,
  TierAssignmentLogPagination,
  TierAssignmentLogRow,
} from './tier-assignment-log-datasource'

export class SupabaseTierAssignmentLogDatasource
  implements ITierAssignmentLogDatasource
{
  constructor(private client: SupabaseClient) {}

  async getAll(
    filters: TierAssignmentLogFilters,
    pagination: TierAssignmentLogPagination
  ): Promise<{ data: TierAssignmentLogRow[]; count: number }> {
    const { palika_id, start_date, end_date } = filters
    const { page, limit } = pagination

    let query = this.client
      .from('tier_assignment_log')
      .select(
        `
        *,
        palika:palika_id(*),
        old_tier:old_tier_id(*),
        new_tier:new_tier_id(*),
        assigned_by:assigned_by(id, full_name)
      `,
        { count: 'exact' }
      )

    if (palika_id) {
      query = query.eq('palika_id', parseInt(palika_id, 10))
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const offset = (page - 1) * limit
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch tier assignment log: ${error.message}`)
    }

    return {
      data: (data as unknown as TierAssignmentLogRow[]) || [],
      count: count || 0,
    }
  }
}
