-- CreateTable
CREATE TABLE "MentorAvailabilityTemplate" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAvailabilityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSlot" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedByStudentId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInterviewSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "meetLink" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorApplicationInterviewBooking" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "adminSlotId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorApplicationInterviewBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorAvailabilityTemplate_professionalId_dayOfWeek_startHo_key" ON "MentorAvailabilityTemplate"("professionalId", "dayOfWeek", "startHour", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSlot_professionalId_scheduledAt_key" ON "MentorSlot"("professionalId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInterviewSlot_dayOfWeek_startHour_startMinute_key" ON "AdminInterviewSlot"("dayOfWeek", "startHour", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "MentorApplicationInterviewBooking_professionalId_key" ON "MentorApplicationInterviewBooking"("professionalId");

-- AddForeignKey
ALTER TABLE "MentorAvailabilityTemplate" ADD CONSTRAINT "MentorAvailabilityTemplate_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_bookedByStudentId_fkey" FOREIGN KEY ("bookedByStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorApplicationInterviewBooking" ADD CONSTRAINT "MentorApplicationInterviewBooking_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorApplicationInterviewBooking" ADD CONSTRAINT "MentorApplicationInterviewBooking_adminSlotId_fkey" FOREIGN KEY ("adminSlotId") REFERENCES "AdminInterviewSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
