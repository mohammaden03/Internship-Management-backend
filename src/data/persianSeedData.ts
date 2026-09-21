import {
  User,
  Student,
  Professor,
  Company,
  InternshipRequest,
  Internship,
  WeeklyReport,
  Document,
  Evaluation,
  Notification,
  ActivityLog,
} from '../types';

export const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    firstName: 'علی',
    lastName: 'احمدی',
    email: 'admin@university.ac.ir',
    phoneNumber: '09121112233',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  // 5 Professors
  {
    id: 'usr-prof-1',
    firstName: 'حمیدرضا',
    lastName: 'صادقی',
    email: 'dr.sadeghi@university.ac.ir',
    phoneNumber: '09121000001',
    role: 'PROFESSOR',
    isActive: true,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'usr-prof-2',
    firstName: 'زهرا',
    lastName: 'کریمی',
    email: 'dr.karimi@university.ac.ir',
    phoneNumber: '09121000002',
    role: 'PROFESSOR',
    isActive: true,
    createdAt: '2026-06-01T09:10:00.000Z',
    updatedAt: '2026-06-01T09:10:00.000Z',
  },
  {
    id: 'usr-prof-3',
    firstName: 'محسن',
    lastName: 'موسوی',
    email: 'dr.mousavi@university.ac.ir',
    phoneNumber: '09121000003',
    role: 'PROFESSOR',
    isActive: true,
    createdAt: '2026-06-01T09:20:00.000Z',
    updatedAt: '2026-06-01T09:20:00.000Z',
  },
  {
    id: 'usr-prof-4',
    firstName: 'مریم',
    lastName: 'ابراهیمی',
    email: 'dr.ebrahimi@university.ac.ir',
    phoneNumber: '09121000004',
    role: 'PROFESSOR',
    isActive: true,
    createdAt: '2026-06-01T09:30:00.000Z',
    updatedAt: '2026-06-01T09:30:00.000Z',
  },
  {
    id: 'usr-prof-5',
    firstName: 'امیرحسین',
    lastName: 'حسینی',
    email: 'dr.hosseini@university.ac.ir',
    phoneNumber: '09121000005',
    role: 'PROFESSOR',
    isActive: true,
    createdAt: '2026-06-01T09:40:00.000Z',
    updatedAt: '2026-06-01T09:40:00.000Z',
  },
  // 10 Students
  { id: 'usr-st-1', firstName: 'محمد', lastName: 'رضایی', email: 'm.rezaei@student.ac.ir', phoneNumber: '09351000001', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:00:00.000Z', updatedAt: '2026-06-02T10:00:00.000Z' },
  { id: 'usr-st-2', firstName: 'سارا', lastName: 'علوی', email: 's.alavi@student.ac.ir', phoneNumber: '09351000002', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:05:00.000Z', updatedAt: '2026-06-02T10:05:00.000Z' },
  { id: 'usr-st-3', firstName: 'پویا', lastName: 'فرهادی', email: 'p.farhadi@student.ac.ir', phoneNumber: '09351000003', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:10:00.000Z', updatedAt: '2026-06-02T10:10:00.000Z' },
  { id: 'usr-st-4', firstName: 'نیلوفر', lastName: 'کاظمی', email: 'n.kazemi@student.ac.ir', phoneNumber: '09351000004', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:15:00.000Z', updatedAt: '2026-06-02T10:15:00.000Z' },
  { id: 'usr-st-5', firstName: 'امید', lastName: 'باقری', email: 'o.bagheri@student.ac.ir', phoneNumber: '09351000005', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:20:00.000Z', updatedAt: '2026-06-02T10:20:00.000Z' },
  { id: 'usr-st-6', firstName: 'فاطمه', lastName: 'نجفی', email: 'f.najafi@student.ac.ir', phoneNumber: '09351000006', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:25:00.000Z', updatedAt: '2026-06-02T10:25:00.000Z' },
  { id: 'usr-st-7', firstName: 'آرش', lastName: 'رستم‌زاده', email: 'a.rostam@student.ac.ir', phoneNumber: '09351000007', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:30:00.000Z', updatedAt: '2026-06-02T10:30:00.000Z' },
  { id: 'usr-st-8', firstName: 'مهسا', lastName: 'حیدری', email: 'm.heidari@student.ac.ir', phoneNumber: '09351000008', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:35:00.000Z', updatedAt: '2026-06-02T10:35:00.000Z' },
  { id: 'usr-st-9', firstName: 'سینا', lastName: 'مرادی', email: 's.moradi@student.ac.ir', phoneNumber: '09351000009', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:40:00.000Z', updatedAt: '2026-06-02T10:40:00.000Z' },
  { id: 'usr-st-10', firstName: 'یلدا', lastName: 'پیروزیان', email: 'y.pirouz@student.ac.ir', phoneNumber: '09351000010', role: 'STUDENT', isActive: true, createdAt: '2026-06-02T10:45:00.000Z', updatedAt: '2026-06-02T10:45:00.000Z' },
];

export const initialProfessors: Professor[] = [
  { id: 'prof-1', department: 'مهندسی کامپیوتر و فناوری اطلاعات', academicRank: 'استاد تمام', userId: 'usr-prof-1' },
  { id: 'prof-2', department: 'مهندسی برق و مخابرات', academicRank: 'دانشیار', userId: 'usr-prof-2' },
  { id: 'prof-3', department: 'مهندسی صنایع و تحلیل سیستم', academicRank: 'استادیار', userId: 'usr-prof-3' },
  { id: 'prof-4', department: 'مهندسی کامپیوتر و هوش مصنوعی', academicRank: 'دانشیار', userId: 'usr-prof-4' },
  { id: 'prof-5', department: 'مهندسی مکانیک و طراحی کاربردی', academicRank: 'استاد تمام', userId: 'usr-prof-5' },
];

export const initialStudents: Student[] = [
  { id: 'st-1', studentNumber: '99123401', faculty: 'دانشکده مهندسی کامپیوتر', major: 'مهندسی نرم‌افزار', degreeLevel: 'کارشناسی', userId: 'usr-st-1' },
  { id: 'st-2', studentNumber: '99123402', faculty: 'دانشکده مهندسی کامپیوتر', major: 'فناوری اطلاعات و شبکه', degreeLevel: 'کارشناسی', userId: 'usr-st-2' },
  { id: 'st-3', studentNumber: '99123403', faculty: 'دانشکده مهندسی برق', major: 'الکترونیک دیجیتال', degreeLevel: 'کارشناسی', userId: 'usr-st-3' },
  { id: 'st-4', studentNumber: '99123404', faculty: 'دانشکده مهندسی صنایع', major: 'مدیریت زنجیره تأمین', degreeLevel: 'کارشناسی', userId: 'usr-st-4' },
  { id: 'st-5', studentNumber: '99123405', faculty: 'دانشکده مهندسی کامپیوتر', major: 'هوش مصنوعی و کلان‌داده', degreeLevel: 'کارشناسی ارشد', userId: 'usr-st-5' },
  { id: 'st-6', studentNumber: '99123406', faculty: 'دانشکده مهندسی مکانیک', major: 'طراحی کاربردی و جامدات', degreeLevel: 'کارشناسی', userId: 'usr-st-6' },
  { id: 'st-7', studentNumber: '99123407', faculty: 'دانشکده مهندسی کامپیوتر', major: 'امنیت سایبری و شبکه', degreeLevel: 'کارشناسی ارشد', userId: 'usr-st-7' },
  { id: 'st-8', studentNumber: '99123408', faculty: 'دانشکده مهندسی صنایع', major: 'سیستم‌های تولیدی و لجستیک', degreeLevel: 'کارشناسی', userId: 'usr-st-8' },
  { id: 'st-9', studentNumber: '99123409', faculty: 'دانشکده مهندسی کامپیوتر', major: 'رایانش ابری و سامانه‌های مقیاس‌پذیر', degreeLevel: 'کارشناسی', userId: 'usr-st-9' },
  { id: 'st-10', studentNumber: '99123410', faculty: 'دانشکده مهندسی برق', major: 'کنترل و ابزار دقیق', degreeLevel: 'کارشناسی', userId: 'usr-st-10' },
];

export const initialCompanies: Company[] = [
  { id: 'comp-1', name: 'دیجی‌کالا (گروه نوآوران فناوری)', industry: 'تجارت الکترونیک و رایانش ابری', city: 'تهران', address: 'خیابان گاندی، خیابان بیست و یکم، پلاک ۲۸', phone: '02161930000', supervisorName: 'مهندس سعید پورعلی', supervisorPhone: '09123456789', createdAt: '2026-06-01' },
  { id: 'comp-2', name: 'اسنپ (ایده گزین ارتباطات)', industry: 'حمل و نقل هوشمند و سرویس‌های مکان‌محور', city: 'تهران', address: 'خیابان ولیعصر، بالاتر از میدان ونک، برج نگار', phone: '02196642', supervisorName: 'خانم مهندس هدی زارعی', supervisorPhone: '09123456790', createdAt: '2026-06-01' },
  { id: 'comp-3', name: 'کافه‌بازار (آوای همراه هوشمند)', industry: 'توزیع برنامه‌های اندروید و خدمات داده', city: 'تهران', address: 'میدان ونک، خیابان ملاصدرا، خیابان پردیس، پلاک ۳۱', phone: '02188880000', supervisorName: 'مهندس رضا تقوی', supervisorPhone: '09123456791', createdAt: '2026-06-01' },
  { id: 'comp-4', name: 'گروه صنعتی مپنا', industry: 'صنایع ریلی، توربین و برق صنعتی', city: 'تهران', address: 'بلوار میرداماد، نبش خیابان کوده، پلاک ۲۳۱', phone: '02122908585', supervisorName: 'دکتر بهمن رادمنش', supervisorPhone: '09123456792', createdAt: '2026-06-01' },
  { id: 'comp-5', name: 'فناپ (ارتباطات پاسارگاد آریان)', industry: 'فناوری مالی، بانکداری دیجیتال و زیرساخت', city: 'تهران', address: 'شهرک غرب، بلوار دادمان، خیابان شفق، پلاک ۱۰', phone: '02189510000', supervisorName: 'مهندس علیرضا کیانی', supervisorPhone: '09123456793', createdAt: '2026-06-01' },
  { id: 'comp-6', name: 'دیوار (نیازمندی‌های آنلاین)', industry: 'پلتفرم‌های داده مقیاس‌پذیر و یادگیری ماشین', city: 'تهران', address: 'کوی نصر (گیشا)، خیابان شهید علیالی، پلاک ۶۲', phone: '02143000020', supervisorName: 'مهندس نوید صادقیان', supervisorPhone: '09123456794', createdAt: '2026-06-01' },
  { id: 'comp-7', name: 'آسان پرداخت پرشین (آپ)', industry: 'سامانه‌های پرداخت الکترونیک و فین‌تک', city: 'تهران', address: 'خیابان کریمخان زند، خیابان سنایی، پلاک ۷', phone: '02183333', supervisorName: 'خانم مهندس شیما افشار', supervisorPhone: '09123456795', createdAt: '2026-06-01' },
  { id: 'comp-8', name: 'گروه شرکت‌های شاتل', industry: 'ارتباطات ماهواره‌ای، فیبر نوری و دیتاسنتر', city: 'تهران', address: 'خیابان شریعتی، بالاتر از پل رومی، کوچه سینا', phone: '02191000000', supervisorName: 'مهندس مسعود کرمی', supervisorPhone: '09123456796', createdAt: '2026-06-01' },
  { id: 'comp-9', name: 'شرکت خدمات ارتباطی ایرانسل', industry: 'مخابرات سیار، اینترنت اشیاء و شبکه 5G', city: 'تهران', address: 'میدان هروی، خیابان پناهی‌نیا، خیابان زندی غربی', phone: '021707', supervisorName: 'دکتر فریبرز نیک‌نام', supervisorPhone: '09123456797', createdAt: '2026-06-01' },
  { id: 'comp-10', name: 'تپسی (فناوری و دانش آرامیس)', industry: 'سامانه‌های اعزام هوشمند و الگوریتم‌های ترافیک', city: 'تهران', address: 'سعادت‌آباد، خیابان سرو غربی، خیابان صدف', phone: '0211630', supervisorName: 'مهندس کیوان معتمدی', supervisorPhone: '09123456798', createdAt: '2026-06-01' },
];

export const initialRequests: InternshipRequest[] = Array.from({ length: 20 }).map((_, i) => {
  const student = initialStudents[i % initialStudents.length];
  const company = initialCompanies[i % initialCompanies.length];
  const titles = [
    'کارآموزی توسعه بک‌اند با NestJS و میکروسرویس‌ها',
    'کارآموزی طراحی سیستم‌های توزیع‌شده با کافکا',
    'کارآموزی یادگیری ماشین و تحلیل سبد خرید',
    'کارآموزی راه‌اندازی زیرساخت‌های کلود و کوبرنتیز',
    'کارآموزی بهینه‌سازی الگوریتم‌های هوشمند ناوگان',
    'کارآموزی توسعه وب مدرن فرانت‌اند با React',
    'کارآموزی تست نفوذ سامانه‌های تراکنش بانکی',
    'کارآموزی نگهداری و اتوماسیون توربین‌های نیروگاهی',
    'کارآموزی کنترل کیفی خطوط تولید قطعات پیشرفته',
    'کارآموزی لجستیک انبارهای مکانیزه',
    'کارآموزی تحلیل ترافیک داده‌های مسیریابی',
    'کارآموزی پیاده‌سازی گیت‌وی پرداخت الکترونیک',
    'کارآموزی پروتکل‌های اینترنت اشیاء صنعتی',
    'کارآموزی طراحی تجربه کاربری (UI/UX) اپلیکیشن',
    'کارآموزی مانیتورینگ شبکه دیتاسنتر فیبر نوری',
    'کارآموزی شبیه‌سازی دینامیک سیالات هیدرولیک',
    'کارآموزی هوش تجاری و داشبورد با Power BI',
    'کارآموزی اتوماسیون فرآیندهای اداری سازمانی',
    'کارآموزی بینایی ماشین برای خطوط کنترل کیفیت',
    'کارآموزی معماری پایگاه‌داده‌های توزیع‌شده با ردیس',
  ];

  let status: 'APPROVED' | 'PENDING' | 'REJECTED' = 'APPROVED';
  if (i === 16 || i === 17 || i === 18) status = 'PENDING';
  if (i === 19) status = 'REJECTED';

  return {
    id: `req-${i + 1}`,
    studentId: student.id,
    companyId: company.id,
    title: titles[i],
    description: `درخواست رسمی کارآموزی جهت گذراندن دوره ۲۴۰ ساعته در شرکت ${company.name} تحت عنوان تخصصی ${titles[i]}.`,
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-09-30T00:00:00.000Z',
    totalHours: 240,
    status,
    createdAt: '2026-06-10T11:00:00.000Z',
  };
});

export const initialInternships: Internship[] = Array.from({ length: 15 }).map((_, i) => {
  const req = initialRequests[i];
  const prof = initialProfessors[i % initialProfessors.length];
  let status: 'ACTIVE' | 'COMPLETED' | 'PENDING' = 'ACTIVE';
  let progress = Math.min(100, Math.floor((i + 3) * 7.5));
  if (i >= 10 && i < 14) {
    status = 'COMPLETED';
    progress = 100;
  } else if (i === 14) {
    status = 'PENDING';
    progress = 0;
  }

  return {
    id: `ins-${i + 1}`,
    studentId: req.studentId,
    professorId: prof.id,
    companyId: req.companyId,
    requestId: req.id,
    startDate: req.startDate,
    endDate: req.endDate,
    progressPercentage: progress,
    status,
  };
});

export const initialReports: WeeklyReport[] = [];
let rCount = 0;
const reportThemes = [
  { act: 'آشنایی با متدولوژی اجایل اسکرام، تحویل وظایف و بررسی معماری سیستم', skill: 'Git, Jira, Agile Scrum, Docker' },
  { act: 'راه‌اندازی محیط توسعه کانتینری با داکر کامپوز و اتصال به پایگاه‌داده پستگرس', skill: 'Docker Compose, PostgreSQL, Prisma' },
  { act: 'طراحی ساختار ماژولار و پیاده‌سازی انتیتی‌ها و مایگریشن جداول اولیه', skill: 'Prisma ORM, Relational Schema Design' },
  { act: 'پیاده‌سازی ماژول احراز هویت با JWT، هش‌کردن پسوردها و گارد نقش‌ها (RBAC)', skill: 'JWT Authentication, Guards, Security' },
  { act: 'طراحی و پیاده‌سازی اندپوینت‌های CRUD همراه با اعتبارسنجی ورودی‌ها و سواگر', skill: 'NestJS Controllers, DTOs, Swagger' },
  { act: 'تست‌نویسی جامع واحد (Unit Test) برای سرویس‌های اصلی با Jest', skill: 'TDD, Jest, Unit Testing' },
  { act: 'اتصال سرویس صف پیام با BullMQ برای ارسال رویدادها و نوتیفیکیشن‌ها', skill: 'Message Queues, Background Jobs' },
  { act: 'ارزیابی عملکرد اندپوینت‌ها با ابزار k6 و اعمال کشینگ برای کوئری‌ها', skill: 'Performance Benchmarking, Redis Caching' },
  { act: 'ایجاد پایپ‌لاین CI/CD جهت تست خودکار و دیپلوی در محیط استیجینگ', skill: 'CI/CD Pipelines, GitHub Actions' },
  { act: 'نگارش گزارش نهایی دوره کارآموزی و آماده‌سازی اسلایدهای ارائه دفاعیه', skill: 'Technical Documentation, Presentation' },
];

for (let i = 0; i < initialInternships.length && rCount < 50; i++) {
  const ins = initialInternships[i];
  const numReports = Math.min(4, 50 - rCount);
  for (let w = 1; w <= numReports; w++) {
    rCount++;
    const theme = reportThemes[(rCount - 1) % reportThemes.length];
    let status: 'APPROVED' | 'SUBMITTED' | 'DRAFT' = 'APPROVED';
    let comment: string | null = 'گزارش این هفته بررسی و تأیید شد. کیفیت پیاده‌سازی مطلوب است.';
    if (w === 3 && i % 2 === 0) {
      status = 'SUBMITTED';
      comment = null;
    } else if (w === 4) {
      status = 'DRAFT';
      comment = null;
    }

    initialReports.push({
      id: `rep-${rCount}`,
      internshipId: ins.id,
      weekNumber: w,
      startDate: `2026-07-0${w}T00:00:00.000Z`,
      endDate: `2026-07-0${w + 6}T00:00:00.000Z`,
      activities: theme.act,
      skillsLearned: theme.skill,
      challenges: 'مدیریت خطاهای شبکه‌ای و سازگاری پکیج‌های شخص ثالث',
      description: `شرح کامل فعالیت‌های هفته ${w} دوره کارآموزی در واحد مهندسی شرکت.`,
      status,
      professorComment: comment,
      createdAt: '2026-07-10T14:00:00.000Z',
    });
  }
}

export const initialEvaluations: Evaluation[] = [
  { id: 'eval-1', internshipId: 'ins-11', technicalSkill: 19.5, responsibility: 20.0, discipline: 19.5, teamwork: 19.0, attendance: 20.0, description: 'تسلط عالی بر مباحث توسعه بک‌اند و اخلاق حرفه‌ای برجسته.', finalScore: 19.5, createdAt: '2026-09-25T10:00:00.000Z' },
  { id: 'eval-2', internshipId: 'ins-12', technicalSkill: 19.0, responsibility: 19.0, discipline: 20.0, teamwork: 18.5, attendance: 20.0, description: 'دانشجو با پشتکار بالا پروژه‌های محوله را در زمان مقرر تحویل داد.', finalScore: 19.2, createdAt: '2026-09-26T11:00:00.000Z' },
  { id: 'eval-3', internshipId: 'ins-13', technicalSkill: 18.5, responsibility: 19.5, discipline: 19.0, teamwork: 19.0, attendance: 20.0, description: 'توانایی برجسته در کار تیمی و حل مسائل پیچیده الگوریتمی.', finalScore: 19.1, createdAt: '2026-09-27T12:00:00.000Z' },
  { id: 'eval-4', internshipId: 'ins-14', technicalSkill: 20.0, responsibility: 20.0, discipline: 20.0, teamwork: 19.5, attendance: 20.0, description: 'عملکرد درخشان و مورد تشویق مدیران ارشد شرکت میزبان.', finalScore: 19.9, createdAt: '2026-09-28T14:00:00.000Z' },
];

export const initialNotifications: Notification[] = [
  { id: 'notif-1', userId: 'usr-st-1', title: 'تأیید درخواست کارآموزی', message: 'درخواست کارآموزی شما در شرکت دیجی‌کالا توسط استاد ناظر تأیید و پرونده فعال گردید.', isRead: false, createdAt: '2026-07-02T10:00:00.000Z' },
  { id: 'notif-2', userId: 'usr-st-1', title: 'تأیید گزارش هفتگی ۳', message: 'گزارش هفتگی شماره ۳ شما توسط دکتر صادقی بررسی و با امتیاز عالی تأیید شد.', isRead: true, createdAt: '2026-07-22T14:30:00.000Z' },
  { id: 'notif-3', userId: 'usr-st-2', title: 'تخصیص استاد ناظر', message: 'خانم دکتر کریمی به عنوان استاد ناظر دوره کارآموزی شما در شرکت اسنپ تعیین شدند.', isRead: false, createdAt: '2026-07-03T09:15:00.000Z' },
  { id: 'notif-4', userId: 'usr-prof-1', title: 'ارسال گزارش هفتگی جدید', message: 'دانشجو محمد رضایی گزارش هفتگی شماره ۴ را جهت بررسی و تأیید ارسال نمود.', isRead: false, createdAt: '2026-07-29T16:00:00.000Z' },
];

export const initialActivityLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'usr-admin-1', action: 'ورود به سامانه به عنوان مدیر ارشد سیستم', createdAt: '2026-09-21T07:10:00.000Z' },
  { id: 'log-2', userId: 'usr-st-1', action: 'ثبت درخواست کارآموزی برای شرکت دیجی‌کالا', createdAt: '2026-09-21T07:12:00.000Z' },
  { id: 'log-3', userId: 'usr-admin-1', action: 'تأیید درخواست کارآموزی شماره req-1 و تخصیص استاد ناظر', createdAt: '2026-09-21T07:15:00.000Z' },
  { id: 'log-4', userId: 'usr-st-1', action: 'ثبت و ارسال گزارش هفتگی شماره ۱', createdAt: '2026-09-21T07:18:00.000Z' },
  { id: 'log-5', userId: 'usr-prof-1', action: 'تأیید گزارش هفتگی شماره ۱ برای دانشجو محمد رضایی', createdAt: '2026-09-21T07:20:00.000Z' },
  { id: 'log-6', userId: 'usr-prof-1', action: 'ثبت ارزیابی نهایی برای کارآموزی ins-11 با نمره ۱۹.۵/۲۰', createdAt: '2026-09-21T07:22:00.000Z' },
];
