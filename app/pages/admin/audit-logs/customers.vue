<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">កំណត់ហេតុសកម្មភាពអតិថិជន</h1>
    <AuditLogTable
      :list-fn="listCustomerLogs"
      :filter-options-fn="customerFilterOptions"
      :cleanup-fn="cleanupCustomerLogs"
      :delete-selected-fn="deleteSelectedCustomerLogs"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'audit.view' })

import { useAdminAuditLogs } from '~/composables/useAdminAuditLogs'
import AuditLogTable from '~/components/admin/AuditLogTable.vue'

const { listCustomerLogs, customerFilterOptions, cleanupCustomerLogs, deleteSelectedCustomerLogs } = useAdminAuditLogs()
</script>
