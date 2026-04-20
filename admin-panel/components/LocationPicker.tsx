/**
 * Location Picker Map
 * Uses Leaflet + OpenStreetMap (free, no API key)
 * - Red marker = pinned location (click or GPS)
 * - GPS button to auto-detect user location
 */

import { useState, useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Navigation } from 'lucide-react'
import type { LatLngExpression } from 'leaflet'
import { Map } from './Map'

// Ensure marker icon is fixed (redundant but ensures it works)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface LocationPickerProps {
  value?: { latitude: number; longitude: number } | null
  onChange: (location: { latitude: number; longitude: number }) => void
  height?: string
  defaultCenter?: { latitude: number; longitude: number } | null
}

// Bhaktapur center as fallback default
const FALLBACK_CENTER: LatLngExpression = [27.6710, 85.4275]
const DEFAULT_ZOOM = 14
const DEFAULT_HEIGHT = '400px' // Better aspect ratio for form context

/** Handles map click → pin placement */
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Pans map when pin value changes (e.g. after GPS button press) */
function PanToPin({ position }: { position: LatLngExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, 16)
    }
  }, [position, map])
  return null
}

export function LocationPicker({ value, onChange, height = DEFAULT_HEIGHT, defaultCenter }: LocationPickerProps) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Match m-place behavior: center on clicked/pinned location
  const center: LatLngExpression = value
    ? [value.latitude, value.longitude]
    : (defaultCenter ? [defaultCenter.latitude, defaultCenter.longitude] : FALLBACK_CENTER)

  const pinPosition: LatLngExpression | null = value
    ? [value.latitude, value.longitude]
    : null

  const handleClick = (lat: number, lng: number) => {
    onChange({ latitude: lat, longitude: lng })
    setGpsError(null)
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        setGpsError('Unable to get location. Please tap the map instead.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Pin your location *</span>
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          {gpsLoading ? 'Getting location...' : 'Use my GPS'}
        </button>
      </div>

      <Map
        center={center}
        zoom={value ? 16 : DEFAULT_ZOOM}
        height={height}
        scrollWheelZoom={true}
        markers={value ? [{ key: `pinned-${value.latitude}-${value.longitude}`, position: [value.latitude, value.longitude] }] : undefined}
      >
        <ClickHandler onClick={handleClick} />
        <PanToPin position={pinPosition} />
      </Map>

      <div className="flex items-center justify-between">
        {value ? (
          <p className="text-xs text-gray-500">
            📍 {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-gray-400">Tap the map or use GPS to set location</p>
        )}
      </div>
      {gpsError && (
        <p className="text-xs text-red-600">{gpsError}</p>
      )}
    </div>
  )
}
