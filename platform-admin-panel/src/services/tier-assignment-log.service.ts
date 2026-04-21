import {
  ITierAssignmentLogDatasource,
  TierAssignmentLogFilters,
  TierAssignmentLogPagination,
  TierAssignmentLogRow,
} from '@/lib/datasources/tier-assignment-log-datasource'
import { getTierAssignmentLogDatasource } from '@/lib/datasources/tier-assignment-log-config'
import { PaginatedResponse, ServiceResponse } from './types'

export class TierAssignmentLogService {
  private datasource: ITierAssignmentLogDatasource

  constructor(datasource?: ITierAssignmentLogDatasource) {
    this.datasource = datasource ?? getTierAssignmentLogDatasource()
  }

  /** Returns paginated tier assignment log rows with filters. */
  async getAll(
    filters: TierAssignmentLogFilters,
    pagination: TierAssignmentLogPagination
  ): Promise<ServiceResponse<PaginatedResponse<TierAssignmentLogRow>>> {
    try {
      const { data, count } = await this.datasource.getAll(filters, pagination)
      const { page, limit } = pagination
      return {
        success: true,
        data: {
          data,
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit),
        },
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch tier assignment log'
      return { success: false, error: message }
    }
  }
}
