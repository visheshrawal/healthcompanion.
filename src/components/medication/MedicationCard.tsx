import { useState } from 'react'
import { CheckCircle, Circle, Clock, Bell, Trash2 } from 'lucide-react'

interface MedicationCardProps {
  id: number
  name: string
  dosage: string
  time: string
  frequency: 'daily' | 'weekly' | 'monthly'
  refillDate?: string
}

export function MedicationCard({ id, name, dosage, time, frequency, refillDate }: MedicationCardProps) {
  const [taken, setTaken] = useState(false)
  const [showReminder, setShowReminder] = useState(false)

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{name}</h4>
            <p className="text-sm text-gray-400">{dosage} • {time}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-purple-400 capitalize">{frequency}</span>
              {refillDate && (
                <span className="text-xs text-orange-400">Refill: {refillDate}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReminder(!showReminder)}
            className="p-2 rounded-lg text-gray-400 hover:text-purple-400 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTaken(!taken)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              taken 
                ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {taken ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            {taken ? 'Taken' : 'Mark Taken'}
          </button>
        </div>
      </div>

      {/* Reminder Popup */}
      {showReminder && (
        <div className="mt-3 p-3 bg-purple-600/20 border border-purple-500/50 rounded-lg">
          <p className="text-sm text-purple-300">
            Reminder set for {time} daily. You'll receive a notification 30 minutes before.
          </p>
        </div>
      )}
    </div>
  )
}