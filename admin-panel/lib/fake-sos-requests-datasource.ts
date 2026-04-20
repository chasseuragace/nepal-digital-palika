/**
 * Fake SOS Requests Datasource
 */

import { ISOSRequestsDatasource, SOSRequest } from './sos-requests-datasource'

export class FakeSOSRequestsDatasource implements ISOSRequestsDatasource {
  private requests: SOSRequest[] = [
    { id: 'fake-sos-1', emergency_type: 'medical', location: 'Main St', status: 'pending', caller_name: 'John', caller_phone: '123', created_at: new Date().toISOString() },
  ]

  async getAll(filters?: { status?: string; palika_id?: number }): Promise<SOSRequest[]> {
    await this.delay(100)
    let filtered = this.requests
    if (filters?.status) filtered = filtered.filter(r => r.status === filters.status)
    return filtered
  }

  async getById(id: string): Promise<SOSRequest | null> {
    await this.delay(50)
    return this.requests.find(r => r.id === id) || null
  }

  async create(input: any): Promise<SOSRequest> {
    await this.delay(100)
    const newRequest = { ...input, id: `fake-sos-${Date.now()}`, status: 'pending', created_at: new Date().toISOString() }
    this.requests.push(newRequest)
    return newRequest
  }

  async updateStatus(id: string, status: SOSRequest['status']): Promise<void> {
    await this.delay(100)
    const request = this.requests.find(r => r.id === id)
    if (request) request.status = status
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(100)
    const index = this.requests.findIndex(r => r.id === id)
    if (index === -1) return false
    this.requests.splice(index, 1)
    return true
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
