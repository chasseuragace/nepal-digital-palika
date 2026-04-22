/**
 * Fake SOS Datasource - Mock implementation for development/testing
 * Returns realistic fixture data without Supabase
 */

import type {
  ISOSDatasource,
} from './sos-datasource';
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
import { v4 as uuidv4 } from 'uuid';

export class FakeSOSDatasource implements ISOSDatasource {
  private palikaId: number = 5; // Default to palika 5 (Kathmandu)
  private requests: SOSRequestDTO[] = [];
  private providers: ServiceProviderDTO[] = [];
  private assignments: SOSRequestAssignmentDTO[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Mock Service Providers
    this.providers = [
      {
        id: 'provider-1',
        palika_id: this.palikaId,
        name_en: 'Metro Ambulance Service',
        name_ne: 'मेट्रो एम्बुलेन्स सेवा',
        service_type: 'ambulance',
        phone: '9841234567',
        email: 'metro@ambulance.np',
        location: { latitude: 27.7172, longitude: 85.3240 },
        address: 'Lazimpat, Kathmandu',
        ward_number: 1,
        coverage_area: 'Kathmandu Valley',
        vehicle_count: 5,
        services: ['trauma_care', 'ICU', 'oxygen_support'],
        is_24_7: true,
        status: 'available',
        response_time_avg_minutes: 8,
        rating_average: 4.8,
        rating_count: 45,
        total_assignments: 156,
        total_resolved: 154,
        is_active: true,
        created_at: new Date(2025, 0, 1).toISOString(),
        updated_at: new Date(2025, 3, 1).toISOString(),
      },
      {
        id: 'provider-2',
        palika_id: this.palikaId,
        name_en: 'Kathmandu Fire Brigade',
        name_ne: 'काठमाडौं दमकल',
        service_type: 'fire_brigade',
        phone: '9801234567',
        location: { latitude: 27.7245, longitude: 85.3270 },
        address: 'Putalisadak, Kathmandu',
        ward_number: 2,
        coverage_area: 'Central Kathmandu',
        vehicle_count: 3,
        is_24_7: true,
        status: 'available',
        response_time_avg_minutes: 12,
        rating_average: 4.6,
        rating_count: 32,
        total_assignments: 98,
        total_resolved: 98,
        is_active: true,
        created_at: new Date(2025, 0, 15).toISOString(),
        updated_at: new Date(2025, 3, 10).toISOString(),
      },
      {
        id: 'provider-3',
        palika_id: this.palikaId,
        name_en: 'Nepal Police (Kathmandu)',
        name_ne: 'नेपाल प्रहरी (काठमाडौं)',
        service_type: 'police',
        phone: '100',
        location: { latitude: 27.7210, longitude: 85.3355 },
        address: 'New Baneshwor, Kathmandu',
        ward_number: 3,
        coverage_area: 'Entire Kathmandu',
        vehicle_count: 8,
        is_24_7: true,
        status: 'available',
        response_time_avg_minutes: 10,
        rating_average: 4.4,
        rating_count: 67,
        total_assignments: 234,
        total_resolved: 230,
        is_active: true,
        created_at: new Date(2025, 0, 1).toISOString(),
        updated_at: new Date(2025, 3, 15).toISOString(),
      },
      {
        id: 'provider-4',
        palika_id: this.palikaId,
        name_en: 'Rescue Nepal',
        name_ne: 'रेस्क्यु नेपाल',
        service_type: 'rescue',
        phone: '9801111111',
        email: 'rescue@nepal.np',
        location: { latitude: 27.7189, longitude: 85.3456 },
        address: 'Tripureshwor, Kathmandu',
        ward_number: 5,
        coverage_area: 'Kathmandu Valley',
        vehicle_count: 4,
        services: ['mountain_rescue', 'disaster_relief', 'search_ops'],
        is_24_7: true,
        status: 'busy',
        response_time_avg_minutes: 15,
        rating_average: 4.7,
        rating_count: 28,
        total_assignments: 67,
        total_resolved: 67,
        is_active: true,
        created_at: new Date(2025, 1, 1).toISOString(),
        updated_at: new Date(2025, 3, 20).toISOString(),
      },
    ];

    // Mock SOS Requests - various statuses
    this.requests = [
      {
        id: 'sos-1',
        palika_id: this.palikaId,
        request_code: `SOS-${this.getDateString()}-000001`,
        emergency_type: 'medical',
        service_type: 'ambulance',
        priority: 'critical',
        urgency_score: 95,
        location: { latitude: 27.7200, longitude: 85.3300 },
        location_description: 'Thamel Main Road, near Stupa Hotel',
        ward_number: 1,
        user_name: 'Ram Kumar',
        user_phone: '9841234567',
        details: 'Elderly person with severe chest pain. Conscious but breathing difficulty.',
        status: 'in_progress',
        status_updated_at: new Date(now.getTime() - 15 * 60000).toISOString(),
        assigned_to: 'admin-1',
        reviewed_at: new Date(now.getTime() - 20 * 60000).toISOString(),
        reviewed_by: 'admin-1',
        app_submitted: true,
        device_location: true,
        is_anonymous: false,
        created_at: new Date(now.getTime() - 25 * 60000).toISOString(),
        updated_at: new Date(now.getTime() - 15 * 60000).toISOString(),
      },
      {
        id: 'sos-2',
        palika_id: this.palikaId,
        request_code: `SOS-${this.getDateString()}-000002`,
        emergency_type: 'fire',
        service_type: 'fire_brigade',
        priority: 'high',
        urgency_score: 85,
        location: { latitude: 27.7150, longitude: 85.3200 },
        location_description: 'Commercial building, Asan',
        ward_number: 2,
        user_phone: '9844567890',
        details: 'Small fire in ground floor electrical room. Sprinklers activated.',
        is_anonymous: true,
        status: 'assigned',
        status_updated_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        assigned_to: 'admin-1',
        reviewed_at: new Date(now.getTime() - 12 * 60000).toISOString(),
        reviewed_by: 'admin-1',
        app_submitted: true,
        device_location: true,
        created_at: new Date(now.getTime() - 12 * 60000).toISOString(),
        updated_at: new Date(now.getTime() - 10 * 60000).toISOString(),
      },
      {
        id: 'sos-3',
        palika_id: this.palikaId,
        request_code: `SOS-${this.getDateString()}-000003`,
        emergency_type: 'accident',
        service_type: 'police',
        priority: 'high',
        urgency_score: 88,
        location: { latitude: 27.7320, longitude: 85.3400 },
        location_description: 'Ring Road near Boudha',
        ward_number: 8,
        user_name: 'Sita Sharma',
        user_phone: '9849876543',
        details: 'Two-vehicle collision. One vehicle overturned. Possible injuries.',
        status: 'pending',
        status_updated_at: new Date(now.getTime() - 5 * 60000).toISOString(),
        app_submitted: true,
        device_location: true,
        is_anonymous: false,
        created_at: new Date(now.getTime() - 5 * 60000).toISOString(),
        updated_at: new Date(now.getTime() - 5 * 60000).toISOString(),
      },
      {
        id: 'sos-4',
        palika_id: this.palikaId,
        request_code: `SOS-${this.getDateString(new Date(today.getTime() - 86400000))}-000004`,
        emergency_type: 'medical',
        service_type: 'ambulance',
        priority: 'medium',
        urgency_score: 60,
        location: { latitude: 27.7250, longitude: 85.3350 },
        location_description: 'Durbarmarg area',
        ward_number: 3,
        user_name: 'John Doe',
        user_phone: '9801234567',
        details: 'Patient with minor injuries from fall. Conscious and stable.',
        status: 'resolved',
        status_updated_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
        assigned_to: 'admin-2',
        reviewed_at: new Date(today.getTime() - 4 * 3600000).toISOString(),
        reviewed_by: 'admin-2',
        resolved_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
        resolution_notes: 'Patient transported to Kathmandu Medical College. Stable condition.',
        user_rating: 5,
        user_feedback: 'Excellent service. Paramedics were very professional and quick.',
        app_submitted: true,
        device_location: true,
        is_anonymous: false,
        created_at: new Date(today.getTime() - 5 * 3600000).toISOString(),
        updated_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
      },
    ];

    // Mock Assignments
    this.assignments = [
      {
        id: 'assign-1',
        sos_request_id: 'sos-1',
        provider_id: 'provider-1',
        assigned_by: 'admin-1',
        assigned_at: new Date(now.getTime() - 20 * 60000).toISOString(),
        status: 'en_route',
        status_updated_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        estimated_arrival_minutes: 8,
        distance_km: 2.3,
        assignment_notes: 'Patient critical. Notify hospital in advance.',
        created_at: new Date(now.getTime() - 20 * 60000).toISOString(),
        updated_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        provider: this.providers[0],
      },
      {
        id: 'assign-2',
        sos_request_id: 'sos-2',
        provider_id: 'provider-2',
        assigned_by: 'admin-1',
        assigned_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        status: 'en_route',
        status_updated_at: new Date(now.getTime() - 8 * 60000).toISOString(),
        estimated_arrival_minutes: 12,
        distance_km: 1.8,
        assignment_notes: 'Standard fire response protocol. Building evacuated.',
        created_at: new Date(now.getTime() - 10 * 60000).toISOString(),
        updated_at: new Date(now.getTime() - 8 * 60000).toISOString(),
        provider: this.providers[1],
      },
      {
        id: 'assign-3',
        sos_request_id: 'sos-4',
        provider_id: 'provider-1',
        assigned_by: 'admin-2',
        assigned_at: new Date(today.getTime() - 4 * 3600000).toISOString(),
        status: 'completed',
        status_updated_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
        estimated_arrival_minutes: 7,
        actual_arrival_at: new Date(today.getTime() - 3 * 3600000).toISOString(),
        distance_km: 3.1,
        completion_notes: 'Patient transported successfully. Vital signs stable.',
        created_at: new Date(today.getTime() - 4 * 3600000).toISOString(),
        updated_at: new Date(today.getTime() - 2 * 3600000).toISOString(),
        provider: this.providers[0],
      },
    ];
  }

