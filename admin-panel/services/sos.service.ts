/**
 * SOS Module Service
 * Business logic for SOS request and provider management
 * Framework-agnostic, testable, reusable
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
} from '@/lib/sos.dto';
import type { ISOSDatasource } from '@/lib/sos-datasource';
import { getSOSDatasource } from '@/lib/sos-config';
import type { ServiceResponse, PaginatedResponse } from './types';

export class SOSService {
  private datasource: ISOSDatasource;

  constructor(datasource?: ISOSDatasource) {
    this.datasource = datasource || getSOSDatasource();
  }

  // ============ SOS Requests ============

  async getSOSRequests(
    palikaId: number,
    filters?: Partial<SOSRequestFiltersDTO>,
    pagination?: { page?: number; pageSize?: number }
  ): Promise<ServiceResponse<PaginatedResponse<SOSRequestDTO>>> {
    try {
      const queryFilters: SOSRequestFiltersDTO = {
        palika_id: palikaId,
        ...filters,
      };

      const result = await this.datasource.getSOSRequests({
        ...queryFilters,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 25,
      });

      return {
        success: true,
        data: {
          data: result.data,
          total: result.meta.total,
          page: result.meta.page,
          limit: result.meta.pageSize,
          hasMore: result.meta.page < result.meta.totalPages,
        },
      };
    } catch (error) {
      console.error('[SOSService] getSOSRequests error:', error);
      return { success: false, error: 'Failed to fetch SOS requests' };
    }
  }

  async getSOSRequestById(id: string): Promise<ServiceResponse<SOSRequestDTO>> {
    try {
      const request = await this.datasource.getSOSRequestById(id);
      const assignments = await this.datasource.getAssignmentsForRequest(id);

      return {
        success: true,
        data: {
          ...request,
          // Augment with assignments if needed
        } as any,
      };
    } catch (error) {
      console.error('[SOSService] getSOSRequestById error:', error);
      return { success: false, error: 'SOS request not found' };
    }
  }

  async updateSOSRequestStatus(
    id: string,
    data: UpdateSOSRequestStatusDTO,
    adminId?: string
  ): Promise<ServiceResponse<SOSRequestDTO>> {
    try {
      if (adminId) {
        data.assigned_to = adminId;
      }

      const updated = await this.datasource.updateSOSRequestStatus(id, data);

      return {
        success: true,
        data: updated,
        message: `SOS request status updated to ${data.status}`,
      };
    } catch (error) {
      console.error('[SOSService] updateSOSRequestStatus error:', error);
      return { success: false, error: 'Failed to update SOS request status' };
    }
  }

  // ============ Service Providers ============

  async getServiceProviders(
    palikaId: number,
    filters?: Partial<ServiceProviderFiltersDTO>,
    pagination?: { page?: number; pageSize?: number }
  ): Promise<ServiceResponse<PaginatedResponse<ServiceProviderDTO>>> {
    try {
      const queryFilters: ServiceProviderFiltersDTO = {
        palika_id: palikaId,
        ...filters,
      };

      const result = await this.datasource.getServiceProviders(queryFilters);

      return {
        success: true,
        data: {
          data: result.data,
          total: result.meta.total,
          page: result.meta.page,
          limit: result.meta.pageSize,
          hasMore: result.meta.page < result.meta.totalPages,
        },
      };
    } catch (error) {
      console.error('[SOSService] getServiceProviders error:', error);
      return { success: false, error: 'Failed to fetch service providers' };
    }
  }

  async getServiceProviderById(id: string): Promise<ServiceResponse<ServiceProviderDTO>> {
    try {
      const provider = await this.datasource.getServiceProviderById(id);
      return { success: true, data: provider };
    } catch (error) {
      console.error('[SOSService] getServiceProviderById error:', error);
      return { success: false, error: 'Service provider not found' };
    }
  }

  async getAvailableProviders(
    palikaId: number,
    serviceType?: string,
    maxDistanceKm?: number
  ): Promise<ServiceResponse<ServiceProviderDTO[]>> {
    try {
      const providers = await this.datasource.getAvailableProviders(
        palikaId,
        serviceType,
        maxDistanceKm
      );
      return { success: true, data: providers };
    } catch (error) {
      console.error('[SOSService] getAvailableProviders error:', error);
      return { success: false, error: 'Failed to fetch available providers' };
    }
  }

  async createServiceProvider(
    palikaId: number,
    data: CreateServiceProviderDTO
  ): Promise<ServiceResponse<ServiceProviderDTO>> {
    try {
      // Validate required fields
      if (!data.name_en || !data.phone || !data.service_type || data.latitude === undefined || data.longitude === undefined) {
        return { success: false, error: 'Missing required fields' };
      }

      const provider = await this.datasource.createServiceProvider(data, palikaId);

      return {
        success: true,
        data: provider,
        message: `Service provider ${data.name_en} created successfully`,
      };
    } catch (error) {
      console.error('[SOSService] createServiceProvider error:', error);
      return { success: false, error: 'Failed to create service provider' };
    }
  }

  async updateServiceProvider(
    id: string,
    data: Partial<CreateServiceProviderDTO>
  ): Promise<ServiceResponse<ServiceProviderDTO>> {
    try {
      const updated = await this.datasource.updateServiceProvider(id, data);
      return {
        success: true,
        data: updated,
        message: 'Service provider updated successfully',
      };
    } catch (error) {
      console.error('[SOSService] updateServiceProvider error:', error);
      return { success: false, error: 'Failed to update service provider' };
    }
  }

  async updateServiceProviderStatus(
    id: string,
    status: 'available' | 'busy' | 'offline' | 'suspended'
  ): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.updateServiceProviderStatus(id, status);
      return {
        success: true,
        message: `Service provider status updated to ${status}`,
      };
    } catch (error) {
      console.error('[SOSService] updateServiceProviderStatus error:', error);
      return { success: false, error: 'Failed to update provider status' };
    }
  }

  async deactivateServiceProvider(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.deactivateServiceProvider(id);
      return { success: true, message: 'Service provider deactivated' };
    } catch (error) {
      console.error('[SOSService] deactivateServiceProvider error:', error);
      return { success: false, error: 'Failed to deactivate service provider' };
    }
  }

  // ============ Assignments ============

  async getAssignmentsForRequest(requestId: string): Promise<ServiceResponse<SOSRequestAssignmentDTO[]>> {
    try {
      const assignments = await this.datasource.getAssignmentsForRequest(requestId);
      return { success: true, data: assignments };
    } catch (error) {
      console.error('[SOSService] getAssignmentsForRequest error:', error);
      return { success: false, error: 'Failed to fetch assignments' };
    }
  }

  async createAssignment(
    requestId: string,
    data: CreateSOSAssignmentDTO,
    adminId: string
  ): Promise<ServiceResponse<SOSRequestAssignmentDTO>> {
    try {
      // Validate required fields
      if (!data.provider_id) {
        return { success: false, error: 'Provider ID is required' };
      }

      // Check provider exists and is available
      const provider = await this.datasource.getServiceProviderById(data.provider_id);
      if (!provider) {
        return { success: false, error: 'Service provider not found' };
      }

      if (provider.status !== 'available') {
        return { success: false, error: `Provider is currently ${provider.status}` };
      }

      const assignment = await this.datasource.createAssignment(requestId, data, adminId);

      return {
        success: true,
        data: assignment,
        message: `${provider.name_en} assigned to request`,
      };
    } catch (error) {
      console.error('[SOSService] createAssignment error:', error);
      return { success: false, error: 'Failed to create assignment' };
    }
  }

  async updateAssignmentStatus(
    assignmentId: string,
    data: UpdateSOSAssignmentStatusDTO
  ): Promise<ServiceResponse<SOSRequestAssignmentDTO>> {
    try {
      const updated = await this.datasource.updateAssignmentStatus(assignmentId, data);
      return {
        success: true,
        data: updated,
        message: `Assignment status updated to ${data.status}`,
      };
    } catch (error) {
      console.error('[SOSService] updateAssignmentStatus error:', error);
      return { success: false, error: 'Failed to update assignment status' };
    }
  }

  async cancelAssignment(assignmentId: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.cancelAssignment(assignmentId);
      return { success: true, message: 'Assignment cancelled' };
    } catch (error) {
      console.error('[SOSService] cancelAssignment error:', error);
      return { success: false, error: 'Failed to cancel assignment' };
    }
  }

  // ============ Dashboard & Analytics ============

  async getSOSStats(palikaId: number): Promise<ServiceResponse<SOSStatsDTO>> {
    try {
      const stats = await this.datasource.getSOSStats(palikaId);
      return { success: true, data: stats };
    } catch (error) {
      console.error('[SOSService] getSOSStats error:', error);
      return { success: false, error: 'Failed to fetch SOS statistics' };
    }
  }

  async getAnalytics(
    palikaId: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const analytics = await this.datasource.getAnalytics(palikaId, dateFrom, dateTo);
      return { success: true, data: analytics };
    } catch (error) {
      console.error('[SOSService] getAnalytics error:', error);
      return { success: false, error: 'Failed to fetch analytics' };
    }
  }
}

// Singleton instance
let serviceInstance: SOSService | null = null;

export function getSOSService(): SOSService {
  if (!serviceInstance) {
    serviceInstance = new SOSService();
  }
  return serviceInstance;
}

export function setSOSService(service: SOSService): void {
  serviceInstance = service;
}
