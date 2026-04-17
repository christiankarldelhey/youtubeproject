import { ref, watch } from 'vue';
import { auth } from "../firebase";
import type { VideoMarker } from '../types/Map';
import { useI18n } from 'vue-i18n';
import { toast } from '@/components/ui/toast';
import { useBackendApi } from './useBackendApi';

const favorites = ref<VideoMarker[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);

export function useFavorites() {
  const { t } = useI18n();
  const { getUserFavorites, addFavorite: addFavoriteApi, removeFavorite: removeFavoriteApi } = useBackendApi();

  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (!user) {
      favorites.value = [];
      return;
    }

    try {
      loading.value = true;
      const favs = await getUserFavorites(user.uid);
      favorites.value = favs.map(fav => ({ ...fav, favorited: true }));
      error.value = null;
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching favorites:", err);
    } finally {
      loading.value = false;
    }
  };

  const addFavorite = async (video: VideoMarker) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      loading.value = true;
      const success = await addFavoriteApi(user.uid, video);
      
      if (success) {
        await fetchFavorites();
      } else {
        throw new Error('Failed to add favorite');
      }
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding favorite:", err);
    } finally {
      loading.value = false;
    }
  };

  const removeFavorite = async (videoId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      loading.value = true;
      const success = await removeFavoriteApi(user.uid, videoId);
      
      if (success) {
        await fetchFavorites();
      } else {
        throw new Error('Failed to remove favorite');
      }
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing favorite:", err);
    } finally {
      loading.value = false;
    }
  };

  const toggleFavorite = async (video: VideoMarker) => {
    if (!video) return;
    
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: t('toast.login_required_title') || 'Login Required',
        description: t('toast.login_required_description') || 'Please login to add videos to favorites',
        variant: 'destructive',
      });
      return;
    }

    const isFavorite = favorites.value.some(fav => fav.videoId === video.videoId);

    if (!isFavorite) {
      video.favorited = true;
      await addFavorite(video);
      toast({
        title: t('toast.added_to_favorites_title'),
        description: t('toast.added_to_favorites_description', { label: video.title }),
      });
    } else {
      video.favorited = false;
      await removeFavorite(video.videoId);
      toast({
        title: t('toast.removed_from_favorites_title'),
        description: t('toast.removed_from_favorites_description', { label: video.title }),
      });
    }
  };

  // Watch auth state changes
  watch(() => auth.currentUser, (user) => {
    if (user) {
      fetchFavorites();
    } else {
      favorites.value = [];
    }
  }, { immediate: true });

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    fetchFavorites,
    toggleFavorite
  };
}
