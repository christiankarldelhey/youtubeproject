import { defineStore } from 'pinia'

export type TravelType = 'city' | 'rural' | null

export type SearchPreferencesState = {
  travelType: TravelType
  category: string
  hasCompletedOnboarding: boolean
}

const ONBOARDING_STORAGE_KEY = 'onboarding_completed'

export const useSearchPreferencesStore = defineStore('search-preferences', {
  state: (): SearchPreferencesState => ({
    travelType: null,
    category: 'Travel',
    hasCompletedOnboarding: false,
  }),
  actions: {
    setTravelType(travelType: TravelType) {
      this.travelType = travelType
    },
    setCategory(category: string) {
      this.category = category
    },
    markOnboardingComplete() {
      this.hasCompletedOnboarding = true
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    },
    loadOnboardingStatus() {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      this.hasCompletedOnboarding = completed === 'true'
    },
  },
})
