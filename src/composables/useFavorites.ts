import { ref, onUnmounted } from 'vue';
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";
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
        await addDoc(collection(db, "favorites"), {
            videoId: video.videoId,  // Store videoId for easy lookup
            title: video.title,
            thumbnail: video.thumbnail,
            favorited: true,
            description: video.description,
            location: video.location,
            position: video.position
        });
    } catch (err) {
        error.value = err as Error;
        console.error("Error adding favorite:", err);
    }
};

const removeFavorite = async (videoId: string) => {
  try {
      const snapshot = await getDocs(collection(db, "favorites"));
      const docToDelete = snapshot.docs.find(doc => doc.data().videoId === videoId);

      if (!docToDelete) {
          console.error("No matching favorite found for videoId:", videoId);
          return;
      }

      await deleteDoc(doc(db, "favorites", docToDelete.id));
      console.log("Successfully removed favorite:", docToDelete.id);
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
