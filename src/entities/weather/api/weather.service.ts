import type { WeatherCurrentResponse } from '@/entities/weather/model/weather.types'
import { backendHttpClient } from '@/shared/api/http-client'

export async function fetchCurrentWeather(): Promise<WeatherCurrentResponse> {
  const { data } = await backendHttpClient.get<WeatherCurrentResponse>('/weather/current')
  return data
}
