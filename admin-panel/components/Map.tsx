/**
 * Shared Map Component
 * Base Leaflet map component that can be reused across the admin panel
 * Handles core Leaflet setup (MapContainer, TileLayer, marker icons)
 */

import { ReactNode } from 'react'
import { MapContainer, TileLayer, Marker, MarkerProps } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon (Leaflet + bundler issue)
// This must run at module load time before any map renders
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export interface MapProps {
  center: LatLngExpression
  zoom?: number
  height?: string
  scrollWheelZoom?: boolean
  dragging?: boolean
  zoomControl?: boolean
  children?: ReactNode
  markers?: Array<{ key: string } & Omit<MarkerProps, 'key'>>
}

const DEFAULT_MAP_HEIGHT = '400px'

/**
 * Base map component with OpenStreetMap tiles
 * Can be used for both interactive and static maps
 */
export function Map({
  center,
  zoom = 14,
  height = DEFAULT_MAP_HEIGHT,
  scrollWheelZoom = true,
  dragging = true,
  zoomControl = true,
  children,
  markers
}: MapProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={scrollWheelZoom}
        dragging={dragging}
        zoomControl={zoomControl}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers?.map(({ key, ...markerProps }) => (
          <Marker key={key} {...markerProps} />
        ))}
        {children}
      </MapContainer>
    </div>
  )
}
