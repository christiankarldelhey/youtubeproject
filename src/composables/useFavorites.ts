import { ref, onUnmounted } from 'vue';
import { db, auth } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";
import type { VideoMarker } from '../types/Map';
import { toast } from '@/components/ui/toast';

const favorites = ref<VideoMarker[]>([]);
const loading = ref(false);
const error = ref<Error | null>(null);

let hasInitialized = false;

export function useFavorites() {
  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const querySnapshot = await getDocs(collection(db, `users/${user.uid}/favorites`));
      favorites.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        videoId: doc.data().videoId ?? '',
        title: doc.data().title ?? '',
        thumbnail: doc.data().thumbnail ?? '',
        favorited: doc.data().favorited ?? false,
        description: doc.data().description ?? '',
        location: doc.data().location ?? '',
        position: doc.data().position ?? [0, 0],
      })) as VideoMarker[];
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching favorites:", err);
    }
  };

  const addFavorite = async (video: VideoMarker) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/favorites`), {
        videoId: video.videoId ?? '',
        title: video.title ?? '',
        thumbnail: video.thumbnail ?? '',
        favorited: true,
        description: video.description ?? '',
        location: video.location ?? '',
        position: video.position ?? [0, 0]
      });

      await fetchFavorites();
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding favorite:", err);
    }
  };

  const removeFavorite = async (videoId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/favorites`));
      const docToDelete = snapshot.docs.find(doc => doc.data().videoId === videoId);
      if (!docToDelete) return;

      await deleteDoc(doc(db, `users/${user.uid}/favorites`, docToDelete.id));
      await fetchFavorites();
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing favorite:", err);
    }
  };

  const toggleFavorite = async (video: VideoMarker) => {
    if (!video) return;
    const isFavorite = favorites.value.some(fav => fav.videoId === video.videoId);

    if (!isFavorite) {
      video.favorited = true;
      await addFavorite(video);
      toast({
        title: "Added to favorites",
        description: `"${video.title}" was added to your favorites.`,
      });
    } else {
      video.favorited = false;
      await removeFavorite(video.videoId);
      toast({
        title: "Removed from favorites",
        description: `"${video.title}" was removed from your favorites.`,
      });
    }
  };

  if (!hasInitialized) {
    hasInitialized = true;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchFavorites();
      }
    });

    const unsubscribe = onSnapshot(
      collection(db, `users/${auth.currentUser?.uid}/favorites`),
      (snapshot) => {
        favorites.value = snapshot.docs.map(doc => ({
          id: doc.id,
          videoId: doc.data().videoId ?? '',
          title: doc.data().title ?? '',
          thumbnail: doc.data().thumbnail ?? '',
          description: doc.data().description ?? '',
          location: doc.data().location ?? '',
          position: doc.data().position ?? [0, 0],
        })) as VideoMarker[];
      },
      (err) => {
        error.value = err;
        console.error("Error in snapshot:", err);
      }
    );

    onUnmounted(() => {
      unsubscribe();
      unsubscribeAuth();
    });
  }

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
