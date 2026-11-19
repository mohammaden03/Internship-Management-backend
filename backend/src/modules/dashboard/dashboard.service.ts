import { Injectable } from '@nestjs/common';
import { InternshipStatus, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalStudents,
      totalProfessors,
      totalCompanies,
      activeInternships,
      pendingRequests,
      completedInternships,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.professor.count(),
      this.prisma.company.count(),
      this.prisma.internship.count({ where: { status: InternshipStatus.ACTIVE } }),
      this.prisma.internshipRequest.count({ where: { status: RequestStatus.PENDING } }),
      this.prisma.internship.count({ where: { status: InternshipStatus.COMPLETED } }),
    ]);

    return {
      totalStudents,
      totalProfessors,
      totalCompanies,
      activeInternships,
      pendingRequests,
      completedInternships,
    };
  }
}
