import { Resend } from 'resend'

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY

if (!resendApiKey) {
  console.warn('Missing Resend API key - email features will be disabled')
}

export const resend = new Resend(resendApiKey)

export async function sendVerificationEmail(email: string, token: string, name: string) {
  try {
    const verificationLink = `${window.location.origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    
    const { data, error } = await resend.emails.send({
      from: 'HealthCompanion <onboarding@resend.dev>', // Change to your domain later
      to: [email],
      subject: 'Verify your HealthCompanion account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%); color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                HealthCompanion
              </h1>
              <p style="color: #9ca3af; margin-top: 8px;">Your AI Health Guardian</p>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px; backdrop-filter: blur(10px);">
              <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 16px; color: #ffffff;">
                Welcome, ${name}! 👋
              </h2>
              
              <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 24px;">
                Thanks for joining HealthCompanion! To get started, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #0891b2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; box-shadow: 0 10px 25px -5px rgba(147, 51, 234, 0.4);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                Or copy and paste this link in your browser:<br>
                <span style="color: #a855f7; word-break: break-all;">${verificationLink}</span>
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  This link will expire in 24 hours. If you didn't create an account with HealthCompanion, you can safely ignore this email.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 32px;">
              <p style="color: #6b7280; font-size: 14px;">
                © 2026 HealthCompanion. All rights reserved.
              </p>
              <p style="color: #4b5563; font-size: 12px; margin-top: 8px;">
                HealthCompanion - Your AI-powered health companion
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendAppointmentConfirmation(
  email: string, 
  name: string, 
  appointmentDetails: {
    doctorName: string
    date: string
    time: string
    type: string
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HealthCompanion <onboarding@resend.dev>',
      to: [email],
      subject: 'Appointment Confirmed - HealthCompanion',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%); color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                HealthCompanion
              </h1>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px;">
              <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 16px; color: #ffffff;">
                Appointment Confirmed! 🎉
              </h2>
              
              <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 24px;">
                Hi ${name}, your appointment has been confirmed.
              </p>
              
              <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <div style="margin-bottom: 12px;">
                  <span style="color: #a855f7; font-weight: 600;">Doctor:</span>
                  <span style="color: #ffffff; margin-left: 8px;">Dr. ${appointmentDetails.doctorName}</span>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="color: #a855f7; font-weight: 600;">Date:</span>
                  <span style="color: #ffffff; margin-left: 8px;">${appointmentDetails.date}</span>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="color: #a855f7; font-weight: 600;">Time:</span>
                  <span style="color: #ffffff; margin-left: 8px;">${appointmentDetails.time}</span>
                </div>
                <div>
                  <span style="color: #a855f7; font-weight: 600;">Type:</span>
                  <span style="color: #ffffff; margin-left: 8px;">${appointmentDetails.type}</span>
                </div>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5;">
                You'll receive a reminder 1 hour before your appointment. You can join the consultation from your dashboard.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'HealthCompanion <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset Your Password - HealthCompanion',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #020617 0%, #1e1b4b 100%); color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">
                HealthCompanion
              </h1>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px;">
              <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 16px; color: #ffffff;">
                Reset Your Password
              </h2>
              
              <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 24px;">
                Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9333ea 0%, #0891b2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}