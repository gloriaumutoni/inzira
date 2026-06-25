import { prisma } from "../prisma/client";

export const list = async () => {
  return prisma.school.findMany({
    include: {
      careerGuide: { include: { user: { select: { email: true } } } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const listPublic = async () => {
  return prisma.school.findMany({
    where: { isActive: true },
    select: { id: true, name: true, district: true },
    orderBy: { name: "asc" },
  });
};

export const create = async (data: { name: string; district: string }) => {
  return prisma.school.create({ data });
};

export const getOne = async (id: string) => {
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      careerGuide: { include: { user: { select: { email: true } } } },
      _count: { select: { students: true } },
    },
  });
  if (!school) throw new Error("School not found");
  return school;
};

export const update = async (
  id: string,
  data: { name?: string; district?: string; isActive?: boolean },
) => {
  return prisma.school.update({ where: { id }, data });
};

export const assignCareerGuide = async (schoolId: string, email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { careerGuide: true },
  });

  if (!user) throw new Error("No user found with this email");
  if (user.role !== "CAREER_GUIDE")
    throw new Error("This user is not a career guide");
  if (!user.careerGuide) throw new Error("Career guide profile not found");

  return prisma.careerGuide.update({
    where: { id: user.careerGuide.id },
    data: { schoolId },
  });
};
