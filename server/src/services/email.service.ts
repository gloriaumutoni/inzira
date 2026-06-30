import { getResend } from '../utils/resend'

type VerificationRoleLabel = 'Professional' | 'Career Guide' | 'Mentor Application'

export const sendAdminVerificationAlert = async (data: {
  roleLabel: VerificationRoleLabel
  firstName: string
  lastName: string
  email: string
  linkedinUrl: string | null
}): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn(`ADMIN_EMAIL not set — skipping admin alert for ${data.roleLabel} signup (${data.email})`)
    return
  }

  const resend = getResend()
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping admin alert for ${data.roleLabel} signup (${data.email})`)
    return
  }

  try {
    await resend.emails.send({
      from: 'Inzira <noreply@inzira.app>',
      to: adminEmail,
      subject: `New ${data.roleLabel.toLowerCase()} awaiting approval`,
      html: `
        <p>A new ${data.roleLabel.toLowerCase()} request is waiting for your review.</p>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>LinkedIn:</strong> ${data.linkedinUrl ?? 'Not provided'}</p>
        <p>Log in to the admin dashboard to review and respond.</p>
      `,
    })
    console.log(`Admin alert sent for ${data.roleLabel}: ${data.email}`)
  } catch (err) {
    console.error(`Failed to send admin alert for ${data.roleLabel} (${data.email}):`, err)
  }
}

export const sendVerificationResultAlert = async (data: {
  roleLabel: VerificationRoleLabel
  email: string
  firstName: string
  approved: boolean
}): Promise<void> => {
  const resend = getResend()
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping verification result email to ${data.email}`)
    return
  }

  const subject = data.approved
    ? `Your Inzira ${data.roleLabel.toLowerCase()} request has been approved`
    : `Update on your Inzira ${data.roleLabel.toLowerCase()} request`

  const approvedCopy = data.roleLabel === 'Mentor Application'
    ? `<p>Hi ${data.firstName},</p><p>Your mentor application has been approved. You can now host group sessions and accept mentorship requests from students. Log in to get started.</p>`
    : `<p>Hi ${data.firstName},</p><p>Your ${data.roleLabel.toLowerCase()} account on Inzira has been approved. Log in to your dashboard to get started.</p>`

  const declinedCopy = data.roleLabel === 'Mentor Application'
    ? `<p>Hi ${data.firstName},</p><p>Thank you for applying to become a mentor on Inzira. We were unable to approve your application at this time.</p>`
    : `<p>Hi ${data.firstName},</p><p>Thank you for your interest in joining Inzira as a ${data.roleLabel.toLowerCase()}. We were unable to approve your request at this time.</p>`

  try {
    await resend.emails.send({
      from: 'Inzira <noreply@inzira.app>',
      to: data.email,
      subject,
      html: data.approved ? approvedCopy : declinedCopy,
    })
    console.log(`Verification result email sent to ${data.email}: ${data.approved ? 'approved' : 'declined'} (${data.roleLabel})`)
  } catch (err) {
    console.error(`Failed to send verification result email to ${data.email} (${data.roleLabel}):`, err)
  }
}
