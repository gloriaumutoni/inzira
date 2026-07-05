import resend from '../utils/resend'

const FROM = 'Inzira <noreply@inzira.rw>'
const BASE = 'https://inzira.rw'

function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:2px;">INZIRA</span>
              <span style="color:#64748b;font-size:13px;margin-left:8px;">Career Guidance</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
                &copy; ${new Date().getFullYear()} Inzira &mdash; Rwanda&rsquo;s career guidance platform.<br />
                This email was sent to you because you have an account on Inzira.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;margin-top:20px;">${text}</a>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${text}</p>`
}

function h2(text: string): string {
  return `<h2 style="margin:0 0 20px;color:#0f172a;font-size:20px;font-weight:bold;">${text}</h2>`
}

function fmt(date: Date): string {
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }) + ' (Kigali time)'
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

export async function notifyAdminNewProfessionalVerification(prof: {
  firstName: string
  lastName: string
  email: string
}) {
  const to = adminEmail()
  if (!to) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'New Professional Verification Request',
    html: layout(
      'New Professional Verification Request',
      h2('New Verification Request') +
      p(`<strong>${prof.firstName} ${prof.lastName}</strong> (${prof.email}) has submitted a professional verification request and is awaiting review.`) +
      btn('Review in Dashboard', `${BASE}/admin/professionals`)
    ),
  })
}

export async function notifyAdminNewCareerGuideVerification(guide: {
  firstName: string
  lastName: string
  email: string
}) {
  const to = adminEmail()
  if (!to) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'New Career Guide Verification Request',
    html: layout(
      'New Career Guide Verification Request',
      h2('New Career Guide Application') +
      p(`<strong>${guide.firstName} ${guide.lastName}</strong> (${guide.email}) has submitted a career guide verification request and is awaiting review.`) +
      btn('Review in Dashboard', `${BASE}/admin/career-guides`)
    ),
  })
}

export async function notifyAdminNewMentorApplication(prof: {
  firstName: string
  lastName: string
  email: string
}) {
  const to = adminEmail()
  if (!to) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'New Mentor Application',
    html: layout(
      'New Mentor Application',
      h2('New Mentor Application') +
      p(`<strong>${prof.firstName} ${prof.lastName}</strong> (${prof.email}) has applied to become a mentor on Inzira.`) +
      btn('Review Applications', `${BASE}/admin/mentors`)
    ),
  })
}

export async function notifyAdminNewCareerStory(prof: {
  firstName: string
  lastName: string
}, storyTitle: string) {
  const to = adminEmail()
  if (!to) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'New Career Story Pending Review',
    html: layout(
      'New Career Story Pending Review',
      h2('New Career Story Submitted') +
      p(`<strong>${prof.firstName} ${prof.lastName}</strong> submitted a career story <em>&ldquo;${storyTitle}&rdquo;</em> for review.`) +
      btn('Review Stories', `${BASE}/admin/career-stories`)
    ),
  })
}

// ── PROFESSIONAL ─────────────────────────────────────────────────────────────

export async function notifyProfessionalApplicationReceived(prof: {
  firstName: string
  email: string
}) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'We received your Inzira application',
    html: layout(
      'Application Received',
      h2(`Thanks for applying, ${prof.firstName}!`) +
      p('We received your professional profile and it is now awaiting review by our team.') +
      p('We will email you as soon as a decision has been made.') +
      btn('View Your Dashboard', `${BASE}/professional/home`)
    ),
  })
}

export async function notifyProfessionalVerificationApproved(prof: {
  firstName: string
  email: string
}) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Your Inzira profile is verified',
    html: layout(
      'Profile Verified',
      h2(`Congratulations, ${prof.firstName}!`) +
      p('Your professional profile has been reviewed and verified. Students can now discover and book sessions with you on Inzira.') +
      btn('View Your Profile', `${BASE}/professional/profile`)
    ),
  })
}

export async function notifyProfessionalVerificationRejected(prof: {
  firstName: string
  email: string
}, reason: string) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Update on your Inzira verification',
    html: layout(
      'Verification Update',
      h2(`Hi ${prof.firstName},`) +
      p('We reviewed your professional profile and were unable to approve it at this time.') +
      p(`<strong>Reason:</strong> ${reason || 'Does not meet current requirements.'}`) +
      p('You may update your profile information and reapply.') +
      btn('Update Your Profile', `${BASE}/professional/home`)
    ),
  })
}

export async function notifyProfessionalMentorApproved(prof: {
  firstName: string
  email: string
}) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: "You're now an Inzira Mentor",
    html: layout(
      'Mentor Application Approved',
      h2(`Welcome to the mentor programme, ${prof.firstName}!`) +
      p('Your mentor application has been approved. You can now create mentor slots and guide students on their career journeys.') +
      btn('Set Up Mentor Slots', `${BASE}/professional/mentor`)
    ),
  })
}

