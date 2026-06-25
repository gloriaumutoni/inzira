import { google } from 'googleapis'
import { prisma } from '../prisma/client'

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export const getAuthUrl = (professionalId: string) => {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: professionalId,
  })
}

export const handleCallback = async (code: string, professionalId: string) => {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  return prisma.professional.update({
    where: { id: professionalId },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token ?? undefined,
      googleTokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
    },
  })
}

export const getAvailableSlots = async (professionalId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  })

  if (!professional?.googleAccessToken) {
    return { slots: [], connected: false }
  }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: professional.googleAccessToken,
    refresh_token: professional.googleRefreshToken ?? undefined,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const now = new Date()
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      items: [{ id: 'primary' }],
    },
  })

  const busy = freebusy.data.calendars?.primary?.busy ?? []
  return { slots: busy, connected: true }
}

export const createEvent = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      professional: true,
      student: true,
    },
  })

  if (!session || !session.professional.googleAccessToken) return null

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: session.professional.googleAccessToken,
    refresh_token: session.professional.googleRefreshToken ?? undefined,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const endTime = new Date(
    session.scheduledAt.getTime() + session.duration * 60 * 1000
  )

  return calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Inzira Session — ${session.professional.firstName} ${session.professional.lastName}`,
      description: `Session type: ${session.type}`,
      start: { dateTime: session.scheduledAt.toISOString() },
      end: { dateTime: endTime.toISOString() },
    },
  })
}

export const disconnect = async (professionalUserId: string) => {
  return prisma.professional.update({
    where: { userId: professionalUserId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  })
}
