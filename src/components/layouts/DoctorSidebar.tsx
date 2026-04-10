import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Heart,
  User,
  ChevronRight,
  Clock,
  DollarSign,
  Activity,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
  { path: '/doctor/patients', icon: Users, label: 'Patients' },
  { path: '/doctor/prescriptions', icon: Activity, label: 'Prescriptions' },
  { path: '/doctor/chat', icon: MessageSquare, label: 'Chat with Patients' },
  { path: '/doctor/profile', icon: User, label: 'Profile' },
  { path: '/doctor/settings', icon: Settings, label: 'Settings' },
]

export function DoctorSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [stats, setStats] = useState({ todayAppointments: 0, pendingCount: 0 })

  useEffect(() => {
    loadDoctorProfile()
    // Re-fetch whenever profile is saved from DoctorProfile page
    window.addEventListener('doctor-profile-updated', loadDoctorProfile)
    return () => window.removeEventListener('doctor-profile-updated', loadDoctorProfile)
  }, [user])

  const loadDoctorProfile = async () => {
    if (!user) return
    
    try {
      const { data } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
  
      const ultimateName = data?.full_name || user.user_metadata?.full_name || 'Doctor'
      const ultimateAvatar = data?.avatar_url || user.user_metadata?.avatar_url || null
  
      setAvatarUrl(ultimateAvatar)
      setDoctorName(ultimateName.split(' ')[0])
  
      // Load today's stats
      const today = new Date().toISOString().split('T')[0]
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('doctor_id', user.id)
        .eq('appointment_date', today)

      if (appointments) {
        setStats({
          todayAppointments: appointments.length,
          pendingCount: appointments.filter(a => a.status === 'pending').length
        })
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-950/95 to-purple-950/20 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto">
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-4 mb-6 border-b border-white/10">
          <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            HealthCompanion
          </span>
        </div>

        {/* Doctor Profile Card */}
        <div className="mb-6 p-3 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Doctor" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Dr. {doctorName}
              </p>
              <p className="text-xs text-purple-300">Verified Doctor</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <span className="text-white font-bold">{stats.todayAppointments}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Pending</span>
            </div>
            <span className="text-white font-bold">{stats.pendingCount}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-white border border-cyan-500/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-white/10 space-y-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 rounded-lg transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}