import { prisma } from '../prisma/client'
import { SessionReportReason, SessionReportStatus } from '@prisma/client'
import * as emailService from './email.service'

export async function reportSession(
  userId: string,
  sessionId: string,
  reason: SessionReportReason,
  description?: string
) {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      student: { select: { firstName: true, lastName: true } },
      professional: { select: { firstName: true, lastName: true } },
    },
  })
  if (!session) throw new Error('Session not found')
  if (session.studentId !== student.id) throw new Error('Access denied')
  if (session.status !== 'COMPLETED') throw new Error('Can only report completed sessions')

  const report = await prisma.sessionReport.create({
    data: { sessionId, reportedBy: userId, reason, description },
  })

  await emailService.notifyAdminSessionReported(
    { reason, description },
    { id: session.id, scheduledAt: session.scheduledAt },
    { firstName: session.student.firstName, lastName: session.student.lastName },
    { firstName: session.professional.firstName, lastName: session.professional.lastName }
  )

  return report
}

export async function reportGroupSession(
  userId: string,
  groupSessionId: string,
  reason: SessionReportReason,
  description?: string
) {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const groupSession = await prisma.groupSession.findUnique({
    where: { id: groupSessionId },
    include: { professional: { select: { firstName: true, lastName: true } } },
  })
  if (!groupSession) throw new Error('Session not found')

  const enrolment = await prisma.groupSessionEnrolment.findUnique({
    where: { groupSessionId_studentId: { groupSessionId, studentId: student.id } },
  })
  if (!enrolment) throw new Error('You were not enrolled in this session')
  if (new Date(groupSession.scheduledAt) > new Date()) throw new Error('Can only report past sessions')

  const report = await prisma.sessionReport.create({
    data: { groupSessionId, reportedBy: userId, reason, description },
  })

  await emailService.notifyAdminSessionReported(
    { reason, description },
    { id: groupSession.id, scheduledAt: groupSession.scheduledAt },
    { firstName: student.firstName, lastName: student.lastName },
    { firstName: groupSession.professional.firstName, lastName: groupSession.professional.lastName }
  )

  return report
}

export async function adminListReports(status?: string) {
  return prisma.sessionReport.findMany({
    where: status ? { status: status as SessionReportStatus } : undefined,
    include: {
      session: {
        include: {
          student: { select: { firstName: true, lastName: true } },
          professional: { select: { id: true, firstName: true, lastName: true, isActive: true } },
        },
      },
      groupSession: {
        include: {
          professional: { select: { id: true, firstName: true, lastName: true, isActive: true } },
        },
      },
      reporter: { select: { id: true, email: true, student: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function adminUpdateReport(id: string, status: SessionReportStatus) {
  return prisma.sessionReport.update({
    where: { id },
    data: { status },
  })
}
