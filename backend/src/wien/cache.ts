interface CacheEntry<T> { value: T; expiresAt: number; staleUntil: number }

export class AsyncCache {
  private entries = new Map<string, CacheEntry<unknown>>()
  private pending = new Map<string, Promise<unknown>>()

  async get<T>(key: string, ttlMs: number, loader: () => Promise<T>, staleMs = ttlMs * 6): Promise<{ value: T; stale: boolean }> {
    const now = Date.now()
    const entry = this.entries.get(key) as CacheEntry<T> | undefined
    if (entry && entry.expiresAt > now) return { value: entry.value, stale: false }
    const existing = this.pending.get(key) as Promise<T> | undefined
    if (existing) return { value: await existing, stale: false }

    const request = loader()
    this.pending.set(key, request)
    try {
      const value = await request
      this.entries.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + staleMs })
      return { value, stale: false }
    } catch (error) {
      if (entry && entry.staleUntil > now) return { value: entry.value, stale: true }
      throw error
    } finally {
      this.pending.delete(key)
    }
  }
}

export const wienCache = new AsyncCache()

export async function fetchJson<T>(url: string, timeoutMs = 8000, headers?: Record<string, string>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, headers })
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
    return await response.json() as T
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}
