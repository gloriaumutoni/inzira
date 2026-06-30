import resend from '../utils/resend'

export const sendNewProfessionalNotificationToAdmin = async (
  professional: { firstName: string; lastName: string; email: string; linkedinUrl: string | null }
) => {
  await resend.emails.send({
    from: 'Inzira <noreply@inzira.app>',
    to: process.env.ADMIN_EMAIL ?? 'admin@inzira.app',
    subject: 'New professional awaiting verification',
    html: `
      <p>A new professional has signed up and is awaiting verification.</p>
      <p><strong>Name:</strong> ${professional.firstName} ${professional.lastName}</p>
      <p><strong>Email:</strong> ${professional.email}</p>
      <p><strong>LinkedIn:</strong> ${professional.linkedinUrl ?? 'Not provided'}</p>
      <p>Review and approve from the admin dashboard.</p>
    `,
  })
}

export const sendProfessionalVerificationEmail = async (
  email: string,
  data: { firstName: string; approved: boolean }
) => {
  const subject = data.approved
    ? 'Your Inzira account has been approved!'
    : 'Update on your Inzira application'

  const html = data.approved
    ? `<p>Hi ${data.firstName},</p><p>Great news — your professional account on Inzira has been verified. You can now host group sessions and accept mentorship requests from students.</p><p>Log in to get started.</p>`
    : `<p>Hi ${data.firstName},</p><p>Thank you for your interest in becoming a mentor on Inzira. Unfortunately we were unable to verify your account at this time. Please contact support if you believe this is an error.</p>`

  await resend.emails.send({
    from: 'Inzira <noreply@inzira.app>',
    to: email,
    subject,
    html,
  })
}
