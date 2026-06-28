import { prisma } from "../prisma/client";

const GOOGLE_MEET_REGEX =
  /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/i;

const parseDateValue = (value: string, fieldName: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return parsed;
};

const parseTimeToMinutes = (time: string) => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const toWorkshopSchedule = (
  date: string,
  startTime: string,
  endTime: string,
) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    throw new Error("Invalid start/end time");
  }

  const day = date.slice(0, 10);
  const scheduledAt = parseDateValue(
    `${day}T${startTime}:00`,
    "date/startTime",
  );
  return { scheduledAt, duration: endMinutes - startMinutes };
};

export const list = async (filters: {
  sector?: string;
  format?: string;
  upcomingOnly?: boolean;
  page?: number;
  limit?: number;
}) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (filters.sector) where.sector = filters.sector;
  if (filters.format) where.format = filters.format;
  if (filters.upcomingOnly) where.scheduledAt = { gte: new Date() };

  const [workshops, total] = await Promise.all([
    prisma.workshop.findMany({
      where,
      skip,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true, logoUrl: true } },
        agendaItems: { orderBy: { order: "asc" } },
        _count: { select: { registrations: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.workshop.count({ where }),
  ]);

  return { workshops, total, page, limit };
};

export const getOwn = async (companyUserId: string) => {
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
  });
  if (!company) throw new Error("Company not found");

  return prisma.workshop.findMany({
    where: { companyId: company.id },
    include: {
      agendaItems: { orderBy: { order: "asc" } },
      _count: { select: { registrations: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });
};

export const getOne = async (id: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, companyName: true, logoUrl: true } },
      agendaItems: { orderBy: { order: "asc" } },
      _count: { select: { registrations: true } },
    },
  });
  if (!workshop) throw new Error("Workshop not found");
  return workshop;
};

export const create = async (
  companyUserId: string,
  data: {
    title: string;
    description: string;
    sector: string;
    format: "IN_PERSON" | "ONLINE";
    location?: string;
    meetingLink?: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    registrationDeadline: string;
    contactPerson: string;
    contactEmail: string;
    hasRefreshments?: boolean;
    hasCertificate?: boolean;
    specialRequirements?: string;
    agendaItems?: { order: number; content: string }[];
  },
) => {
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
  });
  if (!company) throw new Error("Company not found");
  if (!company.isVerified)
    throw new Error("Your account must be verified before creating workshops");

  const requiredStringFields: Array<keyof typeof data> = [
    "title",
    "description",
    "sector",
    "format",
    "date",
    "startTime",
    "endTime",
    "registrationDeadline",
    "contactPerson",
    "contactEmail",
  ];

  for (const field of requiredStringFields) {
    const value = data[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`${field} is required`);
    }
  }

  if (!Number.isFinite(data.capacity) || data.capacity < 1) {
    throw new Error("capacity is required and must be greater than 0");
  }

  if (data.format === "ONLINE") {
    if (!data.meetingLink?.trim()) {
      throw new Error("meetingLink is required for online workshops");
    }
    if (!GOOGLE_MEET_REGEX.test(data.meetingLink.trim())) {
      throw new Error("meetingLink must be a valid Google Meet link");
    }
  }

  if (data.format === "IN_PERSON" && !data.location?.trim()) {
    throw new Error("location is required for in-person workshops");
  }

  const { scheduledAt, duration } = toWorkshopSchedule(
    data.date,
    data.startTime,
    data.endTime,
  );
  const registrationDeadline = parseDateValue(
    data.registrationDeadline,
    "registrationDeadline",
  );

  if (registrationDeadline > scheduledAt) {
    throw new Error("registrationDeadline must be before workshop start time");
  }

  return prisma.workshop.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      sector: data.sector.trim(),
      format: data.format,
      location: data.format === "IN_PERSON" ? data.location?.trim() : null,
      meetingLink: data.format === "ONLINE" ? data.meetingLink?.trim() : null,
      scheduledAt,
      duration,
      maxRegistrations: Math.round(data.capacity),
      registrationDeadline,
      contactPerson: data.contactPerson.trim(),
      contactEmail: data.contactEmail.trim(),
      hasRefreshments: data.hasRefreshments ?? false,
      hasCertificate: data.hasCertificate ?? false,
      specialRequirements: data.specialRequirements?.trim() || undefined,
      companyId: company.id,
      agendaItems: data.agendaItems?.length
        ? { create: data.agendaItems }
        : undefined,
    },
    include: { agendaItems: true },
  });
};

