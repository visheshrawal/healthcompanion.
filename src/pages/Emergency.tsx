import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Siren, 
  Phone, 
  MapPin, 
  AlertCircle,
  Heart,
  Ambulance,
  Hospital,
  User,
  Shield,
  Clock
} from 'lucide-react'

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

interface UserProfile {
  full_name: string
  age: number | null
  blood_group: string
  emergency_contacts: EmergencyContact[]
  diseases: string[]
  allergies: string[]
}

export function Emergency() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sosActive, setSosActive] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    loadProfile()
    getLocation()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const triggerSOS = () => {
    setSosActive(true)
    setCountdown(3)
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          sendEmergencyAlert()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelSOS = () => {
    setSosActive(false)
    setCountdown(0)
  }

  const sendEmergencyAlert = () => {
    // In a real app, this would send SMS/notifications to emergency contacts
    alert('🚨 EMERGENCY ALERT SENT!\n\nYour emergency contacts have been notified with your location.\nEmergency services are being contacted.')
    setSosActive(false)
  }

  const emergencyNumbers = [
    { name: 'Ambulance', number: '108', color: 'from-red-500 to-red-600', icon: Ambulance },
    { name: 'Police', number: '100', color: 'from-blue-500 to-blue-600', icon: Shield },
    { name: 'Fire', number: '101', color: 'from-orange-500 to-orange-600', icon: Siren },
    { name: 'Women Helpline', number: '1091', color: 'from-pink-500 to-pink-600', icon: Heart },
  ]

  const nearbyHospitals = [
    { name: 'City General Hospital', distance: '1.2 km', address: '123 Main St', phone: '+1 234 567 890' },
    { name: 'Emergency Care Center', distance: '2.5 km', address: '456 Oak Ave', phone: '+1 234 567 891' },
    { name: 'Medical College Hospital', distance: '3.8 km', address: '789 Pine Rd', phone: '+1 234 567 892' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Siren className="w-8 h-8 text-red-500" />
              Emergency Assistance
            </h1>
            <p className="text-gray-400">Quick access to emergency services and contacts</p>
          </div>

          {/* SOS Button */}
          <div className="mb-8">
            {!sosActive ? (
              <button
                onClick={triggerSOS}
                className="w-full py-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl border-2 border-red-500/50 shadow-2xl shadow-red-500/30 transition-all group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Siren className="w-12 h-12" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold mb-1">SOS EMERGENCY</p>
                    <p className="text-red-200">Press in case of emergency - Alerts contacts & emergency services</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="w-full py-8 bg-red-900/50 border-2 border-red-500 rounded-2xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white mb-2">
                      Sending Alert in {countdown}...
                    </p>
                    <button
                      onClick={cancelSOS}
                      className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Medical Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Personal Medical Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Medical Information</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Name</p>
                    <p className="text-white font-medium">{profile?.full_name || 'Not set'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Age</p>
                      <p className="text-white font-medium">{profile?.age || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Blood Group</p>
                      <p className="text-white font-medium">{profile?.blood_group || 'Not set'}</p>
                    </div>
                  </div>

                  {profile?.diseases && profile.diseases.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 mb-2">Medical Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.diseases.map((disease, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/20 rounded text-xs text-red-300">
                            {disease}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile?.allergies && profile.allergies.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-400 mb-2">Allergies</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.allergies.map((allergy, i) => (
                          <span key={i} className="px-2 py-1 bg-yellow-500/20 rounded text-xs text-yellow-300">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Status */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-semibold text-white">Location Status</h2>
                </div>
                
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  {location ? (
                    <>
                      <p className="text-cyan-400 text-sm mb-2">✓ Location Available</p>
                      <p className="text-gray-300 text-xs">
                        Lat: {location.lat.toFixed(4)}<br />
                        Lng: {location.lng.toFixed(4)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 text-sm mb-2">⚠ Location Unavailable</p>
                      <p className="text-gray-400 text-xs">Enable location services for emergency tracking</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Emergency Contacts */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
                </div>
                
                {profile?.emergency_contacts && profile.emergency_contacts.length > 0 ? (
                  <div className="space-y-3">
                    {profile.emergency_contacts.map((contact, index) => (
                      <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-white font-medium mb-1">{contact.name}</p>
                        <p className="text-sm text-gray-400 mb-2">{contact.relationship}</p>
                        <a
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-600/30 transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          Call {contact.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No emergency contacts added.<br />
                    Add contacts in your profile.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Emergency Numbers & Hospitals */}
            <div className="lg:col-span-1 space-y-6">
              {/* Emergency Numbers */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Emergency Numbers</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {emergencyNumbers.map((service, index) => {
                    const Icon = service.icon
                    return (
                      <a
                        key={index}
                        href={`tel:${service.number}`}
                        className={`p-4 bg-gradient-to-br ${service.color} rounded-lg hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white mb-2" />
                        <p className="text-white font-medium text-sm">{service.name}</p>
                        <p className="text-white/80 text-lg font-bold">{service.number}</p>
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Nearby Hospitals */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Hospital className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Nearby Hospitals</h2>
                </div>
                
                <div className="space-y-3">
                  {nearbyHospitals.map((hospital, index) => (
                    <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium text-sm">{hospital.name}</p>
                          <p className="text-gray-400 text-xs mt-1">{hospital.address}</p>
                        </div>
                        <span className="text-xs text-cyan-400">{hospital.distance}</span>
                      </div>
                      <a
                        href={`tel:${hospital.phone}`}
                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {hospital.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}