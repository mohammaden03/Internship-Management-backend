import React, { useState } from 'react';
import { Header } from './components/Header';
import { SwaggerTester } from './components/SwaggerTester';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { WorkflowSimulator } from './components/WorkflowSimulator';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { NotificationsModal } from './components/NotificationsModal';
import { ActivityLogsModal } from './components/ActivityLogsModal';
import {
  initialUsers,
  initialStudents,
  initialProfessors,
  initialCompanies,
  initialRequests,
  initialInternships,
  initialReports,
  initialEvaluations,
  initialNotifications,
  initialActivityLogs,
} from './data/persianSeedData';
import {
  Role,
  User,
  Student,
  Professor,
  Company,
  InternshipRequest,
  Internship,
  WeeklyReport,
  Evaluation,
  Notification,
  ActivityLog,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'swagger' | 'database' | 'workflow' | 'architecture'>('swagger');
  const [activeRole, setActiveRole] = useState<Role>('ADMIN');

  // Interactive Data State
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [professors, setProfessors] = useState<Professor[]>(initialProfessors);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [requests, setRequests] = useState<InternshipRequest[]>(initialRequests);
  const [internships, setInternships] = useState<Internship[]>(initialInternships);
  const [reports, setReports] = useState<WeeklyReport[]>(initialReports);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);

  // Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);

  // Automated notification creator
  const triggerNotification = (title: string, message: string) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: activeRole === 'ADMIN' ? 'usr-admin-1' : activeRole === 'PROFESSOR' ? 'usr-prof-1' : 'usr-st-1',
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Automated audit logger
  const triggerActivityLog = (action: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userId: activeRole === 'ADMIN' ? 'usr-admin-1' : activeRole === 'PROFESSOR' ? 'usr-prof-1' : 'usr-st-1',
      action,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Request State Machine Transitions
  const handleApproveRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'APPROVED' } : r)),
    );

    const req = requests.find((r) => r.id === requestId);
    const comp = companies.find((c) => c.id === req?.companyId);

    // Auto-create active internship
    if (req && !internships.some((i) => i.requestId === requestId)) {
      const newInternship: Internship = {
        id: `ins-${Date.now().toString().slice(-4)}`,
        studentId: req.studentId,
        professorId: 'prof-1',
        companyId: req.companyId,
        requestId: req.id,
        startDate: req.startDate,
        endDate: req.endDate,
        progressPercentage: 10,
        status: 'ACTIVE',
      };
      setInternships((prev) => [newInternship, ...prev]);
    }

    triggerNotification(
      'تأیید درخواست کارآموزی',
      `درخواست کارآموزی شماره ${requestId} برای شرکت ${comp?.name || ''} تأیید شد و دوره فعال گردید.`,
    );
    triggerActivityLog(`تأیید درخواست کارآموزی شماره ${requestId} توسط مدیر آموزش`);
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' } : r)),
    );
    triggerNotification('عدم تأیید درخواست', `درخواست کارآموزی شماره ${requestId} رد شد.`);
    triggerActivityLog(`رد درخواست کارآموزی شماره ${requestId}`);
  };

  // Weekly Report State Machine Transitions
  const handleApproveReport = (reportId: string, comment: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'APPROVED', professorComment: comment } : r,
      ),
    );
    triggerNotification('تأیید گزارش هفتگی', `گزارش هفتگی شماره ${reportId} توسط استاد ناظر تأیید گردید.`);
    triggerActivityLog(`تأیید گزارش هفتگی ${reportId} توسط استاد ناظر`);
  };

  const handleRejectReport = (reportId: string, comment: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'REJECTED', professorComment: comment } : r,
      ),
    );
    triggerNotification('عدم تأیید گزارش هفتگی', `گزارش هفتگی شماره ${reportId} نیاز به بازبینی دارد.`);
    triggerActivityLog(`رد گزارش هفتگی ${reportId} جهت اصلاح`);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header with Navigation and Persona Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenActivityLogs={() => setIsActivityLogsOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'swagger' && <SwaggerTester activeRole={activeRole} />}

        {activeTab === 'workflow' && (
          <WorkflowSimulator
            onNotify={triggerNotification}
            onLog={triggerActivityLog}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseExplorer
            students={students}
            professors={professors}
            companies={companies}
            requests={requests}
            internships={internships}
            reports={reports}
            evaluations={evaluations}
            users={users}
            activeRole={activeRole}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onApproveReport={handleApproveReport}
            onRejectReport={handleRejectReport}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureViewer />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>NestJS 10.x API Server • PostgreSQL 16 • Prisma ORM • JWT RBAC</span>
          </div>
          <div className="text-right" dir="rtl">
            سامانه جامع مدیریت کارآموزی دانشگاه • تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      <ActivityLogsModal
        isOpen={isActivityLogsOpen}
        onClose={() => setIsActivityLogsOpen(false)}
        logs={activityLogs}
      />
    </div>
  );
}
