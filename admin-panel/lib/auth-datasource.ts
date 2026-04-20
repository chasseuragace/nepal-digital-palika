/**
 * Abstract Auth Datasource
 */

export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  palika_id?: number
}

export interface IAuthDatasource {
  signIn(email: string, password: string): Promise<AdminUser | null>
  signOut(): Promise<void>
  getAdminProfile(adminId: string): Promise<AdminUser | null>
}
