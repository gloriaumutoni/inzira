import { google } from 'googleapis'
import { prisma } from '../prisma/client'

const getOAuthClient = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.warn('[GoogleCalendar] Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI env vars.')
  }
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
    prompt: 'consent',
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
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      googleCalendarConnected: true,
    },
  })
}

export const getAvailableSlots = async (professionalId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  })
  if (!professional) throw new Error('Professional not found')

  const availability = await prisma.availability.findMany({
    where: { professionalId },
  })

  const now = new Date()
  const twoWeeksOut = new Date()
  twoWeeksOut.setDate(now.getDate() + 14)

  const expandedSlots: { date: string; startTime: string; endTime: string; startISO: string; endISO: string }[] = []

  for (let d = new Date(now); d <= twoWeeksOut; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek)
    for (const slot of daySlots) {
      const start = new Date(d)
      start.setHours(slot.startHour, 0, 0, 0)
      const end = new Date(start)
      end.setHours(slot.startHour + 1, 0, 0, 0)
      if (start <= now) continue
      expandedSlots.push({
        date: start.toISOString().split('T')[0],
        startTime: `${String(slot.startHour).padStart(2, '0')}:00`,
        endTime: `${String(slot.startHour + 1).padStart(2, '0')}:00`,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      })
    }
  }

  if (!professional.googleCalendarConnected || !professional.googleRefreshToken) {
    return { slots: expandedSlots, connected: professional.googleCalendarConnected }
  }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: professional.googleRefreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  let busyTimes: { start: string; end: string }[] = []
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: twoWeeksOut.toISOString(),
        items: [{ id: 'primary' }],
      },
    })
    busyTimes = (response.data.calendars?.primary?.busy ?? []) as { start: string; end: string }[]
  } catch (err) {
    console.error('Failed to fetch Google Calendar busy times, returning all slots:', err)
  }

  const openSlots = expandedSlots.filter((slot) => {
    return !busyTimes.some((busy) => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      const slotStart = new Date(slot.startISO)
      const slotEnd = new Date(slot.endISO)
      return slotStart < busyEnd && slotEnd > busyStart
    })
  })

  return { slots: openSlots, connected: true }
}

export const createEvent = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      professional: true,
      student: true,
    },
  })

  if (!session || !session.professional.googleCalendarConnected || !session.professional.googleRefreshToken) return null

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: session.professional.googleRefreshToken })

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
