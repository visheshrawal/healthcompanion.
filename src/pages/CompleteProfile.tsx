import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ImageCropper } from '../components/ImageCropper'
import { 
  User, 
  Camera, 
  Save,
  AlertCircle,
  Activity,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Weight,
  Heart,
  Stethoscope,
  FileText,
  Clock,
  DollarSign,
  Languages,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react'

export function CompleteProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Patient fields
  const [profile, setProfile] = useState({
    full_name: '',
    age: null as number | null,
    weight: null as number | null,
    gender: '',
    blood_group: '',
    phone: '',
    address: '',
    emergency_contact: '',
    diseases: [] as string[],
    allergies: [] as string[],
    avatar_url: null as string | null
  })

  // Doctor fields
  const [doctorProfile, setDoctorProfile] = useState({
    license_number: '',
    license_document_url: null as string | null,
    specialization: '',
    experience_years: null as number | null,
    qualifications: [] as string[],
    consultation_fee: null as number | null,
    about: '',
    languages: [] as string[],
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false }
    }
  })

  const [newQualification, setNewQualification] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [newDisease, setNewDisease] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient')

  useEffect(() => {
    if (user) {
      loadUserRole()
    }
  }, [user])

  const loadUserRole = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setUserRole(data.role)
      setProfile(prev => ({ ...prev, full_name: data.full_name || '' }))
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setShowCropper(false)
    setSelectedImage(null)
    
    try {
      setUploading(true)
      
      const fileName = `${user!.id}-${Date.now()}.jpg`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setProfile({ ...profile, avatar_url: data.publicUrl })
      setMessage({ type: 'success', text: 'Profile photo uploaded!' })
      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Error uploading photo!' })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    
    setLoading(true)
    setMessage(null)
    
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          age: profile.age,
          weight: profile.weight,
          gender: profile.gender,
          blood_group: profile.blood_group,
          phone: profile.phone,
          address: profile.address,
          emergency_contact: profile.emergency_contact,
          diseases: profile.diseases,
          allergies: profile.allergies,
          avatar_url: profile.avatar_url,
          updated_at: new Date()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // If doctor, update doctor profile
      if (userRole === 'doctor') {
        const { error: doctorError } = await supabase
          .from('doctor_profiles')
          .update({
            specialization: doctorProfile.specialization,
            experience_years: doctorProfile.experience_years,
            qualifications: doctorProfile.qualifications,
            consultation_fee: doctorProfile.consultation_fee,
            about: doctorProfile.about,
            languages: doctorProfile.languages,
            is_verified: false, // Pending verification
            updated_at: new Date()
          })
          .eq('id', user.id)

        if (doctorError) throw doctorError
      }
      
      setMessage({ type: 'success', text: 'Profile completed successfully!' })
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-8">
      {showCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setSelectedImage(null)
          }}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your {userRole === 'doctor' ? 'Doctor' : 'Patient'} Profile
          </h1>
          <p className="text-gray-400">
            {userRole === 'doctor' 
              ? 'Help patients find you by completing your professional profile'
              : 'Tell us about yourself for better health insights'
            }
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}>
            <AlertCircle className="w-5 h-5" />
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Photo Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-white font-medium">Upload your photo</p>
                <p className="text-sm text-gray-400">This helps personalize your experience</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {userRole === 'patient' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Age</label>
                    <input
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.weight || ''}
                      onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || null })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Gender</label>
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Blood Group</label>
                    <select
                      value={profile.blood_group}
                      onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select blood group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Emergency Contact</label>
                    <input
                      type="tel"
                      value={profile.emergency_contact}
                      onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Name: Phone"
                    />
                  </div>
                </>
              )}

              {userRole === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Specialization</label>
                    <input
                      type="text"
                      value={doctorProfile.specialization}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, specialization: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={doctorProfile.experience_years || ''}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, experience_years: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={doctorProfile.consultation_fee || ''}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, consultation_fee: parseFloat(e.target.value) || null })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Additional Doctor Fields */}
          {userRole === 'doctor' && (
            <>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Professional Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">About Me</label>
                    <textarea
                      value={doctorProfile.about}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, about: e.target.value })}
                      className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                      placeholder="Tell patients about your experience and approach..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Qualifications</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g., MD, MBBS, PhD"
                      />
                      <button
                        onClick={() => {
                          if (newQualification.trim()) {
                            setDoctorProfile({
                              ...doctorProfile,
                              qualifications: [...doctorProfile.qualifications, newQualification.trim()]
                            })
                            setNewQualification('')
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doctorProfile.qualifications.map((qual, index) => (
                        <span key={index} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm flex items-center gap-2">
                          {qual}
                          <button onClick={() => {
                            setDoctorProfile({
                              ...doctorProfile,
                              qualifications: doctorProfile.qualifications.filter((_, i) => i !== index)
                            })
                          }}>
                            <Trash2 className="w-3 h-3 hover:text-red-400" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Languages Spoken</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        placeholder="e.g., English, Spanish"
                      />
                      <button
                        onClick={() => {
                          if (newLanguage.trim()) {
                            setDoctorProfile({
                              ...doctorProfile,
                              languages: [...doctorProfile.languages, newLanguage.trim()]
                            })
                            setNewLanguage('')
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doctorProfile.languages.map((lang, index) => (
                        <span key={index} className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm flex items-center gap-2">
                          {lang}
                          <button onClick={() => {
                            setDoctorProfile({
                              ...doctorProfile,
                              languages: doctorProfile.languages.filter((_, i) => i !== index)
                            })
                          }}>
                            <Trash2 className="w-3 h-3 hover:text-red-400" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Patient Medical Info */}
          {userRole === 'patient' && (
            <>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Medical History</h2>
                
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Medical Conditions</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Diabetes"
                    />
                    <button
                      onClick={() => {
                        if (newDisease.trim()) {
                          setProfile({
                            ...profile,
                            diseases: [...profile.diseases, newDisease.trim()]
                          })
                          setNewDisease('')
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.diseases.map((disease, index) => (
                      <span key={index} className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
                        {disease}
                        <button onClick={() => {
                          setProfile({
                            ...profile,
                            diseases: profile.diseases.filter((_, i) => i !== index)
                          })
                        }}>
                          <Trash2 className="w-3 h-3 hover:text-red-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Allergies</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g., Penicillin"
                    />
                    <button
                      onClick={() => {
                        if (newAllergy.trim()) {
                          setProfile({
                            ...profile,
                            allergies: [...profile.allergies, newAllergy.trim()]
                          })
                          setNewAllergy('')
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy, index) => (
                      <span key={index} className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm flex items-center gap-2">
                        {allergy}
                        <button onClick={() => {
                          setProfile({
                            ...profile,
                            allergies: profile.allergies.filter((_, i) => i !== index)
                          })
                        }}>
                          <Trash2 className="w-3 h-3 hover:text-red-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}