'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { eventsService, type Event } from '@/lib/client/events-client.service'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const result = await eventsService.getAll()
      setEvents(result.data)
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = events.filter(event =>
    event.name_en?.toLowerCase().includes(filter.toLowerCase()) ||
    event.name_ne?.includes(filter) ||
    event.event_type?.toLowerCase().includes(filter.toLowerCase())
  )

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading events...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Events Management</h1>
        <Link href="/events/new" className="btn btn-primary">
          Add New Event
        </Link>
      </div>

      <div className="card">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name (English)</th>
              <th>Name (Nepali)</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Palika</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.name_english}</td>
                <td>{event.name_nepali}</td>
                <td>{event.event_type}</td>
                <td>{new Date(event.start_date).toLocaleDateString()}</td>
                <td>{new Date(event.end_date).toLocaleDateString()}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    backgroundColor: event.status === 'published' ? '#d4edda' : '#f8d7da',
                    color: event.status === 'published' ? '#155724' : '#721c24'
                  }}>
                    {event.status}
                  </span>
                </td>
                <td>{event.palika_name}</td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
                <td>
                  <Link href={`/events/${event.id}`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                  <Link href={`/events/${event.id}/view`} className="btn btn-secondary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {filter ? 'No events match your search.' : 'No events found. Add your first event!'}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}