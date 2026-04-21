import { DashboardStats, IStatsDatasource } from './stats-datasource'

export class FakeStatsDatasource implements IStatsDatasource {
  async getDashboardStats(): Promise<DashboardStats> {
    return {
      total_admins: 12,
      active_roles: 6,
      permissions: 24,
      regions: 786,
      admins_by_role: [
        { role: 'super_admin', count: 2 },
        { role: 'province_admin', count: 3 },
        { role: 'district_admin', count: 4 },
        { role: 'palika_admin', count: 2 },
        { role: 'moderator', count: 1 },
      ],
      recent_activity: [
        {
          id: 1,
          admin_id: '880e8400-e29b-41d4-a716-446655440001',
          action: 'CREATE',
          entity_type: 'admin_users',
          entity_id: '880e8400-e29b-41d4-a716-446655440010',
          changes: { full_name: 'Ramesh Sharma', role: 'palika_admin' },
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          admin_id: '880e8400-e29b-41d4-a716-446655440001',
          action: 'UPDATE',
          entity_type: 'palikas',
          entity_id: '5',
          changes: { subscription_tier_id: 'tier-tourism' },
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          admin_id: '880e8400-e29b-41d4-a716-446655440002',
          action: 'DELETE',
          entity_type: 'admin_users',
          entity_id: '880e8400-e29b-41d4-a716-446655440099',
          changes: null,
          created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        },
      ],
    }
  }
}