export const update = async (
  id: string,
  companyUserId: string,
  data: Record<string, unknown>,
) => {
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
  });
  if (!company) throw new Error("Company not found");

  const workshop = await prisma.workshop.findUnique({ where: { id } });
  if (!workshop) throw new Error("Workshop not found");
  if (workshop.companyId !== company.id) throw new Error("Access denied");

  const { scheduledAt, registrationDeadline, ...rest } = data as {
    scheduledAt?: string;
    registrationDeadline?: string;
    [key: string]: unknown;
  };

  return prisma.workshop.update({
    where: { id },
    data: {
      ...rest,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : undefined,
    },
  });
};

export const publish = async (id: string, companyUserId: string) => {
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
  });
  if (!company) throw new Error("Company not found");

  const workshop = await prisma.workshop.findUnique({ where: { id } });
  if (!workshop) throw new Error("Workshop not found");
  if (workshop.companyId !== company.id) throw new Error("Access denied");
  if (workshop.status !== "DRAFT")
    throw new Error("Only draft workshops can be published");

  return prisma.workshop.update({ where: { id }, data: { status: "ACTIVE" } });
};

export const cancelWorkshop = async (
  id: string,
  requestingUserId: string,
  role: string,
) => {
  const workshop = await prisma.workshop.findUnique({ where: { id } });
  if (!workshop) throw new Error("Workshop not found");

  if (role === "COMPANY") {
    const company = await prisma.company.findUnique({
      where: { userId: requestingUserId },
    });
    if (workshop.companyId !== company?.id) throw new Error("Access denied");
  }

  return prisma.workshop.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
};

export const register = async (workshopId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) throw new Error("Student not found");

  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!workshop) throw new Error("Workshop not found");
  if (workshop.status !== "ACTIVE")
    throw new Error("Workshop is not available for registration");
  if (
    workshop.registrationDeadline &&
    workshop.registrationDeadline < new Date()
  ) {
    throw new Error("Registration deadline has passed");
  }
  if (
    workshop.maxRegistrations &&
    workshop._count.registrations >= workshop.maxRegistrations
  ) {
    throw new Error("Workshop is full");
  }

  const existing = await prisma.workshopRegistration.findUnique({
    where: { workshopId_studentId: { workshopId, studentId: student.id } },
  });
  if (existing) throw new Error("You are already registered for this workshop");

  return prisma.workshopRegistration.create({
    data: { workshopId, studentId: student.id },
  });
};

export const unregister = async (workshopId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) throw new Error("Student not found");

  return prisma.workshopRegistration.delete({
    where: { workshopId_studentId: { workshopId, studentId: student.id } },
  });
};

export const getRegistrations = async (
  workshopId: string,
  requestingUserId: string,
  role: string,
) => {
  if (role === "COMPANY") {
    const company = await prisma.company.findUnique({
      where: { userId: requestingUserId },
    });
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
    });
    if (workshop?.companyId !== company?.id) throw new Error("Access denied");
  }

  const registrations = await prisma.workshopRegistration.findMany({
    where: { workshopId },
    include: {
      student: { include: { school: true } },
    },
    orderBy: { registeredAt: "desc" },
  });

  return registrations.map((r) => ({
    code: `S${r.student.id.slice(0, 6).toUpperCase()}`,
    school: r.student.school?.name ?? "Unknown",
    level: r.student.level,
    combination: r.student.combination,
    registeredAt: r.registeredAt,
  }));
};
