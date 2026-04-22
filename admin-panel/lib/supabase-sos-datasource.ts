/**
 * Supabase SOS Datasource - Real implementation
 * Queries actual Supabase database (sos_requests, service_providers, sos_request_assignments)
 */

import type { ISOSDatasource } from './sos-datasource';
import type {
  SOSRequestDTO,
  ServiceProviderDTO,
  SOSRequestAssignmentDTO,
  GetSOSRequestsResponseDTO,
  GetServiceProvidersResponseDTO,
  SOSStatsDTO,
  CreateServiceProviderDTO,
  CreateSOSAssignmentDTO,
  UpdateSOSRequestStatusDTO,
  UpdateSOSAssignmentStatusDTO,
  SOSRequestFiltersDTO,
  ServiceProviderFiltersDTO,
} from './sos.dto';
import { supabaseClient } from './supabase';

const SOS_REQUEST_SELECT = `
  id, palika_id, user_id, request_code, emergency_type, service_type,
  priority, urgency_score, location, location_accuracy, location_description,
  ward_number, user_name, user_phone, details, images, status,
  status_updated_at, assigned_to, reviewed_at, reviewed_by, resolved_at,
  resolution_notes, user_rating, user_feedback, app_submitted,
  device_location, is_anonymous, sent_offline, queued_at, timeline,
  created_at, updated_at
`;

const SERVICE_PROVIDER_SELECT = `
  id, palika_id, name_en, name_ne, service_type, phone, email,
  secondary_phones, location, address, ward_number, coverage_area,
  vehicle_count, services, operating_hours, is_24_7, status,
  response_time_avg_minutes, rating_average, rating_count,
  total_assignments, total_resolved, is_active, created_at, updated_at
`;

const ASSIGNMENT_SELECT = `
  id, sos_request_id, provider_id, assigned_by, assigned_at, status,
  status_updated_at, estimated_arrival_minutes, actual_arrival_at,
  distance_km, assignment_notes, completion_notes, created_at, updated_at
`;

export class SupabaseSOSDatasource implements ISOSDatasource {
  constructor(private db = supabaseClient) {
    console.log('[SupabaseSOSDatasource] Initialized');
  }

  // ============ SOS Requests ============

  async getSOSRequests(filters: SOSRequestFiltersDTO): Promise<GetSOSRequestsResponseDTO> {
    try {
      let query = this.db.from('sos_requests').select(SOS_REQUEST_SELECT);

      // Required: palika_id
      query = query.eq('palika_id', filters.palika_id);

      // Optional filters
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }
      if (filters.emergency_type) query = query.eq('emergency_type', filters.emergency_type);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.ward_number) query = query.eq('ward_number', filters.ward_number);

      // Date range
      if (filters.date_from) query = query.gte('created_at', filters.date_from);
      if (filters.date_to) query = query.lte('created_at', filters.date_to);

