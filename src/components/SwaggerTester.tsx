import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  KeyRound,
  Send,
  Database,
  Search,
  Filter,
  Code,
  Terminal,
} from 'lucide-react';
import { Role } from '../types';

interface SwaggerTesterProps {
  activeRole: Role;
  onExecuteWorkflowStep?: (step: string) => void;
}

interface EndpointDef {
  id: string;
  tag: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  requiredRole?: Role[];
  defaultParams?: Record<string, string>;
  defaultBody?: any;
  responseExample: any;
}

export const SwaggerTester: React.FC<SwaggerTesterProps> = ({ activeRole }) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openEndpointId, setOpenEndpointId] = useState<string>('auth-login');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, { status: number; duration: number; data: any }>>({});
  const [requestBodies, setRequestBodies] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({});

  const endpoints: EndpointDef[] = [
    // Auth
    {
      id: 'auth-login',
      tag: 'Auth',
      method: 'POST',
      path: '/api/auth/login',
      summary: 'ورود به سامانه با شناسه (کد ملی یا شماره دانشجویی) و رمز عبور',
      description:
        'دانشجو: ورود با کد ملی یا شماره دانشجویی و رمز عبور | استاد و مدیر: ورود با کد ملی و رمز عبور. صدور Access Token و Refresh Token.',
      defaultBody: {
        identifier:
          activeRole === 'ADMIN'
            ? '0012345678' // کد ملی مدیر سیستم
            : activeRole === 'PROFESSOR'
              ? '0010000001' // کد ملی استاد ناظر (دکتر صادقی)
              : '400123456', // شماره دانشجویی محمد رضایی (یا کد ملی: 0020000001)
        password: 'Password123!',
      },
      responseExample: {
        statusCode: 200,
        message: 'ورود به سامانه با موفقیت انجام شد',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMSIsIm5hdGlvbmFsQ29kZSI6IjAwMTIzNDU2NzgiLCJyb2xlIjoiQURNSU4ifQ...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh_token_payload...',
          tokenType: 'Bearer',
          user: {
            id: 'usr-1',
            nationalCode: activeRole === 'ADMIN' ? '0012345678' : activeRole === 'PROFESSOR' ? '0010000001' : '0020000001',
            studentNumber: activeRole === 'STUDENT' ? '400123456' : undefined,
            firstName: activeRole === 'ADMIN' ? 'علی' : activeRole === 'PROFESSOR' ? 'حمیدرضا' : 'محمد',
            lastName: activeRole === 'ADMIN' ? 'احمدی' : activeRole === 'PROFESSOR' ? 'صادقی' : 'رضایی',
            role: activeRole,
          },
        },
      },
    },
    {
      id: 'auth-register',
      tag: 'Auth',
      method: 'POST',
      path: '/api/auth/register',
      summary: 'ثبت‌نام دانشجو یا کاربر جدید با کد ملی و شماره دانشجویی',
      description: 'ایجاد حساب کاربری، اعتبارسنجی یکتایی کد ملی و ایمیل، هش امنیتی رمز عبور و ایجاد پروفایل تخصصی.',
      defaultBody: {
        nationalCode: '0029988776',
        studentNumber: '402123456',
        firstName: 'آرمین',
        lastName: 'کامرانی',
        email: 'a.kamrani@student.ac.ir',
        password: 'Password123!',
        phoneNumber: '09129876543',
        role: 'STUDENT',
        major: 'مهندسی کامپیوتر',
        faculty: 'دانشکده مهندسی',
      },
      responseExample: {
        statusCode: 201,
        message: 'کاربر با موفقیت ثبت شد',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'usr-new-88',
            nationalCode: '0029988776',
            studentNumber: '402123456',
            firstName: 'آرمین',
            lastName: 'کامرانی',
            role: 'STUDENT',
          },
        },
      },
    },

    // Students
    {
      id: 'students-get-all',
      tag: 'Students',
      method: 'GET',
      path: '/api/students?page=1&limit=10&search=مهندسی',
      summary: 'دریافت فهرست دانشجویان به همراه صفحه‌بندی، فیلتر و جستجو',
      description: 'فراخوانی لیست دانشجویان با اطلاعات تکمیلی شامل شماره دانشجویی، دانشکده و مقطع تحصیلی.',
      requiredRole: ['ADMIN', 'PROFESSOR'],
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            {
              id: 'st-1',
              studentNumber: '99123401',
              faculty: 'دانشکده مهندسی کامپیوتر',
              major: 'مهندسی نرم‌افزار',
              degreeLevel: 'کارشناسی',
              user: { firstName: 'محمد', lastName: 'رضایی', email: 'm.rezaei@student.ac.ir' },
            },
            {
              id: 'st-2',
              studentNumber: '99123402',
              faculty: 'دانشکده مهندسی کامپیوتر',
              major: 'فناوری اطلاعات و شبکه',
              degreeLevel: 'کارشناسی',
              user: { firstName: 'سارا', lastName: 'علوی', email: 's.alavi@student.ac.ir' },
            },
          ],
          meta: { totalItems: 10, itemCount: 2, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
        },
      },
    },
    {
      id: 'students-get-me',
      tag: 'Students',
      method: 'GET',
      path: '/api/students/me',
      summary: 'دریافت پروفایل آکادمیک دانشجوی لاگین کرده',
      description: 'استخراج اطلاعات پرونده دانشجو از روی JWT توکن جاری.',
      requiredRole: ['STUDENT'],
      responseExample: {
        statusCode: 200,
        data: {
          id: 'st-1',
          studentNumber: '99123401',
          faculty: 'دانشکده مهندسی کامپیوتر',
          major: 'مهندسی نرم‌افزار',
          degreeLevel: 'کارشناسی',
          user: { firstName: 'محمد', lastName: 'رضایی', email: 'm.rezaei@student.ac.ir', phoneNumber: '09351000001' },
        },
      },
    },

    // Professors
    {
      id: 'professors-assigned-students',
      tag: 'Professors',
      method: 'GET',
      path: '/api/professors/assigned-students',
      summary: 'دریافت فهرست دانشجویان و کارآموزی‌های تحت نظارت استاد ناظر',
      description: 'مشاهده دوره‌های کارآموزی فعال تحت هدایت استاد به همراه درصد پیشرفت و آخرین گزارش‌ها.',
      requiredRole: ['PROFESSOR'],
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            {
              id: 'ins-1',
              startDate: '2026-07-01T00:00:00.000Z',
              progressPercentage: 45,
              status: 'ACTIVE',
              student: { studentNumber: '99123401', user: { firstName: 'محمد', lastName: 'رضایی' } },
              company: { name: 'دیجی‌کالا', supervisorName: 'مهندس سعید پورعلی' },
            },
          ],
          meta: { totalItems: 3, currentPage: 1 },
        },
      },
    },

    // Companies
    {
      id: 'companies-search',
      tag: 'Companies',
      method: 'GET',
      path: '/api/companies?search=دیجی&page=1&limit=10',
      summary: 'جستجو و دریافت شرکت‌های پذیرنده کارآموز (مانند GET /companies?search=software)',
      description: 'فیلتر شرکت‌ها بر اساس نام، حوزه صنعت، شهر و نام سرپرست صنعتی.',
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            {
              id: 'comp-1',
              name: 'دیجی‌کالا (گروه نوآوران فناوری)',
              industry: 'تجارت الکترونیک و رایانش ابری',
              city: 'تهران',
              address: 'خیابان گاندی، خیابان بیست و یکم، پلاک ۲۸',
              phone: '02161930000',
              supervisorName: 'مهندس سعید پورعلی',
              supervisorPhone: '09123456789',
            },
          ],
          meta: { totalItems: 1, currentPage: 1 },
        },
      },
    },
    {
      id: 'companies-create',
      tag: 'Companies',
      method: 'POST',
      path: '/api/companies',
      summary: 'ثبت شرکت پذیرنده جدید توسط مدیر سامانه',
      description: 'ثبت اطلاعات حقوقی شرکت، سرپرست کارآموزی و اطلاعات تماس.',
      requiredRole: ['ADMIN'],
      defaultBody: {
        name: 'هلدینگ هزاردستان (کافه‌بازار و دیوار)',
        industry: 'فناوری اطلاعات و خدمات ابری',
        city: 'تهران',
        address: 'میدان ونک، خیابان ملاصدرا',
        phone: '02188880000',
        supervisorName: 'مهندس حسام آرمندهی',
        supervisorPhone: '09121110000',
      },
      responseExample: {
        statusCode: 201,
        message: 'شرکت جدید با موفقیت ثبت شد',
        data: { id: 'comp-11', name: 'هلدینگ هزاردستان', city: 'تهران' },
      },
    },

    // Internship Requests
    {
      id: 'requests-create',
      tag: 'Internship Requests',
      method: 'POST',
      path: '/api/internship-requests',
      summary: 'ثبت درخواست جدید کارآموزی توسط دانشجو (ارسال اعلان و ثبت لاگ)',
      description: 'ایجاد درخواست در وضعیت اولیه PENDING، ارسال نوتیفیکیشن تایید دریافت و ثبت لاگ فعالیت.',
      requiredRole: ['STUDENT'],
      defaultBody: {
        companyId: 'comp-1',
        title: 'کارآموزی توسعه بک‌اند با NestJS و معماری میکروسرویس',
        description: 'گذراندن دوره رسمی ۲۴۰ ساعته کارآموزی در واحد فنی دیجی‌کالا تحت نظارت تیم مهندسی.',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-09-30T00:00:00.000Z',
        totalHours: 240,
      },
      responseExample: {
        statusCode: 201,
        message: 'درخواست کارآموزی با موفقیت ثبت گردید',
        data: {
          id: 'req-21',
          status: 'PENDING',
          title: 'کارآموزی توسعه بک‌اند با NestJS و معماری میکروسرویس',
          company: { name: 'دیجی‌کالا' },
          createdAt: new Date().toISOString(),
        },
      },
    },
    {
      id: 'requests-update-status',
      tag: 'Internship Requests',
      method: 'PATCH',
      path: '/api/internship-requests/req-1/status',
      summary: 'تأیید یا رد درخواست کارآموزی توسط ادمین (تخصیص استاد ناظر و ایجاد دوره فعال)',
      description: 'در صورت APPROVED، رکورد Internship فعال به شکل اتمیک ساخته شده و به دانشجو و استاد نوتیفیکیشن ارسال می‌شود.',
      requiredRole: ['ADMIN'],
      defaultBody: {
        status: 'APPROVED',
        professorId: 'prof-1',
      },
      responseExample: {
        statusCode: 200,
        message: 'درخواست کارآموزی تأیید شد و دوره فعال برای دانشجو ثبت گردید',
        data: {
          request: { id: 'req-1', status: 'APPROVED' },
          internship: {
            id: 'ins-new-1',
            status: 'ACTIVE',
            progressPercentage: 0,
            professor: { user: { firstName: 'حمیدرضا', lastName: 'صادقی' } },
          },
        },
      },
    },

    // Weekly Reports
    {
      id: 'reports-submit',
      tag: 'Weekly Reports',
      method: 'POST',
      path: '/api/weekly-reports',
      summary: 'ارسال گزارش هفتگی توسط دانشجو (SUBMITTED) و اطلاع به استاد ناظر',
      description: 'ثبت جزئیات فعالیت‌ها، مهارت‌های فراگرفته شده و چالش‌های فنی هفته.',
      requiredRole: ['STUDENT'],
      defaultBody: {
        internshipId: 'ins-1',
        weekNumber: 5,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-07T00:00:00.000Z',
        activities: 'پیاده‌سازی پایپ‌لاین CI/CD و تست‌های یکپارچه‌سازی با Jest',
        skillsLearned: 'Docker, GitHub Actions, Jest, Supertest',
        challenges: 'پیکربندی محیط ایزوله دیتابیس در گیت‌هاب اکشنز',
        description: 'شرح تفصیلی فعالیت‌های هفته پنجم کارآموزی در تیم مهندسی نرم‌افزار.',
      },
      responseExample: {
        statusCode: 201,
        message: 'گزارش هفتگی شماره ۵ با موفقیت ارسال شد و به استاد ناظر اطلاع داده شد',
        data: { id: 'rep-51', weekNumber: 5, status: 'SUBMITTED' },
      },
    },
    {
      id: 'reports-filter-approved',
      tag: 'Weekly Reports',
      method: 'GET',
      path: '/api/weekly-reports?status=APPROVED&page=1&limit=10',
      summary: 'دریافت گزارش‌های هفتگی تایید شده (مانند GET /weekly-reports?status=APPROVED)',
      description: 'فیلتر بر اساس وضعیت گزارش، جستجو در متن فعالیت‌ها و مهارت‌ها.',
      requiredRole: ['ADMIN', 'PROFESSOR'],
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            {
              id: 'rep-1',
              weekNumber: 1,
              status: 'APPROVED',
              activities: 'آشنایی با متدولوژی اجایل اسکرام، تحویل وظایف و بررسی معماری سیستم',
              professorComment: 'گزارش این هفته بررسی و تأیید شد. کیفیت پیاده‌سازی مطلوب است.',
              internship: { student: { user: { firstName: 'محمد', lastName: 'رضایی' } } },
            },
          ],
          meta: { totalItems: 38, currentPage: 1 },
        },
      },
    },
    {
      id: 'reports-review',
      tag: 'Weekly Reports',
      method: 'PATCH',
      path: '/api/weekly-reports/rep-1/review',
      summary: 'داوری گزارش هفتگی توسط استاد ناظر (APPROVED / REJECTED با درج نظر و به‌روزرسانی پیشرفت)',
      description: 'با تایید گزارش، درصد پیشرفت دوره کارآموزی بازنگری شده و اعلان به دانشجو ارسال می‌شود.',
      requiredRole: ['PROFESSOR', 'ADMIN'],
      defaultBody: {
        status: 'APPROVED',
        professorComment: 'تسلط دانشجو بر ابزارهای تست و پیکربندی کانتینر بسیار رضایت‌بخش است.',
      },
      responseExample: {
        statusCode: 200,
        message: 'گزارش هفتگی تأیید شد و درصد پیشرفت دوره به‌روزرسانی گردید',
        data: { id: 'rep-1', status: 'APPROVED', professorComment: 'تسلط دانشجو بر ابزارهای تست...' },
      },
    },

    // Documents
    {
      id: 'documents-upload',
      tag: 'Documents',
      method: 'POST',
      path: '/api/documents/upload',
      summary: 'بارگذاری فایل مدرک با Multer (PDF, Word, Image با محدودیت 10MB)',
      description: 'بارگذاری معرفی‌نامه دانشگاه، فرم شروع به کار، قرارداد یا گزارش پایانی.',
      defaultBody: {
        internshipId: 'ins-1',
        documentType: 'INTRODUCTION_LETTER',
        file: '[Binary File Upload: moarefiname_daneshgah.pdf (2.4 MB)]',
      },
      responseExample: {
        statusCode: 201,
        message: 'فایل مدرک با موفقیت بارگذاری و ذخیره گردید',
        data: {
          id: 'doc-99',
          fileName: 'moarefiname_daneshgah.pdf',
          filePath: '/uploads/documents/file-1726880000.pdf',
          documentType: 'INTRODUCTION_LETTER',
          downloadUrl: '/api/documents/download/doc-99',
        },
      },
    },
    {
      id: 'documents-download',
      tag: 'Documents',
      method: 'GET',
      path: '/api/documents/download/doc-1',
      summary: 'دانلود مستقیم فایل مدرک با استریم باینری',
      description: 'تولید هدرهای Content-Disposition و ارسال مستقیم بایت‌های سند به کلاینت.',
      responseExample: {
        headers: {
          'content-disposition': 'attachment; filename="moarefiname_daneshgah.pdf"',
          'content-type': 'application/pdf',
        },
        binaryData: '[PDF Document Stream]',
      },
    },

    // Evaluations
    {
      id: 'evaluations-create',
      tag: 'Evaluations',
      method: 'POST',
      path: '/api/evaluations',
      summary: 'ثبت ارزیابی نهایی کارآموزی (فرمول ۵ معیاره، محاسبه نمره نهایی و خاتمه دوره)',
      description: 'محاسبه خودکار نمره نهایی از ۲۰، تغییر وضعیت کارآموزی به COMPLETED با پیشرفت ۱۰۰٪ و ارسال اعلان به دانشجو.',
      requiredRole: ['PROFESSOR', 'ADMIN'],
      defaultBody: {
        internshipId: 'ins-1',
        technicalSkill: 19.5,
        responsibility: 20.0,
        discipline: 19.5,
        teamwork: 19.0,
        attendance: 20.0,
        description: 'دانشجو در طول دوره کارآموزی عملکرد فنی درخشان، انضباط حرفه‌ای و تعهد کاری مثال‌زدنی از خود نشان داد.',
      },
      responseExample: {
        statusCode: 201,
        message: 'ارزیابی نهایی با موفقیت ثبت شد و دوره کارآموزی پایان یافت',
        data: {
          id: 'eval-5',
          finalScore: 19.5,
          technicalSkill: 19.5,
          responsibility: 20.0,
          discipline: 19.5,
          teamwork: 19.0,
          attendance: 20.0,
          internshipStatus: 'COMPLETED',
          progressPercentage: 100,
        },
      },
    },

    // Notifications
    {
      id: 'notifications-my',
      tag: 'Notifications',
      method: 'GET',
      path: '/api/notifications/my?page=1&limit=10',
      summary: 'دریافت اعلان‌های شخصی کاربر فعال',
      description: 'مشاهده تاریخچه پیام‌ها، وضعیت خوانده شدن و هشدارهای گردش‌کار.',
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            { id: 'notif-1', title: 'تأیید درخواست کارآموزی', message: 'درخواست شما در شرکت دیجی‌کالا تأیید شد.', isRead: false },
            { id: 'notif-2', title: 'تأیید گزارش هفتگی ۳', message: 'گزارش شما توسط استاد ناظر تأیید گردید.', isRead: true },
          ],
          unreadCount: 1,
        },
      },
    },

    // Activity Logs
    {
      id: 'activity-logs-all',
      tag: 'Activity Logs',
      method: 'GET',
      path: '/api/activity-logs?page=1&limit=10',
      summary: 'دریافت لاگ‌های حسابرسی و امنیتی سیستم',
      description: 'ردگیری تاریخ و ساعت و شرح عملیات کلیه کاربران در بستر سامانه.',
      requiredRole: ['ADMIN'],
      responseExample: {
        statusCode: 200,
        data: {
          items: [
            { id: 'log-1', action: 'ورود به سامانه به عنوان مدیر ارشد سیستم', createdAt: new Date().toISOString() },
            { id: 'log-2', action: 'تأیید درخواست کارآموزی شماره req-1 و تخصیص استاد ناظر', createdAt: new Date().toISOString() },
          ],
          meta: { totalItems: 6, currentPage: 1 },
        },
      },
    },
  ];

  const tags = ['All', ...Array.from(new Set(endpoints.map((e) => e.tag)))];

  const filteredEndpoints = endpoints.filter((e) => {
    const matchesTag = selectedTag === 'All' || e.tag === selectedTag;
    const matchesSearch =
      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleExecute = (ep: EndpointDef) => {
    setIsExecuting((prev) => ({ ...prev, [ep.id]: true }));

    // Simulate realistic execution latency & response
    setTimeout(() => {
      let status = ep.method === 'POST' ? 201 : 200;
      let respData = ep.responseExample;

      // Check RBAC permission simulation
      if (ep.requiredRole && !ep.requiredRole.includes(activeRole)) {
        status = 403;
        respData = {
          statusCode: 403,
          error: 'Forbidden',
          message: `نقش فعلی (${activeRole}) مجوز دسترسی به این متد را ندارد. نقش‌های مجاز: ${ep.requiredRole.join(', ')}`,
        };
      }

      setExecutionResults((prev) => ({
        ...prev,
        [ep.id]: {
          status,
          duration: Math.floor(Math.random() * 45) + 15,
          data: respData,
        },
      }));
      setIsExecuting((prev) => ({ ...prev, [ep.id]: false }));
    }, 280);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-600 text-white';
      case 'POST':
        return 'bg-emerald-600 text-white';
      case 'PATCH':
        return 'bg-amber-600 text-white';
      case 'DELETE':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search & Tag Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در متدها و مسیرهای API (مثال: /api/companies یا weekly-reports)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-right"
            dir="rtl"
          />
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner on Bearer Auth */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-slate-900 mb-1">
            سامانه احراز هویت خودکار Swagger (JWT Bearer Auth & RBAC Active):
          </p>
          شما در حال حاضر با نقش{' '}
          <span className="font-bold text-indigo-700 px-1.5 py-0.5 rounded bg-indigo-100/80">
            {activeRole}
          </span>{' '}
          در محیط تست متصل هستید. کلیه درخواست‌ها با توکن معتبر ارسال شده و گارد نقش‌ها (
          <code>RolesGuard</code>) دسترسی‌ها را طبق ساختار NestJS بررسی می‌نماید. جهت تست
          سایر نقش‌ها، از منوی بالای صفحه نقش فعال را تغییر دهید.
        </div>
      </div>

      {/* Endpoints List Accordion */}
      <div className="space-y-3">
        {filteredEndpoints.map((ep) => {
          const isOpen = openEndpointId === ep.id;
          const result = executionResults[ep.id];
          const hasRolePermission = !ep.requiredRole || ep.requiredRole.includes(activeRole);

          return (
            <div
              key={ep.id}
              className={`border rounded-2xl transition-all duration-200 bg-white overflow-hidden shadow-xs ${
                isOpen ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Endpoint Header / Trigger */}
              <div
                onClick={() => setOpenEndpointId(isOpen ? '' : ep.id)}
                className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-18 text-center py-1 text-xs font-black tracking-wider rounded-lg uppercase ${getMethodBadgeClass(
                      ep.method,
                    )}`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-sm font-semibold text-slate-900 tracking-tight">
                    {ep.path}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium hidden md:inline">
                    {ep.summary}
                  </span>
                  {ep.requiredRole && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        hasRolePermission
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {ep.requiredRole.join(' | ')}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Body */}
              {isOpen && (
                <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50 space-y-4 text-right" dir="rtl">
                  {/* Summary & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{ep.summary}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{ep.description}</p>
                  </div>

                  {/* Request Body Editor if POST/PATCH */}
                  {ep.defaultBody && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5" dir="ltr">
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          Request Body (application/json)
                        </span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(ep.defaultBody, null, 2), `req-${ep.id}`)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          {copiedId === `req-${ep.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> کپی شد
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> کپی قالب JSON
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        dir="ltr"
                        rows={6}
                        defaultValue={JSON.stringify(ep.defaultBody, null, 2)}
                        onChange={(e) =>
                          setRequestBodies((prev) => ({ ...prev, [ep.id]: e.target.value }))
                        }
                        className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Action Bar: Try it Out */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200" dir="ltr">
                    <button
                      id={`execute-btn-${ep.id}`}
                      onClick={() => handleExecute(ep)}
                      disabled={isExecuting[ep.id]}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isExecuting[ep.id] ? 'در حال ارسال کوئری...' : 'ارسال درخواست آزمایشی (Execute)'}
                    </button>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>CURL / OpenAPI 3.0 Compatible</span>
                    </div>
                  </div>

                  {/* Execution Response */}
                  {result && (
                    <div className="mt-4 pt-4 border-t border-slate-200" dir="ltr">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            Server Response
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              result.status >= 200 && result.status < 300
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            HTTP {result.status}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Latency: {result.duration} ms
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2), `res-${ep.id}`)}
                          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          {copiedId === `res-${ep.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> کپی شد
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> کپی خروجی
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto max-h-72 border border-slate-800">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
