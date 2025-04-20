<script setup lang="ts">
import Main from './views/Main.vue'
import { useMobile } from './composables/useMobile';

const { isMobile } = useMobile();
</script>

<template>
  <div :class="{ 'is-mobile': isMobile }">
    <Main />
  </div>
</template>
