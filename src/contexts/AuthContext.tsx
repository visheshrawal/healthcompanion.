import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { sendVerificationEmail } from '../lib/resend'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: 'patient' | 'doctor', metadata?: any) => Promise<{ success: boolean; message: string }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, role: 'patient' | 'doctor', metadata?: any) => {
    try {
      // Create user with email confirmation disabled (we use Resend)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: fullName,
            role: role,
            ...metadata
          }
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              role: role,
              email: email
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't throw - user is still created
          }
        }

        // If doctor, create doctor profile (only if doesn't exist)
        if (role === 'doctor' && metadata) {
          const { data: existingDoctor } = await supabase
            .from('doctor_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!existingDoctor) {
            const { error: doctorError } = await supabase
              .from('doctor_profiles')
              .insert({
                id: data.user.id,
                license_number: metadata.licenseNumber,
                specialization: metadata.specialization,
                experience_years: metadata.experience || 0,
                consultation_fee: metadata.consultationFee || 0
              })

            if (doctorError) {
              console.error('Doctor profile creation error:', doctorError)
              // Don't throw - user is still created
            }
          }
        }

        // Create verification token
        const token = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)
        
        // Delete any existing tokens for this user first
        await supabase
          .from('verification_tokens')
          .delete()
          .eq('user_id', data.user.id)
        
        // Create new token
        await supabase
          .from('verification_tokens')
          .insert({
            user_id: data.user.id,
            token,
            email,
            expires_at: expiresAt.toISOString()
          })
        
        // Send verification email
        await sendVerificationEmail(email, token, fullName)
      }

      return { 
        success: true, 
        message: 'Please check your email to verify your account.' 
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        message: error.message || 'Failed to create account' 
      }
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      // Find and validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('token', token)
        .single()

      if (tokenError || !tokenData) {
        return { success: false, message: 'Invalid or expired verification link' }
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return { success: false, message: 'Verification link has expired' }
      }

      if (tokenData.verified_at) {
        return { success: false, message: 'Email already verified' }
      }

      // Mark token as verified
      await supabase
        .from('verification_tokens')
        .update({ verified_at: new Date().toISOString() })
        .eq('token', token)

      return { success: true, message: 'Email verified successfully!' }
    } catch (error: any) {
      console.error('Verification error:', error)
      return { success: false, message: error.message }
    }
  }

  const resendVerification = async (email: string) => {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        return { success: false, message: 'No account found with this email' }
      }

      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)
      
      // Delete old tokens
      await supabase
        .from('verification_tokens')
        .delete()
        .eq('user_id', userData.id)
      
      // Create new token
      await supabase
        .from('verification_tokens')
        .insert({
          user_id: userData.id,
          token,
          email,
          expires_at: expiresAt.toISOString()
        })
      
      await sendVerificationEmail(email, token, userData.full_name)

      return { success: true, message: 'Verification email sent!' }
    } catch (error: any) {
      console.error('Resend error:', error)
      return { success: false, message: error.message }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signOut,
      resendVerification,
      verifyEmail
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}