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
  id: string;
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
  id: string;
  studentNumber: string;
  faculty: string;
  major: string;
  degreeLevel: string;
  userId: string;
  user?: User;
}

export interface Professor {
  id: string;
  department: string;
  academicRank: string;
  userId: string;
  user?: User;
}

export interface Company {
  id: string;
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
  id: string;
  studentId: string;
  student?: Student & { user?: User };
  companyId: string;
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
  id: string;
  studentId: string;
  student?: Student & { user?: User };
  professorId: string;
  professor?: Professor & { user?: User };
  companyId: string;
  company?: Company;
  requestId: string;
  startDate: string;
  endDate: string;
  progressPercentage: number;
  status: InternshipStatus;
  weeklyReports?: WeeklyReport[];
  documents?: Document[];
  evaluation?: Evaluation;
}

export interface WeeklyReport {
  id: string;
  internshipId: string;
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
  id: string;
  internshipId: string;
  fileName: string;
  filePath: string;
  documentType: DocumentType;
  uploadedAt: string;
}

export interface Evaluation {
  id: string;
  internshipId: string;
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
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  createdAt: string;
}
