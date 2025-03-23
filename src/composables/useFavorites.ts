import { ref, onUnmounted } from 'vue';
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import type { VideoMarker } from '../types/Map';

export function useFavorites() {
  const favorites = ref<VideoMarker[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const favoritesCollection = collection(db, "favorites");
  const unsubscribe = onSnapshot(favoritesCollection, (snapshot) => {
    favorites.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VideoMarker[];
  }, (err) => {
    error.value = err;
    console.error("Error fetching favorites:", err);
  });

  const addFavorite = async (video: VideoMarker) => {
    try {
      await addDoc(favoritesCollection, video);
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding favorite:", err);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await deleteDoc(doc(db, "favorites", id));
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing favorite:", err);
    }
  };

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
  };
}
