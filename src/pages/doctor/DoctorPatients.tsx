import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { Users, Search, Mail, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export function DoctorPatients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPatients()
    }
  }, [user])

  const loadPatients = async () => {
    if (!user) return
    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patient_id(
            email,
            user_profiles(full_name, phone)
          )
        `)
        .eq('doctor_id', user.id)

      if (appointments) {
        const uniquePatients = Array.from(
          new Map(appointments.map(apt => [apt.patient_id, apt.patient])).values()
        )
        setPatients(uniquePatients)
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Patients</h1>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No patients yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient: any, index: number) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{patient?.user_profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">Patient</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{patient?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{patient?.user_profiles?.phone || 'No phone'}</span>
                    </div>
                  </div>
                  <button className="mt-3 w-full py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm hover:bg-purple-600/30">
                    View Medical History
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}