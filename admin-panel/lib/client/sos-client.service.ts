/**
 * SOS Client Service
 * Simple wrapper around SOS API endpoints
 * Used by UI pages to fetch/manage SOS data
 */

export interface SOSRequest {
  id: string
  request_code: string
  emergency_type: string
  priority?: string
  status: string
  location_description?: string
  user_name?: string
  user_phone: string
  details?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface ServiceProvider {
  id: string
  name_en: string
  service_type: string
  phone: string
  status: string
  rating_average: number
  total_assignments: number
  is_active: boolean
  created_at: string
}

export interface SOSAssignment {
  id: string
  provider_id: string
  status: string
  estimated_arrival_minutes?: number
  assignment_notes?: string
  created_at: string
}

export interface SOSStats {
  total_today: number
  pending: number
  assigned: number
  in_progress: number
  resolved: number
  cancelled: number
  completion_rate: number
}

class SOSClientService {
  private palikaId = 5; // Default, would come from auth context
  private baseUrl = '/api/admin/sos'

  // Requests
  async getRequests(page = 1, status?: string, search?: string) {
    const params = new URLSearchParams({
      palika_id: this.palikaId.toString(),
      page: page.toString(),
      pageSize: '25',
    })
    if (status) params.append('status', status)
    if (search) params.append('search', search)

    const response = await fetch(`${this.baseUrl}/requests?${params}`)
    if (!response.ok) throw new Error('Failed to fetch requests')
    return response.json()
  }

  async getRequestById(id: string) {
    const response = await fetch(`${this.baseUrl}/requests/${id}`)
    if (!response.ok) throw new Error('Failed to fetch request')
    return response.json()
  }

  async updateRequestStatus(id: string, status: string, notes?: string) {
    const response = await fetch(`${this.baseUrl}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolution_notes: notes, adminId: 'admin-1' }),
    })
    if (!response.ok) throw new Error('Failed to update request')
    return response.json()
  }

  // Providers
  async getProviders(search?: string) {
    const params = new URLSearchParams({ palika_id: this.palikaId.toString() })
    if (search) params.append('search', search)

    const response = await fetch(`${this.baseUrl}/providers?${params}`)
    if (!response.ok) throw new Error('Failed to fetch providers')
    return response.json()
  }

  async getProviderById(id: string) {
    const response = await fetch(`${this.baseUrl}/providers/${id}`)
    if (!response.ok) throw new Error('Failed to fetch provider')
    return response.json()
  }

  async createProvider(data: any) {
    const response = await fetch(`${this.baseUrl}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, palika_id: this.palikaId }),
    })
    if (!response.ok) throw new Error('Failed to create provider')
    return response.json()
  }

  async updateProvider(id: string, data: any) {
    const response = await fetch(`${this.baseUrl}/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update provider')
    return response.json()
  }

  async updateProviderStatus(id: string, status: string) {
    const response = await fetch(`${this.baseUrl}/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Failed to update provider status')
    return response.json()
  }

  async deleteProvider(id: string) {
    const response = await fetch(`${this.baseUrl}/providers/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete provider')
    return response.json()
  }

  // Assignments
  async getAssignments(requestId: string) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/assignments`)
    if (!response.ok) throw new Error('Failed to fetch assignments')
    return response.json()
  }

  async createAssignment(requestId: string, providerId: string, notes?: string, estimatedArrivalMinutes?: number) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_id: providerId,
        assignment_notes: notes,
        estimated_arrival_minutes: estimatedArrivalMinutes,
        adminId: 'admin-1',
      }),
    })
    if (!response.ok) throw new Error('Failed to create assignment')
    return response.json()
  }

  async updateAssignment(requestId: string, assignmentId: string, status: string) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) throw new Error('Failed to update assignment')
    return response.json()
  }

  // Dashboard
  async getStats() {
    const response = await fetch(`${this.baseUrl}/stats?palika_id=${this.palikaId}`)
    if (!response.ok) throw new Error('Failed to fetch stats')
    return response.json()
  }
}

export const sosClientService = new SOSClientService()
