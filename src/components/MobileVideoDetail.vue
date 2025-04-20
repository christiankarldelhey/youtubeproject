  
  <script setup lang="ts">
  import { HeartIcon, XIcon } from "lucide-vue-next";
  import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
  import { useMapStore } from '../store/mapStore';
  import { removeEmojisAndUppercaseWords } from '@/utils/utils';
  import { useFavorites } from '../composables/useFavorites';
  import { Card } from '@/components/ui/card';
  
  const { toggleFavorite } = useFavorites();
  const mapStore = useMapStore();
  const props = defineProps<{ open: boolean }>();
  
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
                <div 
                v-if="mapStore.showMobileVideoDetail" 
                class="flex items-center gap-2 flex-1 min-w-0">
                <HeartIcon 
                    class="flex-shrink-0 h-6 w-6 cursor-pointer transition-colors duration-200" 
                    :class="{ 'fill-red-500 text-red-500': mapStore.selectedPin?.favorited }"
                    @click="toggleFavorite(mapStore.selectedPin!)">
                </HeartIcon>
                <span class="text-sm text-primary truncate">
                    {{ removeEmojisAndUppercaseWords(mapStore.selectedPin?.title || '') }}
                </span>
                </div>

                <XIcon 
                @click="mapStore.setMobileVideoDetail(false)" 
                class="flex-shrink-0 h-4 w-4 text-right cursor-pointer"
                />
            </div>
            </SheetHeader>

            <div v-if="mapStore.showMobileVideoDetail" class="p-4">
            <Card class="space-y-4">
                <div class="relative w-full h-9/10 rounded overflow-hidden">
                <iframe
                    :src="`https://www.youtube.com/embed/${mapStore.selectedPin?.videoId}?autoplay=1&controls=1`"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    class="w-full h-full object-cover aspect-video"
                ></iframe>
                    <p class="text-sm pt-2">
                    {{ mapStore.selectedPin?.description || '' }}
                    </p>
                </div>
            </Card>
            </div>
        </SheetContent>
        </Sheet>
    </div>
</template>
