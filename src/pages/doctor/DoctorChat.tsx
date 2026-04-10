import { useState, useEffect, useRef } from 'react'
import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Send, Clock, User } from 'lucide-react'

interface Message {
  id: string
  appointment_id: string
  sender_id: string
  sender_role: 'doctor' | 'patient'
  content: string
  created_at: string
}

interface Conversation {
  aptId: string
  patientName: string
  aptDate: string
  status: string
}

export function DoctorChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (user) loadConversations()
    return () => { channelRef.current?.unsubscribe() }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user!.id)
        .not('status', 'eq', 'rejected')
        .order('appointment_date', { ascending: false })

      if (!data) return

      const convs: Conversation[] = data.map((a: any) => ({
        aptId: a.id,
        patientName: a.patient_name || 'Patient',
        aptDate: a.appointment_date,
        status: a.status
      }))

      setConversations(convs)
      if (convs.length > 0) {
        selectConv(convs[0])
      }
    } catch (e) { console.error(e) }
  }

  const selectConv = (conv: Conversation) => {
    setSelected(conv)
    loadMessages(conv.aptId)
    subscribeToMessages(conv.aptId)
    setUnread(prev => ({ ...prev, [conv.aptId]: 0 }))
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
    channelRef.current?.unsubscribe()
    channelRef.current = supabase
      .channel(`doctor_messages:${aptId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `appointment_id=eq.${aptId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()
  }

  const sendMessage = async () => {
    if (!selected || !input.trim() || !user) return
    setSending(true)
    const content = input.trim()
    setInput('')

    try {
      await supabase.from('messages').insert({
        appointment_id: selected.aptId,
        sender_id: user.id,
        sender_role: 'doctor',
        content
      })
    } catch (e) {
      console.error(e)
      setInput(content) // restore on error
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[#050510]">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              Patient Messaging
            </h1>
            <p className="text-gray-400">Real-time secure messaging with your patients</p>
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#1a2035]/40 border border-white/10 rounded-2xl">
              <MessageSquare className="w-14 h-14 text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg font-medium">No patient conversations</p>
              <p className="text-gray-500 text-sm mt-1">Accepted appointments will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 h-[72vh]">
              {/* Conversation list */}
              <div className="col-span-1 bg-[#1a2035]/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Patients</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(conv => {
                    const unreadCount = unread[conv.aptId] || 0
                    return (
                      <button
                        key={conv.aptId}
                        onClick={() => selectConv(conv)}
                        className={`w-full p-4 text-left border-b border-white/5 transition-all hover:bg-white/5 ${
                          selected?.aptId === conv.aptId ? 'bg-purple-600/20 border-l-2 border-l-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium truncate">{conv.patientName}</p>
                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(conv.aptDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            conv.status === 'confirmed' ? 'bg-green-500/20 text-green-400'
                            : conv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                          }`}>{conv.status}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Chat window */}
              <div className="col-span-2 bg-[#1a2035]/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                {selected ? (
                  <>
                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{selected.patientName}</p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                          Live — messages sync instantly
                        </p>
                      </div>
                      <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
                        selected.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>{selected.status}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-10 h-10 text-gray-600 mb-3" />
                          <p className="text-gray-500 text-sm">No messages yet</p>
                          <p className="text-gray-600 text-xs mt-1">Start the conversation</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                              msg.sender_role === 'doctor'
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-br-md'
                                : 'bg-[#0d1525] border border-white/10 text-gray-200 rounded-bl-md'
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${msg.sender_role === 'doctor' ? 'text-white/60' : 'text-gray-500'}`}>
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
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message to your patient..."
                        className="flex-1 bg-[#0d1525] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!input.trim() || sending}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-xl hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-40"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">Select a patient to message</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
