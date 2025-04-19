  
  <script setup lang="ts">
  import { XIcon } from "lucide-vue-next";
  import { watch } from "vue";
  import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
  import VideoList from './VideoList.vue';
  import { useMapStore } from '../store/mapStore';
  import type { VideoMarker } from "../types/Map";

  const mapStore = useMapStore();
  const props = defineProps<{ videos: VideoMarker[]; favorites: VideoMarker[]; open: boolean }>();
  
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
        <SheetContent side="bottom" class="h-[55vh] p-0 w-full bg-background overflow-y-auto overflow-x-hidden">
            <SheetHeader class="p-4 border-b sticky top-0 bg-background z-10">
            <div class="flex items-center justify-between w-full">
                <div v-if="mapStore.selectedOption.value === 'search'" class="text-primary text-sm truncate">
                {{ mapStore.searchQuery.label }} videos in the area
                </div>
                <div v-else-if="mapStore.selectedOption.value === 'favorites'" class="text-primary text-sm truncate">
                Favorited videos
                </div>
                <XIcon 
                @click="mapStore.setSelectedOption(mapStore.selectedOption.value, false)" 
                class="flex-shrink-0 h-4 w-4 text-right cursor-pointer"
                />
            </div>
            </SheetHeader>
            <div class="p-4">
                <VideoList v-if="mapStore.selectedOption.value === 'search'" :videos="props.videos" />
                <VideoList v-if="mapStore.selectedOption.value === 'favorites'" :videos="props.favorites" />
            </div>
        </SheetContent>
        </Sheet>
    </div>
</template>

<style>
  [data-state="open"].bg-black\/80 {
    background-color: transparent;
  }
</style>