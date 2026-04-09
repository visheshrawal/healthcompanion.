import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // FORCE update their metadata to the role they selected on login
        // This rescues developers testing with the same email accounts
        await supabase.auth.updateUser({ data: { role: selectedRole } })

        try {
          // Upsert the profile to guarantee the database matches the forced login role
          await supabase.from('user_profiles').upsert({
            id: user.id,
            role: selectedRole,
            full_name: user.user_metadata?.full_name || email,
            email: email
          }, { onConflict: 'id' })

          if (selectedRole === 'doctor') {
            await supabase.from('doctor_profiles').upsert({
              id: user.id,
            }, { onConflict: 'id' }).select()
          }
        } catch (dbErr) {
          console.error("Failed to force update user profiles", dbErr)
        }

        if (selectedRole === 'doctor') {
          navigate('/doctor/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-purple-500 fill-purple-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              HealthCompanion
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Login as</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('patient')}
                  className={`flex-1 py-2 rounded-lg border transition-all ${
                    selectedRole === 'patient'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('doctor')}
                  className={`flex-1 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    selectedRole === 'doctor'
                      ? 'bg-cyan-600 border-cyan-500 text-white'
                      : 'bg-white/10 border-white/20 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}