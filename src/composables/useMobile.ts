import { ref, onMounted, onUnmounted, watch } from 'vue';

export function useMobile() {
  const isMobile = ref(false);
  let mediaQueryList: MediaQueryList;

  const updateIsMobile = (e?: MediaQueryListEvent) => {
    isMobile.value = e ? e.matches : mediaQueryList.matches;
  };

  onMounted(() => {
    mediaQueryList = window.matchMedia('(max-width: 767px)');
    updateIsMobile();
    mediaQueryList.addEventListener('change', updateIsMobile);
  });

  onUnmounted(() => {
    mediaQueryList.removeEventListener('change', updateIsMobile);
  });

  watch(isMobile, (value) => {
    document.body.classList.toggle('is-mobile', value);
    document.body.classList.toggle('is-desktop', !value);
  }, { immediate: true });

  return { isMobile };
}
