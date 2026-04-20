/**
 * Static Map Display
 * Read-only map for detail pages
 * Uses the shared Map component with disabled interaction
 */

import type { LatLngExpression } from 'leaflet'
import { Map } from './Map'

export interface StaticMapProps {
  latitude: number
  longitude: number
  label?: string
  height?: string
  zoom?: number
}

/**
 * Read-only map for displaying a single location
 * Used in detail pages, event/festival views, etc.
 */
export function StaticMap({ latitude, longitude, label, height = '250px', zoom = 15 }: StaticMapProps) {
  const center: LatLngExpression = [latitude, longitude]

  return (
    <Map
      center={center}
      zoom={zoom}
      height={height}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      markers={[{ key: 'location', position: center }]}
    />
  )
}
