import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('patient' | 'doctor')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      let role = user.user_metadata?.role;

      try {
        // First check if they have a doctor profile since we implicitly trust it.
        const { data: doctorProfile } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('id', user.id)
          .single()
          
        if (doctorProfile) {
          role = 'doctor';
        } else {
          // Fallback to user_profiles
          const { data, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (!error && data?.role) {
            role = data.role;
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setUserRole(role || 'patient')
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If allowedRoles is specified, check if user's role is allowed
  if (allowedRoles && userRole && !allowedRoles.includes(userRole as 'patient' | 'doctor')) {
    // Redirect to the correct dashboard based on role
    if (userRole === 'doctor') {
      return <Navigate to="/doctor/dashboard" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

// Convenience components for role-specific routes
export function PatientRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['patient']}>{children}</ProtectedRoute>
}

export function DoctorRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['doctor']}>{children}</ProtectedRoute>
}