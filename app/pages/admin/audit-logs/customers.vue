<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">កំណត់ហេតុសកម្មភាពអតិថិជន</h1>
    <AuditLogTable :list-fn="listCustomerLogs" :filter-options-fn="customerFilterOptions" :cleanup-fn="cleanupCustomerLogs" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'audit.view' })

import { useAdminAuditLogs } from '~/composables/useAdminAuditLogs'
import AuditLogTable from '~/components/admin/AuditLogTable.vue'

const { listCustomerLogs, customerFilterOptions, cleanupCustomerLogs } = useAdminAuditLogs()
</script>
