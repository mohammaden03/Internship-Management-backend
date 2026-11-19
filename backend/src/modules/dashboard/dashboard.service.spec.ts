import { InternshipStatus, ReportStatus, RequestStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns aggregated non-deleted counts along with configured academicTerm and universityName', async () => {
    const prisma: any = {
      student: { count: jest.fn().mockResolvedValue(42) },
      professor: { count: jest.fn().mockResolvedValue(8) },
      company: { count: jest.fn().mockResolvedValue(15) },
      internship: {
        count: jest
          .fn()
          .mockResolvedValueOnce(12)
          .mockResolvedValueOnce(9),
      },
      internshipRequest: { count: jest.fn().mockResolvedValue(5) },
      weeklyReport: {
        count: jest.fn().mockResolvedValueOnce(31).mockResolvedValueOnce(4),
      },
    };
    const settingsService: any = {
      getSettings: jest.fn().mockResolvedValue({
        academicTerm: 'تابستان ۱۴۰۳',
        universityName: 'دانشگاه سمنان',
      }),
    };

    const service = new DashboardService(prisma, settingsService);
    const stats = await service.getStats();

    expect(stats).toEqual({
      currentTerm: 'تابستان ۱۴۰۳',
      universityName: 'دانشگاه سمنان',
      totalStudents: 42,
      totalProfessors: 8,
      totalCompanies: 15,
      activeInternships: 12,
      pendingReports: 4,
      pendingRequests: 5,
      completedInternships: 9,
      totalReports: 31,
    });
    expect(prisma.internship.count).toHaveBeenNthCalledWith(1, {
      where: { status: InternshipStatus.ACTIVE, deletedAt: null },
    });
    expect(prisma.internship.count).toHaveBeenNthCalledWith(2, {
      where: { status: InternshipStatus.COMPLETED, deletedAt: null },
    });
    expect(prisma.internshipRequest.count).toHaveBeenCalledWith({
      where: { status: RequestStatus.PENDING, deletedAt: null },
    });
    expect(prisma.weeklyReport.count).toHaveBeenNthCalledWith(1, {
      where: { internship: { deletedAt: null } },
    });
    expect(prisma.weeklyReport.count).toHaveBeenNthCalledWith(2, {
      where: { internship: { deletedAt: null }, status: ReportStatus.SUBMITTED },
    });
  });
});
