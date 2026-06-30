-- CreateTable
CREATE TABLE "ProfessionalCareer" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalCareer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalCareer_professionalId_careerId_key" ON "ProfessionalCareer"("professionalId", "careerId");

-- AddForeignKey
ALTER TABLE "ProfessionalCareer" ADD CONSTRAINT "ProfessionalCareer_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCareer" ADD CONSTRAINT "ProfessionalCareer_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;