export async function notifyProfessionalMentorRejected(prof: {
  firstName: string
  email: string
}, reason: string) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Update on your Inzira mentor application',
    html: layout(
      'Mentor Application Update',
      h2(`Hi ${prof.firstName},`) +
      p('We reviewed your mentor application and were unable to approve it at this time.') +
      p(`<strong>Reason:</strong> ${reason || 'Does not meet current requirements.'}`) +
      p('You may reapply once you have addressed the feedback above.') +
      btn('View Dashboard', `${BASE}/professional/home`)
    ),
  })
}

export async function notifyProfessionalNewSessionRequest(
  prof: { firstName: string; email: string },
  student: { firstName: string; lastName: string },
  session: { scheduledAt: Date; type: string }
) {
  const typeLabel = session.type.replaceAll('_', ' ')
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'New session request on Inzira',
    html: layout(
      'New Session Request',
      h2(`New session request, ${prof.firstName}`) +
      p(`<strong>${student.firstName} ${student.lastName}</strong> has requested a <strong>${typeLabel}</strong> session with you.`) +
      p(`<strong>Proposed time:</strong> ${fmt(session.scheduledAt)}`) +
      p('Please confirm or decline this request from your dashboard.') +
      btn('Review Request', `${BASE}/professional/sessions`)
    ),
  })
}

export async function notifyProfessionalSessionCancelled(
  prof: { firstName: string; email: string },
  student: { firstName: string; lastName: string },
  session: { scheduledAt: Date }
) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'A student cancelled their session',
    html: layout(
      'Session Cancelled',
      h2(`Hi ${prof.firstName},`) +
      p(`<strong>${student.firstName} ${student.lastName}</strong> has cancelled their session scheduled for <strong>${fmt(session.scheduledAt)}</strong>.`) +
      btn('View Sessions', `${BASE}/professional/sessions`)
    ),
  })
}

export async function notifyProfessionalGroupSessionFull(
  prof: { firstName: string; email: string },
  gs: { title: string; scheduledAt: Date }
) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Your group session is full',
    html: layout(
      'Group Session Full',
      h2(`Your session is full, ${prof.firstName}!`) +
      p(`Your group session <strong>&ldquo;${gs.title}&rdquo;</strong> scheduled for <strong>${fmt(gs.scheduledAt)}</strong> has reached maximum capacity.`) +
      btn('View Group Sessions', `${BASE}/professional/group-sessions`)
    ),
  })
}

export async function notifyProfessionalCareerStoryPublished(
  prof: { firstName: string; email: string },
  storyTitle: string
) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Your career story is now live',
    html: layout(
      'Career Story Published',
      h2(`Your story is live, ${prof.firstName}!`) +
      p(`Your career story <strong>&ldquo;${storyTitle}&rdquo;</strong> has been approved and is now visible to students in the Inzira Career Library.`) +
      btn('View Career Library', `${BASE}/career-library`)
    ),
  })
}

export async function notifyProfessionalCareerStoryRejected(
  prof: { firstName: string; email: string },
  storyTitle: string,
  reason: string
) {
  await resend.emails.send({
    from: FROM,
    to: prof.email,
    subject: 'Update on your career story',
    html: layout(
      'Career Story Update',
      h2(`Hi ${prof.firstName},`) +
      p(`Your career story <strong>&ldquo;${storyTitle}&rdquo;</strong> could not be published at this time.`) +
      p(`<strong>Reason:</strong> ${reason}`) +
      p('You can edit and resubmit your story from your dashboard.') +
      btn('Edit Your Story', `${BASE}/professional/career-stories`)
    ),
  })
}

// ── STUDENT ──────────────────────────────────────────────────────────────────

export async function notifyStudentSessionConfirmed(
  student: { firstName: string; email: string },
  prof: { firstName: string; lastName: string },
  session: { scheduledAt: Date; type: string }
) {
  const typeLabel = session.type.replaceAll('_', ' ')
  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: 'Your session is confirmed',
    html: layout(
      'Session Confirmed',
      h2(`Session confirmed, ${student.firstName}!`) +
      p(`Your <strong>${typeLabel}</strong> session with <strong>${prof.firstName} ${prof.lastName}</strong> is confirmed.`) +
      p(`<strong>When:</strong> ${fmt(session.scheduledAt)}`) +
      btn('View Session Details', `${BASE}/sessions`)
    ),
  })
}

