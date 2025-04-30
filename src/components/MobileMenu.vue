  
  <script setup lang="ts">
  import { XIcon, HeartIcon } from "lucide-vue-next";
  import { watch } from "vue";
  import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
  import VideoList from './VideoList.vue';
  import { useMapStore } from '../store/mapStore';
  import type { VideoMarker } from "../types/Map";
  import { useSearchSettings } from '../composables/useSearchSettings';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const mapStore = useMapStore();
  const props = defineProps<{ videos: VideoMarker[]; favorites: VideoMarker[]; open: boolean }>();
  const { iconMap } = useSearchSettings();
  
  watch(() => props.videos, (newVideos) => {
    if (newVideos.length > 0) {
      mapStore.setSelectedOption('search', false);
    }
  }, { deep: true });
  
  </script>
  
  <template>
    <!-- Mobile view -->
    <div class="block md:hidden mobile-sheet">
        <Sheet 
            class="bg-background" 
            :open="props.open" 
            @update:open="$emit('update:open')">
        <SheetContent side="bottom" class="h-[55vh] mb-12 p-0 w-full bg-background overflow-y-auto overflow-x-hidden">
            <SheetHeader class="p-4 border-b sticky top-0 bg-background z-10">
            <div class="flex items-center justify-between w-full">
                <div v-if="mapStore.selectedOption.value === 'search'" class="text-primary text-sm truncate">
                  <span class="flex flex-row items-center gap-2 text-primary font-semibold">
                    <component :is="iconMap[mapStore.searchQuery.icon as keyof typeof iconMap]" class="h-4 w-4" /> {{ t('sidebar.search_results', { label: t(mapStore.searchQuery.value) }) }}
                  </span>
                </div>
                <span class="flex flex-row items-center gap-2 text-primary font-semibold" v-if="mapStore.selectedOption.value === 'favorites'">
                  <HeartIcon class="h-4 w-4" /> {{ t('sidebar.favorites') }}
                </span>
                <XIcon 
                @click="mapStore.setSelectedOption(mapStore.selectedOption.value, false)" 
                class="flex-shrink-0 h-4 w-4 text-right cursor-pointer"
                />
            </div>
            </SheetHeader>
            <div class="p-1">
                <VideoList v-if="mapStore.selectedOption.value === 'search'" :videos="props.videos" />
                <VideoList v-if="mapStore.selectedOption.value === 'favorites'" :videos="props.favorites" />
            </div>
        </SheetContent>
        </Sheet>
    </div>
</template>