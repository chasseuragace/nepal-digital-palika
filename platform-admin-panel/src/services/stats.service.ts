import { IStatsDatasource, DashboardStats } from '@/lib/datasources/stats-datasource'
import { getStatsDatasource } from '@/lib/datasources/stats-config'
import { ServiceResponse } from './types'

export class StatsService {
  private datasource: IStatsDatasource

  constructor(datasource?: IStatsDatasource) {
    this.datasource = datasource ?? getStatsDatasource()
  }

  async getDashboardStats(): Promise<ServiceResponse<DashboardStats>> {
    try {
      const data = await this.datasource.getDashboardStats()
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats'
      return { success: false, error: message }
    }
  }
}
