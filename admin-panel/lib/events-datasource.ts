/**
 * Abstract Events Datasource
 * Defines contract for querying/storing events
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

import { Event, EventFilters, CreateEventInput, PaginationParams } from '@/services/types'

export interface IEventsDatasource {
  // Fetch all events with optional filtering and pagination
  getAll(filters?: EventFilters, pagination?: PaginationParams): Promise<{ data: Event[]; total: number; count?: number }>

  // Fetch a single event by ID
  getById(id: string): Promise<Event | null>

  // Fetch an event by slug
  getBySlug(slug: string): Promise<Event | null>

  // Create a new event
  create(input: CreateEventInput): Promise<Event>

  // Update an existing event
  update(id: string, input: Partial<CreateEventInput>): Promise<Event>

  // Delete an event
  delete(id: string): Promise<boolean>

  // Fetch upcoming events
  getUpcoming(limit?: number): Promise<Event[]>

  // Fetch events by palika
  getByPalika(palikaId: number, pagination?: PaginationParams): Promise<{ data: Event[]; total: number; count?: number }>

  // Fetch festival events
  getFestivals(palikaId?: number): Promise<Event[]>

  // Search events
  search(query: string, pagination?: PaginationParams): Promise<{ data: Event[]; total: number; count?: number }>

  // Publish an event
  publish(id: string): Promise<Event>

  // Archive an event
  archive(id: string): Promise<Event>
}
