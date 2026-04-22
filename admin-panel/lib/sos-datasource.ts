/**
 * SOS Module Datasource Interface
 * Defines contract for both Fake and Supabase implementations
 */

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

export interface ISOSDatasource {
  // ============ SOS Requests ============
  getSOSRequests(filters: SOSRequestFiltersDTO): Promise<GetSOSRequestsResponseDTO>;
  getSOSRequestById(id: string): Promise<SOSRequestDTO>;
  getSOSRequestByCode(code: string): Promise<SOSRequestDTO>;
  updateSOSRequestStatus(id: string, data: UpdateSOSRequestStatusDTO): Promise<SOSRequestDTO>;

  // ============ Service Providers ============
  getServiceProviders(filters: ServiceProviderFiltersDTO): Promise<GetServiceProvidersResponseDTO>;
  getServiceProviderById(id: string): Promise<ServiceProviderDTO>;
  getAvailableProviders(palikaId: number, serviceType?: string, maxDistanceKm?: number): Promise<ServiceProviderDTO[]>;
  createServiceProvider(data: CreateServiceProviderDTO, palikaId: number): Promise<ServiceProviderDTO>;
  updateServiceProvider(id: string, data: Partial<CreateServiceProviderDTO>): Promise<ServiceProviderDTO>;
  updateServiceProviderStatus(id: string, status: 'available' | 'busy' | 'offline' | 'suspended'): Promise<void>;
  deactivateServiceProvider(id: string): Promise<void>;

  // ============ Assignments ============
  getAssignmentsForRequest(requestId: string): Promise<SOSRequestAssignmentDTO[]>;
  createAssignment(requestId: string, data: CreateSOSAssignmentDTO, adminId: string): Promise<SOSRequestAssignmentDTO>;
  updateAssignmentStatus(assignmentId: string, data: UpdateSOSAssignmentStatusDTO): Promise<SOSRequestAssignmentDTO>;
  cancelAssignment(assignmentId: string): Promise<void>;

  // ============ Dashboard & Analytics ============
  getSOSStats(palikaId: number): Promise<SOSStatsDTO>;
  getAnalytics(palikaId: number, dateFrom?: string, dateTo?: string): Promise<{
    totalRequests: number;
    requestsByType: Record<string, number>;
    requestsByStatus: Record<string, number>;
    topProviders: Array<{ id: string; name_en: string; assignments_completed: number; avg_rating: number }>;
    responseTimeByType: Record<string, number>;
    timeline: Array<{ date: string; count: number }>;
  }>;
}
