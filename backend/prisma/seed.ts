import { PrismaClient, Role, InternshipStatus, RequestStatus, ReportStatus, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Persian Seed Data Generation for Semnan University Internship System...');

  // Clean existing tables in reverse relational order
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.internshipRequest.deleteMany();
  await prisma.company.deleteMany();
  await prisma.student.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123@', 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      id: 'user-admin-1',
      firstName: 'علیرضا',
      lastName: 'حسینی',
      email: 'internship_office@semnan.ac.ir',
      nationalCode: '0098765432',
      password: defaultPassword,
      phoneNumber: '02331530000',
      role: Role.ADMIN,
      isActive: true,
      activityLogs: {
        create: [
          { action: 'ورود مهندس حسینی (مدیر اداره کارآموزی) به سامانه جامع دانشگاه' },
          { action: 'بررسی آیین‌نامه و شیوه اجرای دوره کارآموزی تابستان ۱۴۰۳' }
        ]
      }
    }
  });

  // 2. Create Professors
  const professorsData = [
    {
      userId: 'user-prof-1',
      profId: 'prof-1',
      firstName: 'محمد',
      lastName: 'رضایی',
      email: 'rezaei@semnan.ac.ir',
      nationalCode: '0011223344',
      phoneNumber: '09127894561',
      department: 'مهندسی کامپیوتر',
      academicRank: 'دانشیار'
    },
    {
      userId: 'user-prof-2',
      profId: 'prof-2',
      firstName: 'سارا',
      lastName: 'احمدی',
      email: 'ahmadi_s@semnan.ac.ir',
      nationalCode: '0022334455',
      phoneNumber: '09128912345',
      department: 'مهندسی صنایع',
      academicRank: 'استادیار'
    }
  ];

  const createdProfessors = [];
  for (const p of professorsData) {
    const user = await prisma.user.create({
      data: {
        id: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        nationalCode: p.nationalCode,
        password: defaultPassword,
        phoneNumber: p.phoneNumber,
        role: Role.PROFESSOR,
        isActive: true,
        activityLogs: {
          create: [{ action: `ورود استاد ${p.firstName} ${p.lastName} به سامانه نظارت کارآموزی` }]
        }
      }
    });

    const prof = await prisma.professor.create({
      data: {
        id: p.profId,
        userId: user.id,
        department: p.department,
        academicRank: p.academicRank
      }
    });
    createdProfessors.push(prof);
  }

  // 3. Create Students
  const studentsData = [
    {
      userId: 'user-stu-1',
      studentId: 'stu-1',
      studentNumber: '400105432',
      firstName: 'محمد',
      lastName: 'احمدی',
      email: 'm.ahmadi@semnan.ac.ir',
      nationalCode: '0021345678',
      phoneNumber: '09121234567',
      faculty: 'مهندسی کامپیوتر',
      major: 'مهندسی نرم‌افزار',
      degreeLevel: 'کارشناسی'
    },
    {
      userId: 'user-stu-2',
      studentId: 'stu-2',
      studentNumber: '400108921',
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'a.rezaei@semnan.ac.ir',
      nationalCode: '0019876543',
      phoneNumber: '09122345678',
      faculty: 'مهندسی کامپیوتر',
      major: 'هوش مصنوعی و داده',
      degreeLevel: 'کارشناسی'
    },
    {
      userId: 'user-stu-3',
      studentId: 'stu-3',
      studentNumber: '400201456',
      firstName: 'سارا',
      lastName: 'محمدی',
      email: 's.mohammadi@semnan.ac.ir',
      nationalCode: '0032145698',
      phoneNumber: '09123456789',
      faculty: 'مهندسی صنایع',
      major: 'تحلیل سیستم‌ها',
      degreeLevel: 'کارشناسی'
    },
    {
      userId: 'user-stu-4',
      studentId: 'stu-4',
      studentNumber: '400305882',
      firstName: 'مهدی',
      lastName: 'کریمی',
      email: 'm.karimi@semnan.ac.ir',
      nationalCode: '0045678912',
      phoneNumber: '09124567890',
      faculty: 'مهندسی کامپیوتر',
      major: 'فناوری اطلاعات',
      degreeLevel: 'کارشناسی'
    }
  ];

  const createdStudents = [];
  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        id: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        nationalCode: s.nationalCode,
        password: defaultPassword,
        phoneNumber: s.phoneNumber,
        role: Role.STUDENT,
        isActive: true,
        activityLogs: {
          create: [{ action: `ورود دانشجو ${s.firstName} ${s.lastName} (شماره دانشجویی: ${s.studentNumber}) به سامانه کارآموزی` }]
        }
      }
    });

    const stu = await prisma.student.create({
      data: {
        id: s.studentId,
        userId: user.id,
        studentNumber: s.studentNumber,
        faculty: s.faculty,
        major: s.major,
        degreeLevel: s.degreeLevel
      }
    });
    createdStudents.push(stu);
  }

  // 4. Create Companies
  const companiesData = [
    {
      id: 'comp-1',
      name: 'شرکت فناوران هوشمند',
      industry: 'توسعه نرم‌افزارهای ابری و هوش مصنوعی',
      city: 'تهران',
      address: 'تهران، خیابان آزادی، ناحیه نوآوری شریف، برج فناوری، طبقه ۵',
      phone: '۰۲۱-۶۶۷۸۹۰۰۱',
      supervisorName: 'مهندس آرش طاهری',
      supervisorPhone: '09121112233'
    },
    {
      id: 'comp-2',
      name: 'شرکت توسعه نرم افزار پارس',
      industry: 'سیستم‌های بانکی و پرداخت الکترونیک',
      city: 'تهران',
      address: 'تهران، سعادت آباد، بلوار پاکنژاد، پلاک ۴۲',
      phone: '۰۲۱-۲۲۰۸۹۴۵۰',
      supervisorName: 'مهندس مریم صادقی',
      supervisorPhone: '09122223344'
    },
    {
      id: 'comp-3',
      name: 'شرکت فناوری اطلاعات آریا',
      industry: 'امنیت سایبری و زیرساخت شبکه',
      city: 'تهران',
      address: 'تهران، میدان ونک، خیابان ملاصدرا، ساختمان پردیس',
      phone: '۰۲۱-۸۸۹۹۰۰۱۱',
      supervisorName: 'دکتر کامران شفیعی',
      supervisorPhone: '09123334455'
    },
    {
      id: 'comp-4',
      name: 'هلدینگ داده‌ورزان نوین',
      industry: 'طراحی داده‌محور و سامانه‌های سازمانی',
      city: 'سمنان',
      address: 'سمنان، پردیس فناوری دانشگاه سمنان، ساختمان نوآوری',
      phone: '۰۲۳-۳۳۴۴۵۵۶۶',
      supervisorName: 'مهندس پویا فرهمند',
      supervisorPhone: '09124445566'
    }
  ];

  const createdCompanies = [];
  for (const c of companiesData) {
    const comp = await prisma.company.create({
      data: c
    });
    createdCompanies.push(comp);
  }

  // 5. Create Internship Requests
  const requestsData = [
    {
      id: 'req-1',
      studentId: 'stu-1',
      companyId: 'comp-1',
      title: 'توسعه بک‌اند و سرویس‌های میکروسرویس',
      description: 'درخواست رسمی کارآموزی تابستانه جهت گذراندن دوره ۲۴۰ ساعته کارآموزی در شرکت فناوران هوشمند در زمینه توسعه بک‌اند.',
      startDate: new Date('2024-06-21T00:00:00.000Z'),
      endDate: new Date('2024-09-21T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    },
    {
      id: 'req-2',
      studentId: 'stu-2',
      companyId: 'comp-4',
      title: 'طراحی رابط کاربری و تحلیل تجربه کاربری',
      description: 'درخواست کارآموزی در هلدینگ داده‌ورزان نوین برای زمینه طراحی رابط کاربری و تحلیل تجربه کاربری.',
      startDate: new Date('2024-09-22T00:00:00.000Z'),
      endDate: new Date('2024-12-20T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.PENDING
    },
    {
      id: 'req-3',
      studentId: 'stu-3',
      companyId: 'comp-2',
      title: 'تحلیل داده و کنترل فرآیند تولید',
      description: 'درخواست کارآموزی در شرکت توسعه نرم افزار پارس جهت تحلیل داده و کنترل فرآیند تولید.',
      startDate: new Date('2024-09-26T00:00:00.000Z'),
      endDate: new Date('2024-12-25T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.PENDING
    },
    // Supporting approved requests for active/completed internships 2, 3, and 4
    {
      id: 'req-intern-2',
      studentId: 'stu-2',
      companyId: 'comp-2',
      title: 'سیستم‌های بانکی و پرداخت الکترونیک',
      description: 'درخواست مصوب دوره کارآموزی در شرکت توسعه نرم‌افزار پارس.',
      startDate: new Date('2024-06-30T00:00:00.000Z'),
      endDate: new Date('2024-10-01T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    },
    {
      id: 'req-intern-3',
      studentId: 'stu-3',
      companyId: 'comp-3',
      title: 'امنیت سایبری و زیرساخت شبکه',
      description: 'درخواست مصوب دوره کارآموزی در شرکت فناوری اطلاعات آریا.',
      startDate: new Date('2024-07-05T00:00:00.000Z'),
      endDate: new Date('2024-10-05T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    },
    {
      id: 'req-intern-4',
      studentId: 'stu-4',
      companyId: 'comp-1',
      title: 'توسعه سامانه‌های فناوری اطلاعات و کلود',
      description: 'درخواست مصوب دوره کارآموزی دانشجو مهدی کریمی در شرکت فناوران هوشمند.',
      startDate: new Date('2024-06-04T00:00:00.000Z'),
      endDate: new Date('2024-09-04T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    }
  ];

  for (const req of requestsData) {
    await prisma.internshipRequest.create({ data: req });
  }

  // 6. Create Internships
  const internshipsData = [
    {
      id: 'intern-1',
      studentId: 'stu-1',
      professorId: 'prof-1',
      companyId: 'comp-1',
      requestId: 'req-1',
      startDate: new Date('2024-06-21T00:00:00.000Z'),
      endDate: new Date('2024-09-21T00:00:00.000Z'),
      progressPercentage: 75,
      status: InternshipStatus.ACTIVE
    },
    {
      id: 'intern-2',
      studentId: 'stu-2',
      professorId: 'prof-1',
      companyId: 'comp-2',
      requestId: 'req-intern-2',
      startDate: new Date('2024-06-30T00:00:00.000Z'),
      endDate: new Date('2024-10-01T00:00:00.000Z'),
      progressPercentage: 100,
      status: InternshipStatus.ACTIVE
    },
    {
      id: 'intern-3',
      studentId: 'stu-3',
      professorId: 'prof-2',
      companyId: 'comp-3',
      requestId: 'req-intern-3',
      startDate: new Date('2024-07-05T00:00:00.000Z'),
      endDate: new Date('2024-10-05T00:00:00.000Z'),
      progressPercentage: 50,
      status: InternshipStatus.ACTIVE
    },
    {
      id: 'intern-4',
      studentId: 'stu-4',
      professorId: 'prof-1',
      companyId: 'comp-1',
      requestId: 'req-intern-4',
      startDate: new Date('2024-06-04T00:00:00.000Z'),
      endDate: new Date('2024-09-04T00:00:00.000Z'),
      progressPercentage: 100,
      status: InternshipStatus.COMPLETED
    }
  ];

  for (const ins of internshipsData) {
    await prisma.internship.create({ data: ins });
  }

  // 7. Create Weekly Reports
  const reportsData = [
    {
      id: 'rep-1',
      internshipId: 'intern-1',
      weekNumber: 1,
      startDate: new Date('2024-06-21T00:00:00.000Z'),
      endDate: new Date('2024-06-27T00:00:00.000Z'),
      activities: 'آشنایی با هم‌تیمی‌ها، دریافت دسترسی‌های مخازن Gitlab، کانفیگ محیط تست، بررسی معماری کدهای سمت سرور با فریم‌ورک NestJS.',
      skillsLearned: 'مفاهیم داکر کامپوز، مدیریت متغیرهای محیطی در تیم و ساختارهای ماژولار در NestJS.',
      challenges: 'محدودیت دسترسی به برخی پکیج‌های رجیستری که با تنظیم پروکسی شرکتی برطرف گردید.',
      description: 'آشنایی با ساختار پروژه و راه‌اندازی محیط توسعه Docker',
      status: ReportStatus.APPROVED,
      professorComment: 'شروع بسیار خوب و منظمی است. در گزارش‌های بعدی ساختار دقیق‌تر کامپوننت‌های پایگاه داده را نیز قید بفرمایید.'
    },
    {
      id: 'rep-2',
      internshipId: 'intern-1',
      weekNumber: 2,
      startDate: new Date('2024-06-28T00:00:00.000Z'),
      endDate: new Date('2024-07-04T00:00:00.000Z'),
      activities: 'طراحی گارد احراز هویت در NestJS، اتصال به پایگاه داده PostgreSQL از طریق Prisma ORM و نوشتن تست‌های واحد اولیه.',
      skillsLearned: 'الگوهای امنیتی ذخیره‌سازی توکن، مدیریت اکسپایر شدن سشن‌ها و کار با بیپرینت‌های امنیتی.',
      challenges: 'چالش در مدیریت Race Condition در رفرش توکن همزمان که با مکانیزم Lock حل شد.',
      description: 'پیاده‌سازی سرویس احراز هویت با JWT و رفرش توکن',
      status: ReportStatus.APPROVED,
      professorComment: 'مستندسازی دقیق بوده و انتخاب Prisma برای مدل‌سازی تایید می‌گردد.'
    },
    {
      id: 'rep-3',
      internshipId: 'intern-1',
      weekNumber: 3,
      startDate: new Date('2024-07-05T00:00:00.000Z'),
      endDate: new Date('2024-07-11T00:00:00.000Z'),
      activities: 'ایجاد اندپوینت‌های چندرسانه‌ای برای آپلود با اعتبارسنجی حجم و پسوند، یکپارچه‌سازی با MinIO سازمانی.',
      skillsLearned: 'مفاهیم Streaming در Node.js و اعتبارسنجی نوع فایل در سطح باینری (MIME type buffer).',
      challenges: 'مدیریت خطاهای وقفه در آپلود فایل‌های بزرگ که با Resumable Upload حل شد.',
      description: 'پیاده‌سازی ماژول مدیریت اسناد و بارگذاری فایل‌ها روی S3 Storage',
      status: ReportStatus.APPROVED,
      professorComment: 'خوب است، توجه به مباحث امنیتی دسترسی به فایل‌ها (Private vs Public bucket) را جدی بگیرید.'
    },
    {
      id: 'rep-4',
      internshipId: 'intern-1',
      weekNumber: 4,
      startDate: new Date('2024-07-12T00:00:00.000Z'),
      endDate: new Date('2024-07-18T00:00:00.000Z'),
      activities: 'نوشتن سناریوهای تست با Jest و Supertest، بررسی Execution Plan در دیتابیس و اضافه کردن ایندکس‌های کامپوزیت.',
      skillsLearned: 'بهینه‌سازی کارایی ایندکس‌های B-Tree و کاهش زمان اجرای کوئری‌های تودرتو از ۳۵۰ میلی‌ثانیه به ۴۰ میلی‌ثانیه.',
      challenges: 'تداخل داده‌های سید در اجرای موازی تست‌ها که با تراکنش‌های مجزا رولبک شد.',
      description: 'توسعه تست‌های یکپارچه و بهینه‌سازی کوئری‌های SQL',
      status: ReportStatus.APPROVED,
      professorComment: 'بسیار کاربردی و عالی. شاخص‌های سنجش پرفورمنس بسیار تحسین‌برانگیز است.'
    },
    {
      id: 'rep-5',
      internshipId: 'intern-1',
      weekNumber: 5,
      startDate: new Date('2024-07-19T00:00:00.000Z'),
      endDate: new Date('2024-07-25T00:00:00.000Z'),
      activities: 'تنظیم متغیرها و اسکریپت‌های بیلد اتوماتیک، کانتینرسازی مجدد و تست سلامت سیستم با Health Check API.',
      skillsLearned: 'مفاهیم Continuous Delivery و نحوه مدیریت Secretها در محیط پایپ‌لاین.',
      challenges: 'محدودیت منابع رانر که با کش کردن لایه‌های داکر زمان بیلد تا ۵۰ درصد کاهش یافت.',
      description: 'طراحی خط لوله CI/CD با Gitlab Actions و استقرار روی سرور استیجینگ',
      status: ReportStatus.APPROVED,
      professorComment: 'تایید می‌شود. دانش استقرار نرم‌افزار برای ورود به بازار کار امتیاز بزرگی است.'
    },
    {
      id: 'rep-6',
      internshipId: 'intern-1',
      weekNumber: 6,
      startDate: new Date('2024-07-26T00:00:00.000Z'),
      endDate: new Date('2024-08-01T00:00:00.000Z'),
      activities: 'طراحی صفی از ایونت‌ها جهت تفکیک وظایف ارسال ایمیل و پیامک، ایجاد کانسومرهای منعطف و کنترل Dead Letter Queue.',
      skillsLearned: 'معماری بر پایه رویداد (EDA) و الگوهای Pub/Sub.',
      challenges: 'رسیدگی به پیام‌های پردازش‌نشده و مکانیسم Retry با تاخیر تصاعدی (Exponential Backoff).',
      description: 'پیاده‌سازی پیام‌رسانی ناهمگام با RabbitMQ برای ارسال نوتیفیکیشن‌ها',
      status: ReportStatus.APPROVED,
      professorComment: 'کار سطح بالایی است و مهارت‌های فنی به خوبی در این بازه پیاده شده است.'
    },
    {
      id: 'rep-7',
      internshipId: 'intern-1',
      weekNumber: 7,
      startDate: new Date('2024-08-02T00:00:00.000Z'),
      endDate: new Date('2024-08-08T00:00:00.000Z'),
      activities: 'تکمیل DTOها با دکوریتورهای Swagger، یکپارچه‌سازی با Winston Logger و ثبت ردپاها با Correlation ID.',
      skillsLearned: 'استانداردهای بین‌المللی مستندسازی وب‌سرویس و مدیریت سیستم‌های مانیتورینگ متمرکز.',
      challenges: 'همگام‌سازی شمای کدهای کلاینت با OpenAPI Schema که با اوتوژنراتور برطرف شد.',
      description: 'مستندسازی APIها با Swagger/OpenAPI و تحلیل لاگ‌های ساختاریافته',
      status: ReportStatus.SUBMITTED,
      professorComment: null
    },
    {
      id: 'rep-8',
      internshipId: 'intern-3',
      weekNumber: 5,
      startDate: new Date('2024-08-04T00:00:00.000Z'),
      endDate: new Date('2024-08-10T00:00:00.000Z'),
      activities: 'بررسی رخدادهای غیرعادی در ترافیک شبکه، طراحی داشبورد بصری در الستیک‌سرچ و کیبانا.',
      skillsLearned: 'شناسایی الگوهای حملات DDoS و قوانین WAF.',
      challenges: 'حجم بالای لاگ‌ها که با ایجاد فیلترهای استخراجی تفکیک شد.',
      description: 'تحلیل داده‌های لاگ امنیتی و نمودارهای پایش فایروال',
      status: ReportStatus.SUBMITTED,
      professorComment: null
    }
  ];

  for (const rep of reportsData) {
    await prisma.weeklyReport.create({ data: rep });
  }

  // 8. Create Evaluations
  const evaluationsData = [
    {
      id: 'eval-1',
      internshipId: 'intern-2',
      technicalSkill: 19.5,
      responsibility: 19.0,
      discipline: 19.5,
      teamwork: 19.0,
      attendance: 20.0,
      description: 'دانشجو علی رضایی دوره کارآموزی را در شرکت توسعه نرم‌افزار پارس با موفقیت بالا به پایان رساند و مهارت‌های فنی برجسته‌ای از خود نشان داد.',
      finalScore: 19.25
    },
    {
      id: 'eval-2',
      internshipId: 'intern-4',
      technicalSkill: 20.0,
      responsibility: 20.0,
      discipline: 20.0,
      teamwork: 20.0,
      attendance: 20.0,
      description: 'عملکرد دانشجو مهدی کریمی در شرکت فناوران هوشمند در بالاترین سطح ارزیابی شد و پروژه نهایی با موفقیت کامل تحویل گردید.',
      finalScore: 20.0
    }
  ];

  for (const ev of evaluationsData) {
    await prisma.evaluation.create({ data: ev });
  }

  // 9. Create Documents
  const documentsData = [
    {
      id: 'doc-1',
      internshipId: 'intern-1',
      fileName: 'ahmadi_intro_letter.pdf',
      filePath: '/uploads/documents/ahmadi_intro_letter.pdf',
      documentType: DocumentType.INTRODUCTION_LETTER
    },
    {
      id: 'doc-2',
      internshipId: 'intern-1',
      fileName: 'internship_guideline_1403.pdf',
      filePath: '/uploads/documents/internship_guideline_1403.pdf',
      documentType: DocumentType.OTHER
    },
    {
      id: 'doc-3',
      internshipId: 'intern-2',
      fileName: 'supervisor_evaluation_template.docx',
      filePath: '/uploads/documents/supervisor_evaluation_template.docx',
      documentType: DocumentType.START_FORM
    },
    {
      id: 'doc-4',
      internshipId: 'intern-4',
      fileName: 'karimi_internship_certificate.pdf',
      filePath: '/uploads/documents/karimi_internship_certificate.pdf',
      documentType: DocumentType.FINAL_REPORT
    }
  ];

  for (const doc of documentsData) {
    await prisma.document.create({ data: doc });
  }

  // 10. Create Notifications
  const notificationsData = [
    {
      id: 'notif-1',
      userId: 'user-stu-1',
      title: 'تایید گزارش هفتگی شماره ۶',
      message: 'گزارش هفتگی شماره ۶ شما توسط دکتر محمد رضایی بررسی و با نظر مثبت تایید شد.',
      isRead: false
    },
    {
      id: 'notif-2',
      userId: 'user-stu-1',
      title: 'ثبت یادآوری: ارسال گزارش شماره ۷',
      message: 'مهلت ارسال گزارش کارآموزی هفته هفتم تا پایان روز جمعه می‌باشد.',
      isRead: true
    },
    {
      id: 'notif-3',
      userId: 'user-prof-1',
      title: 'گزارش هفتگی جدید جهت بررسی',
      message: 'دانشجو محمد احمدی گزارش هفتگی شماره ۷ را جهت بازبینی و ثبت بازخورد ارسال نموده است.',
      isRead: false
    },
    {
      id: 'notif-4',
      userId: 'user-prof-1',
      title: 'دانشجو در انتظار ارزیابی نهایی',
      message: 'دوره کارآموزی دانشجو علی رضایی تکمیل شده و منتظر تکمیل فرم نمره و ارزیابی استاد است.',
      isRead: false
    },
    {
      id: 'notif-5',
      userId: 'user-admin-1',
      title: 'درخواست کارآموزی جدید ثبت شد',
      message: 'درخواست کارآموزی جدید توسط دانشجویان در سامانه به ثبت رسید.',
      isRead: false
    }
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }

  console.log('✅ Persian Seed data updated successfully based on the exact frontend specification!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
