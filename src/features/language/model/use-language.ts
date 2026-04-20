import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLanguage() {
  const { locale } = useI18n()

  const currentLanguage = computed(() => locale.value as 'en' | 'es')

  const setLanguage = (value: 'en' | 'es') => {
    locale.value = value
  }

  return {
    currentLanguage,
    setLanguage,
  }
}
