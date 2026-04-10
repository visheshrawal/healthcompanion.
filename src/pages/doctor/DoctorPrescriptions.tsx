import { useState, useEffect, useRef } from 'react'
import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { FileText, Plus, Pill, Clock, CheckCircle, X, Mic, StopCircle, Trash2, Calendar } from 'lucide-react'
import { DEMO_APPOINTMENTS } from './DoctorAppointments'
import { supabase } from '../../lib/supabase'
import { analyzeMedicalAudio } from '../../lib/groq'

export function DoctorPrescriptions() {
  const [prescriptionsHistory, setPrescriptionsHistory] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  
  // Voice transcription states
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiSummary, setAiSummary] = useState('')
  const [analyzingAudio, setAnalyzingAudio] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Medication Queuing System
  const [queuedDrugs, setQueuedDrugs] = useState<any[]>([])
  const [requireFollowUp, setRequireFollowUp] = useState(false)
  
  const [currentPatientId, setCurrentPatientId] = useState('')
  const [currentDrug, setCurrentDrug] = useState({
    name: '',
    dosage: '',
    quantity: '',
    timeOfDay: 'morning',
    foodIntake: 'before',
    course_duration: ''
  })

  useEffect(() => {
    loadPatientsAndHistory()
    setupSpeechRecognition()
  }, [])

  const setupSpeechRecognition = () => {
    const Spec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (Spec) {
      recognitionRef.current = new Spec()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        setTranscript(prev => prev + ' ' + currentTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error)
        setIsRecording(false)
      }
    }
  }

  const startVoiceScribe = async () => {
    try {
      // Aggressive hardware hardware intercept to force permission prompt lock
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (!recognitionRef.current) return alert("Browser does not support Speech Recognition. Try Chrome.")
      setTranscript('')
      setAiSummary('')
      recognitionRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Mic access denied.", err)
      alert("Microphone permission was denied. Please allow microphone access to use the AI Scribe.")
    }
  }

  const stopVoiceScribe = async () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsRecording(false)
    
    if (transcript.length > 5) {
      setAnalyzingAudio(true)
      const summary = await analyzeMedicalAudio(transcript)
      setAiSummary(summary)
      setAnalyzingAudio(false)
    }
  }

  const loadPatientsAndHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('appointments').select(`patient:patient_id(id, email, user_profiles(full_name))`).eq('doctor_id', user.id)
      const realPatients = (data || []).map(apt => {
        const p: any = apt.patient
        return { id: p?.id || 'unknown', name: p?.user_profiles?.full_name || p?.email || 'Unknown Patient' }
      })
      const uniqueMap = new Map()
      realPatients.forEach(p => uniqueMap.set(p.name, p))
      DEMO_APPOINTMENTS.forEach(d => uniqueMap.set(d.patient_name, { id: d.id, name: d.patient_name }))
      setPatients(Array.from(uniqueMap.values()))
    } else {
      setPatients(DEMO_APPOINTMENTS.map(d => ({ id: d.id, name: d.patient_name })))
    }

    const history = localStorage.getItem('healthcompanion_doctor_prescriptions')
    if (history) setPrescriptionsHistory(JSON.parse(history))
  }

  const handleAddMedication = () => {
    if (!currentDrug.name || !currentDrug.dosage) return
    setQueuedDrugs([...queuedDrugs, { ...currentDrug, id: Date.now() }])
    setCurrentDrug({ name: '', dosage: '', quantity: '', timeOfDay: 'morning', foodIntake: 'before', course_duration: '' })
  }

  const handleRemoveMedication = (id: number) => {
    setQueuedDrugs(queuedDrugs.filter(d => d.id !== id))
  }

  const handleSyncPrescription = () => {
    if (!currentPatientId || queuedDrugs.length === 0) return

    const patientName = patients.find(p => String(p.id) === String(currentPatientId))?.name || 'Unknown'
    const systemPayloads = queuedDrugs.map(drug => {
      let displayTime = '08:00 AM'
      switch (drug.timeOfDay) {
        case 'morning': displayTime = '08:00 AM'; break;
        case 'afternoon': displayTime = '01:00 PM'; break;
        case 'evening': displayTime = '06:00 PM'; break;
        case 'night': displayTime = '09:00 PM'; break;
      }
      return {
        id: Date.now() + Math.random(),
        name: drug.name,
        dosage: drug.dosage,
        quantity: drug.quantity,
        timeOfDay: drug.timeOfDay,
        foodIntake: drug.foodIntake,
        course_duration: drug.course_duration || '',
        time: displayTime,
        taken: false,
        prescribed_to: patientName,
        date: new Date().toISOString().split('T')[0]
      }
    })

    // Bridge directly to patient dashboard
    const existingMedsRaw = localStorage.getItem('healthcompanion_medications')
    let meds = existingMedsRaw ? JSON.parse(existingMedsRaw) : []
    meds = [...meds, ...systemPayloads]
    localStorage.setItem('healthcompanion_medications', JSON.stringify(meds))

    // Save Unified Doctor Log
    const logSummary = {
      id: Date.now(),
      prescribed_to: patientName,
      date: new Date().toISOString().split('T')[0],
      drugCount: systemPayloads.length,
      primaryDrug: systemPayloads[0].name,
      requireFollowUp,
      aiSummary
    }
    const updatedHistory = [logSummary, ...prescriptionsHistory]
    setPrescriptionsHistory(updatedHistory)
    localStorage.setItem('healthcompanion_doctor_prescriptions', JSON.stringify(updatedHistory))

    // Reset Core State
    setShowModal(false)
    setQueuedDrugs([])
    setRequireFollowUp(false)
    setAiSummary('')
    setTranscript('')
    setCurrentPatientId('')
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">E-Prescribing System</h1>
              <p className="text-gray-400">Directly synchronize multi-drug regimens with clinical voice scribing natively to patient dashboards.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus className="w-5 h-5" /> Issue Prescription
            </button>
          </div>

          <div className="bg-[#1a2035]/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-5 border-b border-white/10 text-sm text-gray-400 font-medium bg-black/20">
              <div className="col-span-1">Patient</div>
              <div className="col-span-2">Regimen Overview</div>
              <div className="col-span-1">Follow-up</div>
              <div className="col-span-1">Issue Date</div>
            </div>

            {prescriptionsHistory.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                <p className="text-white text-lg font-medium mb-2">No prescriptions issued</p>
                <p className="text-gray-400">Use the unified system to transmit digital regimens directly to patients.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {prescriptionsHistory.map(p => (
                  <div key={p.id} className="grid grid-cols-5 gap-4 p-5 items-center hover:bg-white/5 transition-colors">
                    <div className="col-span-1">
                      <p className="text-white font-medium">{p.prescribed_to}</p>
                    </div>
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{p.primaryDrug} <span className="text-gray-400 font-normal">{(p.drugCount > 1) ? `+ ${p.drugCount - 1} others` : ''}</span></p>
                        {p.aiSummary && <p className="text-xs text-purple-400 truncate max-w-[200px] mt-1">{p.aiSummary}</p>}
                      </div>
                    </div>
                    <div className="col-span-1 border border-white/10 p-1.5 rounded bg-black/20 text-center">
                      <p className={`text-xs font-semibold ${p.requireFollowUp ? 'text-red-400' : 'text-green-400'}`}>{p.requireFollowUp ? 'Follow-up Required' : 'Not Needed'}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-gray-400 text-sm">{p.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1525] border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-cyan-900/10 sticky top-0 z-10 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400"/> Clinical Prescription Builder</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Scribe & Settings */}
              <div className="space-y-6 border-r border-white/10 pr-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Patient</label>
                  <select 
                    value={currentPatientId}
                    onChange={e => setCurrentPatientId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="">-- Choose target patient --</option>
                    {patients.map((p, i) => <option key={i} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Scribe Implementation */}
                <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/10 rounded-xl p-5 border border-purple-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2"><Mic className="w-4 h-4 text-purple-400"/> AI Voice Scribe Note</h3>
                  </div>
                  
                  {aiSummary ? (
                    <div className="text-gray-300 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{aiSummary}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      {analyzingAudio ? (
                        <p className="text-purple-400 animate-pulse text-sm">Structuring medical text...</p>
                      ) : !isRecording ? (
                        <button onClick={startVoiceScribe} className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                          <Mic className="w-6 h-6 text-white" />
                        </button>
                      ) : (
                        <button onClick={stopVoiceScribe} className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
                          <StopCircle className="w-6 h-6 text-white" />
                        </button>
                      )}
                      <p className="text-xs text-gray-400 mt-2 text-center max-w-[250px]">
                        {!isRecording && !analyzingAudio ? 'Tap to dictate patient case notes. Triggers permission.' : isRecording ? 'Recording...' : ''}
                      </p>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                  <input type="checkbox" checked={requireFollowUp} onChange={e => setRequireFollowUp(e.target.checked)} className="w-5 h-5 rounded border-white/20 bg-black/50 text-purple-500" />
                  <span className="text-gray-300 font-medium">Require Follow-up Visit</span>
                </label>
              </div>

              {/* Right Column: Medications Queuing */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                    Medication Queue <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{queuedDrugs.length} Items</span>
                  </h3>
                  
                  {queuedDrugs.length > 0 && (
                    <div className="space-y-2 mb-6 max-h-40 overflow-y-auto hide-scrollbar">
                      {queuedDrugs.map((d, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                          <div>
                            <p className="text-sm font-medium text-white">{d.name} <span className="text-xs text-purple-400">{d.dosage}</span></p>
                            <p className="text-xs text-gray-500">{d.timeOfDay} • {d.foodIntake}</p>
                          </div>
                          <button onClick={() => handleRemoveMedication(d.id)} className="text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Medication Name</label>
                        <input type="text" placeholder="e.g. Amoxicillin" value={currentDrug.name} onChange={e => setCurrentDrug({...currentDrug, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Dosage Pattern</label>
                        <input type="text" placeholder="e.g. 500mg" value={currentDrug.dosage} onChange={e => setCurrentDrug({...currentDrug, dosage: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Total Quantity</label>
                        <input type="text" placeholder="e.g. 1 Tablet" value={currentDrug.quantity} onChange={e => setCurrentDrug({...currentDrug, quantity: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none" />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Time of Day</label>
                        <select value={currentDrug.timeOfDay} onChange={e => setCurrentDrug({...currentDrug, timeOfDay: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-gray-300 text-sm focus:border-purple-500 outline-none">
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Food Trigger</label>
                        <select value={currentDrug.foodIntake} onChange={e => setCurrentDrug({...currentDrug, foodIntake: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-gray-300 text-sm focus:border-purple-500 outline-none">
                          <option value="before">Before</option>
                          <option value="after">After</option>
                          <option value="with">With</option>
                          <option value="empty">Empty</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Course Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 7 days, 2 weeks, 1 month"
                        value={currentDrug.course_duration}
                        onChange={e => setCurrentDrug({...currentDrug, course_duration: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none"
                      />
                    </div>
                    
                    <button 
                      onClick={handleAddMedication}
                      disabled={!currentDrug.name || !currentDrug.dosage} 
                      className="w-full py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium text-sm transition-colors mt-2"
                    >
                      + Queue This Medication
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSyncPrescription} 
                    disabled={queuedDrugs.length === 0 || !currentPatientId}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 disabled:opacity-50 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-white font-medium shadow-lg shadow-purple-500/20"
                  >
                    Sync Regimen to Device
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}