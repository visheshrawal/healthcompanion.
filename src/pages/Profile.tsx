import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ImageCropper } from '../components/ImageCropper'
import { 
  User, 
  Phone, 
  Mail, 
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Activity,
  Camera
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
  weight: number | null
  gender: string
  blood_group: string
  diseases: string[]
  allergies: string[]
  emergency_contacts: EmergencyContact[]
  avatar_url?: string | null
}

export function Profile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    age: null,
    weight: null,
    gender: '',
    blood_group: '',
    diseases: [],
    allergies: [],
    emergency_contacts: [],
    avatar_url: null
  })

  const [newDisease, setNewDisease] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          age: data.age || null,
          weight: data.weight || null,
          gender: data.gender || '',
          blood_group: data.blood_group || '',
          diseases: data.diseases || [],
          allergies: data.allergies || [],
          emergency_contacts: data.emergency_contacts || [],
          avatar_url: data.avatar_url || null
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
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
      
      const fileExt = 'jpg'
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`
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

      const publicUrl = data.publicUrl

      setProfile({ ...profile, avatar_url: publicUrl })
      
      await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id)

      setMessage({ type: 'success', text: 'Profile photo updated!' })
      setTimeout(() => setMessage(null), 3000)

      // Force sidebar to refresh avatar
      window.dispatchEvent(new Event('avatar-updated'))

    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Error uploading photo!' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          age: profile.age,
          weight: profile.weight,
          gender: profile.gender,
          blood_group: profile.blood_group,
          diseases: profile.diseases,
          allergies: profile.allergies,
          emergency_contacts: profile.emergency_contacts,
          updated_at: new Date()
        })

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
      
      // Force sidebar to refresh name
      window.dispatchEvent(new Event('profile-updated'))
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const addDisease = () => {
    if (newDisease.trim() && !profile.diseases.includes(newDisease.trim())) {
      setProfile({
        ...profile,
        diseases: [...profile.diseases, newDisease.trim()]
      })
      setNewDisease('')
    }
  }

  const removeDisease = (disease: string) => {
    setProfile({
      ...profile,
      diseases: profile.diseases.filter(d => d !== disease)
    })
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies.includes(newAllergy.trim())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, newAllergy.trim()]
      })
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter(a => a !== allergy)
    })
  }

  const addEmergencyContact = () => {
    if (newContact.name && newContact.relationship && newContact.phone) {
      setProfile({
        ...profile,
        emergency_contacts: [...profile.emergency_contacts, newContact]
      })
      setNewContact({ name: '', relationship: '', phone: '', email: '' })
      setShowContactForm(false)
    }
  }

  const removeEmergencyContact = (index: number) => {
    setProfile({
      ...profile,
      emergency_contacts: profile.emergency_contacts.filter((_, i) => i !== index)
    })
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

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
      
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
            <p className="text-gray-400">Manage your personal health information</p>
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
            {/* Basic Information */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
              </div>

              {/* Profile Photo Upload Section */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
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
                  <p className="text-white font-medium">Profile Photo</p>
                  <p className="text-sm text-gray-400">Click the camera icon to upload</p>
                  {uploading && <p className="text-xs text-purple-400 mt-1">Uploading...</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Age</label>
                  <input
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="30"
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
                    placeholder="70.5"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" className="bg-slate-800">Select gender</option>
                    <option value="male" className="bg-slate-800">Male</option>
                    <option value="female" className="bg-slate-800">Female</option>
                    <option value="other" className="bg-slate-800">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Blood Group</label>
                  <select
                    value={profile.blood_group}
                    onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="" className="bg-slate-800">Select blood group</option>
                    {bloodGroups.map(group => (
                      <option key={group} value={group} className="bg-slate-800">{group}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">Medical Conditions</h2>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDisease()}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                  <button
                    onClick={addDisease}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.diseases.map((disease, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2"
                    >
                      {disease}
                      <button onClick={() => removeDisease(disease)} className="hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Allergies</h2>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                  <button
                    onClick={addAllergy}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm flex items-center gap-2"
                    >
                      {allergy}
                      <button onClick={() => removeAllergy(allergy)} className="hover:text-yellow-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
                </div>
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              </div>

              {showContactForm && (
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Contact Name"
                    />
                    <input
                      type="text"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Relationship (e.g., Spouse)"
                    />
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Phone Number"
                    />
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="Email (Optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addEmergencyContact}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      Save Contact
                    </button>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {profile.emergency_contacts.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No emergency contacts added yet</p>
                ) : (
                  profile.emergency_contacts.map((contact, index) => (
                    <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-white font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-400">{contact.relationship}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-purple-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {contact.phone}
                            </span>
                            {contact.email && (
                              <span className="text-sm text-cyan-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {contact.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeEmergencyContact(index)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}