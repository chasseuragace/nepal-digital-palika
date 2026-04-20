/**
 * SOS Requests Service
 * Framework-agnostic operations for emergency request management
 */

import {
  SOSRequest,
  SOSRequestFilters,
  SOSRequestAssignment,
  CreateAssignmentInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'
import { ISOSRequestsDatasource } from '@/lib/sos-requests-datasource'
import { getSOSRequestsDatasource } from '@/lib/sos-requests-config'

export class SOSRequestsService {
  private datasource: ISOSRequestsDatasource

  constructor(datasource?: ISOSRequestsDatasource) {
    this.datasource = datasource || getSOSRequestsDatasource()
  }

  async getAll(
    filters: SOSRequestFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<SOSRequest>>> {
    try {
      const requests = await this.datasource.getAll({ status: filters.status, palika_id: filters.palika_id })
      const { page = 1, limit = 25 } = pagination
      const offset = (page - 1) * limit
      const paginated = requests.slice(offset, offset + limit)
      return {
        success: true,
        data: {
          data: paginated,
          total: requests.length,
          page,
          limit,
          hasMore: paginated.length === limit
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch SOS requests' }
    }
  }

  async getById(id: string): Promise<ServiceResponse<SOSRequest>> {
    try {
      const request = await this.datasource.getById(id)
      if (!request) {
        return { success: false, error: 'SOS request not found' }
      }
      return { success: true, data: request }
    } catch (error) {
      return { success: false, error: 'Failed to fetch SOS request' }
    }
  }

  async getByRequestCode(code: string): Promise<ServiceResponse<SOSRequest>> {
    try {
      const { data, error } = await this.db
        .from('sos_requests')
        .select(`
          *,
          palikas!inner(name_en)
        `)
        .eq('request_code', code)
        .single()

      if (error || !data) {
        return { success: false, error: 'SOS request not found' }
      }

      return { success: true, data: this.mapRequest(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch SOS request' }
    }
  }

  async updateStatus(
    id: string,
    status: SOSRequest['status'],
    adminId: string,
    notes?: string
  ): Promise<ServiceResponse<SOSRequest>> {
    try {
      const updateData: any = {
        status,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (status === 'reviewing') {
        updateData.reviewed_at = new Date().toISOString()
        updateData.reviewed_by = adminId
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        if (notes) updateData.resolution_notes = notes
      }

      if (status === 'assigned') {
        updateData.assigned_to = adminId
      }

      const { data, error } = await this.db
        .from('sos_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update status' }
      }

      return {
        success: true,
        data: this.mapRequest(data),
        message: `Request status updated to ${status}`
      }
    } catch (error) {
      return { success: false, error: 'Failed to update status' }
    }
  }

  async assignProvider(input: CreateAssignmentInput, adminId: string): Promise<ServiceResponse<SOSRequestAssignment>> {
    try {
      const assignmentData = {
        sos_request_id: input.sos_request_id,
        provider_id: input.provider_id,
        assigned_by: adminId,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
        estimated_arrival_minutes: input.estimated_arrival_minutes,
        distance_km: input.distance_km,
        assignment_notes: input.assignment_notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.db
        .from('sos_request_assignments')
        .insert(assignmentData)
        .select(`
          *,
          service_providers!inner(name_en, service_type, phone)
        `)
        .single()

      if (error) {
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          return { success: false, error: 'This provider is already assigned to this request' }
        }
        return { success: false, error: error.message || 'Failed to assign provider' }
      }

      // Update the SOS request status to 'assigned' if still pending/reviewing
      await this.db
        .from('sos_requests')
        .update({
          status: 'assigned',
          assigned_to: adminId,
          status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', input.sos_request_id)
        .in('status', ['pending', 'reviewing'])

      // Update provider status to busy
      await this.db
        .from('service_providers')
        .update({ status: 'busy', updated_at: new Date().toISOString() })
        .eq('id', input.provider_id)

      return {
        success: true,
        data: this.mapAssignment(data),
        message: 'Provider assigned successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to assign provider' }
    }
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: SOSRequestAssignment['status'],
    notes?: string
  ): Promise<ServiceResponse<SOSRequestAssignment>> {
    try {
      const updateData: any = {
        status,
        status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (status === 'on_scene') {
        updateData.actual_arrival_at = new Date().toISOString()
      }
      if (status === 'completed' && notes) {
        updateData.completion_notes = notes
      }

      const { data, error } = await this.db
        .from('sos_request_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select(`
          *,
          service_providers!inner(name_en, service_type, phone)
        `)
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update assignment' }
      }

      // If completed or declined, release the provider back to available
      if (status === 'completed' || status === 'declined') {
        if (data?.provider_id) {
          await this.db
            .from('service_providers')
            .update({ status: 'available', updated_at: new Date().toISOString() })
            .eq('id', data.provider_id)
        }
      }

      return {
        success: true,
        data: this.mapAssignment(data),
        message: `Assignment status updated to ${status}`
      }
    } catch (error) {
      return { success: false, error: 'Failed to update assignment' }
    }
  }

  async getAssignmentsForRequest(requestId: string): Promise<ServiceResponse<SOSRequestAssignment[]>> {
    try {
      const { data, error } = await this.db
        .from('sos_request_assignments')
        .select(`
          *,
          service_providers!inner(name_en, service_type, phone)
        `)
        .eq('sos_request_id', requestId)
        .order('assigned_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch assignments' }
      }

      return { success: true, data: (data || []).map(this.mapAssignment) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch assignments' }
    }
  }

  async getStats(palikaId: number): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const { data: requests } = await this.db
        .from('sos_requests')
        .select('status, priority, emergency_type')
        .eq('palika_id', palikaId)

      if (!requests) {
        return { success: true, data: {} }
      }

      const stats = {
        total: requests.length,
        by_status: {
          pending: requests.filter(r => r.status === 'pending').length,
          reviewing: requests.filter(r => r.status === 'reviewing').length,
          assigned: requests.filter(r => r.status === 'assigned').length,
          in_progress: requests.filter(r => r.status === 'in_progress').length,
          resolved: requests.filter(r => r.status === 'resolved').length,
          cancelled: requests.filter(r => r.status === 'cancelled').length,
        },
        by_priority: {
          critical: requests.filter(r => r.priority === 'critical').length,
          high: requests.filter(r => r.priority === 'high').length,
          medium: requests.filter(r => r.priority === 'medium').length,
          low: requests.filter(r => r.priority === 'low').length,
        },
        active: requests.filter(r => ['pending', 'reviewing', 'assigned', 'in_progress'].includes(r.status)).length,
      }

      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: 'Failed to fetch stats' }
    }
  }

  private mapRequest(data: any): SOSRequest {
    return {
      id: data.id,
      palika_id: data.palika_id,
      user_id: data.user_id,
      request_code: data.request_code,
      emergency_type: data.emergency_type,
      service_type: data.service_type,
      priority: data.priority,
      urgency_score: data.urgency_score,
      location: data.location ? { lat: data.location.coordinates?.[1], lng: data.location.coordinates?.[0] } : undefined,
      location_description: data.location_description,
      ward_number: data.ward_number,
      user_name: data.user_name,
      user_phone: data.user_phone,
      details: data.details,
      images: data.images,
      status: data.status,
      status_updated_at: data.status_updated_at,
      assigned_to: data.assigned_to,
      reviewed_at: data.reviewed_at,
      reviewed_by: data.reviewed_by,
      resolved_at: data.resolved_at,
      resolution_notes: data.resolution_notes,
      user_rating: data.user_rating,
      user_feedback: data.user_feedback,
      app_submitted: data.app_submitted || false,
      device_location: data.device_location || false,
      timeline: data.timeline,
      created_at: data.created_at,
      updated_at: data.updated_at,
      palika_name: data.palikas?.name_en,
    }
  }

  private mapAssignment(data: any): SOSRequestAssignment {
    return {
      id: data.id,
      sos_request_id: data.sos_request_id,
      provider_id: data.provider_id,
      assigned_by: data.assigned_by,
      assigned_at: data.assigned_at,
      status: data.status,
      status_updated_at: data.status_updated_at,
      estimated_arrival_minutes: data.estimated_arrival_minutes,
      actual_arrival_at: data.actual_arrival_at,
      distance_km: data.distance_km,
      assignment_notes: data.assignment_notes,
      completion_notes: data.completion_notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      provider_name: data.service_providers?.name_en,
      provider_type: data.service_providers?.service_type,
      provider_phone: data.service_providers?.phone,
    }
  }
}
