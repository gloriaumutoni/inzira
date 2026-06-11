export type Role =
  | "STUDENT"
  | "PROFESSIONAL"
  | "COMPANY"
  | "COORDINATOR"
  | "ADMIN";

export type Level = "O_LEVEL" | "A_LEVEL";
export type SessionStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type WorkshopStatus = "OPEN" | "FULL" | "COMPLETED";
export type BookingStatus = "REGISTERED" | "ATTENDED" | "CANCELLED";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  school: string;
  level: Level;
  createdAt: string;
  user?: User;
}

export interface Professional {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  bio: string;
  sector: string;
  videoUrl: string | null;
  createdAt: string;
  user?: User;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  description: string;
  sector: string;
  logoUrl: string | null;
  createdAt: string;
  user?: User;
}

export interface SchoolCoordinator {
  id: string;
  userId: string;
  school: string;
  district: string;
  createdAt: string;
  user?: User;
}

export interface Career {
  id: string;
  title: string;
  description: string;
  sector: string;
  combinations: string[];
  professionalId: string;
  createdAt: string;
  professional?: Professional;
}

export interface Session {
  id: string;
  studentId: string;
  professionalId: string;
  careerId: string | null;
  scheduledAt: string;
  duration: number;
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
  student?: Student;
  professional?: Professional;
  career?: Career;
}

export interface Workshop {
  id: string;
  companyId: string;
  title: string;
  description: string;
  date: string;
  capacity: number;
  status: WorkshopStatus;
  createdAt: string;
  company?: Company;
}

export interface Booking {
  id: string;
  studentId: string;
  workshopId: string;
  status: BookingStatus;
  createdAt: string;
  student?: Student;
  workshop?: Workshop;
}

export interface Interest {
  id: string;
  studentId: string;
  category: string;
  score: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
