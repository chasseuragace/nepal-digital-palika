/**
 * SOS Module DTOs (Data Transfer Objects)
 * Mirrors database schema from migrations 125, 331:058-061
 *
 * Note on Over-Delivery: DTOs fetch 29 fields but UI currently displays only 6.
 * This is intentional to avoid n+1 queries. See field comments for usage.
 */

// ============ Service Provider DTO ============
export interface ServiceProviderDTO {
  // Identifiers
  id: string;
  palika_id: number;

  // UI DISPLAYS: name_en, service_type, phone, status, rating_average, total_assignments
  name_en: string;
  name_ne?: string;
  service_type: 'ambulance' | 'fire_brigade' | 'police' | 'rescue' | 'other';
  phone: string;

  // FUTURE: Email notifications, bulk SMS for secondary phones
  email?: string;
  secondary_phones?: string[];

  // FUTURE: Map integration, distance-based dispatch
  location: { latitude: number; longitude: number };
  address?: string;
  ward_number?: number;
  coverage_area?: string;

  // FUTURE: Fleet management, capacity planning
  vehicle_count: number;
  services?: string[];
  is_24_7: boolean;
  operating_hours?: Record<string, any>;

  // DISPLAYED: status
  // FUTURE: Availability dashboard showing real-time fleet status
  status: 'available' | 'busy' | 'offline' | 'suspended';

  // FUTURE: SLA monitoring, performance dashboards
  response_time_avg_minutes?: number;

  // DISPLAYED: rating_average
  rating_count: number; // FUTURE: Show "4.5 ⭐ (234 reviews)" format

  // DISPLAYED: total_assignments
  total_resolved: number; // FUTURE: Show resolution rate (resolved/total)

  // FUTURE: Admin audit trail, deactivation workflows
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ SOS Request DTO ============
export interface SOSRequestDTO {
  // Identifiers
  id: string;
  palika_id: number;
  user_id?: string; // FUTURE: User profile link, call history

  // UI DISPLAYS: request_code, emergency_type, user_name (as "Caller"), status, priority,
  // location_description, created_at, details (in detail view)
  request_code: string;
  emergency_type: 'medical' | 'accident' | 'fire' | 'security' | 'natural_disaster' | 'other';

  // FUTURE: Auto-assign matching service_type provider
  // NOTE: Redundant with emergency_type for UI; kept for backend matching logic
  service_type?: 'ambulance' | 'fire_brigade' | 'police' | 'rescue' | 'other';

  // DISPLAYED: priority
  // FUTURE: Dynamic priority recalculation based on urgency_score
  priority?: 'low' | 'medium' | 'high' | 'critical';

  // FUTURE: AI-powered priority suggestions, risk scoring
  urgency_score?: number;

  // FUTURE: Map integration, route optimization
  location: { latitude: number; longitude: number };
  location_accuracy?: number; // FUTURE: GPS accuracy indicators
  location_description?: string;
  ward_number?: number;

  // DISPLAYED: user_name (as "Caller")
  user_name?: string;
  user_phone: string;

  // DISPLAYED: details (in detail view)
  details?: string;

  // FUTURE: Photo gallery for on-site documentation, evidence collection
  images?: string[];

  // DISPLAYED: status
  status: 'pending' | 'reviewing' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  status_updated_at?: string;

  // DEPRECATED: Use sos_request_assignments table instead for current provider tracking
  // Kept for backward compatibility; new assignments should use sos_request_assignments
  assigned_to?: string;

  // FUTURE: Admin review audit trail, review timestamp tracking
  reviewed_at?: string;
  reviewed_by?: string;

  // FUTURE: Close-out workflows, resolution tracking
  resolved_at?: string;
  resolution_notes?: string;

  // FUTURE: User satisfaction metrics, feedback dashboard
  user_rating?: number;
  user_feedback?: string;

  // FUTURE: Mobile app submission tracking
  app_submitted: boolean;
  device_location: boolean; // FUTURE: GPS accuracy validation metrics

  // DISPLAYED: is_anonymous
  is_anonymous: boolean;

  // FUTURE: Offline-first sync, reconnection handling
  sent_offline?: boolean;
  queued_at?: string;

