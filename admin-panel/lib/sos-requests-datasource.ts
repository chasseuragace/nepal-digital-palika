/**
 * Abstract SOS Requests Datasource
 */

export interface SOSRequest {
  id: string
  emergency_type: string
  location: string
  status: 'pending' | 'dispatched' | 'resolved' | 'cancelled'
  caller_name: string
  caller_phone: string
  created_at: string
}

export interface ISOSRequestsDatasource {
  getAll(filters?: { status?: string; palika_id?: number }): Promise<SOSRequest[]>
  getById(id: string): Promise<SOSRequest | null>
  create(input: any): Promise<SOSRequest>
  updateStatus(id: string, status: SOSRequest['status']): Promise<void>
  delete(id: string): Promise<boolean>
}
