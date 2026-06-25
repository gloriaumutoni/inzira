import { prisma } from "../prisma/client";
import { randomUUID } from "crypto";

export const initiate = async (data: {
  sessionId?: string;
  mentorshipId?: string;
  amount: number;
  phoneNumber: string;
}) => {
  const momoReference = randomUUID();

  const payment = await prisma.payment.create({
    data: {
      sessionId: data.sessionId,
      mentorshipId: data.mentorshipId,
      amount: data.amount,
      method: "MOMO",
      status: "PENDING",
      momoReference,
      phoneNumber: data.phoneNumber,
    },
  });

  return { momoReference, paymentId: payment.id, status: "PENDING" };
};

export const checkStatus = async (momoReference: string) => {
  const payment = await prisma.payment.findFirst({ where: { momoReference } });
  if (!payment) throw new Error("Payment not found");

  const secondsSinceCreation =
    (Date.now() - payment.createdAt.getTime()) / 1000;

  if (payment.status === "PENDING" && secondsSinceCreation > 2) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "SUCCESSFUL" },
    });
    return { status: updated.status, momoReference };
  }

  return { status: payment.status, momoReference };
};

export const getMyPayments = async (studentUserId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentUserId },
  });
  if (!student) throw new Error("Student not found");

  return prisma.payment.findMany({
    where: {
      OR: [
        { session: { studentId: student.id } },
        { mentorship: { studentId: student.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getProfessionalEarnings = async (
  professionalUserId: string,
  month?: string,
) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  });
  if (!professional) throw new Error("Professional not found");

  const where: Record<string, unknown> = {
    status: "SUCCESSFUL",
    OR: [
      { session: { professionalId: professional.id } },
      { mentorship: { professionalId: professional.id } },
    ],
  };

  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    where.createdAt = { gte: start, lt: end };
  }

  return prisma.payment.findMany({
    where,
    include: { session: true, mentorship: true },
    orderBy: { createdAt: "desc" },
  });
};

export const requestPayout = async (
  professionalUserId: string,
  amount: number,
) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  });
  if (!professional) throw new Error("Professional not found");
  if (amount < 10000) throw new Error("Minimum payout is RWF 10,000");

  return {
    requested: true,
    amount,
    message: "Payout request received. Processing within 3 business days.",
    professionalId: professional.id,
  };
};
