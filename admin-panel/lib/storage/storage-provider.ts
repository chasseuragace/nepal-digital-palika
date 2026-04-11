/**
 * Storage Provider - Low-level abstraction over key-value storage
 *
 * Ported from m-place pattern. Allows components to depend on the
 * StorageProvider interface instead of touching window.localStorage directly.
 *
 * The browserStorage implementation tries window.localStorage first and
 * falls back to an in-memory object if localStorage is unavailable
 * (SSR, privacy mode, or storage blocked).
 */

export interface StorageProvider {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * In-memory fallback used when window.localStorage is not available
 * (server-side rendering, privacy mode, storage blocked, etc.)
 */
let memoryStorage: Record<string, string> = {}

/**
 * Browser storage provider with automatic in-memory fallback
 */
export const browserStorage: StorageProvider = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key)
      }
    } catch (e) {
      console.warn('[storage] localStorage access denied, using memory storage')
    }
    return memoryStorage[key] ?? null
  },

  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
        return
      }
    } catch (e) {
      console.warn('[storage] localStorage write failed, using memory storage')
    }
    memoryStorage[key] = value
  },

  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
        return
      }
    } catch (e) {
      console.warn('[storage] localStorage remove failed, using memory storage')
    }
    delete memoryStorage[key]
  },

  clear: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear()
        return
      }
    } catch (e) {
      console.warn('[storage] localStorage clear failed, using memory storage')
    }
    memoryStorage = {}
  },
}

/**
 * Pure in-memory storage - useful for tests that need isolation
 */
export function createMemoryStorage(): StorageProvider {
  let store: Record<string, string> = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}
