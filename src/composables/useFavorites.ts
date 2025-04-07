import { ref, onUnmounted, watchEffect } from 'vue';
import { db, auth } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";
import type { VideoMarker } from '../types/Map';

export function useFavorites() {
  const favorites = ref<VideoMarker[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;
    console.log('fetch favorites');
    try {
      const querySnapshot = await getDocs(collection(db, `users/${user.uid}/favorites`));
      favorites.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoMarker[];
      console.log('new favorites', favorites.value);
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
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        favorited: true,
        description: video.description,
        location: video.location,
        position: video.position
      });

      fetchFavorites();
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
      fetchFavorites(); // Refresh favorites after removal
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing favorite:", err);
    }
  };

  // Firebase auth state listener to load favorites when the user is authenticated
  const unsubscribeAuth = auth.onAuthStateChanged((user) => {
    if (user) {
      fetchFavorites(); // Fetch favorites only when user is authenticated
    }
  });

  // Listen for real-time updates on the user's favorites
  const unsubscribe = onSnapshot(
    collection(db, `users/${auth.currentUser?.uid}/favorites`),
    (snapshot) => {
      favorites.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    fetchFavorites
  };
}
