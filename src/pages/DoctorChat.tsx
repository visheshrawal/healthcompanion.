import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MessageSquare, Send, Stethoscope, Clock } from 'lucide-react'

interface Message {
  id: string
  appointment_id: string
  sender_id: string
  sender_role: 'doctor' | 'patient'
  content: string
  created_at: string
}

interface Appointment {
  id: string
  doctor_name: string
  appointment_date: string
  status: string
}

export function DoctorChat() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (user) loadAppointments()
    return () => { channelRef.current?.unsubscribe() }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadAppointments = async () => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user!.id)
        .in('status', ['confirmed', 'completed'])
        .order('appointment_date', { ascending: false })

      if (!data?.length) return

      const docIds = [...new Set(data.map((a: any) => a.doctor_id).filter(Boolean))]
      const { data: docProfiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', docIds)

      const docMap = new Map()
      if (docProfiles) docProfiles.forEach((d: any) => docMap.set(d.id, d.full_name))

      const formatted: Appointment[] = data.map((a: any) => ({
        id: a.id,
        doctor_name: docMap.get(a.doctor_id) || user?.user_metadata?.full_name || 'Your Doctor',
        appointment_date: a.appointment_date,
        status: a.status
      }))

      setAppointments(formatted)
      selectApt(formatted[0])
    } catch (e) { console.error(e) }
  }

  const selectApt = (apt: Appointment) => {
    setSelectedApt(apt)
    loadMessages(apt.id)
    subscribeToMessages(apt.id)
  }

  const loadMessages = async (aptId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('appointment_id', aptId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const subscribeToMessages = (aptId: string) => {
    // Unsubscribe from previous channel
    channelRef.current?.unsubscribe()

    channelRef.current = supabase
      .channel(`messages:${aptId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `appointment_id=eq.${aptId}` },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates from optimistic update
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()
  }

  const sendMessage = async () => {
    if (!selectedApt || !newMessage.trim() || !user) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    try {
      await supabase.from('messages').insert({
        appointment_id: selectedApt.id,
        sender_id: user.id,
        sender_role: 'patient',
        content
      })
    } catch (e) {
      console.error(e)
      setNewMessage(content) // restore on error
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              Chat with Your Doctor
            </h1>
            <p className="text-gray-400">Secure real-time messaging with your confirmed doctors</p>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#1a2035]/40 border border-white/10 rounded-2xl">
              <Stethoscope className="w-14 h-14 text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg font-medium">No confirmed appointments yet</p>
              <p className="text-gray-500 text-sm mt-1">Book and get an appointment confirmed to start chatting</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 h-[70vh]">
              {/* Appointment list */}
              <div className="col-span-1 bg-[#1a2035]/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Doctors</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {appointments.map(apt => (
                    <button
                      key={apt.id}
                      onClick={() => selectApt(apt)}
                      className={`w-full p-4 text-left border-b border-white/5 transition-all hover:bg-white/5 ${
                        selectedApt?.id === apt.id ? 'bg-purple-600/20 border-l-2 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-bold">
                            {apt.doctor_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">Dr. {apt.doctor_name}</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(apt.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>{apt.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat window */}
              <div className="col-span-2 bg-[#1a2035]/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                {selectedApt ? (
                  <>
                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {selectedApt.doctor_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Dr. {selectedApt.doctor_name}</p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                          Live — messages sync instantly
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-10 h-10 text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">No messages yet</p>
                          <p className="text-gray-600 text-xs mt-1">Your doctor can message you from their dashboard</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_role === 'patient' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                              msg.sender_role === 'patient'
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-br-md'
                                : 'bg-[#0d1525] border border-white/10 text-gray-200 rounded-bl-md'
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${msg.sender_role === 'patient' ? 'text-white/60' : 'text-gray-500'}`}>
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/10 flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message to your doctor..."
                        className="flex-1 bg-[#0d1525] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-40 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">Select a conversation</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
