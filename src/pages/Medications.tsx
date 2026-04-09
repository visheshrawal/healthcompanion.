import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { Plus, Bell, CheckCircle, Circle, Trash2, Calendar, Trophy, Clock, Utensils, Sun, Moon, SunDim, Cloud } from 'lucide-react'

interface Medication {
  id: number
  name: string
  dosage: string
  quantity: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  foodIntake: 'before' | 'after' | 'with' | 'empty'
  time: string
  taken: boolean
}

export function Medications() {
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('healthcompanion_medications')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { id: 1, name: "Lisinopril", dosage: "10mg", quantity: "1 tablet", timeOfDay: "morning", foodIntake: "before", time: "08:00 AM", taken: false },
      { id: 2, name: "Metformin", dosage: "500mg", quantity: "1 tablet", timeOfDay: "afternoon", foodIntake: "with", time: "01:00 PM", taken: false },
      { id: 3, name: "Atorvastatin", dosage: "20mg", quantity: "1 tablet", timeOfDay: "evening", foodIntake: "after", time: "08:00 PM", taken: false },
    ]
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    quantity: '',
    timeOfDay: 'morning' as const,
    foodIntake: 'before' as const,
    time: ''
  })
  const [adherenceData, setAdherenceData] = useState<Record<string, { total: number, taken: number }>>({})

  // Save medications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('healthcompanion_medications', JSON.stringify(medications))
    // Update adherence data when medications change
    const today = new Date().toISOString().split('T')[0]
    const takenCount = medications.filter(m => m.taken).length
    const totalCount = medications.length
    
    const newAdherence = { 
      ...adherenceData, 
      [today]: { total: totalCount, taken: takenCount } 
    }
    localStorage.setItem('adherence', JSON.stringify(newAdherence))
    setAdherenceData(newAdherence)
  }, [medications])

  useEffect(() => {
    const saved = localStorage.getItem('adherence')
    if (saved) setAdherenceData(JSON.parse(saved))
  }, [])

  const saveAdherence = (data: Record<string, { total: number, taken: number }>) => {
    localStorage.setItem('adherence', JSON.stringify(data))
    setAdherenceData(data)
  }

  const toggleTaken = (id: number) => {
    const updated = medications.map(med => 
      med.id === id ? { ...med, taken: !med.taken } : med
    )
    setMedications(updated)
    
    const today = new Date().toISOString().split('T')[0]
    const takenCount = updated.filter(m => m.taken).length
    const totalCount = updated.length
    
    const newAdherence = { ...adherenceData, [today]: { total: totalCount, taken: takenCount } }
    saveAdherence(newAdherence)
    
    if (takenCount === totalCount && totalCount > 0) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage || !newMed.quantity || !newMed.time) return
    
    // Convert time format
    let displayTime = newMed.time
    if (newMed.time) {
      const [hours, minutes] = newMed.time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      displayTime = `${hour12}:${minutes} ${ampm}`
    }
    
    setMedications([...medications, { 
      ...newMed, 
      id: Date.now(), 
      taken: false,
      time: displayTime
    }])
    setNewMed({ name: '', dosage: '', quantity: '', timeOfDay: 'morning', foodIntake: 'before', time: '' })
    setShowAddModal(false)
  }

  const deleteMedication = (id: number) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch(timeOfDay) {
      case 'morning': return <Sun className="w-4 h-4 text-yellow-400" />
      case 'afternoon': return <SunDim className="w-4 h-4 text-orange-400" />
      case 'evening': return <Cloud className="w-4 h-4 text-purple-400" />
      case 'night': return <Moon className="w-4 h-4 text-blue-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getFoodIntakeText = (foodIntake: string) => {
    switch(foodIntake) {
      case 'before': return 'Before meal'
      case 'after': return 'After meal'
      case 'with': return 'With meal'
      case 'empty': return 'Empty stomach'
      default: return ''
    }
  }

  const takenCount = medications.filter(m => m.taken).length
  const percentage = medications.length > 0 ? (takenCount / medications.length) * 100 : 0

  // Get adherence color for a date
  const getAdherenceColor = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const record = adherenceData[dateStr]
    if (!record) return 'bg-white/10'
    if (record.taken === record.total) return 'bg-green-500'
    if (record.taken === 0) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {showSuccess && (
            <div className="fixed top-20 right-8 z-50 animate-bounce">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <div>
                  <p className="font-bold">Well done! 🎉</p>
                  <p className="text-sm">All medications taken for today!</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Medications</h1>
              <p className="text-gray-400 mt-1">Track your daily medication schedule</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Medication
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all">
              <p className="text-2xl font-bold text-white">{medications.length}</p>
              <p className="text-xs text-gray-400">Total Medications</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all">
              <p className="text-2xl font-bold text-green-400">{takenCount}</p>
              <p className="text-xs text-gray-400">Taken Today</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all">
              <p className="text-2xl font-bold text-purple-400">{Math.round(percentage)}%</p>
              <p className="text-xs text-gray-400">Adherence Rate</p>
            </div>
          </div>

          {/* Adherence Heatmap */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              7-Day Adherence Tracker
            </h2>
            <div className="flex justify-around">
              {getLast7Days().map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const record = adherenceData[dateStr]
                let tooltip = ''
                if (record) {
                  tooltip = `${record.taken}/${record.total} taken`
                } else {
                  tooltip = 'No data'
                }
                return (
                  <div key={dateStr} className="text-center group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-all hover:scale-110 cursor-pointer ${getAdherenceColor(date)}`}>
                      <span className="text-white font-bold text-sm">{date.getDate()}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{tooltip}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs text-gray-400">All taken</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs text-gray-400">Partial</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-400">Missed</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white/10"></div><span className="text-xs text-gray-400">No data</span></div>
            </div>
          </div>

          {/* Medications List */}
          <h2 className="text-xl font-semibold text-white mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {medications.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-gray-400">No medications added yet</p>
                <button onClick={() => setShowAddModal(true)} className="mt-4 text-purple-400 hover:text-purple-300">
                  Add your first medication
                </button>
              </div>
            ) : (
              medications.map(med => (
                <div key={med.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTimeOfDayIcon(med.timeOfDay)}
                        <div>
                          <h3 className="font-semibold text-white text-lg">{med.name}</h3>
                          <p className="text-gray-400 text-sm">{med.dosage} • {med.quantity}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <p className="text-sm text-white">{med.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Utensils className="w-3 h-3 text-cyan-400" />
                          <p className="text-sm text-gray-300">{getFoodIntakeText(med.foodIntake)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTimeOfDayIcon(med.timeOfDay)}
                          <p className="text-sm text-gray-300 capitalize">{med.timeOfDay}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTaken(med.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          med.taken 
                            ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {med.taken ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        {med.taken ? 'Taken' : 'Mark Taken'}
                      </button>
                      <button
                        onClick={() => deleteMedication(med.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/50 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add New Medication</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Medication Name</label>
                <input
                  type="text"
                  value={newMed.name}
                  onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Lisinopril"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Dosage</label>
                <input
                  type="text"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., 10mg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Quantity</label>
                <input
                  type="text"
                  value={newMed.quantity}
                  onChange={(e) => setNewMed({...newMed, quantity: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., 1 tablet, 2 capsules"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Time of Day</label>
                <select
                  value={newMed.timeOfDay}
                  onChange={(e) => setNewMed({...newMed, timeOfDay: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="morning" className="bg-slate-800 text-white">🌅 Morning (6 AM - 11 AM)</option>
                  <option value="afternoon" className="bg-slate-800 text-white">☀️ Afternoon (12 PM - 4 PM)</option>
                  <option value="evening" className="bg-slate-800 text-white">🌆 Evening (5 PM - 8 PM)</option>
                  <option value="night" className="bg-slate-800 text-white">🌙 Night (9 PM - 12 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Specific Time</label>
                <input
                  type="time"
                  value={newMed.time}
                  onChange={(e) => setNewMed({...newMed, time: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Food Intake</label>
                <select
                  value={newMed.foodIntake}
                  onChange={(e) => setNewMed({...newMed, foodIntake: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="before" className="bg-slate-800 text-white">🍽️ Before meal</option>
                  <option value="after" className="bg-slate-800 text-white">🍽️ After meal</option>
                  <option value="with" className="bg-slate-800 text-white">🍽️ With meal</option>
                  <option value="empty" className="bg-slate-800 text-white">💧 Empty stomach</option>
                </select>
              </div>

              <button
                onClick={addMedication}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 mt-6"
              >
                <Plus className="w-4 h-4" />
                Add Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}