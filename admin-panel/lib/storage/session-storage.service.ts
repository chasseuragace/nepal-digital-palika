/**
 * Session Storage Service - Typed API for admin session persistence
 *
 * Higher-level abstraction on top of StorageProvider. Components depend on
 * ISessionStorage, not on any specific storage mechanism.
 *
 * To swap storage (localStorage, cookies, encrypted store, etc.), create a
 * new implementation of ISessionStorage or inject a different StorageProvider.
 */

import { browserStorage, type StorageProvider } from './storage-provider'

/**
 * Admin session data shape - what the login route returns and what
 * every protected page needs to know about the current user.
 */
export interface AdminSession {
  id: string
  email: string
  full_name: string
  role: string
  palika_id?: number
  district_id?: number
  hierarchy_level?: string
}

/**
 * Session storage contract - components depend on this, not on storage internals
 */
export interface ISessionStorage {
  get(): AdminSession | null
  set(session: AdminSession): void
  clear(): void
  exists(): boolean
}

const SESSION_KEY = 'adminSession'

/**
 * Default session storage implementation backed by a StorageProvider
 */
class SessionStorageService implements ISessionStorage {
  constructor(private readonly storage: StorageProvider) {}

  get(): AdminSession | null {
    const raw = this.storage.getItem(SESSION_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw) as AdminSession
    } catch (e) {
      console.error('[sessionStorage] Failed to parse session:', e)
      // Corrupted session - clear it
      this.storage.removeItem(SESSION_KEY)
      return null
    }
  }

  set(session: AdminSession): void {
    this.storage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  clear(): void {
    this.storage.removeItem(SESSION_KEY)
  }

  exists(): boolean {
    return this.storage.getItem(SESSION_KEY) !== null
  }
}

/**
 * Factory for creating session storage with custom provider (useful for tests)
 */
export function createSessionStorage(provider: StorageProvider): ISessionStorage {
  return new SessionStorageService(provider)
}

/**
 * Default singleton - backed by browser storage with memory fallback.
 * This is what production code imports.
 *
 * Named `adminSessionStore` to avoid shadowing the browser's global
 * window.sessionStorage API.
 */
export const adminSessionStore: ISessionStorage = new SessionStorageService(browserStorage)
