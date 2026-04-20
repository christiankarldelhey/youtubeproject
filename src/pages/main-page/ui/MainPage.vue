<script setup lang="ts">
import { SidebarProvider } from '@/shared/ui/shadcn/sidebar'
import SearchBar from '@/components/SearchBar.vue'
import { MapPanel } from '@/widgets/map-panel'
import { UserControls } from '@/widgets/user-controls'
import { useAuthSession } from '@/features/auth'

const { user } = useAuthSession()
</script>

<template>
  <SidebarProvider
    :open="false"
    :defaultOpen="false"
    style="--sidebar-width: 35rem;"
  >
    <UserControls :user="user" class="z-9999" />
    <SearchBar />

    <div class="flex w-full flex-col">
      <MapPanel />
    </div>
  </SidebarProvider>
</template>

<style>
.is-mobile [data-state="open"].bg-black\/80 {
  background-color: transparent;
}

div[role="dialog"][data-state="open"] {
  z-index: 100000 !important;
  position: fixed !important;
}

div[data-aria-hidden=true][data-state="open"] {
  z-index: 9999 !important;
}

ol,
li[role="alert"] {
  z-index: 100001 !important;
  color: black !important;
}
</style>
