import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getAIResponse } from '../lib/groq'
import {
  Calendar,
  Clock,
  Video,
  Star,
  Loader,
  Sparkles,
  X,
  CheckCircle,
  Award,
  BookOpen,
  Globe,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'

interface TimeSlot {
  date: string
  time: string
  available: boolean
}

interface Doctor {
  id: string
  full_name: string
  specialization: string
  experience_years: number
  consultation_fee: number
  about: string
  languages: string[]
  is_available: boolean
  average_rating: number
  avatar_url?: string | null
  available_slots?: TimeSlot[]
  education?: string
  hospital?: string
  total_reviews?: number
  phone?: string
}

interface Appointment {
  id: number
  doctor_id: string
  doctor?: Doctor
  appointment_date: string
  appointment_time: string
  status: string
  priority: string
  patient_issue: string
}

// Generate time slots for the next 7 days
const generateTimeSlots = () => {
  const slots = []
  const today = new Date()
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Morning slots
    slots.push({ date: dateStr, time: '09:00 AM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '10:00 AM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '11:00 AM', available: Math.random() > 0.3 })
    
    // Afternoon slots
    slots.push({ date: dateStr, time: '02:00 PM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '03:00 PM', available: Math.random() > 0.3 })
    slots.push({ date: dateStr, time: '04:00 PM', available: Math.random() > 0.3 })
  }
  
  return slots
}

// Generate mock doctors
const generateMockDoctors = (): Doctor[] => {
  return [
    {
      id: 'mock-1',
      full_name: 'Sarah Johnson',
      specialization: 'Cardiology',
      experience_years: 15,
      consultation_fee: 150,
      about: 'Board-certified cardiologist with expertise in preventive cardiology and heart disease management. Trained at Johns Hopkins and has published over 30 peer-reviewed papers on cardiac risk reduction.',
      languages: ['English', 'Spanish'],
      is_available: true,
      average_rating: 4.8,
      total_reviews: 312,
      avatar_url: null,
      education: 'MD – Johns Hopkins University, Fellowship in Cardiology – Mayo Clinic',
      hospital: 'Apollo Hospitals, New Delhi',
      phone: '+91 11 2345 6789',
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-2',
      full_name: 'Michael Chen',
      specialization: 'Pediatrics',
      experience_years: 12,
      consultation_fee: 120,
      about: 'Pediatrician specializing in childhood development, immunization, and preventive care for newborns through adolescents. Advocates for child mental health alongside physical wellbeing.',
      languages: ['English', 'Mandarin'],
      is_available: true,
      average_rating: 4.9,
      total_reviews: 478,
      avatar_url: null,
      education: 'MD – Stanford University, Pediatric Residency – Children\'s Hospital Boston',
      hospital: 'Fortis Hospital, Mumbai',
      phone: '+91 22 8765 4321',
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-3',
      full_name: 'Emily Rodriguez',
      specialization: 'Dermatology',
      experience_years: 10,
      consultation_fee: 130,
      about: 'Dermatologist specializing in medical, surgical, and cosmetic dermatology. Expert in skin cancer detection, acne management, and advanced laser treatments.',
      languages: ['English', 'Portuguese'],
      is_available: true,
      average_rating: 4.7,
      total_reviews: 256,
      avatar_url: null,
      education: 'MD – University of São Paulo, Dermatology Residency – UCSF',
      hospital: 'Manipal Hospital, Bangalore',
      phone: '+91 80 3456 7890',
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-4',
      full_name: 'David Kim',
      specialization: 'Neurology',
      experience_years: 18,
      consultation_fee: 200,
      about: 'Neurologist with expertise in headache medicine, epilepsy, and Parkinson\'s disease. Pioneer in applying AI-assisted diagnostics for neurological disorders.',
      languages: ['English', 'Korean'],
      is_available: true,
      average_rating: 4.9,
      total_reviews: 541,
      avatar_url: null,
      education: 'MD – Seoul National University, Neurology Fellowship – Cleveland Clinic',
      hospital: 'AIIMS, New Delhi',
      phone: '+91 11 9876 5432',
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-5',
      full_name: 'Priya Sharma',
      specialization: 'Internal Medicine',
      experience_years: 8,
      consultation_fee: 100,
      about: 'Internal medicine physician committed to holistic adult healthcare, chronic disease management, and preventive wellness. Special interest in diabetes and metabolic disorders.',
      languages: ['English', 'Hindi'],
      is_available: true,
      average_rating: 4.6,
      total_reviews: 189,
      avatar_url: null,
      education: 'MD – AIIMS New Delhi, Internal Medicine Residency – PGI Chandigarh',
      hospital: 'Max Healthcare, Gurgaon',
      phone: '+91 124 5555 678',
      available_slots: generateTimeSlots()
    },
    {
      id: 'mock-6',
      full_name: 'James Wilson',
      specialization: 'Orthopedics',
      experience_years: 20,
      consultation_fee: 180,
      about: 'Orthopedic surgeon with two decades of experience in minimally invasive joint replacement and sports medicine. Has treated several national-level athletes.',
      languages: ['English'],
      is_available: true,
      average_rating: 4.8,
      total_reviews: 402,
      avatar_url: null,
      education: 'MD – University of Edinburgh, Orthopedic Residency – Hospital for Special Surgery (HSS)',
      hospital: 'Kokilaben Hospital, Mumbai',
      phone: '+91 22 6767 8899',
      available_slots: generateTimeSlots()
    }
  ]
}

export function Appointments() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'book'>('book')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    appointment_date: '',
    appointment_time: '',
    patient_issue: '',
    symptoms: [] as string[]
  })
  const [refiningIssue, setRefiningIssue] = useState(false)
  const [aiRefinedIssue, setAiRefinedIssue] = useState('')

  useEffect(() => {
    if (user) {
      loadDoctors()
      loadAppointments()
    }
  }, [user])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          specialization,
          experience_years,
          consultation_fee,
          about,
          languages,
          is_available,
          average_rating,
          user_profiles!inner(full_name, avatar_url)
        `)

      let formattedDoctors: Doctor[] = []
      
      if (!error && data && data.length > 0) {
        // Format real doctors from Supabase
        formattedDoctors = data.map((d: any) => ({
          id: d.id,
          full_name: d.user_profiles?.full_name || 'Dr.',
          specialization: d.specialization,
          experience_years: d.experience_years,
          consultation_fee: d.consultation_fee || 0,
          about: d.about,
          languages: d.languages || [],
          is_available: d.is_available,
          average_rating: d.average_rating || 0,
          avatar_url: d.user_profiles?.avatar_url,
          available_slots: generateTimeSlots()
        }))
      }
      
      // Add mock doctors (always include them for demo)
      const mockDoctors = generateMockDoctors()
      
      // Combine real and mock doctors
      setDoctors([...formattedDoctors, ...mockDoctors])
    } catch (error) {
      console.error('Error loading doctors:', error)
      // Fallback to mock doctors only
      setDoctors(generateMockDoctors())
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_profiles(
            specialization,
            user_profiles(full_name)
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const refineIssueWithAI = async () => {
    if (!bookingData.patient_issue) return
    
    setRefiningIssue(true)
    try {
      const prompt = `Convert this patient's description into professional medical terminology for a doctor:
      "${bookingData.patient_issue}"
      
      Return only the refined medical description, no extra text.`
      
      const refined = await getAIResponse(prompt, 'You are a medical terminology expert. Be concise and professional.')
      setAiRefinedIssue(refined)
    } catch (error) {
      console.error('Error refining issue:', error)
    } finally {
      setRefiningIssue(false)
    }
  }

  const calculatePriority = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_appointment_priority', {
          p_issue: bookingData.patient_issue,
          p_symptoms: bookingData.symptoms
        })
      
      if (error) throw error
      return data || 'normal'
    } catch (error) {
      return 'normal'
    }
  }

  const bookAppointment = async () => {
    if (!selectedDoctor || !user) return

    try {
      const priority = await calculatePriority()
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor.id,
          appointment_date: bookingData.appointment_date,
          appointment_time: bookingData.appointment_time,
          patient_issue: bookingData.patient_issue,
          ai_refined_issue: aiRefinedIssue || null,
          symptoms: bookingData.symptoms,
          priority: priority
        })

      if (error) throw error

      setShowBookingModal(false)
      setSelectedDoctor(null)
      setBookingData({ appointment_date: '', appointment_time: '', patient_issue: '', symptoms: [] })
      setAiRefinedIssue('')
      
      loadAppointments()
      alert('Appointment booked successfully! Waiting for doctor confirmation.')
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment')
    }
  }

  if (loading) {
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
              <Calendar className="w-8 h-8 text-purple-400" />
              Appointments
            </h1>
            <p className="text-gray-400">Book and manage your appointments with doctors</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'book'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upcoming ({appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 font-medium transition-all ${
                activeTab === 'past'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Past Appointments
            </button>
          </div>

          {/* Book Appointment Tab */}
          {activeTab === 'book' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doctor => (
                <div key={doctor.id} className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col">
                  {/* Doctor Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        {doctor.avatar_url ? (
                          <img src={doctor.avatar_url} alt={doctor.full_name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {doctor.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      {doctor.is_available && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a2035]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-white font-semibold truncate">Dr. {doctor.full_name}</h3>
                        <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      </div>
                      <p className="text-purple-400 text-sm font-medium">{doctor.specialization}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-semibold">{doctor.average_rating.toFixed(1)}</span>
                        {doctor.total_reviews && (
                          <span className="text-gray-500 text-xs">({doctor.total_reviews} reviews)</span>
                        )}
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{doctor.experience_years}yr exp</span>
                      </div>
                    </div>
                  </div>

                  {/* Hospital */}
                  {doctor.hospital && (
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="truncate">{doctor.hospital}</span>
                    </div>
                  )}

                  {/* About */}
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{doctor.about}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {doctor.languages.map(lang => (
                      <span key={lang} className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                        <Globe className="w-2.5 h-2.5" />{lang}
                      </span>
                    ))}
                  </div>

                  {/* Fee */}
                  <div className="flex items-center justify-between mb-4 py-3 px-3 bg-white/5 rounded-xl">
                    <span className="text-gray-400 text-sm">Consultation Fee</span>
                    <span className="text-green-400 font-bold text-lg">₹{doctor.consultation_fee}</span>
                  </div>

                  {/* Slots */}
                  {doctor.available_slots && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Next available:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doctor.available_slots.filter(s => s.available).slice(0, 2).map((slot, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
                            {slot.date.split('-').slice(1).join('/')} · {slot.time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => setProfileDoctor(doctor)}
                      className="flex-1 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button
                      onClick={() => { setSelectedDoctor(doctor); setShowBookingModal(true) }}
                      disabled={!doctor.is_available}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                        doctor.is_available
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {doctor.is_available ? 'Book Now' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Doctor Profile Modal */}
          {profileDoctor && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setProfileDoctor(null)}>
              <div className="bg-[#0d1525] border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-bold">
                        {profileDoctor.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-white">Dr. {profileDoctor.full_name}</h2>
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      </div>
                      <p className="text-purple-400 font-medium">{profileDoctor.specialization}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${ i <= Math.round(profileDoctor.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                        <span className="text-white text-sm font-semibold">{profileDoctor.average_rating.toFixed(1)}</span>
                        {profileDoctor.total_reviews && <span className="text-gray-400 text-sm">({profileDoctor.total_reviews} reviews)</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setProfileDoctor(null)} className="text-gray-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{profileDoctor.experience_years}+</p>
                    <p className="text-xs text-gray-400">Years Experience</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">₹{profileDoctor.consultation_fee}</p>
                    <p className="text-xs text-gray-400">Consultation</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{profileDoctor.total_reviews || '100+'}  </p>
                    <p className="text-xs text-gray-400">Patient Reviews</p>
                  </div>
                </div>

                {/* About */}
                <div className="mb-5">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-purple-400" /> About</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{profileDoctor.about}</p>
                </div>

                {/* Education */}
                {profileDoctor.education && (
                  <div className="mb-5">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" /> Education</h3>
                    <p className="text-gray-400 text-sm">{profileDoctor.education}</p>
                  </div>
                )}

                {/* Hospital */}
                {profileDoctor.hospital && (
                  <div className="mb-5">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Hospital / Clinic</h3>
                    <p className="text-gray-400 text-sm">{profileDoctor.hospital}</p>
                  </div>
                )}

                {/* Languages */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-green-400" /> Languages Spoken</h3>
                  <div className="flex gap-2">
                    {profileDoctor.languages.map(lang => (
                      <span key={lang} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs">{lang}</span>
                    ))}
                  </div>
                </div>

                {/* Contact + Book */}
                <div className="flex gap-3">
                  {profileDoctor.phone && (
                    <a href={`tel:${profileDoctor.phone}`}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" /> Call Clinic
                    </a>
                  )}
                  <button
                    onClick={() => { setSelectedDoctor(profileDoctor); setShowBookingModal(true); setProfileDoctor(null) }}
                    disabled={!profileDoctor.is_available}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No upcoming appointments</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Book an appointment
                  </button>
                </div>
              ) : (
                appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').map(apt => (
                  <div key={apt.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-10 h-10 text-purple-400" />
                        <div>
                          <h3 className="text-white font-semibold">
                            Dr. {(apt.doctor as any)?.user_profiles?.full_name} - {apt.doctor?.specialization}
                          </h3>
                          <p className="text-gray-400">
                            {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              apt.status === 'confirmed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {apt.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              apt.priority === 'emergency' ? 'bg-red-500/20 text-red-400' :
                              apt.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {apt.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                      {apt.status === 'confirmed' && (
                        <button className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Join Call
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Past Appointments */}
          {activeTab === 'past' && (
            <div className="space-y-4">
              {appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length === 0 ? (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No past appointments</p>
                </div>
              ) : (
                appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').map(apt => (
                  <div key={apt.id} className="bg-white/5 border border-white/10 rounded-xl p-6 opacity-60">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-10 h-10 text-gray-400" />
                      <div>
                        <h3 className="text-white font-semibold">
                          Dr. {(apt.doctor as any)?.user_profiles?.full_name} - {apt.doctor?.specialization}
                        </h3>
                        <p className="text-gray-400">
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                          apt.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/50 border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Book Appointment with Dr. {selectedDoctor.full_name}
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Select Date & Time</label>
                <select
                  value={`${bookingData.appointment_date}|${bookingData.appointment_time}`}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('|')
                    setBookingData({
                      ...bookingData,
                      appointment_date: date,
                      appointment_time: time
                    })
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select a time slot</option>
                  {selectedDoctor?.available_slots
                    ?.filter(slot => slot.available)
                    .map((slot, idx) => (
                      <option key={idx} value={`${slot.date}|${slot.time}`}>
                        {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {slot.time}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Describe Your Issue</label>
                <textarea
                  value={bookingData.patient_issue}
                  onChange={(e) => setBookingData({...bookingData, patient_issue: e.target.value})}
                  className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                  placeholder="Please describe your symptoms or reason for consultation..."
                />
                
                <button
                  onClick={refineIssueWithAI}
                  disabled={!bookingData.patient_issue || refiningIssue}
                  className="mt-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-600/30 transition-all"
                >
                  {refiningIssue ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Refine with AI (Medical Terms)
                </button>

                {aiRefinedIssue && (
                  <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-400 text-xs mb-1">AI Refined Version:</p>
                    <p className="text-gray-300 text-sm">{aiRefinedIssue}</p>
                  </div>
                )}
              </div>

              <button
                onClick={bookAppointment}
                disabled={!bookingData.appointment_date || !bookingData.appointment_time || !bookingData.patient_issue}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}