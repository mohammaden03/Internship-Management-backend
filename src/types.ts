export type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT';
export type InternshipStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type DocumentType =
  | 'INTRODUCTION_LETTER'
  | 'CONTRACT'
  | 'START_FORM'
  | 'FINAL_REPORT'
  | 'OTHER';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  nationalCode: string;
  phoneNumber?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  studentNumber: string;
  faculty: string;
  major: string;
  degreeLevel: string;
  userId: number;
  user?: User;
}

export interface Professor {
  id: number;
  department: string;
  academicRank: string;
  userId: number;
  user?: User;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  city: string;
  address: string;
  phone: string;
  supervisorName: string;
  supervisorPhone: string;
  createdAt: string;
}

export interface InternshipRequest {
  id: number;
  studentId: number;
  student?: Student & { user?: User };
  companyId: number;
  company?: Company;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: RequestStatus;
  createdAt: string;
}

export interface Internship {
  id: number;
  studentId: number;
  student?: Student & { user?: User };
  professorId: number;
  professor?: Professor & { user?: User };
  companyId: number;
  company?: Company;
  requestId: number;
  startDate: string;
  endDate: string;
  progressPercentage: number;
  status: InternshipStatus;
  weeklyReports?: WeeklyReport[];
  documents?: Document[];
  evaluation?: Evaluation;
}

export interface WeeklyReport {
  id: number;
  internshipId: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  activities: string;
  skillsLearned: string;
  challenges?: string;
  description: string;
  status: ReportStatus;
  professorComment?: string | null;
  createdAt: string;
}

export interface Document {
  id: number;
  internshipId: number;
  fileName: string;
  filePath: string;
  documentType: DocumentType;
  uploadedAt: string;
}

export interface Evaluation {
  id: number;
  internshipId: number;
  technicalSkill: number;
  responsibility: number;
  discipline: number;
  teamwork: number;
  attendance: number;
  description: string;
  finalScore: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  user?: User;
  action: string;
  createdAt: string;
}
