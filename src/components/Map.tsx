import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { useState } from 'react'
import { Hospital, Phone, MapPin } from 'lucide-react'

interface Hospital {
  id: string
  name: string
  position: { lat: number; lng: number }
  address: string
  phone: string
  distance: string
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

// Default center (can be updated with user's location)
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
}

export function Map({ hospitals, userLocation }: { hospitals: Hospital[], userLocation?: { lat: number; lng: number } }) {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  
  const center = userLocation || defaultCenter

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={{
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
          ],
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }}
          />
        )}
        
        {hospitals.map(hospital => (
          <Marker
            key={hospital.id}
            position={hospital.position}
            onClick={() => setSelectedHospital(hospital)}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }}
          />
        ))}

        {selectedHospital && (
          <InfoWindow
            position={selectedHospital.position}
            onCloseClick={() => setSelectedHospital(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Hospital className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-gray-900">{selectedHospital.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {selectedHospital.address}
              </p>
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {selectedHospital.phone}
              </p>
              <p className="text-xs text-purple-600">{selectedHospital.distance} away</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}