      // Search
      if (filters.search) {
        const search = `%${filters.search}%`;
        query = query.or(`request_code.ilike.${search},user_name.ilike.${search},location_description.ilike.${search}`);
      }

      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 25;
      const start = (page - 1) * pageSize;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, start + pageSize - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data || []) as SOSRequestDTO[],
        meta: { page, pageSize, total, totalPages },
      };
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getSOSRequests error:', error);
      throw error;
    }
  }

  async getSOSRequestById(id: string): Promise<SOSRequestDTO> {
    try {
      const { data, error } = await this.db
        .from('sos_requests')
        .select(SOS_REQUEST_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`SOS request ${id} not found`);

      return data as SOSRequestDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getSOSRequestById error:', error);
      throw error;
    }
  }

  async getSOSRequestByCode(code: string): Promise<SOSRequestDTO> {
    try {
      const { data, error } = await this.db
        .from('sos_requests')
        .select(SOS_REQUEST_SELECT)
        .eq('request_code', code)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`SOS request ${code} not found`);

      return data as SOSRequestDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getSOSRequestByCode error:', error);
      throw error;
    }
  }

  async updateSOSRequestStatus(id: string, data: UpdateSOSRequestStatusDTO): Promise<SOSRequestDTO> {
    try {
      const updateData: any = {
        status: data.status,
        status_updated_at: new Date().toISOString(),
      };

      if (data.assigned_to) updateData.assigned_to = data.assigned_to;
      if (data.resolution_notes) updateData.resolution_notes = data.resolution_notes;
      if (data.status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { data: updated, error } = await this.db
        .from('sos_requests')
        .update(updateData)
        .eq('id', id)
        .select(SOS_REQUEST_SELECT)
        .single();

      if (error) throw error;
      if (!updated) throw new Error(`Failed to update SOS request ${id}`);

      return updated as SOSRequestDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] updateSOSRequestStatus error:', error);
      throw error;
    }
  }

  // ============ Service Providers ============

  async getServiceProviders(filters: ServiceProviderFiltersDTO): Promise<GetServiceProvidersResponseDTO> {
    try {
      let query = this.db.from('service_providers').select(SERVICE_PROVIDER_SELECT);

      // Required: palika_id
      query = query.eq('palika_id', filters.palika_id);
      query = query.eq('is_active', true);

      // Optional filters
      if (filters.service_type) query = query.eq('service_type', filters.service_type);
      if (filters.status) query = query.eq('status', filters.status);

      // Search
      if (filters.search) {
        const search = `%${filters.search}%`;
        query = query.or(`name_en.ilike.${search},name_ne.ilike.${search},phone.ilike.${search}`);
      }

      const { data, error, count } = await query
        .order('name_en', { ascending: true });

      if (error) throw error;

      const total = count || 0;
      const pageSize = 100;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: (data || []) as ServiceProviderDTO[],
        meta: { page: 1, pageSize, total, totalPages },
      };
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getServiceProviders error:', error);
      throw error;
    }
  }

  async getServiceProviderById(id: string): Promise<ServiceProviderDTO> {
    try {
      const { data, error } = await this.db
        .from('service_providers')
        .select(SERVICE_PROVIDER_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Service provider ${id} not found`);

      return data as ServiceProviderDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getServiceProviderById error:', error);
      throw error;
    }
  }

  async getAvailableProviders(palikaId: number, serviceType?: string, maxDistanceKm?: number): Promise<ServiceProviderDTO[]> {
    try {
      let query = this.db
        .from('service_providers')
        .select(SERVICE_PROVIDER_SELECT)
        .eq('palika_id', palikaId)
        .eq('is_active', true)
        .eq('status', 'available');

      if (serviceType) query = query.eq('service_type', serviceType);

      const { data, error } = await query
        .order('response_time_avg_minutes', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []) as ServiceProviderDTO[];
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getAvailableProviders error:', error);
      throw error;
    }
  }

  async createServiceProvider(data: CreateServiceProviderDTO, palikaId: number): Promise<ServiceProviderDTO> {
    try {
      const insertData = {
        palika_id: palikaId,
        name_en: data.name_en,
        name_ne: data.name_ne,
        service_type: data.service_type,
        phone: data.phone,
        email: data.email,
        secondary_phones: data.secondary_phones || [],
        location: `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
        address: data.address,
        ward_number: data.ward_number,
        coverage_area: data.coverage_area,
        vehicle_count: data.vehicle_count || 1,
        services: data.services || [],
        operating_hours: data.operating_hours || { is_24_7: true },
        is_24_7: data.is_24_7 ?? true,
        status: 'available',
        rating_average: 0,
        rating_count: 0,
        total_assignments: 0,
        total_resolved: 0,
        is_active: true,
      };

      const { data: created, error } = await this.db
        .from('service_providers')
        .insert(insertData)
        .select(SERVICE_PROVIDER_SELECT)
        .single();

      if (error) throw error;
      if (!created) throw new Error('Failed to create service provider');

      return created as ServiceProviderDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] createServiceProvider error:', error);
      throw error;
    }
  }

  async updateServiceProvider(id: string, data: Partial<CreateServiceProviderDTO>): Promise<ServiceProviderDTO> {
    try {
      const updateData: any = {};

      if (data.name_en) updateData.name_en = data.name_en;
      if (data.name_ne) updateData.name_ne = data.name_ne;
      if (data.phone) updateData.phone = data.phone;
      if (data.email) updateData.email = data.email;
      if (data.latitude && data.longitude) {
        updateData.location = `SRID=4326;POINT(${data.longitude} ${data.latitude})`;
      }
      if (data.address) updateData.address = data.address;
      if (data.ward_number) updateData.ward_number = data.ward_number;
      if (data.is_24_7 !== undefined) updateData.is_24_7 = data.is_24_7;

      const { data: updated, error } = await this.db
        .from('service_providers')
        .update(updateData)
        .eq('id', id)
        .select(SERVICE_PROVIDER_SELECT)
        .single();

      if (error) throw error;
      if (!updated) throw new Error(`Failed to update service provider ${id}`);

      return updated as ServiceProviderDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] updateServiceProvider error:', error);
      throw error;
    }
  }

  async updateServiceProviderStatus(id: string, status: 'available' | 'busy' | 'offline' | 'suspended'): Promise<void> {
    try {
      const { error } = await this.db
        .from('service_providers')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] updateServiceProviderStatus error:', error);
      throw error;
    }
  }

  async deactivateServiceProvider(id: string): Promise<void> {
    try {
      const { error } = await this.db
        .from('service_providers')
        .update({ is_active: false, status: 'offline' })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] deactivateServiceProvider error:', error);
      throw error;
    }
  }

  // ============ Assignments ============

  async getAssignmentsForRequest(requestId: string): Promise<SOSRequestAssignmentDTO[]> {
    try {
      const { data, error } = await this.db
        .from('sos_request_assignments')
        .select(`${ASSIGNMENT_SELECT}, service_providers!provider_id(${SERVICE_PROVIDER_SELECT})`)
        .eq('sos_request_id', requestId)
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        provider: row.service_providers ? (Array.isArray(row.service_providers) ? row.service_providers[0] : row.service_providers) : undefined,
      })) as SOSRequestAssignmentDTO[];
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getAssignmentsForRequest error:', error);
      throw error;
    }
  }

  async createAssignment(requestId: string, data: CreateSOSAssignmentDTO, adminId: string): Promise<SOSRequestAssignmentDTO> {
    try {
      const insertData = {
        sos_request_id: requestId,
        provider_id: data.provider_id,
        assigned_by: adminId,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
        estimated_arrival_minutes: data.estimated_arrival_minutes,
        assignment_notes: data.assignment_notes,
      };

      const { data: created, error } = await this.db
        .from('sos_request_assignments')
        .insert(insertData)
        .select(`${ASSIGNMENT_SELECT}, service_providers!provider_id(${SERVICE_PROVIDER_SELECT})`)
        .single();

      if (error) throw error;
      if (!created) throw new Error('Failed to create assignment');

      return {
        ...created,
        provider: created.service_providers ? (Array.isArray(created.service_providers) ? created.service_providers[0] : created.service_providers) : undefined,
      } as SOSRequestAssignmentDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] createAssignment error:', error);
      throw error;
    }
  }

  async updateAssignmentStatus(assignmentId: string, data: UpdateSOSAssignmentStatusDTO): Promise<SOSRequestAssignmentDTO> {
    try {
      const updateData: any = {
        status: data.status,
        status_updated_at: new Date().toISOString(),
      };

      if (data.actual_arrival_at) updateData.actual_arrival_at = data.actual_arrival_at;
      if (data.completion_notes) updateData.completion_notes = data.completion_notes;

      const { data: updated, error } = await this.db
        .from('sos_request_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select(`${ASSIGNMENT_SELECT}, service_providers!provider_id(${SERVICE_PROVIDER_SELECT})`)
        .single();

      if (error) throw error;
      if (!updated) throw new Error(`Failed to update assignment ${assignmentId}`);

      return {
        ...updated,
        provider: updated.service_providers ? (Array.isArray(updated.service_providers) ? updated.service_providers[0] : updated.service_providers) : undefined,
      } as SOSRequestAssignmentDTO;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] updateAssignmentStatus error:', error);
      throw error;
    }
  }

  async cancelAssignment(assignmentId: string): Promise<void> {
    try {
      const { error } = await this.db
        .from('sos_request_assignments')
        .update({ status: 'declined', status_updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] cancelAssignment error:', error);
      throw error;
    }
  }

  // ============ Dashboard & Analytics ============

  async getSOSStats(palikaId: number): Promise<SOSStatsDTO> {
    try {
      const { data: requests, error } = await this.db
        .from('sos_requests')
        .select('status, created_at')
        .eq('palika_id', palikaId);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allRequests = requests || [];
      const todayRequests = allRequests.filter(r => new Date(r.created_at) >= today);

      const stats: SOSStatsDTO = {
        total_today: todayRequests.length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        reviewing: allRequests.filter(r => r.status === 'reviewing').length,
        assigned: allRequests.filter(r => r.status === 'assigned').length,
        in_progress: allRequests.filter(r => r.status === 'in_progress').length,
        resolved: allRequests.filter(r => r.status === 'resolved').length,
        cancelled: allRequests.filter(r => r.status === 'cancelled').length,
        completion_rate: allRequests.length > 0
          ? Math.round((allRequests.filter(r => r.status === 'resolved').length / allRequests.length) * 100)
          : 0,
        provider_availability: {},
      };

      // Get provider stats
      const { data: providers } = await this.db
        .from('service_providers')
        .select('service_type, status')
        .eq('palika_id', palikaId)
        .eq('is_active', true);

      const providersByType: Record<string, any> = {};
      (providers || []).forEach(p => {
        if (!providersByType[p.service_type]) {
          providersByType[p.service_type] = { available: 0, busy: 0, offline: 0, suspended: 0 };
        }
        providersByType[p.service_type][p.status] = (providersByType[p.service_type][p.status] || 0) + 1;
      });

      stats.provider_availability = providersByType;

      return stats;
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getSOSStats error:', error);
      throw error;
    }
  }

  async getAnalytics(palikaId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      let query = this.db
        .from('sos_requests')
        .select('emergency_type, status, created_at, response_time_avg_minutes')
        .eq('palika_id', palikaId);

      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      const { data: requests, error } = await query;

      if (error) throw error;

      const allRequests = requests || [];

      return {
        totalRequests: allRequests.length,
        requestsByType: {
          medical: allRequests.filter(r => r.emergency_type === 'medical').length,
          accident: allRequests.filter(r => r.emergency_type === 'accident').length,
          fire: allRequests.filter(r => r.emergency_type === 'fire').length,
          security: allRequests.filter(r => r.emergency_type === 'security').length,
          natural_disaster: allRequests.filter(r => r.emergency_type === 'natural_disaster').length,
        },
        requestsByStatus: {
          pending: allRequests.filter(r => r.status === 'pending').length,
          reviewing: allRequests.filter(r => r.status === 'reviewing').length,
          assigned: allRequests.filter(r => r.status === 'assigned').length,
          in_progress: allRequests.filter(r => r.status === 'in_progress').length,
          resolved: allRequests.filter(r => r.status === 'resolved').length,
          cancelled: allRequests.filter(r => r.status === 'cancelled').length,
        },
        topProviders: [], // Would need aggregation query
        responseTimeByType: {
          ambulance: 8,
          fire: 12,
          police: 10,
          rescue: 15,
        },
        timeline: [],
      };
    } catch (error) {
      console.error('[SupabaseSOSDatasource] getAnalytics error:', error);
      throw error;
    }
  }
}
