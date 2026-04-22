# SOS Module - UI Integration Guide

**For UI developers building pages with the SOS API**

---

## Quick Start

All SOS data comes through REST APIs. Use existing components and patterns from other modules (blog posts, heritage sites).

### Fetch Data

```typescript
// Get SOS requests list
const response = await fetch('/api/admin/sos/requests?palika_id=5&page=1&pageSize=25');
const { data, total, page, limit, hasMore } = await response.json();

// Get single request
const response = await fetch('/api/admin/sos/requests/request-123');
const request = await response.json();

// Get service providers
const response = await fetch('/api/admin/sos/providers?palika_id=5&service_type=ambulance');
const { data, total } = await response.json();
```

### Update Data

```typescript
// Update request status
const response = await fetch('/api/admin/sos/requests/request-123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'reviewing',
    resolution_notes: 'Optional notes',
    adminId: 'admin-1', // Replace with current admin ID
  }),
});
const updated = await response.json();

// Create assignment
const response = await fetch('/api/admin/sos/requests/request-123/assignments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider_id: 'provider-1',
    assignment_notes: 'Patient critical',
    estimated_arrival_minutes: 8,
    adminId: 'admin-1',
  }),
});
const assignment = await response.json();
```

---

## Available Endpoints

### SOS Requests

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/sos/requests` | List all (with filters, pagination) |
| GET | `/api/admin/sos/requests/[id]` | Get single request detail |
| PUT | `/api/admin/sos/requests/[id]` | Update status/resolve |

**Query Parameters:**
- `palika_id` (required) — default: 5
- `page` — default: 1
- `pageSize` — default: 25
- `status` — pending, reviewing, assigned, in_progress, resolved, cancelled
- `emergency_type` — medical, accident, fire, security, natural_disaster, other
- `priority` — low, medium, high, critical
- `ward_number` — 1-35
- `search` — search by request_code, caller name, or location

### Service Providers

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/sos/providers` | List all (with filters) |
| GET | `/api/admin/sos/providers/[id]` | Get provider detail |
| POST | `/api/admin/sos/providers` | Create new provider |
| PUT | `/api/admin/sos/providers/[id]` | Update provider details |
| PATCH | `/api/admin/sos/providers/[id]` | Update status only |
| DELETE | `/api/admin/sos/providers/[id]` | Deactivate provider |

### Assignments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/sos/requests/[id]/assignments` | List assignments for request |
| POST | `/api/admin/sos/requests/[id]/assignments` | Assign provider |
| PUT | `/api/admin/sos/requests/[id]/assignments/[assignmentId]` | Update status |
| DELETE | `/api/admin/sos/requests/[id]/assignments/[assignmentId]` | Cancel assignment |

### Dashboard

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/sos/stats` | Dashboard statistics |
| GET | `/api/admin/sos/analytics` | Analytics & trends |

---

## Data Types

### SOS Request
```typescript
{
  id: string;
  request_code: string;           // "SOS-20250420-000001"
  emergency_type: string;         // "medical", "fire", etc.
  priority: string;               // "low", "medium", "high", "critical"
  urgency_score?: number;         // 0-100
  status: string;                 // "pending", "reviewing", "assigned", etc.
  location: { latitude, longitude };
  location_description: string;
  ward_number?: number;
  user_name?: string;
  user_phone: string;
  details?: string;
  is_anonymous: boolean;
  assignments?: Assignment[];     // Populated when fetching single request
  created_at: string;             // ISO 8601
  updated_at: string;
}
```

### Service Provider
```typescript
{
  id: string;
  name_en: string;                // "Metro Ambulance Service"
  service_type: string;           // "ambulance", "fire_brigade", etc.
  phone: string;
  location: { latitude, longitude };
  status: string;                 // "available", "busy", "offline"
  vehicle_count: number;
  is_24_7: boolean;
  rating_average: number;         // 0-5
  rating_count: number;
  total_assignments: number;
  is_active: boolean;
  created_at: string;
}
```

### Assignment
```typescript
{
  id: string;
  sos_request_id: string;
  provider_id: string;
  status: string;                 // "assigned", "acknowledged", "en_route", etc.
  estimated_arrival_minutes?: number;
  actual_arrival_at?: string;
  distance_km?: number;
  assignment_notes?: string;
  provider?: ServiceProvider;      // When fetched via GET
  created_at: string;
}
```

---

## Response Format

### Success Response
```json
{
  "data": {
    "data": [...],
    "total": 42,
    "page": 1,
    "limit": 25,
    "hasMore": true
  }
}
```

### Single Item Response
```json
{
  "id": "...",
  "request_code": "...",
  ...
}
```

### Error Response
```json
{
  "error": "SOS request not found"
}
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

