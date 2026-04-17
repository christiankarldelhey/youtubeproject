<script setup lang="ts">
  import SearchBar from '../components/SearchBar.vue';
  import WorldMap from '../components/WorldMap.vue';
  import { SidebarProvider } from '@/components/ui/sidebar'
  import { useAuth } from '../composables/useAuth';
  import UserOptions from '../components/UserOptions.vue';

  const { user } = useAuth();
</script>

<template>
  <SidebarProvider 
      :open="false"
      :defaultOpen="false" 
      style="--sidebar-width: 35rem;">

    <UserOptions 
      :user="user" 
      class="z-9999" />
    <SearchBar />

    <div class="flex flex-col w-full">
        <WorldMap />
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
div[data-aria-hidden = true][data-state="open"] {
  z-index: 9999 !important;
}
ol, li[role="alert"] {
  z-index: 100001 !important;
  color: black !important;
}
</style>   
