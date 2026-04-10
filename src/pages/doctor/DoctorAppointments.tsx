import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { Calendar, Clock, Search, User, Phone, AlertCircle, ArrowUp, ArrowDown, Minus, CheckCircle, XCircle, Video, MessageSquare, Edit2, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export interface DemoAppointment {
  id: string | number
  patient_name: string
  patient_age?: number
  patient_phone?: string
  appointment_date: string
  appointment_time: string
  status: string
  priority: 'emergency' | 'high' | 'normal' | 'low'
  patient_issue: string
  ai_refined_issue?: string
  isDemo?: boolean
}

export const DEMO_APPOINTMENTS: DemoAppointment[] = [
  {
    id: 'demo-1',
    patient_name: 'Rajesh Kumar',
    patient_age: 58,
    patient_phone: '+91 98765 43210',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00 AM',
    status: 'confirmed',
    priority: 'emergency',
    patient_issue: 'Severe chest pain radiating to left arm since 2 hours',
    ai_refined_issue: 'Acute onset chest pain with left arm radiation — suspect acute myocardial infarction. Immediate ECG and troponin levels recommended.',
    isDemo: true
  },
  {
    id: 'demo-2',
    patient_name: 'Anita Sharma',
    patient_age: 42,
    patient_phone: '+91 87654 32109',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:30 AM',
    status: 'confirmed',
    priority: 'high',
    patient_issue: 'Persistent high fever (104°F) with severe headache for 3 days',
    ai_refined_issue: 'Pyrexia of 104°F with cephalgia lasting 72 hours. Differential: bacterial meningitis, dengue, or typhoid. CBC and lumbar puncture may be warranted.',
    isDemo: true
  },
  {
    id: 'demo-3',
    patient_name: 'Mohammed Farhan',
    patient_age: 35,
    patient_phone: '+91 76543 21098',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '11:15 AM',
    status: 'pending',
    priority: 'high',
    patient_issue: 'Sudden vision loss in left eye since yesterday',
    ai_refined_issue: 'Acute monocular visual loss — rule out retinal detachment or central retinal artery occlusion. Urgent ophthalmological evaluation required.',
    isDemo: true
  },
  {
    id: 'demo-4',
    patient_name: 'Priya Nair',
    patient_age: 28,
    patient_phone: '+91 65432 10987',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '02:00 PM',
    status: 'pending',
    priority: 'normal',
    patient_issue: 'Lower back pain for 2 weeks, worsens when sitting',
    ai_refined_issue: 'Chronic lumbar pain exacerbated by prolonged sitting — likely mechanical low back pain. Consider physiotherapy referral and NSAIDs.',
    isDemo: true
  },
  {
    id: 'demo-5',
    patient_name: 'Suresh Patel',
    patient_age: 65,
    patient_phone: '+91 54321 09876',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '03:00 PM',
    status: 'confirmed',
    priority: 'normal',
    patient_issue: 'Monthly diabetes follow-up and blood pressure check',
    ai_refined_issue: 'Routine management follow-up for Type 2 diabetes mellitus and hypertension. Review HbA1c, fasting glucose, and antihypertensive efficacy.',
    isDemo: true
  },
  {
    id: 'demo-6',
    patient_name: 'Kavitha Menon',
    patient_age: 32,
    patient_phone: '+91 43210 98765',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '04:00 PM',
    status: 'pending',
    priority: 'low',
    patient_issue: 'Mild seasonal allergies and skin rash on forearm',
    ai_refined_issue: 'Seasonal allergic rhinitis with contact dermatitis on forearm. Antihistamines and topical corticosteroids likely sufficient.',
    isDemo: true
  },
  {
    id: 'demo-7',
    patient_name: 'Arjun Reddy',
    patient_age: 22,
    patient_phone: '+91 32109 87654',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    status: 'confirmed',
    priority: 'low',
    patient_issue: 'Annual health check-up and vitamin D deficiency review',
    ai_refined_issue: 'Routine annual wellness examination with follow-up for previously documented hypovitaminosis D.',
    isDemo: true
  }
]

export const PRIORITY_ORDER: Record<string, number> = { emergency: 0, high: 1, normal: 2, low: 3 }

export const PRIORITY_CONFIG = {
  emergency: {
    label: 'Emergency',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    Icon: AlertCircle,
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    Icon: ArrowUp,
    dot: 'bg-orange-500',
  },
  normal: {
    label: 'Normal',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    Icon: Minus,
    dot: 'bg-blue-400',
  },
  low: {
    label: 'Low',
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    Icon: ArrowDown,
    dot: 'bg-green-500',
  }
}

export function DoctorAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<DemoAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | number | null>(null)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editForm, setEditForm] = useState({ priority: '', date: '', time: '' })
  // Tracks which card is mid-rejection animation
  const [rejectingId, setRejectingId] = useState<string | number | null>(null)
  // Tracks which card is mid-acceptance animation
  const [acceptingId, setAcceptingId] = useState<string | number | null>(null)
  // Suggest New Time modal
  const [suggestModal, setSuggestModal] = useState<{ open: boolean; apt: DemoAppointment | null }>({ open: false, apt: null })
  const [suggestForm, setSuggestForm] = useState({ date: '', time: '' })
  // Message Patient modal
  const [messageModal, setMessageModal] = useState<{ open: boolean; apt: DemoAppointment | null }>({ open: false, apt: null })
  const [messageText, setMessageText] = useState('')

  const convertTo24Hour = (timeStr: string) => {
    if (!timeStr) return ''
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return timeStr
    let [_, hours, minutes, modifier] = match
    if (hours === '12') hours = '00'
    if (modifier.toUpperCase() === 'PM') hours = String(parseInt(hours, 10) + 12)
    return `${hours.padStart(2, '0')}:${minutes}`
  }

  const convertTo12Hour = (timeStr: string) => {
    if (!timeStr) return ''
    const parts = timeStr.split(':')
    if (parts.length < 2) return timeStr
    let h = parseInt(parts[0], 10)
    const modifier = h >= 12 ? 'PM' : 'AM'
    if (h === 0) h = 12
    else if (h > 12) h -= 12
    return `${String(h).padStart(2, '0')}:${parts[1]} ${modifier}`
  }

  useEffect(() => {
    if (user) loadAppointments()
    else {
      const sorted = [...DEMO_APPOINTMENTS].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      setAppointments(sorted)
      setLoading(false)
    }
  }, [user])

  const loadAppointments = async () => {
    try {
      // Read patient_name directly from appointment row — no cross-user RLS issue
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user!.id)
        .order('appointment_date', { ascending: true })

      if (error) throw error

      const realApts: DemoAppointment[] = (data || []).map((apt: any) => ({
        id: apt.id,
        patient_name: apt.patient_name || 'Unknown Patient',
        patient_phone: apt.patient_phone || '',
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        priority: apt.priority || 'normal',
        patient_issue: apt.patient_issue,
        ai_refined_issue: apt.ai_refined_issue
      }))

      const combined = [...realApts, ...DEMO_APPOINTMENTS]
      combined.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      setAppointments(combined)
    } catch {
      const sorted = [...DEMO_APPOINTMENTS].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      setAppointments(sorted)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string | number, status: string) => {
    if (typeof id === 'string' && id.startsWith('demo-')) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      return
    }
    // Animate rejection: red sweep then remove card
    if (status === 'rejected') {
      setRejectingId(id)
      supabase.from('appointments').update({ status: 'rejected' }).eq('id', id).then(() => {})
      setTimeout(() => {
        setAppointments(prev => prev.filter(a => a.id !== id))
        setRejectingId(null)
      }, 900)
      return
    }
    // Animate acceptance: green sweep
    if (status === 'confirmed') {
      setAcceptingId(id)
      setTimeout(() => setAcceptingId(null), 900)
    }
    try {
      await supabase.from('appointments').update({ status }).eq('id', id)
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } catch (e) { console.error(e) }
  }

  const handleSendMessage = async () => {
    if (!messageModal.apt || !messageText.trim() || !user) return
    const apt = messageModal.apt
    // Skip demo appointments
    if (typeof apt.id === 'string' && apt.id.startsWith('demo-')) {
      alert('Demo patients cannot receive real messages.')
      return
    }
    try {
      await supabase.from('messages').insert({
        appointment_id: apt.id,
        sender_id: user!.id,
        sender_role: 'doctor',
        content: messageText.trim()
      })
      setMessageText('')
      setMessageModal({ open: false, apt: null })
    } catch (e) {
      console.error('Failed to send message:', e)
    }
  }

  const handleSuggestTime = async () => {
    if (!suggestModal.apt) return
    const apt = suggestModal.apt
    const time12hr = convertTo12Hour(suggestForm.time) || suggestForm.time
    if (typeof apt.id !== 'string' || !apt.id.startsWith('demo-')) {
      try {
        await supabase.from('appointments').update({
          appointment_date: suggestForm.date,
          appointment_time: time12hr,
          status: 'pending'
        }).eq('id', apt.id)
      } catch (e) { console.error(e) }
    }
    setAppointments(prev => prev.map(a =>
      a.id === apt.id
        ? { ...a, appointment_date: suggestForm.date, appointment_time: time12hr, status: 'pending' }
        : a
    ))
    setSuggestModal({ open: false, apt: null })
    setSuggestForm({ date: '', time: '' })
  }

  const handleSaveEdit = async (id: string | number) => {
    const time12hr = convertTo12Hour(editForm.time) || editForm.time
    if (typeof id === 'string' && id.startsWith('demo-')) {
      setAppointments(prev => {
        const next = prev.map(a => a.id === id ? { ...a, priority: editForm.priority as any, appointment_date: editForm.date, appointment_time: time12hr } : a)
        next.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        return next
      })
      setEditingId(null)
      return
    }
    try {
      await supabase.from('appointments').update({
        priority: editForm.priority,
        appointment_date: editForm.date,
        appointment_time: time12hr
      }).eq('id', id)
      setAppointments(prev => {
        const next = prev.map(a => a.id === id ? { ...a, priority: editForm.priority as any, appointment_date: editForm.date, appointment_time: time12hr } : a)
        next.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        return next
      })
      setEditingId(null)
    } catch (e) { console.error(e) }
  }

  // Exclude permanently rejected (real) appointments — they were already removed via animation
  // but also guard against stale state showing rejected on refresh
  const filtered = appointments.filter(apt => apt.status !== 'rejected').filter(apt => {
    const q = searchQuery.toLowerCase()
    const matchSearch = apt.patient_name.toLowerCase().includes(q) || apt.patient_issue.toLowerCase().includes(q)
    const matchPriority = priorityFilter === 'all' || apt.priority === priorityFilter
    const matchStatus = statusFilter === 'all' || apt.status === statusFilter
    return matchSearch && matchPriority && matchStatus
  })

  const counts = {
    emergency: appointments.filter(a => a.priority === 'emergency').length,
    high: appointments.filter(a => a.priority === 'high').length,
    normal: appointments.filter(a => a.priority === 'normal').length,
    low: appointments.filter(a => a.priority === 'low').length
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">

          {/* Inline keyframes for reject animation */}
          <style>{`
            @keyframes rejectSweep {
              0% { box-shadow: inset 0 0 0 0 rgba(239,68,68,0); background: transparent; }
              30% { box-shadow: inset 200px 0 0 0 rgba(239,68,68,0.25); }
              70% { box-shadow: inset 2000px 0 0 0 rgba(239,68,68,0.4); opacity: 1; transform: translateX(0); }
              100% { opacity: 0; transform: translateX(60px); }
            }
            .rejecting-card {
              animation: rejectSweep 0.85s ease-in-out forwards;
              pointer-events: none;
            }
            @keyframes acceptSweep {
              0% { box-shadow: inset 0 0 0 0 rgba(34,197,94,0); }
              40% { box-shadow: inset 300px 0 0 0 rgba(34,197,94,0.2); }
              100% { box-shadow: inset 3000px 0 0 0 rgba(34,197,94,0); }
            }
            .accepting-card {
              animation: acceptSweep 0.85s ease-out forwards;
            }
          `}</style>

          {/* Message Patient Modal */}
          {messageModal.open && messageModal.apt && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#1a2035] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-1">Message Patient</h3>
                <p className="text-gray-400 text-sm mb-5">Send a message to <span className="text-purple-300 font-medium">{messageModal.apt.patient_name}</span></p>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full bg-[#0d1525] border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none resize-none text-sm"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setMessageModal({ open: false, apt: null }); setMessageText('') }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">Cancel</button>
                  <button onClick={handleSendMessage} disabled={!messageText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium hover:from-purple-700 hover:to-cyan-700 transition-all text-sm disabled:opacity-40">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          )}
          {suggestModal.open && suggestModal.apt && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#1a2035] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-1">Suggest New Time</h3>
                <p className="text-gray-400 text-sm mb-5">Propose a new appointment slot for <span className="text-purple-300 font-medium">{suggestModal.apt.patient_name}</span></p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">New Date</label>
                    <input type="date" value={suggestForm.date} onChange={e => setSuggestForm({...suggestForm, date: e.target.value})}
                      className="w-full bg-[#0d1525] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">New Time</label>
                    <input type="time" value={suggestForm.time} onChange={e => setSuggestForm({...suggestForm, time: e.target.value})}
                      className="w-full bg-[#0d1525] border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none [color-scheme:dark]" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setSuggestModal({ open: false, apt: null })}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">Cancel</button>
                  <button onClick={handleSuggestTime} disabled={!suggestForm.date || !suggestForm.time}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium hover:from-purple-700 hover:to-cyan-700 transition-all text-sm disabled:opacity-40">
                    Send Suggestion
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Patient Appointments</h1>
            <p className="text-gray-400">Sorted by priority — critical cases at the top</p>
          </div>

          {/* Priority Summary */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {(Object.keys(PRIORITY_CONFIG) as Array<keyof typeof PRIORITY_CONFIG>).map(p => {
              const cfg = PRIORITY_CONFIG[p]
              const { Icon } = cfg
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(priorityFilter === p ? 'all' : p)}
                  className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 text-left ${
                    priorityFilter === p
                      ? `${cfg.bg} ${cfg.border} shadow-lg`
                      : 'bg-[#1a2035]/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} ${p === 'emergency' ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${priorityFilter === p ? cfg.text : 'text-gray-400'}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{counts[p]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">patients</p>
                </button>
              )
            })}
          </div>

          {/* Search + Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patients or conditions..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2035]/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1a2035]/60 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-[#1a2035]/30 border border-white/10 rounded-2xl">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No appointments match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(apt => {
                const priorityKey = apt.priority as keyof typeof PRIORITY_CONFIG
                const cfg = PRIORITY_CONFIG[priorityKey]
                const { Icon } = cfg
                const isExpanded = expandedId === apt.id

                return (
                  <div
                    key={apt.id}
                    className={`rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden ${
                      rejectingId === apt.id ? 'rejecting-card' :
                      acceptingId === apt.id ? 'accepting-card' :
                      apt.priority === 'emergency'
                        ? 'bg-red-950/20 border-red-500/30'
                        : 'bg-[#1a2035]/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : apt.id)}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${cfg.text} ${apt.priority === 'emergency' ? 'animate-pulse' : ''}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-semibold">{apt.patient_name}</h3>
                            {apt.patient_age && <span className="text-gray-500 text-sm">Age {apt.patient_age}</span>}
                            {apt.isDemo && (
                              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-xs">Demo</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm truncate">{apt.patient_issue}</p>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden md:block">
                            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {apt.appointment_time}
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                            {cfg.label}
                          </span>

                          <span className={`px-3 py-1 rounded-full text-xs ${
                            apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            apt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-white/5 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Patient Details</p>
                            <div className="space-y-2">
                              {apt.patient_phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  {apt.patient_phone}
                                </div>
                              )}
                              <div className="flex items-start gap-2 text-sm text-gray-300">
                                <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <span>{apt.patient_issue}</span>
                              </div>
                            </div>
                          </div>
                          {apt.ai_refined_issue && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                              <p className="text-xs text-purple-400 font-semibold mb-1.5">🤖 AI Clinical Analysis</p>
                              <p className="text-sm text-gray-300 leading-relaxed">{apt.ai_refined_issue}</p>
                            </div>
                          )}
                        </div>

                        {editingId === apt.id ? (
                          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2"><Edit2 className="w-4 h-4" /> Adjust Priority & Timing</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                                <select 
                                  value={editForm.priority}
                                  onChange={e => setEditForm({...editForm, priority: e.target.value})}
                                  className="w-full bg-[#1a2035] border border-white/20 rounded-lg p-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                >
                                  <option value="emergency">Emergency</option>
                                  <option value="high">High</option>
                                  <option value="normal">Normal</option>
                                  <option value="low">Low</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input type="date" 
                                  value={editForm.date}
                                  onChange={e => setEditForm({...editForm, date: e.target.value})}
                                  className="w-full bg-[#1a2035] border border-white/20 rounded-lg p-2 text-sm text-white focus:border-purple-500 focus:outline-none [color-scheme:dark]" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Time</label>
                                <input type="time" 
                                  value={editForm.time}
                                  onChange={e => setEditForm({...editForm, time: e.target.value})}
                                  className="w-full bg-[#1a2035] border border-white/20 rounded-lg p-2 text-sm text-white focus:border-purple-500 focus:outline-none [color-scheme:dark]" 
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">Cancel</button>
                              <button onClick={() => handleSaveEdit(apt.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/20">
                                <Check className="w-3.5 h-3.5" /> Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between mt-4">
                            <div className="flex flex-wrap gap-2">
                              {apt.status === 'pending' && !apt.isDemo && (
                                <>
                                  <button onClick={() => updateStatus(apt.id, 'confirmed')}
                                    className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-600/40 transition-all flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Accept
                                  </button>
                                  <button onClick={() => updateStatus(apt.id, 'rejected')}
                                    className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-600/40 transition-all flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> Reject
                                  </button>
                                  <button
                                    onClick={() => { setSuggestModal({ open: true, apt }); setSuggestForm({ date: apt.appointment_date, time: convertTo24Hour(apt.appointment_time) }) }}
                                    className="px-4 py-2 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm hover:bg-amber-600/40 transition-all flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Suggest Time
                                  </button>
                                </>
                              )}
                              {apt.status === 'pending' && apt.isDemo && (
                                <button onClick={() => updateStatus(apt.id, 'confirmed')}
                                  className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-sm hover:bg-green-600/40 transition-all flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> Accept (Demo)
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <>
                                  <button className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm flex items-center gap-2">
                                    <Video className="w-4 h-4" /> Start Video Call
                                  </button>
                                  <button
                                    onClick={() => setMessageModal({ open: true, apt })}
                                    className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm hover:bg-purple-600/40 transition-all flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Message Patient
                                  </button>
                                  {!apt.isDemo && (
                                    <button onClick={() => updateStatus(apt.id, 'completed')}
                                      className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg text-sm hover:bg-white/20 transition-all">
                                      Mark Complete
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <button onClick={() => {
                                setEditingId(apt.id);
                                setEditForm({
                                  priority: apt.priority,
                                  date: apt.appointment_date,
                                  time: convertTo24Hour(apt.appointment_time)
                                });
                              }}
                              className="px-3 py-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Adjust Details
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}