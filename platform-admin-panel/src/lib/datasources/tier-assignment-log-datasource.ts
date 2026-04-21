export interface TierAssignmentLogEntry {
  id: string
  palika_id: number
  old_tier_id: string | null
  new_tier_id: string
  assigned_by: string | null
  reason?: string | null
  created_at: string
  palika: {
    id: number
    name_en: string
    name_ne?: string
    code?: string
  } | null
  old_tier: {
    id: string
    name: string
    display_name: string
  } | null
  new_tier: {
    id: string
    name: string
    display_name: string
  } | null
  assigned_by_user?: never
  // Supabase alias: selected as `assigned_by:assigned_by(full_name, email)` which replaces the FK id
  // with the nested object on the same key. We keep id accessible above but the route's shape uses
  // the embedded object under `assigned_by`. Consumers should treat `assigned_by` as the object form.
}

// The shape actually returned by the existing Supabase query: `assigned_by` is the nested object
// (full_name, email) when the embed resolves, since the same alias is used. Mirror that exactly.
export interface TierAssignmentLogRow {
  id: string
  palika_id: number
  old_tier_id: string | null
  new_tier_id: string
  reason?: string | null
  created_at: string
  palika: {
    id: number
    name_en: string
    name_ne?: string
    code?: string
  } | null
  old_tier: {
    id: string
    name: string
    display_name: string
  } | null
  new_tier: {
    id: string
    name: string
    display_name: string
  } | null
  assigned_by: { full_name: string; email: string } | null
}

export interface TierAssignmentLogFilters {
  palika_id?: string
  start_date?: string
  end_date?: string
}

export interface TierAssignmentLogPagination {
  page: number
  limit: number
}

export interface ITierAssignmentLogDatasource {
  /** Returns paginated tier assignment log rows with nested palika, old_tier, new_tier, and assigned_by. */
  getAll(
    filters: TierAssignmentLogFilters,
    pagination: TierAssignmentLogPagination
  ): Promise<{ data: TierAssignmentLogRow[]; count: number }>
}
