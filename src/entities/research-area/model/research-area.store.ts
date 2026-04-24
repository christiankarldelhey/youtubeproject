import { defineStore } from 'pinia'
import type { ResearchArea, CreateResearchAreaInput, UpdateResearchAreaInput } from './research-area.types'
import { v4 as uuidv4 } from 'uuid'

const RESEARCH_AREAS_STORAGE_KEY = 'research_areas'
const ACTIVE_RESEARCH_AREA_STORAGE_KEY = 'active_research_area_id'

export const useResearchAreaStore = defineStore('research-area', {
  state: () => ({
    researchAreas: [] as ResearchArea[],
    activeResearchAreaId: null as string | null,
  }),

  getters: {
    activeResearchArea: (state) => {
      return state.researchAreas.find((ra) => ra.id === state.activeResearchAreaId) || null
    },
  },

  actions: {
    createResearchArea(input: CreateResearchAreaInput): ResearchArea {
      const now = new Date().toISOString()
      const researchArea: ResearchArea = {
        id: uuidv4(),
        name: input.name,
        bbox: input.bbox,
        zoomLevel: input.zoomLevel,
        active: true,
        videos: [],
        pois: [],
        travelType: input.travelType,
        category: input.category,
        createdAt: now,
        updatedAt: now,
      }

      this.researchAreas.push(researchArea)
      this.saveToStorage()
      return researchArea
    },

    updateResearchArea(id: string, input: UpdateResearchAreaInput): ResearchArea | null {
      const index = this.researchAreas.findIndex((ra) => ra.id === id)
      if (index === -1) return null

      this.researchAreas[index] = {
        ...this.researchAreas[index],
        ...input,
        updatedAt: new Date().toISOString(),
      }

      this.saveToStorage()
      return this.researchAreas[index]
    },

    deleteResearchArea(id: string): boolean {
      const index = this.researchAreas.findIndex((ra) => ra.id === id)
      if (index === -1) return false

      this.researchAreas.splice(index, 1)

      if (this.activeResearchAreaId === id) {
        this.activeResearchAreaId = null
      }

      this.saveToStorage()
      return true
    },

    setActiveResearchArea(id: string | null): void {
      this.activeResearchAreaId = id
      localStorage.setItem(ACTIVE_RESEARCH_AREA_STORAGE_KEY, id || '')
    },

    clearActiveResearchArea(): void {
      this.activeResearchAreaId = null
      localStorage.setItem(ACTIVE_RESEARCH_AREA_STORAGE_KEY, '')
    },

    loadFromStorage(): void {
      try {
        const stored = localStorage.getItem(RESEARCH_AREAS_STORAGE_KEY)
        if (stored) {
          this.researchAreas = JSON.parse(stored)
        }

        const activeId = localStorage.getItem(ACTIVE_RESEARCH_AREA_STORAGE_KEY)
        if (activeId) {
          this.activeResearchAreaId = activeId || null
        }
      } catch (error) {
        console.error('Failed to load research areas from storage:', error)
      }
    },

    saveToStorage(): void {
      try {
        localStorage.setItem(RESEARCH_AREAS_STORAGE_KEY, JSON.stringify(this.researchAreas))
        localStorage.setItem(ACTIVE_RESEARCH_AREA_STORAGE_KEY, this.activeResearchAreaId || '')
      } catch (error) {
        console.error('Failed to save research areas to storage:', error)
      }
    },
  },
})
