import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { GoogleMap, LoadScript, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { 
  Hospital, 
  Phone, 
  MapPin, 
  Navigation, 
  Clock, 
  Star,
  Loader,
  AlertCircle
} from 'lucide-react'

interface HospitalData {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  formatted_phone_number?: string
  opening_hours?: {
    open_now: boolean
  }
  distance?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

// Default to a major city if location fails
const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.0060 } // New York

export function Hospitals() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [hospitals, setHospitals] = useState<HospitalData[]>([])
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(5000) // 5km default
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  })

  useEffect(() => {
    if (isLoaded) {
      getUserLocation()
    }
  }, [isLoaded])

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          console.log('User location found:', location)
          setUserLocation(location)
          setLocationError(null)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationError('Unable to get your location. Showing hospitals near New York.')
          setUserLocation(DEFAULT_LOCATION)
        }
      )
    } else {
      setLocationError('Geolocation not supported. Showing hospitals near New York.')
      setUserLocation(DEFAULT_LOCATION)
    }
  }

  const searchNearbyHospitals = () => {
    if (!mapRef.current || !userLocation) return

    console.log('Searching for hospitals near:', userLocation)
    setLoading(true)

    const service = new google.maps.places.PlacesService(mapRef.current)
    
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: searchRadius,
      type: 'hospital'
    }

    service.nearbySearch(request, (results, status) => {
      console.log('Places API status:', status)
      console.log('Results found:', results?.length)

      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Filter to only hospitals (some clinics might be returned)
        const hospitalResults = results.filter(place => 
          place.types?.includes('hospital') || place.types?.includes('health')
        )

        if (hospitalResults.length === 0) {
          setHospitals([])
          setLoading(false)
          return
        }

        // Get details for each hospital
        const hospitalsWithDetails = hospitalResults.slice(0, 15).map(place => {
          return new Promise<HospitalData>((resolve) => {
            service.getDetails(
              {
                placeId: place.place_id!,
                fields: ['name', 'formatted_phone_number', 'opening_hours', 'vicinity', 'geometry', 'rating', 'place_id', 'types']
              },
              (detailResult, detailStatus) => {
                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && detailResult) {
                  // Calculate distance
                  const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(userLocation.lat, userLocation.lng),
                    new google.maps.LatLng(detailResult.geometry!.location!.lat(), detailResult.geometry!.location!.lng())
                  )
                  
                  resolve({
                    place_id: detailResult.place_id!,
                    name: detailResult.name || 'Unknown Hospital',
                    vicinity: detailResult.vicinity || 'Address not available',
                    geometry: {
                      location: {
                        lat: detailResult.geometry!.location!.lat(),
                        lng: detailResult.geometry!.location!.lng()
                      }
                    },
                    rating: detailResult.rating,
                    formatted_phone_number: detailResult.formatted_phone_number,
                    opening_hours: detailResult.opening_hours,
                    distance: distance < 1000 
                      ? `${Math.round(distance)} m` 
                      : `${(distance / 1000).toFixed(1)} km`
                  })
                } else {
                  console.warn('Failed to get details for place:', place.place_id)
                  resolve({
                    ...place as HospitalData,
                    distance: 'Unknown'
                  })
                }
              }
            )
          })
        })

        Promise.all(hospitalsWithDetails).then(hospitalsData => {
          // Sort by distance
          const sorted = hospitalsData.sort((a, b) => {
            const distA = a.distance === 'Unknown' ? Infinity : parseFloat(a.distance || '0')
            const distB = b.distance === 'Unknown' ? Infinity : parseFloat(b.distance || '0')
            return distA - distB
          })
          
          console.log('Hospitals loaded:', sorted.length)
          setHospitals(sorted)
          setLoading(false)
        }).catch(error => {
          console.error('Error getting hospital details:', error)
          setLoading(false)
        })
      } else {
        console.error('Places API error:', status)
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setHospitals([])
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          setLocationError('API quota exceeded. Please try again later.')
        }
        setLoading(false)
      }
    })
  }

  const getDirections = (hospital: HospitalData) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${hospital.geometry.location.lat},${hospital.geometry.location.lng}&destination_place_id=${hospital.place_id}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  const handleMapLoad = (mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance
    setMap(mapInstance)
    
    // Search for hospitals once map is loaded and we have location
    if (userLocation) {
      searchNearbyHospitals()
    }
  }

  // Search when location is set
  useEffect(() => {
    if (userLocation && mapRef.current) {
      searchNearbyHospitals()
    }
  }, [userLocation])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Hospital className="w-8 h-8 text-red-400" />
              Nearby Hospitals
            </h1>
            <p className="text-gray-400">Find hospitals and medical facilities near you</p>
          </div>

          {locationError && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 text-sm">{locationError}</p>
            </div>
          )}

          {/* Search Radius Selector */}
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm text-gray-400">Search radius:</label>
            <select 
              value={searchRadius}
              onChange={(e) => {
                setSearchRadius(Number(e.target.value))
                setTimeout(() => searchNearbyHospitals(), 100)
              }}
              className="px-3 py-1.5 bg-slate-800 border border-white/20 rounded-lg text-white text-sm"
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
            <button
              onClick={searchNearbyHospitals}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>

          {/* Map View */}
          <div className="mb-6">
            {userLocation && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={userLocation}
                zoom={13}
                onLoad={handleMapLoad}
                options={{
                  styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    {
                      featureType: "poi",
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#d59563" }],
                    },
                    {
                      featureType: "road",
                      elementType: "geometry",
                      stylers: [{ color: "#38414e" }],
                    },
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#17263c" }],
                    },
                  ],
                }}
              >
                {/* User Location Marker */}
                <Marker
                  position={userLocation}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                  title="Your Location"
                />
                
                {/* Hospital Markers */}
                {hospitals.map(hospital => (
                  <Marker
                    key={hospital.place_id}
                    position={{
                      lat: hospital.geometry.location.lat,
                      lng: hospital.geometry.location.lng
                    }}
                    onClick={() => setSelectedHospital(hospital)}
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }}
                    title={hospital.name}
                  />
                ))}

                {selectedHospital && (
                  <InfoWindow
                    position={{
                      lat: selectedHospital.geometry.location.lat,
                      lng: selectedHospital.geometry.location.lng
                    }}
                    onCloseClick={() => setSelectedHospital(null)}
                  >
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-gray-900 mb-1">{selectedHospital.name}</h3>
                      <p className="text-sm text-gray-600">{selectedHospital.vicinity}</p>
                      {selectedHospital.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedHospital.rating}</span>
                        </div>
                      )}
                      {selectedHospital.distance && (
                        <p className="text-xs text-purple-600 mt-1">{selectedHospital.distance} away</p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-gray-400">Searching for hospitals...</span>
            </div>
          )}

          {/* No Results */}
          {!loading && hospitals.length === 0 && (
            <div className="text-center py-8">
              <Hospital className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No hospitals found in this area</p>
              <p className="text-sm text-gray-500 mt-1">Try increasing the search radius</p>
            </div>
          )}

          {/* Hospitals List */}
          {!loading && hospitals.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">
                Found {hospitals.length} hospitals nearby
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map(hospital => (
                  <div
                    key={hospital.place_id}
                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedHospital(hospital)
                      if (map) {
                        map.panTo({
                          lat: hospital.geometry.location.lat,
                          lng: hospital.geometry.location.lng
                        })
                        map.setZoom(15)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">{hospital.name}</h3>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {hospital.vicinity}
                        </p>
                      </div>
                      {hospital.distance && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          {hospital.distance}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {hospital.formatted_phone_number && (
                        <p className="text-gray-300 text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-400" />
                          {hospital.formatted_phone_number}
                        </p>
                      )}
                      {hospital.opening_hours && (
                        <p className="text-gray-300 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className={hospital.opening_hours.open_now ? 'text-green-400' : 'text-red-400'}>
                            {hospital.opening_hours.open_now ? 'Open Now' : 'Closed'}
                          </span>
                        </p>
                      )}
                      {hospital.rating && (
                        <p className="text-gray-300 text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          {hospital.rating} / 5.0
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {hospital.formatted_phone_number && (
                        <a
                          href={`tel:${hospital.formatted_phone_number}`}
                          className="flex-1 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          getDirections(hospital)
                        }}
                        className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                        Directions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}