  private getDateString(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getSOSRequests(filters: SOSRequestFiltersDTO): Promise<GetSOSRequestsResponseDTO> {
    await this.delay(150);
    let filtered = this.requests.filter(r => r.palika_id === filters.palika_id);

    if (filters.status) filtered = filtered.filter(r => r.status === filters.status);
    if (filters.emergency_type) filtered = filtered.filter(r => r.emergency_type === filters.emergency_type);
    if (filters.priority) filtered = filtered.filter(r => r.priority === filters.priority);
    if (filters.ward_number) filtered = filtered.filter(r => r.ward_number === filters.ward_number);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.request_code.toLowerCase().includes(search) ||
        r.user_name?.toLowerCase().includes(search) ||
        r.location_description?.toLowerCase().includes(search)
      );
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return { data, meta: { page, pageSize, total, totalPages } };
  }

  async getSOSRequestById(id: string): Promise<SOSRequestDTO> {
    await this.delay(100);
    const request = this.requests.find(r => r.id === id);
    if (!request) throw new Error(`SOS request ${id} not found`);

    // Augment with assignments
    const result = { ...request };
    return result;
  }

  async getSOSRequestByCode(code: string): Promise<SOSRequestDTO> {
    await this.delay(100);
    const request = this.requests.find(r => r.request_code === code);
    if (!request) throw new Error(`SOS request ${code} not found`);
    return request;
  }

