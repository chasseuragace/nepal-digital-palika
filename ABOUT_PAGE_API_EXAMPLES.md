# About Page - API Examples & Data Structures

## API Functions

### 1. Fetch Full Palika Profile

```typescript
import { fetchPalikaProfile } from '@/api/palikaProfile';

// Usage
const profile = await fetchPalikaProfile(1);
```

**Parameters**:
- `palikaId` (number) - The ID of the palika to fetch

**Returns**:
```typescript
interface PalikaProfile {
  id: number;
  name_en: string;
  name_ne: string;
  description?: string;
  total_wards: number;
  population?: number;
  established_year?: number;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  district_name?: string;
  province_name?: string;
}
```

**Example Response**:
```json
{
  "id": 1,
  "name_en": "Kathmandu Metropolitan City",
  "name_ne": "काठमाडौं महानगरपालिका",
  "description": "The capital city of Nepal, known for its rich cultural heritage and tourism.",
  "total_wards": 32,
  "population": 1450000,
  "established_year": 2017,
  "website": "https://kathmandu.gov.np",
  "contact_email": "info@kathmandu.gov.np",
  "contact_phone": "+977-1-4262000",
  "district_name": "Kathmandu",
  "province_name": "Bagmati"
}
```

**Error Handling**:
```typescript
try {
  const profile = await fetchPalikaProfile(1);
  console.log(profile.name_en);
} catch (error) {
  console.error('Failed to fetch profile:', error);
  // Use fallback data
}
```

### 2. Fetch Minimal Palika Profile

```typescript
import { fetchPalikaProfileMinimal } from '@/api/palikaProfile';

// Usage - for RLS fallback
const profile = await fetchPalikaProfileMinimal(1);
```

**Parameters**:
- `palikaId` (number) - The ID of the palika to fetch

**Returns**:
```typescript
interface Partial<PalikaProfile> {
  id?: number;
  name_en?: string;
  name_ne?: string;
  total_wards?: number;
}
```

**Example Response**:
```json
{
  "id": 1,
  "name_en": "Kathmandu Metropolitan City",
  "name_ne": "काठमाडौं महानगरपालिका",
  "total_wards": 32
}
```

## Supabase Queries

### Query 1: Full Profile with Joins

```sql
SELECT
  id,
  name_en,
  name_ne,
  description,
  total_wards,
  population,
  established_year,
  website,
  contact_email,
  contact_phone,
  districts (
    name_en
  ),
  districts!inner (
    provinces (
      name_en
    )
  )
FROM palikas
WHERE id = 1
```

**Response Structure**:
```json
{
  "id": 1,
  "name_en": "Kathmandu Metropolitan City",
  "name_ne": "काठमाडौं महानगरपालिका",
  "description": "The capital city of Nepal...",
  "total_wards": 32,
  "population": 1450000,
  "established_year": 2017,
  "website": "https://kathmandu.gov.np",
  "contact_email": "info@kathmandu.gov.np",
  "contact_phone": "+977-1-4262000",
  "districts": {
    "name_en": "Kathmandu"
  }
}
```

### Query 2: Minimal Profile (RLS Fallback)

```sql
SELECT
  id,
  name_en,
  name_ne,
  total_wards
FROM palikas
WHERE id = 1
```

**Response Structure**:
```json
{
  "id": 1,
  "name_en": "Kathmandu Metropolitan City",
  "name_ne": "काठमाडौं महानगरपालिका",
  "total_wards": 32
}
```

## Component Usage

### Basic Usage in About Page

```typescript
import { useEffect, useState } from 'react';
import { useCurrentPalika } from '@/hooks/useCurrentPalika';
import { fetchPalikaProfile } from '@/api/palikaProfile';

export default function About() {
  const { palika } = useCurrentPalika();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!palika?.palikaId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPalikaProfile(palika.palikaId);
        setProfile(data);
      } catch (err) {
        setError(err.message);
        // Use fallback data
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [palika?.palikaId]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No data</div>;

  return (
    <div>
      <h1>{profile.name_en}</h1>
      <p>{profile.description}</p>
      <p>Wards: {profile.total_wards}</p>
      <p>Location: {profile.district_name}, {profile.province_name}</p>
    </div>
  );
}
```

## Data Transformation Examples

### Transform Supabase Response to PalikaProfile

```typescript
function transformPalikaData(supabaseData: any): PalikaProfile {
  return {
    id: supabaseData.id,
    name_en: supabaseData.name_en,
    name_ne: supabaseData.name_ne,
    description: supabaseData.description,
    total_wards: supabaseData.total_wards,
    population: supabaseData.population,
    established_year: supabaseData.established_year,
    website: supabaseData.website,
    contact_email: supabaseData.contact_email,
    contact_phone: supabaseData.contact_phone,
    district_name: supabaseData.districts?.name_en,
    province_name: supabaseData.districts?.provinces?.name_en,
  };
}
```

### Format Population for Display

```typescript
function formatPopulation(population: number): string {
  if (population >= 1000000) {
    return `${(population / 1000000).toFixed(1)}M`;
  }
  if (population >= 1000) {
    return `${(population / 1000).toFixed(0)}K`;
  }
  return population.toString();
}

// Usage
const displayPopulation = formatPopulation(1450000); // "1.5M"
```

