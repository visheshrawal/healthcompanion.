import { Sidebar } from '../components/layouts/Sidebar'
import { 
  Activity, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Pill, 
  Heart, 
  Brain, 
  Shield,
  Clock,
  AlertCircle,
  ChevronRight,
  Bell,
  Moon,
  Zap,
  ArrowUp,
  Circle,
  Sparkles,
  Loader
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getAIResponse } from '../lib/groq'

interface Medication {
  id: number
  name: string
  dosage: string
  quantity: string
  timeOfDay: string
  time: string
  foodIntake: string
  taken: boolean
}

interface UserProfile {
  full_name: string
  avatar_url: string | null
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [medications, setMedications] = useState<Medication[]>([])
  const [greeting, setGreeting] = useState('')
  const [adherenceData, setAdherenceData] = useState<Record<string, { total: number, taken: number }>>({})
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userName, setUserName] = useState('')
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [healthTip, setHealthTip] = useState('')
  const [loadingTip, setLoadingTip] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    loadUserProfile()
    loadMedications()
    loadAdherenceData()

    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    if (userName) {
      generateAIInsights()
      generateHealthTip()
    }
  }, [userName, medications])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
      
      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0])
      } else {
        setUserName(user.email?.split('@')[0] || 'User')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setUserName(user.email?.split('@')[0] || 'User')
    }
  }

  const loadMedications = () => {
    const savedMeds = localStorage.getItem('healthcompanion_medications')
    if (savedMeds) {
      setMedications(JSON.parse(savedMeds))
    }
  }

  const loadAdherenceData = () => {
    const savedAdherence = localStorage.getItem('adherence')
    if (savedAdherence) {
      setAdherenceData(JSON.parse(savedAdherence))
    }
  }

  const generateAIInsights = async () => {
    setLoadingInsights(true)
    try {
      const takenToday = medications.filter(med => med.taken).length
      const totalToday = medications.length
      const adherenceRate = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0
      
      const prompt = `You are a supportive health AI assistant for ${userName}. 
      Their current medication adherence rate is ${adherenceRate}% (${takenToday}/${totalToday} medications taken today).
      Provide 3 brief, encouraging, and personalized health insights or recommendations. 
      Each insight should be 1 short sentence. Focus on positivity and actionable tips.
      Format as a simple list with no numbering or bullets. Separate each insight with a newline.`

      const response = await getAIResponse(prompt, 'You are a helpful health AI. Keep responses brief, encouraging, and personalized.')
      
      // Parse insights (split by newline and filter empty)
      const insights = response.split('\n').filter(line => line.trim().length > 0).slice(0, 3)
      setAiInsights(insights)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      setAiInsights([
        "Stay consistent with your medication schedule!",
        "Remember to stay hydrated throughout the day.",
        "A short walk can boost your energy levels."
      ])
    } finally {
      setLoadingInsights(false)
    }
  }

  const generateHealthTip = async () => {
    setLoadingTip(true)
    try {
      const prompt = `Generate one brief, actionable health tip for ${userName}. 
      Make it personalized and relevant to general wellness. 
      Keep it under 15 words. Just the tip, no extra text.`

      const tip = await getAIResponse(prompt, 'You are a health and wellness expert. Be brief and actionable.')
      setHealthTip(tip)
    } catch (error) {
      console.error('Error generating health tip:', error)
      setHealthTip('Stay hydrated! Aim for 8 glasses of water today.')
    } finally {
      setLoadingTip(false)
    }
  }

  useEffect(() => {
    const handleStorageChange = () => {
      loadMedications()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const takenToday = medications.filter(med => med.taken).length
  const totalToday = medications.length
  const adherenceRate = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0

  const upcomingMeds = medications
    .filter(med => !med.taken)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 3)

  const healthMetrics = {
    heartRate: 72,
    sleepHours: 7.5,
    steps: 8432,
    stressLevel: 'Low'
  }

  const toggleMedicationTaken = (id: number) => {
    const updated = medications.map(med => 
      med.id === id ? { ...med, taken: !med.taken } : med
    )
    setMedications(updated)
    localStorage.setItem('healthcompanion_medications', JSON.stringify(updated))
    
    const today = new Date().toISOString().split('T')[0]
    const takenCount = updated.filter(m => m.taken).length
    const totalCount = updated.length
    
    const newAdherence = { 
      ...adherenceData, 
      [today]: { total: totalCount, taken: takenCount } 
    }
    localStorage.setItem('adherence', JSON.stringify(newAdherence))
    setAdherenceData(newAdherence)
    
    // Regenerate AI insights after medication update
    setTimeout(() => generateAIInsights(), 500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with greeting and time */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {greeting}, <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(currentTime)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-white mb-1">
                {formatTime(currentTime)}
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">System Active</span>
              </div>
            </div>
          </div>

          {/* Health Score Card */}
          <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-white">Health Score</h2>
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs text-green-400">
                      Excellent
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Based on your activity, sleep, and medication adherence</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  85
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUp className="w-3 h-3" />
                  <span>+5 from last week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{healthMetrics.heartRate} bpm</p>
              <p className="text-gray-400 text-sm">Heart Rate</p>
              <p className="text-xs text-green-400 mt-2">Normal range</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-cyan-400" />
                </div>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{healthMetrics.sleepHours} hrs</p>
              <p className="text-gray-400 text-sm">Sleep Duration</p>
              <p className="text-xs text-green-400 mt-2">Good quality</p>
            </div>

            <div 
              onClick={() => navigate('/dashboard/medications')}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-green-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{takenToday}/{totalToday}</p>
              <p className="text-gray-400 text-sm">Meds Taken Today</p>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{healthMetrics.steps.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Daily Steps</p>
              <p className="text-xs text-yellow-400 mt-2">1,568 to goal</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Medications */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Upcoming Medications</h3>
                      <p className="text-sm text-gray-400">Next doses to take</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/dashboard/medications')}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {upcomingMeds.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMeds.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Pill className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{med.name}</p>
                            <p className="text-sm text-gray-400">{med.dosage} - {med.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-white font-mono">{med.time}</p>
                            <p className="text-xs text-gray-400">{med.foodIntake}</p>
                          </div>
                          <button
                            onClick={() => toggleMedicationTaken(med.id)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1 transition-all"
                          >
                            <Circle className="w-3 h-3" />
                            Mark
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p>All medications taken for today!</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate('/symptom-checker')}
                    className="flex items-center gap-3 p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg hover:bg-purple-600/20 transition-all group"
                  >
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className="text-white text-sm">AI Symptom Check</span>
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/medications')}
                    className="flex items-center gap-3 p-4 bg-cyan-600/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/20 transition-all group"
                  >
                    <Pill className="w-5 h-5 text-cyan-400" />
                    <span className="text-white text-sm">Add Medication</span>
                  </button>
                  <button 
                    onClick={() => navigate('/emergency')}
                    className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-500/30 rounded-lg hover:bg-red-600/20 transition-all group"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-white text-sm">Emergency SOS</span>
                  </button>
                  <button 
                    onClick={() => navigate('/reports')}
                    className="flex items-center gap-3 p-4 bg-green-600/10 border border-green-500/30 rounded-lg hover:bg-green-600/20 transition-all group"
                  >
                    <Activity className="w-5 h-5 text-green-400" />
                    <span className="text-white text-sm">View Reports</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Content - 1 column */}
            <div className="space-y-6">
              {/* AI Health Insights */}
              <div className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                  <Sparkles className="w-4 h-4 text-yellow-400 ml-auto" />
                </div>
                
                {loadingInsights ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <Loader className="w-4 h-4 text-purple-400 animate-spin mx-auto" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={generateAIInsights}
                  className="mt-4 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Refresh Insights
                </button>
              </div>

              {/* Health Tip of the Day */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Health Tip</h3>
                </div>
                
                {loadingTip ? (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg">
                    <Loader className="w-4 h-4 text-purple-400 animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg">
                    <p className="text-sm text-gray-300 leading-relaxed">{healthTip}</p>
                  </div>
                )}
                
                <button 
                  onClick={generateHealthTip}
                  className="mt-4 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  New Tip
                </button>
              </div>

              {/* Streak Card */}
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Current Streak</p>
                    <p className="text-3xl font-bold text-white">12 days</p>
                    <p className="text-xs text-gray-400 mt-2">Personal best: 15 days</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress to record</span>
                    <span>12/15</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                      style={{ width: '80%' }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Chat Quick Access */}
              <div 
                onClick={() => navigate('/chat')}
                className="bg-gradient-to-br from-purple-600/30 to-cyan-600/30 border border-purple-500/30 rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Need Help?</h3>
                    <p className="text-sm text-gray-400">Chat with AI Assistant</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 ml-auto" />
                </div>
                <p className="text-xs text-gray-400">
                  Ask questions about your health, medications, or get personalized advice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}