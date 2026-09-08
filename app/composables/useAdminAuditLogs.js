import { useApi } from './useApi'

// Kept as its own small composable, same reasoning as useAdminOrders —
// self-contained, safe to drop in without touching an established file.
export function useAdminAuditLogs() {
  const api = useApi()

  function buildQuery({ page = 1, pageSize = 20, search = '', action = '', resource = '', dateFrom = '', dateTo = '', actorId = '' } = {}) {
    const q = new URLSearchParams({ page, pageSize })
    if (search) q.set('search', search)
    if (action) q.set('action', action)
    if (resource) q.set('resource', resource)
    if (dateFrom) q.set('dateFrom', dateFrom)
    if (dateTo) q.set('dateTo', dateTo)
    if (actorId) q.set('actorId', actorId)
    return q.toString()
  }

  function listStaffLogs(params) {
    return api.get(`/admin/audit-logs/staff?${buildQuery(params)}`)
  }

  function listCustomerLogs(params) {
    return api.get(`/admin/audit-logs/customers?${buildQuery(params)}`)
  }

  // The distinct action/resource values actually in use right now, for
  // populating each view's filter dropdowns — see the backend's own
  // DistinctActions/DistinctResources for why these are queried live
  // rather than hardcoded here.
  function staffFilterOptions() {
    return api.get('/admin/audit-logs/staff/filters')
  }

  function customerFilterOptions() {
    return api.get('/admin/audit-logs/customers/filters')
  }

  return { listStaffLogs, listCustomerLogs, staffFilterOptions, customerFilterOptions }
}
