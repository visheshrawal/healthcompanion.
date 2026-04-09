import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { Settings, Bell, Lock, Globe, ToggleLeft } from 'lucide-react'
import { useState } from 'react'

export function DoctorSettings() {
  const [notifications, setNotifications] = useState(true)
  const [available, setAvailable] = useState(true)
  const [language, setLanguage] = useState('english')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
          
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Appointment reminders</span>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-purple-600' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Availability
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Available for appointments</span>
                <button 
                  onClick={() => setAvailable(!available)}
                  className={`w-12 h-6 rounded-full transition-colors ${available ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${available ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Security
              </h2>
              <button className="px-4 py-2 bg-purple-600 rounded-lg text-white">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}