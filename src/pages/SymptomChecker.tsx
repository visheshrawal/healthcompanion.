import { useState } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { analyzeSymptoms, SymptomAnalysis } from '../lib/groq'
import { 
  Brain, 
  AlertCircle, 
  Loader,
  Activity,
  Plus,
  X,
  CheckCircle,
  Clock,
  Sparkles,
  Send
} from 'lucide-react'

const commonSymptoms = [
  'Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea',
  'Chest Pain', 'Shortness of Breath', 'Dizziness', 'Sore Throat',
  'Body Aches', 'Chills', 'Runny Nose', 'Loss of Taste', 'Loss of Smell'
]

export function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null)

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim()
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms([...selectedSymptoms, trimmed])
      setCustomSymptom('')
    }
  }

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
  }

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) return
    
    setAnalyzing(true)
    setAnalysis(null)
    
    try {
      const result = await analyzeSymptoms(selectedSymptoms)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleQuickAnalyze = async () => {
    // Analyze just the custom symptom without adding to list
    const trimmed = customSymptom.trim()
    if (!trimmed) return
    
    setAnalyzing(true)
    setAnalysis(null)
    
    try {
      const result = await analyzeSymptoms([trimmed])
      setAnalysis(result)
      // Optionally add it to selected list
      if (!selectedSymptoms.includes(trimmed)) {
        setSelectedSymptoms([...selectedSymptoms, trimmed])
      }
      setCustomSymptom('')
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getUrgencyStyles = (level: string) => {
    switch(level) {
      case 'High':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          icon: AlertCircle,
          gradient: 'from-red-600/20 to-red-700/20',
          badge: 'bg-red-600'
        }
      case 'Medium':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: Clock,
          gradient: 'from-yellow-600/20 to-orange-600/20',
          badge: 'bg-yellow-600'
        }
      default:
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          text: 'text-green-400',
          icon: CheckCircle,
          gradient: 'from-green-600/20 to-emerald-600/20',
          badge: 'bg-green-600'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              AI Symptom Checker
            </h1>
            <p className="text-gray-400">Describe your symptoms and get AI-powered insights</p>
          </div>

          {/* Disclaimer */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium mb-1">Medical Disclaimer</p>
                <p className="text-sm text-gray-300">
                  This AI symptom checker is for informational purposes only and does not constitute medical advice. 
                  Always consult with a qualified healthcare professional for medical concerns.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Symptom Input Section */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Describe Your Symptoms
                </h2>
                
                {/* Main Symptom Input */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Enter your main symptom or condition</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomSymptom()
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 text-lg"
                      placeholder="e.g., Sharp pain in lower back, Migraine, Skin rash..."
                    />
                    <button
                      onClick={addCustomSymptom}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add
                    </button>
                    <button
                      onClick={handleQuickAnalyze}
                      disabled={!customSymptom.trim() || analyzing}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Quick Analyze
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to add, or click "Quick Analyze" to analyze this symptom directly
                  </p>
                </div>

                {/* Common Symptoms */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Common Symptoms (click to add)</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map(symptom => (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-purple-600 text-white border border-purple-500'
                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Symptoms */}
                {selectedSymptoms.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-400">Selected Symptoms ({selectedSymptoms.length})</p>
                      <button
                        onClick={() => setSelectedSymptoms([])}
                        className="text-xs text-gray-500 hover:text-gray-400"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map(symptom => (
                        <span
                          key={symptom}
                          className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm flex items-center gap-2"
                        >
                          {symptom}
                          <button onClick={() => removeSymptom(symptom)} className="hover:text-purple-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={selectedSymptoms.length === 0 || analyzing}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Analyze All Symptoms ({selectedSymptoms.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Tips for Best Results</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    Be specific about your symptoms
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    Include duration and severity
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    Add multiple symptoms for accuracy
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    Use "Quick Analyze" for single symptoms
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-semibold">Seek Immediate Help If</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Difficulty breathing
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Chest pain or pressure
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Severe headache
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Confusion or disorientation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="mt-6 space-y-4">
              {/* Urgency Card */}
              {(() => {
                const styles = getUrgencyStyles(analysis.urgencyLevel)
                const IconComponent = styles.icon
                return (
                  <div className={`bg-gradient-to-r ${styles.gradient} border ${styles.border} rounded-xl p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${styles.text}`} />
                        </div>
                        <div>
                          <p className={`${styles.text} text-sm font-medium mb-1`}>Urgency Level</p>
                          <p className="text-2xl font-bold text-white">{analysis.urgencyLevel}</p>
                        </div>
                      </div>
                      {analysis.urgencyLevel === 'High' && (
                        <button 
                          onClick={() => window.location.href = '/emergency'}
                          className={`px-4 py-2 ${styles.badge} hover:opacity-90 text-white rounded-lg font-medium`}
                        >
                          Emergency Help
                        </button>
                      )}
                    </div>
                  </div>
                )}
              )()}

              {/* Possible Conditions */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Possible Conditions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.conditions.map((condition, index) => (
                    <div key={index} className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-white font-medium">{condition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-400 text-sm font-medium">{index + 1}</span>
                      </div>
                      <p className="text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">{analysis.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}