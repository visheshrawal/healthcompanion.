import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { User, Mail, Phone, MapPin, Award, Clock, DollarSign, Camera, CheckCircle, Save, Plus, Trash2, Edit2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ImageCropper } from '../../components/ImageCropper'

export function DoctorProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  // Edit states
  const [uploading, setUploading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    specialization: '',
    experience_years: 0,
    consultation_fee: 0,
    license_number: '',
    about: '',
    hospital: '',
    education: '',
    languages: [] as string[],
    avatar_url: null as string | null,
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: false },
      sunday: { start: '09:00', end: '13:00', available: false }
    }
  })

  const [newLanguage, setNewLanguage] = useState('')

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('doctor_profiles')
        .select('*, user_profiles!inner(*)')
        .eq('id', user!.id)
        .single()
      
      setProfile(data)
      if (data) {
        setEditForm({
          full_name: data.user_profiles?.full_name || '',
          phone: data.user_profiles?.phone || '',
          specialization: data.specialization || '',
          experience_years: data.experience_years || 0,
          consultation_fee: data.consultation_fee || 0,
          license_number: data.license_number || '',
          about: data.about || '',
          hospital: data.hospital || '',
          education: data.education || (data.qualifications && data.qualifications[0]) || '',
          languages: data.languages || [],
          avatar_url: data.user_profiles?.avatar_url || null,
          availability: data.availability || editForm.availability
        })
      }
    } catch (e) { console.error(e) } 
    finally { setLoading(false) }
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
      await supabase.storage.from('avatars').upload(fileName, croppedImageBlob, { contentType: 'image/jpeg', upsert: true })
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      setEditForm({ ...editForm, avatar_url: data.publicUrl })
      
      // Instantly update user_profiles
      await supabase.from('user_profiles').update({ avatar_url: data.publicUrl }).eq('id', user!.id)
      setProfile((prev: any) => ({ ...prev, user_profiles: { ...prev.user_profiles, avatar_url: data.publicUrl } }))
      
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: 'Failed to upload photo.' })
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage(null)
    try {
      // 1. Update user_profiles (Name, Phone)
      await supabase.from('user_profiles').update({
        full_name: editForm.full_name,
        phone: editForm.phone
      }).eq('id', user!.id)

      // 2. Base payload that we KNOW exists in the database schema
      let tryPayload: any = {
        specialization: editForm.specialization,
        experience_years: editForm.experience_years,
        consultation_fee: editForm.consultation_fee,
        license_number: editForm.license_number,
        about: editForm.about,
        languages: editForm.languages,
        // education maps to qualifications in DB, optionally wrap in array
        qualifications: editForm.education ? [editForm.education] : [] 
      }

      // 3. Experimental payload - fields we added to UI but might lack DB columns
      const experimentalObj = {
        hospital: editForm.hospital,
        availability: editForm.availability
      }

      // 4. Try updating with everything first
      let res = await supabase.from('doctor_profiles')
        .update({ ...tryPayload, ...experimentalObj })
        .eq('id', user!.id)

      // 5. If it fails due to schema, fall back to safe payload
      if (res.error && res.error.message?.includes('could not find the')) {
        console.warn("DB schema missing new columns. Falling back to safe fields.")
        
        res = await supabase.from('doctor_profiles')
          .update(tryPayload)
          .eq('id', user!.id)
      }

      if (res.error) throw res.error

      await loadProfile()
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Error saving profile: ' + e.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex">
      <DoctorSidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050510] flex">
      <DoctorSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {showCropper && selectedImage && (
            <ImageCropper image={selectedImage} onCropComplete={handleCropComplete} onCancel={() => { setShowCropper(false); setSelectedImage(null) }} />
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Doctor Profile</h1>
              <p className="text-gray-400">Manage your seamless integration with patients</p>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white transition-all flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsEditing(false); loadProfile(); }} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all flex items-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={saveProfile} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Avatar & Basic */}
            <div className="space-y-6">
              <div className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden border-4 border-white/10">
                    {editForm.avatar_url ? (
                      <img src={editForm.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-3 -right-3 p-3 bg-purple-600 rounded-xl cursor-pointer hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/30 border border-white/20">
                      {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                      <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3 mt-6 text-left">
                    <div>
                      <label className="text-xs text-gray-400">Full Name</label>
                      <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-2 text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Specialization</label>
                      <input type="text" value={editForm.specialization} onChange={e => setEditForm({...editForm, specialization: e.target.value})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-2 text-white mt-1" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1">Dr. {editForm.full_name || 'Name not set'}</h2>
                    <p className="text-purple-400 font-medium">{editForm.specialization || 'Specialization not set'}</p>
                  </>
                )}
              </div>

              <div className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-semibold mb-4">Contact Info</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400">Phone</label>
                      <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-2 text-white mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Hospital / Clinic Name</label>
                      <input type="text" value={editForm.hospital} onChange={e => setEditForm({...editForm, hospital: e.target.value})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-2 text-white mt-1" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-gray-300"><Phone className="w-5 h-5 text-gray-500" /> {editForm.phone || 'Not provided'}</div>
                    <div className="flex items-center gap-3 text-gray-300"><MapPin className="w-5 h-5 text-gray-500" /> {editForm.hospital || 'Not provided'}</div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Professional & Timings */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><Award className="w-5 h-5 text-purple-400" /> Professional Details</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Consultation Fee</p>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-lg">₹</span>
                        <input type="number" value={editForm.consultation_fee} onChange={e => setEditForm({...editForm, consultation_fee: Number(e.target.value)})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-1.5 text-white" />
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-green-400">₹{editForm.consultation_fee}</p>
                    )}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Experience (Years)</p>
                    {isEditing ? (
                      <input type="number" value={editForm.experience_years} onChange={e => setEditForm({...editForm, experience_years: Number(e.target.value)})} className="w-full bg-[#0d1525] border border-white/10 rounded-lg p-1.5 text-white" />
                    ) : (
                      <p className="text-xl font-bold text-white">{editForm.experience_years}+</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">About</label>
                    {isEditing ? (
                      <textarea value={editForm.about} onChange={e => setEditForm({...editForm, about: e.target.value})} className="w-full h-24 bg-[#0d1525] border border-white/10 rounded-xl p-3 text-white resize-none focus:border-purple-500" />
                    ) : (
                      <p className="text-sm text-gray-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{editForm.about || 'No bio provided.'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Education</label>
                    {isEditing ? (
                      <input type="text" value={editForm.education} onChange={e => setEditForm({...editForm, education: e.target.value})} className="w-full bg-[#0d1525] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500" placeholder="e.g. MD - Harvard, Residency - Mayo Clinic" />
                    ) : (
                      <p className="text-sm text-gray-400">{editForm.education || 'No education provided.'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Languages */}
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Languages Spoken</label>
                      {isEditing && (
                        <div className="flex gap-2 mb-3">
                          <input type="text" value={newLanguage} onChange={e => setNewLanguage(e.target.value)} className="flex-1 bg-[#0d1525] border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="Add language..." />
                          <button onClick={() => { if(newLanguage) { setEditForm({...editForm, languages: [...editForm.languages, newLanguage]}); setNewLanguage(''); } }} className="p-2 bg-purple-600 rounded-lg text-white"><Plus className="w-4 h-4" /></button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {editForm.languages.map((l, i) => (
                          <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs flex items-center gap-1">
                            {l} {isEditing && <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setEditForm({...editForm, languages: editForm.languages.filter((_, idx) => idx !== i)})} />}
                          </span>
                        ))}
                        {editForm.languages.length === 0 && !isEditing && <span className="text-sm text-gray-500">None added</span>}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Adjust Timings / Availability */}
              <div className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-5 flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" /> Clinic Timings & Availability</h3>
                
                <div className="space-y-3">
                  {Object.entries(editForm.availability).map(([day, timings]) => (
                    <div key={day} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${timings.available ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50'}`}>
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <input type="checkbox" disabled={!isEditing} checked={timings.available} onChange={e => setEditForm({
                          ...editForm, availability: { ...editForm.availability, [day]: { ...timings, available: e.target.checked } }
                        })} className="w-4 h-4 accent-purple-500 rounded focus:ring-purple-500" />
                        <span className="text-sm font-medium text-white capitalize">{day}</span>
                      </div>
                      
                      {timings.available ? (
                        <div className="flex items-center gap-2">
                          <input type="time" disabled={!isEditing} value={timings.start} onChange={e => setEditForm({
                            ...editForm, availability: { ...editForm.availability, [day]: { ...timings, start: e.target.value } }
                          })} className="bg-[#0d1525] border border-white/10 rounded-lg p-1.5 text-xs text-gray-300 focus:border-purple-500 [color-scheme:dark]" />
                          <span className="text-gray-500 text-xs">to</span>
                          <input type="time" disabled={!isEditing} value={timings.end} onChange={e => setEditForm({
                            ...editForm, availability: { ...editForm.availability, [day]: { ...timings, end: e.target.value } }
                          })} className="bg-[#0d1525] border border-white/10 rounded-lg p-1.5 text-xs text-gray-300 focus:border-purple-500 [color-scheme:dark]" />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic pr-12">Closed</span>
                      )}
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