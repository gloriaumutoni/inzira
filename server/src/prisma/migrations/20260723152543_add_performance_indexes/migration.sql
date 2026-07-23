-- Adds indexes on foreign-key / filter columns that were doing full table scans.
-- Postgres does not auto-index foreign key columns, and this schema had zero
-- @@index declarations before this migration (only @@unique-backed indexes existed).

-- Student
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");
CREATE INDEX "Student_level_idx" ON "Student"("level");
CREATE INDEX "Student_streamCode_idx" ON "Student"("streamCode");
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- Professional
CREATE INDEX "Professional_isVerified_isActive_idx" ON "Professional"("isVerified", "isActive");
CREATE INDEX "Professional_isMentor_idx" ON "Professional"("isMentor");
CREATE INDEX "Professional_mentorApplicationStatus_idx" ON "Professional"("mentorApplicationStatus");
CREATE INDEX "Professional_verificationStatus_idx" ON "Professional"("verificationStatus");
CREATE INDEX "Professional_createdAt_idx" ON "Professional"("createdAt");

-- CareerGuide
CREATE INDEX "CareerGuide_isVerified_idx" ON "CareerGuide"("isVerified");

-- Session
CREATE INDEX "Session_studentId_idx" ON "Session"("studentId");
CREATE INDEX "Session_professionalId_idx" ON "Session"("professionalId");
CREATE INDEX "Session_status_idx" ON "Session"("status");
CREATE INDEX "Session_scheduledAt_idx" ON "Session"("scheduledAt");
CREATE INDEX "Session_updatedAt_idx" ON "Session"("updatedAt");

-- GroupSession
CREATE INDEX "GroupSession_isCancelled_idx" ON "GroupSession"("isCancelled");
CREATE INDEX "GroupSession_parentSessionId_idx" ON "GroupSession"("parentSessionId");
CREATE INDEX "GroupSession_scheduledAt_idx" ON "GroupSession"("scheduledAt");

-- GroupSessionEnrolment
CREATE INDEX "GroupSessionEnrolment_studentId_idx" ON "GroupSessionEnrolment"("studentId");

-- Mentorship
CREATE INDEX "Mentorship_professionalId_idx" ON "Mentorship"("professionalId");

-- Notification
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Review
CREATE INDEX "Review_professionalId_idx" ON "Review"("professionalId");
CREATE INDEX "Review_studentId_idx" ON "Review"("studentId");

-- ConfidenceLog
CREATE INDEX "ConfidenceLog_studentId_createdAt_idx" ON "ConfidenceLog"("studentId", "createdAt");

-- QuizResult
CREATE INDEX "QuizResult_studentId_idx" ON "QuizResult"("studentId");

-- MentorApplicationInterviewBooking
CREATE INDEX "MentorApplicationInterviewBooking_adminSlotId_idx" ON "MentorApplicationInterviewBooking"("adminSlotId");

-- MentorSlot
CREATE INDEX "MentorSlot_bookedByStudentId_idx" ON "MentorSlot"("bookedByStudentId");
CREATE INDEX "MentorSlot_isBooked_idx" ON "MentorSlot"("isBooked");

-- ProfessionalCareer
CREATE INDEX "ProfessionalCareer_careerId_idx" ON "ProfessionalCareer"("careerId");

-- CareerStory
CREATE INDEX "CareerStory_professionalId_idx" ON "CareerStory"("professionalId");
CREATE INDEX "CareerStory_status_idx" ON "CareerStory"("status");
CREATE INDEX "CareerStory_linkedCareerId_idx" ON "CareerStory"("linkedCareerId");

-- SessionFeedback
CREATE INDEX "SessionFeedback_studentId_idx" ON "SessionFeedback"("studentId");

-- SessionReport
CREATE INDEX "SessionReport_sessionId_idx" ON "SessionReport"("sessionId");
CREATE INDEX "SessionReport_groupSessionId_idx" ON "SessionReport"("groupSessionId");
CREATE INDEX "SessionReport_reportedBy_idx" ON "SessionReport"("reportedBy");
CREATE INDEX "SessionReport_status_idx" ON "SessionReport"("status");
