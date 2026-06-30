import { prisma } from '../prisma/client'

export const getMine = async (studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  return prisma.mentorship.findUnique({
    where: { studentId: student.id },
    include: {
      professional: {
        select: { id: true, firstName: true, lastName: true, jobTitle: true, profilePhoto: true },
      },
    },
  })
}

export const start = async (studentUserId: string, professionalId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const existing = await prisma.mentorship.findUnique({ where: { studentId: student.id } })
  if (existing && existing.status === 'ACTIVE') {
    throw new Error('You already have an active mentorship')
  }

  const professional = await prisma.professional.findUnique({ where: { id: professionalId } })
  if (!professional) throw new Error('Professional not found')
  if (!professional.isVerified || !professional.isActive) {
    throw new Error('Professional is not available')
  }
  if (!professional.offersPremiumTier) {
    throw new Error('This professional does not offer Premium mentorship')
  }

  const nextBillingDate = new Date()
  nextBillingDate.setDate(nextBillingDate.getDate() + 30)

  const mentorship = await prisma.mentorship.create({
    data: {
      studentId: student.id,
      professionalId,
      nextBillingDate,
    },
  })

  return mentorship
}

export const cancel = async (studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const mentorship = await prisma.mentorship.findUnique({ where: { studentId: student.id } })
  if (!mentorship || mentorship.status !== 'ACTIVE') {
    throw new Error('No active mentorship found')
  }

  return prisma.mentorship.update({
    where: { studentId: student.id },
    data: { status: 'CANCELLED' },
  })
}

export const switchProfessional = async (
  studentUserId: string,
  newProfessionalId: string
) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const mentorship = await prisma.mentorship.findUnique({ where: { studentId: student.id } })
  if (!mentorship || mentorship.status !== 'ACTIVE') {
    throw new Error('No active mentorship found')
  }

  const professional = await prisma.professional.findUnique({
    where: { id: newProfessionalId },
  })
  if (!professional?.isVerified || !professional?.isActive) {
    throw new Error('Professional is not available')
  }

  return prisma.mentorship.update({
    where: { studentId: student.id },
    data: { professionalId: newProfessionalId },
  })
}

export const getStudents = async (professionalUserId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  return prisma.mentorship.findMany({
    where: { professionalId: professional.id, status: 'ACTIVE' },
    include: {
      student: { select: { id: true, level: true, combination: true, school: true } },
    },
  })
}

export const getBilling = async (professionalUserId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const mentorships = await prisma.mentorship.findMany({
    where: { professionalId: professional.id, status: 'ACTIVE' },
    include: {
      student: true,
    },
  })

  return mentorships.map((m) => ({
    studentCode: `S${m.studentId.slice(0, 6).toUpperCase()}`,
    since: m.startDate,
    sessionsUsed: m.sessionsUsed,
    nextBillingDate: m.nextBillingDate,
    netAmount: professional.premiumRate,
  }))
}
