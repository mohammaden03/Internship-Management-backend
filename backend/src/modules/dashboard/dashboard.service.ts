import { Injectable } from '@nestjs/common';
import { InternshipStatus, ReportStatus, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async getStats() {
    const [
      settings,
      totalStudents,
      totalProfessors,
      totalCompanies,
      activeInternships,
      pendingRequests,
      completedInternships,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      this.settingsService.getSettings(),
      this.prisma.student.count({ where: { user: { deletedAt: null } } }),
      this.prisma.professor.count({ where: { user: { deletedAt: null } } }),
      this.prisma.company.count(),
      this.prisma.internship.count({
        where: { status: InternshipStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.internshipRequest.count({
        where: { status: RequestStatus.PENDING, deletedAt: null },
      }),
      this.prisma.internship.count({
        where: { status: InternshipStatus.COMPLETED, deletedAt: null },
      }),
      this.prisma.weeklyReport.count({
        where: { internship: { deletedAt: null } },
      }),
      this.prisma.weeklyReport.count({
        where: { internship: { deletedAt: null }, status: ReportStatus.SUBMITTED },
      }),
    ]);

    return {
      currentTerm: settings.academicTerm,
      universityName: settings.universityName,
      totalStudents,
      totalProfessors,
      totalCompanies,
      activeInternships,
      pendingRequests,
      completedInternships,
      totalReports,
      pendingReports,
    };
  }
}
