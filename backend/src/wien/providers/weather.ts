import { fetchJson, wienCache } from '../cache.js'
import type { WeatherResult } from '../types.js'

const conditionLabels: Record<number, string> = { 0: 'Klar', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bewölkt', 45: 'Nebel', 48: 'Raureifnebel', 51: 'Leichter Nieselregen', 53: 'Nieselregen', 55: 'Starker Nieselregen', 61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen', 71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall', 80: 'Regenschauer', 81: 'Starke Regenschauer', 82: 'Heftige Regenschauer', 95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Starkes Gewitter mit Hagel' }
interface OpenMeteo { current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number; precipitation: number; wind_speed_10m: number }; hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; precipitation: number[]; weather_code: number[] }; daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; sunset: string[] } }

export async function getWeather(latitude: number, longitude: number): Promise<WeatherResult> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Ungültige Koordinaten')
  const key = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}`
  const cached = await wienCache.get(key, 10 * 60_000, async () => {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m', hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code', daily: 'temperature_2m_max,temperature_2m_min,sunset', timezone: 'Europe/Vienna', forecast_days: '1' })
    const raw = await fetchJson<OpenMeteo>(`https://api.open-meteo.com/v1/forecast?${params}`)
    const currentIndex = Math.max(0, raw.hourly.time.findIndex(time => time >= raw.current.time.slice(0, 13) + ':00'))
    const hourly = raw.hourly.time.slice(currentIndex, currentIndex + 6).map((time, index) => ({ time, temperature: raw.hourly.temperature_2m[currentIndex + index], precipitationProbability: raw.hourly.precipitation_probability[currentIndex + index], precipitation: raw.hourly.precipitation[currentIndex + index], weatherCode: raw.hourly.weather_code[currentIndex + index] }))
    const probability = hourly[0]?.precipitationProbability ?? 0
    const warning = raw.current.weather_code >= 95 ? 'Gewitterwarnung' : raw.current.wind_speed_10m >= 60 ? 'Sturmwarnung' : raw.current.temperature_2m >= 32 ? 'Hitzewarnung' : (hourly[0]?.precipitation ?? 0) >= 8 ? 'Starkregenwarnung' : null
    return { state: 'live' as const, source: 'Open-Meteo', location: { name: 'Wien, Donaumarina', latitude, longitude }, temperature: raw.current.temperature_2m, apparentTemperature: raw.current.apparent_temperature, weatherCode: raw.current.weather_code, condition: conditionLabels[raw.current.weather_code] || 'Unbekannt', precipitationProbability: probability, nextHourPrecipitation: hourly[0]?.precipitation ?? raw.current.precipitation, windSpeed: raw.current.wind_speed_10m, high: raw.daily.temperature_2m_max[0], low: raw.daily.temperature_2m_min[0], sunset: raw.daily.sunset[0], warning, hourly, updatedAt: raw.current.time }
  })
  return { ...cached.value, state: cached.stale ? 'stale' : cached.value.state }
}
