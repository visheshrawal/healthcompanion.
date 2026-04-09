import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layouts/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { analyzeMedicalReport, ReportAnalysis } from '../lib/groq'
import { 
  FileText, 
  Upload, 
  Brain,
  Download,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader,
  Sparkles,
  Calendar,
  Activity,
  FileBarChart,
  TrendingUp,
  Clock,
  X,
  ChevronRight
} from 'lucide-react'

interface Report {
  id: string
  name: string
  date: string
  type: string
  file_url: string
  file_content?: string
  ai_analysis?: ReportAnalysis
}

export function Reports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newReportFile, setNewReportFile] = useState<File | null>(null)
  const [reportText, setReportText] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')

  useEffect(() => {
    loadReports()
  }, [user])

  const loadReports = async () => {
    if (!user) return
    
    try {
      // Load from localStorage for now (you can switch to Supabase later)
      const savedReports = localStorage.getItem(`healthcompanion_reports_${user.id}`)
      if (savedReports) {
        setReports(JSON.parse(savedReports))
      } else {
        // Add some sample reports for demo
        const mockReports: Report[] = [
          {
            id: '1',
            name: 'Blood Test Results - January 2026',
            date: '2026-01-15',
            type: 'Blood Work',
            file_url: '#',
          },
          {
            id: '2',
            name: 'Chest X-Ray Report',
            date: '2026-01-10',
            type: 'Radiology',
            file_url: '#',
          }
        ]
        setReports(mockReports)
        localStorage.setItem(`healthcompanion_reports_${user.id}`, JSON.stringify(mockReports))
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveReports = (updatedReports: Report[]) => {
    if (!user) return
    setReports(updatedReports)
    localStorage.setItem(`healthcompanion_reports_${user.id}`, JSON.stringify(updatedReports))
  }

  const handleFileUpload = async () => {
    if (!newReportFile && !reportText) return

    setUploading(true)
    
    try {
      let fileContent = reportText
      
      if (newReportFile) {
        // Read file content
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsText(newReportFile)
        })
      }

      const newReport: Report = {
        id: Date.now().toString(),
        name: newReportFile?.name || `Report - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        type: uploadMode === 'file' ? 'Uploaded Report' : 'Text Report',
        file_url: '#',
        file_content: fileContent
      }

      const updatedReports = [newReport, ...reports]
      saveReports(updatedReports)
      
      setNewReportFile(null)
      setReportText('')
      setShowUploadModal(false)
      
      // Auto-select and analyze the new report
      setSelectedReport(newReport)
      setTimeout(() => analyzeReport(newReport.id), 500)
      
    } catch (error) {
      console.error('Error uploading report:', error)
      alert('Error uploading report. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const analyzeReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId)
    if (!report || !report.file_content) {
      alert('No report content to analyze')
      return
    }

    setAnalyzing(reportId)
    
    try {
      const analysis = await analyzeMedicalReport(report.file_content)
      
      const updatedReports = reports.map(r => {
        if (r.id === reportId) {
          return { ...r, ai_analysis: analysis }
        }
        return r
      })
      
      saveReports(updatedReports)
      setSelectedReport(updatedReports.find(r => r.id === reportId) || null)
      
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Error analyzing report. Please try again.')
    } finally {
      setAnalyzing(null)
    }
  }

  const deleteReport = (id: string) => {
    const updatedReports = reports.filter(r => r.id !== id)
    saveReports(updatedReports)
    if (selectedReport?.id === id) {
      setSelectedReport(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <Sidebar />
        <div className="ml-64 flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileBarChart className="w-8 h-8 text-purple-400" />
                Medical Reports
              </h1>
              <p className="text-gray-400">Upload and analyze your medical reports with AI</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Your Reports
                </h2>
                
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No reports uploaded yet</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 text-sm text-purple-400 hover:text-purple-300"
                    >
                      Upload your first report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {reports.map(report => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedReport?.id === report.id
                            ? 'bg-purple-600/30 border border-purple-500/50'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate">{report.name}</p>
                              <p className="text-gray-400 text-xs mt-1">{report.date}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteReport(report.id)
                            }}
                            className="text-gray-400 hover:text-red-400 ml-2 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {report.ai_analysis && (
                          <div className="mt-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400 text-xs">AI Analyzed</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">AI Analysis</h3>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Our AI can analyze your medical reports and extract:
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Key findings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Abnormal values
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Recommendations
                  </li>
                </ul>
              </div>
            </div>

            {/* Report Details */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">{selectedReport.name}</h2>
                      <p className="text-gray-400 text-sm">Uploaded on {selectedReport.date}</p>
                    </div>
                    <div className="flex gap-2">
                      {!selectedReport.ai_analysis && selectedReport.file_content && (
                        <button
                          onClick={() => analyzeReport(selectedReport.id)}
                          disabled={analyzing === selectedReport.id}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg flex items-center gap-2 transition-all"
                        >
                          {analyzing === selectedReport.id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4" />
                              AI Analyze
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedReport.ai_analysis ? (
                    <div className="space-y-4">
                      {/* Summary Card */}
                      <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-400" />
                          AI Summary
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{selectedReport.ai_analysis.summary}</p>
                      </div>

                      {/* Abnormal Values - Show first with red styling */}
                      {selectedReport.ai_analysis.abnormalValues && selectedReport.ai_analysis.abnormalValues.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            Abnormal Values
                          </h3>
                          <div className="space-y-3">
                            {selectedReport.ai_analysis.abnormalValues.map((item, index) => (
                              <div key={index} className="p-4 bg-red-500/5 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium">{item.name}</span>
                                  <span className="text-red-400 font-bold">{item.value}</span>
                                </div>
                                <p className="text-sm text-gray-400">Normal range: {item.range}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Normal Values */}
                      {selectedReport.ai_analysis.normalValues && selectedReport.ai_analysis.normalValues.length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            Normal Values
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedReport.ai_analysis.normalValues.map((item, index) => (
                              <div key={index} className="p-3 bg-green-500/5 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-300 text-sm">{item.name}</span>
                                  <span className="text-green-400 font-medium">{item.value}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{item.range}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {selectedReport.ai_analysis.recommendations && selectedReport.ai_analysis.recommendations.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                            Recommendations
                          </h3>
                          <div className="space-y-2">
                            {selectedReport.ai_analysis.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-3 p-2">
                                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-cyan-400 text-xs">{index + 1}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up */}
                      {selectedReport.ai_analysis.followUp && (
                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Follow-up Needed
                          </h3>
                          <p className="text-gray-300">{selectedReport.ai_analysis.followUp}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      {selectedReport.file_content ? (
                        <>
                          <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400 mb-4">Click "AI Analyze" to get insights from your report</p>
                        </>
                      ) : (
                        <>
                          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">Report content not available for analysis</p>
                          <p className="text-sm text-gray-500 mt-2">Try uploading a text-based report</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Select a report to view details</p>
                  <p className="text-sm text-gray-500">or</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 text-purple-400 hover:text-purple-300"
                  >
                    Upload a new report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900/50 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Upload Medical Report</h2>
              <button 
                onClick={() => {
                  setShowUploadModal(false)
                  setNewReportFile(null)
                  setReportText('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  uploadMode === 'file'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  uploadMode === 'text'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Paste Text
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 mb-2">
                    {newReportFile ? newReportFile.name : 'Choose a file'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Supported formats: .txt, .pdf (text only), .doc
                  </p>
                  <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer text-sm">
                    Browse Files
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) => setNewReportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full h-48 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Paste your medical report text here..."
                />
              </div>
            )}

            <button
              onClick={handleFileUpload}
              disabled={(!newReportFile && !reportText) || uploading}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}