export async function notifyStudentSessionDeclined(
  student: { firstName: string; email: string },
  prof: { firstName: string; lastName: string },
  session: { scheduledAt: Date },
  reason: string
) {
  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: 'Your session request was not accepted',
    html: layout(
      'Session Declined',
      h2(`Hi ${student.firstName},`) +
      p(`<strong>${prof.firstName} ${prof.lastName}</strong> was unable to accept your session request for <strong>${fmt(session.scheduledAt)}</strong>.`) +
      (reason ? p(`<strong>Reason:</strong> ${reason}`) : '') +
      p('You can book with another professional or choose a different time.') +
      btn('Find a Professional', `${BASE}/professionals`)
    ),
  })
}

export async function notifyStudentSessionCancelled(
  student: { firstName: string; email: string },
  prof: { firstName: string; lastName: string },
  session: { scheduledAt: Date }
) {
  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: 'Your session has been cancelled',
    html: layout(
      'Session Cancelled',
      h2(`Hi ${student.firstName},`) +
      p(`<strong>${prof.firstName} ${prof.lastName}</strong> has cancelled your session scheduled for <strong>${fmt(session.scheduledAt)}</strong>.`) +
      p('You can book a new session from your dashboard.') +
      btn('Book a Session', `${BASE}/professionals`)
    ),
  })
}

export async function notifyStudentGroupEnrolmentConfirmed(
  student: { firstName: string; email: string },
  gs: { title: string; scheduledAt: Date; joinLink?: string | null }
) {
  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: `You're enrolled: ${gs.title}`,
    html: layout(
      'Enrolment Confirmed',
      h2(`You're in, ${student.firstName}!`) +
      p(`Your enrolment in <strong>&ldquo;${gs.title}&rdquo;</strong> is confirmed.`) +
      p(`<strong>When:</strong> ${fmt(gs.scheduledAt)}`) +
      (gs.joinLink
        ? p(`<strong>Join link:</strong> <a href="${gs.joinLink}" style="color:#0f172a;">${gs.joinLink}</a>`)
        : '') +
      btn('View My Sessions', `${BASE}/sessions`)
    ),
  })
}

export async function notifyStudentGroupSessionCancelled(
  student: { firstName: string; email: string },
  gs: { title: string; scheduledAt: Date }
) {
  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: `Group session cancelled: ${gs.title}`,
    html: layout(
      'Group Session Cancelled',
      h2(`Hi ${student.firstName},`) +
      p(`The group session <strong>&ldquo;${gs.title}&rdquo;</strong> scheduled for <strong>${fmt(gs.scheduledAt)}</strong> has been cancelled.`) +
      p('Browse other upcoming sessions on Inzira.') +
      btn('Browse Group Sessions', `${BASE}/sessions`)
    ),
  })
}

// ── CAREER GUIDE ─────────────────────────────────────────────────────────────

export async function notifyCareerGuideVerificationApproved(guide: {
  firstName: string
  email: string
}) {
  await resend.emails.send({
    from: FROM,
    to: guide.email,
    subject: 'Your Inzira career guide account is verified',
    html: layout(
      'Career Guide Verified',
      h2(`Welcome to Inzira, ${guide.firstName}!`) +
      p('Your career guide account has been verified. You can now support students in their career discovery journey.') +
      btn('Go to Dashboard', `${BASE}/career-guide/home`)
    ),
  })
}

export async function notifyCareerGuideVerificationRejected(guide: {
  firstName: string
  email: string
}, reason: string) {
  await resend.emails.send({
    from: FROM,
    to: guide.email,
    subject: 'Update on your Inzira career guide application',
    html: layout(
      'Career Guide Application Update',
      h2(`Hi ${guide.firstName},`) +
      p('We reviewed your career guide application and were unable to approve it at this time.') +
      p(`<strong>Reason:</strong> ${reason || 'Does not meet current requirements.'}`) +
      btn('Contact Support', `${BASE}/support`)
    ),
  })
}

export async function notifyAdminSessionReported(
  report: { reason: string; description?: string },
  session: { id: string; scheduledAt: Date },
  student: { firstName: string; lastName: string },
  professional: { firstName: string; lastName: string }
) {
  const to = adminEmail()
  if (!to) return
  const reasonLabel = report.reason.replaceAll('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
  await resend.emails.send({
    from: FROM,
    to,
    subject: `[Safety] Session report submitted — ${reasonLabel}`,
    html: layout(
      'Session Report',
      h2('A session has been reported') +
      p(`<strong>Student:</strong> ${student.firstName} ${student.lastName}`) +
      p(`<strong>Professional:</strong> ${professional.firstName} ${professional.lastName}`) +
      p(`<strong>Session date:</strong> ${fmt(session.scheduledAt)}`) +
      p(`<strong>Reason:</strong> ${reasonLabel}`) +
      (report.description ? p(`<strong>Details:</strong> ${report.description}`) : '') +
      btn('Review in Dashboard', `${BASE}/admin/session-reports`)
    ),
  })
}