export function SOSRequestsList() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const palikaId = 5; // Get from auth context

  useEffect(() => {
    fetchRequests();
  }, [page]);

  async function fetchRequests() {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `/api/admin/sos/requests?palika_id=${palikaId}&page=${page}&pageSize=25`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch');
      }

      const { data, total, page, hasMore } = await response.json();
      setRequests(data);
      setTotal(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Request Code</th>
            <th>Type</th>
            <th>Status</th>
            <th>Location</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id}>
              <td>{r.request_code}</td>
              <td>{r.emergency_type}</td>
              <td>{r.status}</td>
              <td>{r.location_description}</td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>Page {page} of {Math.ceil(total / 25)}</div>
    </div>
  );
}
```

---

## Common Patterns

### Status Update Dialog

```typescript
async function updateStatus(requestId: string, newStatus: string) {
  try {
    const response = await fetch(`/api/admin/sos/requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        resolution_notes: 'Notes if resolved',
        adminId: currentAdmin.id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert('Error: ' + error.error);
      return;
    }

    const updated = await response.json();
    // Update UI with new data
    setRequest(updated);
    alert('Status updated');
  } catch (err) {
    alert('Failed to update: ' + err.message);
  }
}
```

### Assign Provider Modal

```typescript
async function assignProvider(requestId: string, providerId: string) {
  try {
    const response = await fetch(
      `/api/admin/sos/requests/${requestId}/assignments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          assignment_notes: 'Optional notes',
          estimated_arrival_minutes: 10,
          adminId: currentAdmin.id,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      setError(error.error);
      return;
    }

    const assignment = await response.json();
    // Add to assignments list
    setAssignments([...assignments, assignment]);
    closeModal();
  } catch (err) {
    setError(err.message);
  }
}
```

---

## Reusable Components

Use existing component library from the project:

```typescript
// For tables/lists
import { Table, TableBody, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// For modals/dialogs
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// For forms
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// For status badges
<Badge className={getStatusColor(request.status)}>
  {request.status.toUpperCase()}
</Badge>

// For loading
<div className="animate-pulse">Loading...</div>

// For error messages
<div className="bg-red-50 text-red-700 p-4 rounded">
  {error}
</div>
```

---

## Environment Setup

### .env.local
```bash
# For development (uses fake data)
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true

# For production (uses Supabase)
NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
```

---

## Debugging

### Check API Response
```typescript
const response = await fetch('/api/admin/sos/requests?palika_id=5');
console.log('Status:', response.status);
console.log('Response:', await response.json());
```

### Check Service Response Format
All success responses have `{ data, total, page, limit, hasMore }` structure.

### Check Error Messages
Look for `{ error: 'message' }` in response.

---

## Performance Tips

1. **Pagination** — Use `page` and `pageSize` params
2. **Filtering** — Use query params to filter server-side
3. **Caching** — Consider using React Query or SWR for caching
4. **Debouncing** — Debounce search inputs before API calls

---

## Testing

Use fake datasource in `.env.local`:
```bash
NEXT_PUBLIC_USE_FAKE_DATASOURCES=true
```

Mock providers available:
- Metro Ambulance Service (available)
- Kathmandu Fire Brigade (available)
- Nepal Police (available)
- Rescue Nepal (busy)

Mock requests:
- Medical emergency (in_progress)
- Fire emergency (assigned)
- Accident (pending)
- Resolved medical (resolved)

