import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Pill, 
  MessageSquare, 
  Siren, 
  Settings,
  LogOut,
  Heart,
  User,
  ChevronRight,
  FileBarChart,
  MapPin,
  Hospital,
  Stethoscope,
  Calendar
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dashboard/medications', icon: Pill, label: 'Medications' },
  { path: '/symptom-checker', icon: Stethoscope, label: 'Symptom Checker' },
  { path: '/appointments', icon: Calendar, label: 'Appointments' },
  { path: '/doctor-chat', icon: MessageSquare, label: 'Chat with Doctor' },
  { path: '/reports', icon: FileBarChart, label: 'Reports' },
  { path: '/hospitals', icon: Hospital, label: 'Nearby Hospitals' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/emergency', icon: Siren, label: 'Emergency' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient')

  useEffect(() => {
    loadUserProfile()
    
    const handleAvatarUpdate = () => {
      loadUserProfile()
    }
    
    window.addEventListener('avatar-updated', handleAvatarUpdate)
    window.addEventListener('profile-updated', handleAvatarUpdate)
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
      window.removeEventListener('profile-updated', handleAvatarUpdate)
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      if (data) {
        setAvatarUrl(data.avatar_url)
        setUserName(data.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User')
        setUserRole(data.role || 'patient')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setUserName(user.email?.split('@')[0] || 'User')
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

        {/* User Profile Card */}
        <div className="mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-purple-400 mt-0.5 capitalize">
                {userRole}
              </p>
            </div>
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
                      ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-white border border-purple-500/50'
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

        {/* Health Score Card - Only show for patients */}
        {userRole === 'patient' && (
          <div className="my-4 p-4 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Health Score</span>
              <Heart className="w-4 h-4 text-purple-400 fill-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">85</div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-1.5 rounded-full w-[85%]" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Excellent • +5 this week</p>
          </div>
        )}

        {/* Doctor Stats Card - Only show for doctors */}
        {userRole === 'doctor' && (
          <div className="my-4 p-4 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Today's Appointments</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">8</div>
            <p className="text-xs text-gray-400">Next: 10:30 AM</p>
          </div>
        )}

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

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            HealthCompanion v1.0
          </p>
        </div>
      </div>
    </aside>
  )
}