### Format Contact Information

```typescript
function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +977-1-XXXXXXX
  if (cleaned.startsWith('977')) {
    return `+${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
}

// Usage
const formatted = formatPhoneNumber('9741234567'); // "+977-1-4262000"
```

## Error Handling Examples

### Handle RLS Errors

```typescript
async function fetchWithFallback(palikaId: number) {
  try {
    // Try full profile
    return await fetchPalikaProfile(palikaId);
  } catch (error) {
    console.warn('Full profile fetch failed, trying minimal:', error);
    
    try {
      // Try minimal profile
      return await fetchPalikaProfileMinimal(palikaId);
    } catch (minimalError) {
      console.error('Minimal profile fetch also failed:', minimalError);
      
      // Return fallback data
      return FALLBACK_PALIKA_DATA;
    }
  }
}
```

### Handle Network Errors

```typescript
async function fetchWithRetry(palikaId: number, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchPalikaProfile(palikaId);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error; // Last attempt failed
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Testing Examples

### Unit Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchPalikaProfile } from '@/api/palikaProfile';

describe('fetchPalikaProfile', () => {
  it('should fetch palika profile successfully', async () => {
    const mockData = {
      id: 1,
      name_en: 'Test Palika',
      name_ne: 'परीक्षण पालिका',
      total_wards: 13,
    };

    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      },
    }));

    const result = await fetchPalikaProfile(1);
    expect(result.name_en).toBe('Test Palika');
  });

  it('should throw error on fetch failure', async () => {
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('RLS policy violation'),
              }),
            }),
          }),
        }),
      },
    }));

    await expect(fetchPalikaProfile(1)).rejects.toThrow();
  });
});
```

### Integration Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import About from '@/pages/About';

describe('About Page', () => {
  it('should display palika information', async () => {
    render(<About />);

    await waitFor(() => {
      expect(screen.getByText(/Kathmandu Metropolitan City/i)).toBeInTheDocument();
    });
  });

  it('should show fallback data on error', async () => {
    // Mock fetch to fail
    vi.mock('@/api/palikaProfile', () => ({
      fetchPalikaProfile: vi.fn().mockRejectedValue(new Error('RLS error')),
    }));

    render(<About />);

    await waitFor(() => {
      expect(screen.getByText(/Using cached information/i)).toBeInTheDocument();
    });
  });
});
```

## Real-World Examples

### Example 1: Display Palika Stats

```typescript
function PalikaStats({ profile }: { profile: PalikaProfile }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-sm text-gray-600">Wards</p>
        <p className="text-2xl font-bold">{profile.total_wards}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Population</p>
        <p className="text-2xl font-bold">
          {formatPopulation(profile.population || 0)}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Established</p>
        <p className="text-2xl font-bold">{profile.established_year}</p>
      </div>
    </div>
  );
}
```

### Example 2: Display Contact Card

```typescript
function ContactCard({ profile }: { profile: PalikaProfile }) {
  return (
    <div className="space-y-3">
      {profile.contact_email && (
        <div>
          <p className="text-sm text-gray-600">Email</p>
          <a href={`mailto:${profile.contact_email}`}>
            {profile.contact_email}
          </a>
        </div>
      )}
      {profile.contact_phone && (
        <div>
          <p className="text-sm text-gray-600">Phone</p>
          <a href={`tel:${profile.contact_phone}`}>
            {profile.contact_phone}
          </a>
        </div>
      )}
      {profile.website && (
        <div>
          <p className="text-sm text-gray-600">Website</p>
          <a href={profile.website} target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Display Location Info

```typescript
function LocationInfo({ profile }: { profile: PalikaProfile }) {
  return (
    <div className="flex items-center space-x-2">
      <MapPin className="w-5 h-5 text-emerald-600" />
      <div>
        <p className="font-semibold">{profile.district_name}</p>
        <p className="text-sm text-gray-600">{profile.province_name}</p>
      </div>
    </div>
  );
}
```

## Debugging Tips

### Check Supabase Response

```typescript
const { data, error } = await supabase
  .from('palikas')
  .select('*')
  .eq('id', 1)
  .single();

console.log('Supabase Response:', { data, error });
```

### Log API Calls

```typescript
export async function fetchPalikaProfile(palikaId: number) {
  console.log('[API] Fetching palika profile:', palikaId);
  
  try {
    const { data, error } = await supabase
      .from('palikas')
      .select('...')
      .eq('id', palikaId)
      .single();

    console.log('[API] Response:', { data, error });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[API] Error:', error);
    throw error;
  }
}
```

### Monitor Component State

```typescript
useEffect(() => {
  console.log('[About] State updated:', {
    loading,
    error,
    profile: profile?.name_en,
  });
}, [loading, error, profile]);
```

## Performance Optimization

### Memoize Profile Data

```typescript
const memoizedProfile = useMemo(() => profile, [profile]);
```

### Cache with React Query

```typescript
import { useQuery } from '@tanstack/react-query';

function useProfileQuery(palikaId: number) {
  return useQuery({
    queryKey: ['palika', palikaId],
    queryFn: () => fetchPalikaProfile(palikaId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

**Last Updated**: March 25, 2026
**Version**: 1.0
