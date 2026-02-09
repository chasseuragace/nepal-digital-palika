'use client'

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { apiClient, Admin, Role, Permission, Region, AuditLog } from './api-client'

export function useAdmins(): UseQueryResult<Admin[], Error> {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => apiClient.getAdmins(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAdmin(id: string): UseQueryResult<Admin, Error> {
  return useQuery({
    queryKey: ['admin', id],
    queryFn: () => apiClient.getAdmin(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoles(): UseQueryResult<Role[], Error> {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => apiClient.getRoles(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRole(id: string): UseQueryResult<Role, Error> {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => apiClient.getRole(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePermissions(): UseQueryResult<Permission[], Error> {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiClient.getPermissions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRolePermissions(roleId: string): UseQueryResult<Permission[], Error> {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => apiClient.getRolePermissions(roleId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRegions(): UseQueryResult<Region[], Error> {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => apiClient.getRegions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAuditLog(limit?: number): UseQueryResult<AuditLog[], Error> {
  return useQuery({
    queryKey: ['audit-log', limit],
    queryFn: () => apiClient.getAuditLog(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useDashboardStats(): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
  })
}