  async updateSOSRequestStatus(id: string, data: UpdateSOSRequestStatusDTO): Promise<SOSRequestDTO> {
    await this.delay(100);
    const request = this.requests.find(r => r.id === id);
    if (!request) throw new Error(`SOS request ${id} not found`);

    request.status = data.status;
    request.status_updated_at = new Date().toISOString();
    if (data.assigned_to) request.assigned_to = data.assigned_to;
    if (data.resolution_notes) request.resolution_notes = data.resolution_notes;
    if (data.status === 'resolved') request.resolved_at = new Date().toISOString();
    request.updated_at = new Date().toISOString();

    return request;
  }

  async getServiceProviders(filters: ServiceProviderFiltersDTO): Promise<GetServiceProvidersResponseDTO> {
    await this.delay(150);
    let filtered = this.providers.filter(p => p.palika_id === filters.palika_id && p.is_active);

    if (filters.service_type) filtered = filtered.filter(p => p.service_type === filters.service_type);
    if (filters.status) filtered = filtered.filter(p => p.status === filters.status);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name_en.toLowerCase().includes(search) ||
        p.phone.includes(search)
      );
    }

    const page = 1;
    const pageSize = 100;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);

    return { data: filtered, meta: { page, pageSize, total, totalPages } };
  }

  async getServiceProviderById(id: string): Promise<ServiceProviderDTO> {
    await this.delay(100);
    const provider = this.providers.find(p => p.id === id);
    if (!provider) throw new Error(`Service provider ${id} not found`);
    return provider;
  }

  async getAvailableProviders(palikaId: number, serviceType?: string, maxDistanceKm?: number): Promise<ServiceProviderDTO[]> {
    await this.delay(150);
    let filtered = this.providers.filter(
      p => p.palika_id === palikaId && p.is_active && p.status === 'available'
    );

    if (serviceType) filtered = filtered.filter(p => p.service_type === serviceType);

    // Sort by response time
    filtered.sort((a, b) => (a.response_time_avg_minutes || 0) - (b.response_time_avg_minutes || 0));

    return filtered;
  }

  async createServiceProvider(data: CreateServiceProviderDTO, palikaId: number): Promise<ServiceProviderDTO> {
    await this.delay(100);
    const provider: ServiceProviderDTO = {
      id: uuidv4(),
      palika_id: palikaId,
      name_en: data.name_en,
      name_ne: data.name_ne,
      service_type: data.service_type,
      phone: data.phone,
      email: data.email,
      location: { latitude: data.latitude, longitude: data.longitude },
      address: data.address,
      ward_number: data.ward_number,
      coverage_area: data.coverage_area,
      vehicle_count: data.vehicle_count || 1,
      services: data.services,
      is_24_7: data.is_24_7 ?? true,
      status: 'available',
      rating_average: 0,
      rating_count: 0,
      total_assignments: 0,
      total_resolved: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.providers.push(provider);
    return provider;
  }

  async updateServiceProvider(id: string, data: Partial<CreateServiceProviderDTO>): Promise<ServiceProviderDTO> {
    await this.delay(100);
    const provider = this.providers.find(p => p.id === id);
    if (!provider) throw new Error(`Service provider ${id} not found`);

    if (data.name_en) provider.name_en = data.name_en;
    if (data.name_ne) provider.name_ne = data.name_ne;
    if (data.phone) provider.phone = data.phone;
    if (data.email) provider.email = data.email;
    if (data.latitude && data.longitude) {
      provider.location = { latitude: data.latitude, longitude: data.longitude };
    }
    if (data.address) provider.address = data.address;
    if (data.ward_number) provider.ward_number = data.ward_number;
    if (data.is_24_7 !== undefined) provider.is_24_7 = data.is_24_7;
    provider.updated_at = new Date().toISOString();

    return provider;
  }

  async updateServiceProviderStatus(id: string, status: 'available' | 'busy' | 'offline' | 'suspended'): Promise<void> {
    await this.delay(100);
    const provider = this.providers.find(p => p.id === id);
    if (!provider) throw new Error(`Service provider ${id} not found`);
    provider.status = status;
    provider.updated_at = new Date().toISOString();
  }

  async deactivateServiceProvider(id: string): Promise<void> {
    await this.delay(100);
    const provider = this.providers.find(p => p.id === id);
    if (!provider) throw new Error(`Service provider ${id} not found`);
    provider.is_active = false;
    provider.status = 'offline';
    provider.updated_at = new Date().toISOString();
  }

  async getAssignmentsForRequest(requestId: string): Promise<SOSRequestAssignmentDTO[]> {
    await this.delay(100);
    return this.assignments.filter(a => a.sos_request_id === requestId);
  }

  async createAssignment(requestId: string, data: CreateSOSAssignmentDTO, adminId: string): Promise<SOSRequestAssignmentDTO> {
    await this.delay(100);
    const request = this.requests.find(r => r.id === requestId);
    if (!request) throw new Error(`SOS request ${requestId} not found`);

    const provider = this.providers.find(p => p.id === data.provider_id);
    if (!provider) throw new Error(`Service provider ${data.provider_id} not found`);

    const assignment: SOSRequestAssignmentDTO = {
      id: uuidv4(),
      sos_request_id: requestId,
      provider_id: data.provider_id,
      assigned_by: adminId,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
      estimated_arrival_minutes: data.estimated_arrival_minutes,
      assignment_notes: data.assignment_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      provider: provider,
    };

    this.assignments.push(assignment);
    return assignment;
  }

  async updateAssignmentStatus(assignmentId: string, data: UpdateSOSAssignmentStatusDTO): Promise<SOSRequestAssignmentDTO> {
    await this.delay(100);
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

    assignment.status = data.status;
    assignment.status_updated_at = new Date().toISOString();
    if (data.actual_arrival_at) assignment.actual_arrival_at = data.actual_arrival_at;
    if (data.completion_notes) assignment.completion_notes = data.completion_notes;
    assignment.updated_at = new Date().toISOString();

    return assignment;
  }

  async cancelAssignment(assignmentId: string): Promise<void> {
    await this.delay(100);
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);
    assignment.status = 'declined';
    assignment.updated_at = new Date().toISOString();
  }

  async getSOSStats(palikaId: number): Promise<SOSStatsDTO> {
    await this.delay(150);
    const requests = this.requests.filter(r => r.palika_id === palikaId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRequests = requests.filter(r => new Date(r.created_at) >= today);

    const stats: SOSStatsDTO = {
      total_today: todayRequests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      reviewing: requests.filter(r => r.status === 'reviewing').length,
      assigned: requests.filter(r => r.status === 'assigned').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      resolved: requests.filter(r => r.status === 'resolved').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      completion_rate: requests.length > 0 ? Math.round((requests.filter(r => r.status === 'resolved').length / requests.length) * 100) : 0,
      provider_availability: {
        ambulance: { available: 1, busy: 0, offline: 0, suspended: 0 },
        fire_brigade: { available: 1, busy: 0, offline: 0, suspended: 0 },
        police: { available: 1, busy: 0, offline: 0, suspended: 0 },
        rescue: { available: 0, busy: 1, offline: 0, suspended: 0 },
      },
    };

    return stats;
  }

  async getAnalytics(palikaId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    await this.delay(200);
    const requests = this.requests.filter(r => r.palika_id === palikaId);

    return {
      totalRequests: requests.length,
      requestsByType: {
        medical: requests.filter(r => r.emergency_type === 'medical').length,
        accident: requests.filter(r => r.emergency_type === 'accident').length,
        fire: requests.filter(r => r.emergency_type === 'fire').length,
        security: requests.filter(r => r.emergency_type === 'security').length,
      },
      requestsByStatus: {
        pending: requests.filter(r => r.status === 'pending').length,
        assigned: requests.filter(r => r.status === 'assigned').length,
        resolved: requests.filter(r => r.status === 'resolved').length,
      },
      topProviders: this.providers.slice(0, 3).map(p => ({
        id: p.id,
        name_en: p.name_en,
        assignments_completed: p.total_resolved,
        avg_rating: p.rating_average,
      })),
      responseTimeByType: {
        ambulance: 8,
        fire: 12,
        police: 10,
        rescue: 15,
      },
      timeline: [
        { date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], count: 2 },
        { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], count: 3 },
        { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], count: 1 },
        { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], count: 4 },
        { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], count: 2 },
        { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], count: 3 },
        { date: new Date().toISOString().split('T')[0], count: requests.filter(r => {
          const created = new Date(r.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length },
      ],
    };
  }
}
