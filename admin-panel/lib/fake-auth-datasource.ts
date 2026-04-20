/**
 * Fake Auth Datasource
 */

import { IAuthDatasource, AdminUser } from './auth-datasource'

export class FakeAuthDatasource implements IAuthDatasource {
  async signIn(email: string, password: string): Promise<AdminUser | null> {
    await this.delay(100)
    if (email === 'admin@palika.np' && password === 'password') {
      return { id: 'fake-admin-1', email, first_name: 'Admin', last_name: 'User', role: 'admin', palika_id: 1 }
    }
    return null
  }

  async signOut(): Promise<void> {
    await this.delay(50)
  }

  async getAdminProfile(adminId: string): Promise<AdminUser | null> {
    await this.delay(50)
    return { id: adminId, email: 'admin@palika.np', first_name: 'Admin', last_name: 'User', role: 'admin', palika_id: 1 }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
