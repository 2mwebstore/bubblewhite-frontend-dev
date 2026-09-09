<template>
  <div>
    <h1 class="font-sans font-bold text-2xl mb-6">កំណត់ហេតុសកម្មភាពបុគ្គលិក</h1>
    <AuditLogTable :list-fn="listStaffLogs" :filter-options-fn="staffFilterOptions" :cleanup-fn="cleanupStaffLogs" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', permission: 'audit.view' })

import { useAdminAuditLogs } from '~/composables/useAdminAuditLogs'
import AuditLogTable from '~/components/admin/AuditLogTable.vue'

const { listStaffLogs, staffFilterOptions, cleanupStaffLogs } = useAdminAuditLogs()
</script>
