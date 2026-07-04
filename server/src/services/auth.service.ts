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
  schoolId?: string;
  linkedinUrl?: string;
  confidence?: number;
}

export const signup = async (data: SignupData) => {
  const existing = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error('An account with this email already exists. Please sign in instead.');
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
          confidenceLevel: data.confidence ?? null,
          schoolId: data.schoolId ?? null,
          combination: data.combination ?? null,
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
          linkedinUrl: data.linkedinUrl ?? null,
        },
      });
    }

    if (data.role === "CAREER_GUIDE") {
      await tx.careerGuide.create({
        data: {
          userId: newUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          schoolId: data.schoolId ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
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

  if (!user) throw new Error('No account found with this email. Please check your email or sign up.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Incorrect password. Please try again.');

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
      professional: {
        include: {
          interviewBooking: true,
        },
      },
      careerGuide: true,
    },
  });

  if (!user) throw new Error("User not found");

  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
