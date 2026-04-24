import axios from 'axios'
import type { ResearchArea, CreateResearchAreaInput, UpdateResearchAreaInput } from '../model/research-area.types'

const BACKEND_ENDPOINT = 'http://localhost:4000'

export const createResearchAreaApi = async (
  input: CreateResearchAreaInput,
): Promise<ResearchArea> => {
  const { data } = await axios.post<ResearchArea>(
    `${BACKEND_ENDPOINT}/api/research-areas`,
    input,
  )
  return data
}

export const listResearchAreasApi = async (): Promise<ResearchArea[]> => {
  const { data } = await axios.get<ResearchArea[]>(
    `${BACKEND_ENDPOINT}/api/research-areas`,
  )
  return data
}

export const getResearchAreaByIdApi = async (id: string): Promise<ResearchArea> => {
  const { data } = await axios.get<ResearchArea>(
    `${BACKEND_ENDPOINT}/api/research-areas/${id}`,
  )
  return data
}

export const updateResearchAreaApi = async (
  id: string,
  input: UpdateResearchAreaInput,
): Promise<ResearchArea> => {
  const { data } = await axios.put<ResearchArea>(
    `${BACKEND_ENDPOINT}/api/research-areas/${id}`,
    input,
  )
  return data
}

export const deleteResearchAreaApi = async (id: string): Promise<void> => {
  await axios.delete(`${BACKEND_ENDPOINT}/api/research-areas/${id}`)
}
