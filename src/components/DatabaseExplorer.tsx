import React, { useState } from 'react';
import {
  Database,
  Building2,
  GraduationCap,
  Users,
  FileSpreadsheet,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Star,
  Award,
  ExternalLink,
} from 'lucide-react';
import {
  User,
  Student,
  Professor,
  Company,
  InternshipRequest,
  Internship,
  WeeklyReport,
  Evaluation,
  Role,
} from '../types';

interface DatabaseExplorerProps {
  students: Student[];
  professors: Professor[];
  companies: Company[];
  requests: InternshipRequest[];
  internships: Internship[];
  reports: WeeklyReport[];
  evaluations: Evaluation[];
  users: User[];
  activeRole: Role;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onApproveReport: (reportId: string, comment: string) => void;
  onRejectReport: (reportId: string, comment: string) => void;
}

export const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({
  students,
  professors,
  companies,
  requests,
  internships,
  reports,
  evaluations,
  users,
  activeRole,
  onApproveRequest,
  onRejectRequest,
  onApproveReport,
  onRejectReport,
}) => {
  const [activeTable, setActiveTable] = useState<
    'companies' | 'students' | 'professors' | 'requests' | 'internships' | 'reports' | 'evaluations'
  >('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getCompany = (compId: string) => companies.find((c) => c.id === compId);
  const getStudent = (stId: string) => students.find((s) => s.id === stId);
  const getProfessor = (profId: string) => professors.find((p) => p.id === profId);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            کاوشگر پایگاه‌داده و رکوردهای بذرپاشی‌شده فارسی (Prisma Seed Explorer)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده رکوردهای ذخیره شده در دیتابیس PostgreSQL به همراه روابط انتیتی‌ها و قابلیت تعامل زنده
          </p>
        </div>

        {/* Table Selector Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTable('companies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'companies'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            شرکت‌ها ({companies.length})
          </button>
          <button
            onClick={() => setActiveTable('requests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'requests'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            درخواست‌های کارآموزی ({requests.length})
          </button>
          <button
            onClick={() => setActiveTable('internships')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'internships'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            دوره‌های فعال ({internships.length})
          </button>
          <button
            onClick={() => setActiveTable('reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'reports'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            گزارش‌های هفتگی ({reports.length})
          </button>
          <button
            onClick={() => setActiveTable('students')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            دانشجویان ({students.length})
          </button>
          <button
            onClick={() => setActiveTable('professors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'professors'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            اساتید ناظر ({professors.length})
          </button>
          <button
            onClick={() => setActiveTable('evaluations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTable === 'evaluations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            ارزیابی‌های نهایی ({evaluations.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در این جدول..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-right"
          />
        </div>

        {['requests', 'reports', 'internships'].includes(activeTable) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">فیلتر وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">همه موارد</option>
              <option value="APPROVED">تأیید شده (APPROVED)</option>
              <option value="PENDING">در انتظار بررسی (PENDING)</option>
              <option value="SUBMITTED">ارسال شده (SUBMITTED)</option>
              <option value="ACTIVE">در حال برگزاری (ACTIVE)</option>
              <option value="COMPLETED">پایان یافته (COMPLETED)</option>
              <option value="REJECTED">رد شده (REJECTED)</option>
            </select>
          </div>
        )}
      </div>

      {/* Tables Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* COMPANIES TABLE */}
        {activeTable === 'companies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">نام شرکت</th>
                  <th className="py-3 px-4">حوزه فعالیت و صنعت</th>
                  <th className="py-3 px-4">شهر / آدرس</th>
                  <th className="py-3 px-4">سرپرست صنعتی</th>
                  <th className="py-3 px-4">تلفن تماس</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies
                  .filter((c) => c.name.includes(searchQuery) || c.industry.includes(searchQuery))
                  .map((comp) => (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{comp.name}</td>
                      <td className="py-3 px-4 text-slate-600">{comp.industry}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-semibold text-slate-700">{comp.city}</span> -{' '}
                        {comp.address}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {comp.supervisorName}
                        <div className="text-[11px] text-slate-400 font-mono">
                          {comp.supervisorPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{comp.phone}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REQUESTS TABLE */}
        {activeTable === 'requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">عنوان کارآموزی</th>
                  <th className="py-3 px-4">دانشجو</th>
                  <th className="py-3 px-4">شرکت میزبان</th>
                  <th className="py-3 px-4">طول دوره</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">عملیات ادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests
                  .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
                  .filter((r) => r.title.includes(searchQuery))
                  .map((req) => {
                    const st = getStudent(req.studentId);
                    const user = st ? getUser(st.userId) : null;
                    const comp = getCompany(req.companyId);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {req.description}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {user ? `${user.firstName} ${user.lastName}` : 'نامشخص'}
                          <div className="text-[11px] text-slate-400 font-mono">
                            {st?.studentNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{comp?.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {req.totalHours} ساعت
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {req.status === 'APPROVED'
                              ? 'تأیید شده'
                              : req.status === 'PENDING'
                              ? 'در انتظار بررسی'
                              : 'رد شده'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onApproveRequest(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-xs"
                              >
                                تأیید درخواست
                              </button>
                              <button
                                onClick={() => onRejectRequest(req.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition-all"
                              >
                                رد
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">بررسی شده</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* INTERNSHIPS TABLE */}
        {activeTable === 'internships' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">شناسه</th>
                  <th className="py-3 px-4">دانشجو</th>
                  <th className="py-3 px-4">استاد ناظر</th>
                  <th className="py-3 px-4">شرکت</th>
                  <th className="py-3 px-4">درصد پیشرفت</th>
                  <th className="py-3 px-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {internships
                  .filter((ins) => statusFilter === 'ALL' || ins.status === statusFilter)
                  .map((ins) => {
                    const st = getStudent(ins.studentId);
                    const stUser = st ? getUser(st.userId) : null;
                    const prof = getProfessor(ins.professorId);
                    const profUser = prof ? getUser(prof.userId) : null;
                    const comp = getCompany(ins.companyId);

                    return (
                      <tr key={ins.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{ins.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {stUser ? `${stUser.firstName} ${stUser.lastName}` : ''}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {profUser ? `دکتر ${profUser.lastName}` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{comp?.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${ins.progressPercentage}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">
                              {ins.progressPercentage}٪
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              ins.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800'
                                : ins.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ins.status === 'COMPLETED'
                              ? 'پایان یافته (فارغ‌التحصیل)'
                              : ins.status === 'ACTIVE'
                              ? 'در حال برگزاری'
                              : ins.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* WEEKLY REPORTS TABLE */}
        {activeTable === 'reports' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">هفته</th>
                  <th className="py-3 px-4">فعالیت‌های انجام شده</th>
                  <th className="py-3 px-4">مهارت‌های فراگرفته</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4">نظر استاد ناظر</th>
                  <th className="py-3 px-4">عملیات داوری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports
                  .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
                  .filter((r) => r.activities.includes(searchQuery))
                  .slice(0, 25)
                  .map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-600">هفته {rep.weekNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                        {rep.activities}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {rep.skillsLearned}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            rep.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rep.status === 'APPROVED'
                            ? 'تأیید شده'
                            : rep.status === 'SUBMITTED'
                            ? 'ارسال شده (در انتظار داوری)'
                            : rep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {rep.professorComment || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {rep.status === 'SUBMITTED' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                onApproveReport(
                                  rep.id,
                                  'گزارش این هفته بررسی شد و کیفیت پیاده‌سازی مطلوب ارزیابی می‌گردد.',
                                )
                              }
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px]"
                            >
                              تأیید گزارش
                            </button>
                            <button
                              onClick={() =>
                                onRejectReport(rep.id, 'نیاز به توضیحات بیشتر در خصوص تست‌ها')
                              }
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px]"
                            >
                              رد
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STUDENTS TABLE */}
        {activeTable === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">شماره دانشجویی</th>
                  <th className="py-3 px-4">نام و نام خانوادگی</th>
                  <th className="py-3 px-4">ایمیل دانشگاهی</th>
                  <th className="py-3 px-4">دانشکده</th>
                  <th className="py-3 px-4">رشته تحصیلی</th>
                  <th className="py-3 px-4">مقطع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const u = getUser(st.userId);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {st.studentNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u ? `${u.firstName} ${u.lastName}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{u?.email}</td>
                      <td className="py-3 px-4 text-slate-700">{st.faculty}</td>
                      <td className="py-3 px-4 text-indigo-700 font-medium">{st.major}</td>
                      <td className="py-3 px-4 text-slate-600">{st.degreeLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PROFESSORS TABLE */}
        {activeTable === 'professors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">نام استاد</th>
                  <th className="py-3 px-4">مرتبه علمی</th>
                  <th className="py-3 px-4">دانشکده و گروه آموزشی</th>
                  <th className="py-3 px-4">ایمیل رسمی</th>
                  <th className="py-3 px-4">دانشجویان تخصیص‌یافته</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {professors.map((prof) => {
                  const u = getUser(prof.userId);
                  const assignedCount = internships.filter((i) => i.professorId === prof.id).length;

                  return (
                    <tr key={prof.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u ? `دکتر ${u.firstName} ${u.lastName}` : ''}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {prof.academicRank}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{prof.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{u?.email}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 font-mono">
                        {assignedCount} دانشجو
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* EVALUATIONS TABLE */}
        {activeTable === 'evaluations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">کارآموزی</th>
                  <th className="py-3 px-4">مهارت فنی (۳۰٪)</th>
                  <th className="py-3 px-4">مسئولیت‌پذیری (۲۰٪)</th>
                  <th className="py-3 px-4">انضباط (۱۵٪)</th>
                  <th className="py-3 px-4">کار تیمی (۱۵٪)</th>
                  <th className="py-3 px-4">حضور و غیاب (۲۰٪)</th>
                  <th className="py-3 px-4">نمره پایانی (از ۲۰)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {ev.internshipId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ev.technicalSkill}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ev.responsibility}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ev.discipline}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ev.teamwork}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{ev.attendance}</td>
                    <td className="py-3 px-4 font-mono font-black text-emerald-700 text-sm">
                      {ev.finalScore} / ۲۰
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