  // FUTURE: Event timeline visualization, detailed audit trail
  timeline?: any[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============ SOS Request Assignment DTO ============
export interface SOSRequestAssignmentDTO {
  // Identifiers
  id: string;
  sos_request_id: string;
  provider_id: string;

  // DISPLAYED (implicitly): assigned_by as admin name, assigned_at for audit
  // FUTURE: Assignment audit trail, admin accountability
  assigned_by: string;
  assigned_at: string;

  // DISPLAYED: status, estimated_arrival_minutes, created_at
  // FUTURE: Real-time tracking dashboard, ETA updates
  status: 'assigned' | 'acknowledged' | 'en_route' | 'on_scene' | 'completed' | 'declined';
  status_updated_at?: string;

  // DISPLAYED: estimated_arrival_minutes
  // FUTURE: SLA monitoring, on-time performance metrics
  estimated_arrival_minutes?: number;

  // FUTURE: Actual arrival tracking, SLA validation, incident timeline
  actual_arrival_at?: string;

  // FUTURE: Distance heatmaps, dispatch efficiency analytics
  distance_km?: number;

  // FUTURE: Assignment context, handoff notes between providers
  assignment_notes?: string;

  // FUTURE: Post-incident documentation, resolution notes
  completion_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // DISPLAYED: provider reference (loaded separately to avoid circular deps)
  // Contains ServiceProviderDTO for assignment detail view
  provider?: ServiceProviderDTO;
}

// ============ Query/Filter DTOs ============
export interface SOSRequestFiltersDTO {
  palika_id: number;
  // DISPLAYED: status, search filters in UI
  status?: string;
  emergency_type?: string;
  priority?: string;
  search?: string;
  // Pagination
  page?: number;
  pageSize?: number;
  // FUTURE: Date range filtering for analytics dashboard
  date_from?: string;
  date_to?: string;
  // FUTURE: Ward-level dispatch, palika sub-region filtering
  ward_number?: number;
}

export interface ServiceProviderFiltersDTO {
  palika_id: number;
  // DISPLAYED: service_type, status in dropdown filters
  service_type?: string;
  status?: string;
  search?: string;
}

// ============ Response DTOs ============
export interface GetSOSRequestsResponseDTO {
  data: SOSRequestDTO[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface GetServiceProvidersResponseDTO {
  data: ServiceProviderDTO[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SOSStatsDTO {
  // DISPLAYED: Dashboard stat cards (Total, Pending, Assigned, In Progress, Resolved, Completion %)
  total_today: number;
  pending: number;
  reviewing: number;
  assigned: number;
  in_progress: number;
  resolved: number;
  cancelled: number;

  // FUTURE: SLA monitoring, average response time tracking
  avg_response_time_minutes?: number;

  // DISPLAYED: completion_rate in dashboard
  completion_rate: number;

  // FUTURE: Provider fleet status dashboard, dispatch optimization
  // Breakdown: ambulance, fire_brigade, police, rescue, other
  provider_availability: {
    [key: string]: {
      available: number;
      busy: number;
      offline: number;
      suspended: number;
    };
  };
}

// ============ Create/Update DTOs ============
export interface CreateServiceProviderDTO {
  name_en: string;
  name_ne?: string;
  service_type: 'ambulance' | 'fire_brigade' | 'police' | 'rescue' | 'other';
  phone: string;
  email?: string;
  secondary_phones?: string[];
  latitude: number;
  longitude: number;
  address?: string;
  ward_number?: number;
  coverage_area?: string;
  vehicle_count?: number;
  services?: string[];
  is_24_7?: boolean;
  operating_hours?: Record<string, any>;
}

export interface CreateSOSAssignmentDTO {
  provider_id: string;
  assignment_notes?: string;
  estimated_arrival_minutes?: number;
}

export interface UpdateSOSRequestStatusDTO {
  status: 'reviewing' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  resolution_notes?: string;
  assigned_to?: string;
}

export interface UpdateSOSAssignmentStatusDTO {
  status: 'acknowledged' | 'en_route' | 'on_scene' | 'completed' | 'declined';
  actual_arrival_at?: string;
  completion_notes?: string;
}
