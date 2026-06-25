import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { Role } from "../types";

export const COMMISSION_RATE = 0.15;

interface SignupData {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  level?: string;
  schoolYear?: string;
  combination?: string;
  jobTitle?: string;
  employer?: string;
  sector?: string;
  bio?: string;
  companyName?: string;
  companySize?: string;
  contactPerson?: string;
  contactPhone?: string;
  schoolId?: string;
  roleAtSchool?: string;
  district?: string;
  yearsOfExperience?: string;
  additionalNote?: string;
}

export const signup = async (data: SignupData) => {
  const existing = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    if (data.role === "STUDENT") {
      await tx.student.create({
        data: {
          userId: newUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          level: (data.level as "O_LEVEL" | "A_LEVEL") ?? "O_LEVEL",
          schoolYear: data.schoolYear ?? "S1",
        },
      });
    }

    if (data.role === "PROFESSIONAL") {
      await tx.professional.create({
        data: {
          userId: newUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle ?? "",
          employer: data.employer ?? "",
          sector: data.sector ?? "",
          bio: data.bio ?? "",
        },
      });
    }

    if (data.role === "COMPANY") {
      await tx.company.create({
        data: {
          userId: newUser.id,
          companyName: data.companyName ?? "",
          sector: data.sector ?? "",
          description: data.bio ?? "",
          companySize: data.companySize ?? "",
          contactPerson: data.contactPerson ?? "",
          contactPhone: data.contactPhone ?? "",
        },
      });
    }

    if (data.role === "CAREER_GUIDE") {
      await tx.careerGuide.create({
        data: {
          userId: newUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.roleAtSchool ?? "",
          schoolId: data.schoolId ?? null,
        },
      });
    }

    return newUser;
  });

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
};

export const refresh = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  const payload = verifyRefreshToken(token);
  const accessToken = signAccessToken({
    userId: payload.userId,
    role: payload.role,
  });

  return { accessToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      professional: true,
      company: true,
      careerGuide: true,
    },
  });

  if (!user) throw new Error("User not found");

  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
