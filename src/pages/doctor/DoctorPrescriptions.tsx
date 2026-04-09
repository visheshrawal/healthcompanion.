import { DoctorSidebar } from '../../components/layouts/DoctorSidebar'
import { FileText, Plus, Download } from 'lucide-react'

export function DoctorPrescriptions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <DoctorSidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Prescriptions</h1>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Prescription
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 text-sm text-gray-400 font-medium">
              <div>Patient</div>
              <div>Date</div>
              <div>Medications</div>
              <div>Actions</div>
            </div>
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No prescriptions yet</p>
              <button className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-600/30">
                Create Your First Prescription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}