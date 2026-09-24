import { PrismaClient, Role, InternshipStatus, RequestStatus, ReportStatus, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Persian Seed Data Generation with Auto-increment Integer IDs...');

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

  // 1. Create Admin User (will receive auto-increment id: 1)
  const adminUser = await prisma.user.create({
    data: {
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

  // 2. Create Professors (will receive auto-increment id: 2 and 3)
  const prof1User = await prisma.user.create({
    data: {
      firstName: 'محمد',
      lastName: 'رضایی',
      email: 'rezaei@semnan.ac.ir',
      nationalCode: '0011223344',
      password: defaultPassword,
      phoneNumber: '09127894561',
      role: Role.PROFESSOR,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دکتر محمد رضایی به سامانه نظارت کارآموزی' }]
      }
    }
  });

  const prof1 = await prisma.professor.create({
    data: {
      userId: prof1User.id,
      department: 'مهندسی کامپیوتر',
      academicRank: 'دانشیار'
    }
  });

  const prof2User = await prisma.user.create({
    data: {
      firstName: 'سارا',
      lastName: 'احمدی',
      email: 'ahmadi_s@semnan.ac.ir',
      nationalCode: '0022334455',
      password: defaultPassword,
      phoneNumber: '09128912345',
      role: Role.PROFESSOR,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دکتر سارا احمدی به سامانه نظارت کارآموزی' }]
      }
    }
  });

  const prof2 = await prisma.professor.create({
    data: {
      userId: prof2User.id,
      department: 'مهندسی صنایع',
      academicRank: 'استادیار'
    }
  });

  // 3. Create Students (will receive auto-increment id: 4, 5, 6, 7)
  const stu1User = await prisma.user.create({
    data: {
      firstName: 'محمد',
      lastName: 'احمدی',
      email: 'm.ahmadi@semnan.ac.ir',
      nationalCode: '0021345678',
      password: defaultPassword,
      phoneNumber: '09121234567',
      role: Role.STUDENT,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دانشجو محمد احمدی (شماره دانشجویی: 400105432) به سامانه کارآموزی' }]
      }
    }
  });

  const stu1 = await prisma.student.create({
    data: {
      userId: stu1User.id,
      studentNumber: '400105432',
      faculty: 'مهندسی کامپیوتر',
      major: 'مهندسی نرم‌افزار',
      degreeLevel: 'کارشناسی'
    }
  });

  const stu2User = await prisma.user.create({
    data: {
      firstName: 'علی',
      lastName: 'رضایی',
      email: 'a.rezaei@semnan.ac.ir',
      nationalCode: '0019876543',
      password: defaultPassword,
      phoneNumber: '09122345678',
      role: Role.STUDENT,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دانشجو علی رضایی (شماره دانشجویی: 400108921) به سامانه کارآموزی' }]
      }
    }
  });

  const stu2 = await prisma.student.create({
    data: {
      userId: stu2User.id,
      studentNumber: '400108921',
      faculty: 'مهندسی کامپیوتر',
      major: 'هوش مصنوعی و داده',
      degreeLevel: 'کارشناسی'
    }
  });

  const stu3User = await prisma.user.create({
    data: {
      firstName: 'سارا',
      lastName: 'محمدی',
      email: 's.mohammadi@semnan.ac.ir',
      nationalCode: '0032145698',
      password: defaultPassword,
      phoneNumber: '09123456789',
      role: Role.STUDENT,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دانشجو سارا محمدی (شماره دانشجویی: 400201456) به سامانه کارآموزی' }]
      }
    }
  });

  const stu3 = await prisma.student.create({
    data: {
      userId: stu3User.id,
      studentNumber: '400201456',
      faculty: 'مهندسی صنایع',
      major: 'تحلیل سیستم‌ها',
      degreeLevel: 'کارشناسی'
    }
  });

  const stu4User = await prisma.user.create({
    data: {
      firstName: 'مهدی',
      lastName: 'کریمی',
      email: 'm.karimi@semnan.ac.ir',
      nationalCode: '0045678912',
      password: defaultPassword,
      phoneNumber: '09124567890',
      role: Role.STUDENT,
      isActive: true,
      activityLogs: {
        create: [{ action: 'ورود دانشجو مهدی کریمی (شماره دانشجویی: 400305882) به سامانه کارآموزی' }]
      }
    }
  });

  const stu4 = await prisma.student.create({
    data: {
      userId: stu4User.id,
      studentNumber: '400305882',
      faculty: 'مهندسی کامپیوتر',
      major: 'فناوری اطلاعات',
      degreeLevel: 'کارشناسی'
    }
  });

  // 4. Create Companies (will receive auto-increment id: 1, 2, 3, 4)
  const comp1 = await prisma.company.create({
    data: {
      name: 'شرکت فناوران هوشمند',
      industry: 'توسعه نرم‌افزارهای ابری و هوش مصنوعی',
      city: 'تهران',
      address: 'تهران، خیابان آزادی، ناحیه نوآوری شریف، برج فناوری، طبقه ۵',
      phone: '۰۲۱-۶۶۷۸۹۰۰۱',
      supervisorName: 'مهندس آرش طاهری',
      supervisorPhone: '09121112233'
    }
  });

  const comp2 = await prisma.company.create({
    data: {
      name: 'شرکت توسعه نرم افزار پارس',
      industry: 'سیستم‌های بانکی و پرداخت الکترونیک',
      city: 'تهران',
      address: 'تهران، سعادت آباد، بلوار پاکنژاد، پلاک ۴۲',
      phone: '۰۲۱-۲۲۰۸۹۴۵۰',
      supervisorName: 'مهندس مریم صادقی',
      supervisorPhone: '09122223344'
    }
  });

  const comp3 = await prisma.company.create({
    data: {
      name: 'شرکت فناوری اطلاعات آریا',
      industry: 'امنیت سایبری و زیرساخت شبکه',
      city: 'تهران',
      address: 'تهران، میدان ونک، خیابان ملاصدرا، ساختمان پردیس',
      phone: '۰۲۱-۸۸۹۹۰۰۱۱',
      supervisorName: 'دکتر کامران شفیعی',
      supervisorPhone: '09123334455'
    }
  });

  const comp4 = await prisma.company.create({
    data: {
      name: 'هلدینگ داده‌ورزان نوین',
      industry: 'طراحی داده‌محور و سامانه‌های سازمانی',
      city: 'سمنان',
      address: 'سمنان، پردیس فناوری دانشگاه سمنان، ساختمان نوآوری',
      phone: '۰۲۳-۳۳۴۴۵۵۶۶',
      supervisorName: 'مهندس پویا فرهمند',
      supervisorPhone: '09124445566'
    }
  });

  // 5. Create Internship Requests (will receive auto-increment id: 1, 2, 3, 4, 5, 6)
  const req1 = await prisma.internshipRequest.create({
    data: {
      studentId: stu1.id,
      companyId: comp1.id,
      title: 'توسعه بک‌اند و سرویس‌های میکروسرویس',
      description: 'درخواست رسمی کارآموزی تابستانه جهت گذراندن دوره ۲۴۰ ساعته کارآموزی در شرکت فناوران هوشمند در زمینه توسعه بک‌اند.',
      startDate: new Date('2024-06-21T00:00:00.000Z'),
      endDate: new Date('2024-09-21T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    }
  });

  const req2 = await prisma.internshipRequest.create({
    data: {
      studentId: stu2.id,
      companyId: comp4.id,
      title: 'طراحی رابط کاربری و تحلیل تجربه کاربری',
      description: 'درخواست کارآموزی در هلدینگ داده‌ورزان نوین برای زمینه طراحی رابط کاربری و تحلیل تجربه کاربری.',
      startDate: new Date('2024-09-22T00:00:00.000Z'),
      endDate: new Date('2024-12-20T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.PENDING
    }
  });

  const req3 = await prisma.internshipRequest.create({
    data: {
      studentId: stu3.id,
      companyId: comp2.id,
      title: 'تحلیل داده و کنترل فرآیند تولید',
      description: 'درخواست کارآموزی در شرکت توسعه نرم افزار پارس جهت تحلیل داده و کنترل فرآیند تولید.',
      startDate: new Date('2024-09-26T00:00:00.000Z'),
      endDate: new Date('2024-12-25T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.PENDING
    }
  });

  const reqIntern2 = await prisma.internshipRequest.create({
    data: {
      studentId: stu2.id,
      companyId: comp2.id,
      title: 'سیستم‌های بانکی و پرداخت الکترونیک',
      description: 'درخواست مصوب دوره کارآموزی در شرکت توسعه نرم‌افزار پارس.',
      startDate: new Date('2024-06-30T00:00:00.000Z'),
      endDate: new Date('2024-10-01T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    }
  });

  const reqIntern3 = await prisma.internshipRequest.create({
    data: {
      studentId: stu3.id,
      companyId: comp3.id,
      title: 'امنیت سایبری و زیرساخت شبکه',
      description: 'درخواست مصوب دوره کارآموزی در شرکت فناوری اطلاعات آریا.',
      startDate: new Date('2024-07-05T00:00:00.000Z'),
      endDate: new Date('2024-10-05T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    }
  });

  const reqIntern4 = await prisma.internshipRequest.create({
    data: {
      studentId: stu4.id,
      companyId: comp1.id,
      title: 'توسعه سامانه‌های فناوری اطلاعات و کلود',
      description: 'درخواست مصوب دوره کارآموزی دانشجو مهدی کریمی در شرکت فناوران هوشمند.',
      startDate: new Date('2024-06-04T00:00:00.000Z'),
      endDate: new Date('2024-09-04T00:00:00.000Z'),
      totalHours: 240,
      status: RequestStatus.APPROVED
    }
  });

  // 6. Create Internships (will receive auto-increment id: 1, 2, 3, 4)
  const intern1 = await prisma.internship.create({
    data: {
      studentId: stu1.id,
      professorId: prof1.id,
      companyId: comp1.id,
      requestId: req1.id,
      startDate: new Date('2024-06-21T00:00:00.000Z'),
      endDate: new Date('2024-09-21T00:00:00.000Z'),
      progressPercentage: 75,
      status: InternshipStatus.ACTIVE
    }
  });

  const intern2 = await prisma.internship.create({
    data: {
      studentId: stu2.id,
      professorId: prof1.id,
      companyId: comp2.id,
      requestId: reqIntern2.id,
      startDate: new Date('2024-06-30T00:00:00.000Z'),
      endDate: new Date('2024-10-01T00:00:00.000Z'),
      progressPercentage: 100,
      status: InternshipStatus.ACTIVE
    }
  });

  const intern3 = await prisma.internship.create({
    data: {
      studentId: stu3.id,
      professorId: prof2.id,
      companyId: comp3.id,
      requestId: reqIntern3.id,
      startDate: new Date('2024-07-05T00:00:00.000Z'),
      endDate: new Date('2024-10-05T00:00:00.000Z'),
      progressPercentage: 50,
      status: InternshipStatus.ACTIVE
    }
  });

  const intern4 = await prisma.internship.create({
    data: {
      studentId: stu4.id,
      professorId: prof1.id,
      companyId: comp1.id,
      requestId: reqIntern4.id,
      startDate: new Date('2024-06-04T00:00:00.000Z'),
      endDate: new Date('2024-09-04T00:00:00.000Z'),
      progressPercentage: 100,
      status: InternshipStatus.COMPLETED
    }
  });

  // 7. Create Weekly Reports (will receive auto-increment id: 1 to 8)
  const reportsData = [
    {
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern1.id,
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
      internshipId: intern3.id,
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

  // 8. Create Evaluations (will receive auto-increment id: 1, 2)
  await prisma.evaluation.create({
    data: {
      internshipId: intern2.id,
      technicalSkill: 19.5,
      responsibility: 19.0,
      discipline: 19.5,
      teamwork: 19.0,
      attendance: 20.0,
      description: 'دانشجو علی رضایی دوره کارآموزی را در شرکت توسعه نرم‌افزار پارس با موفقیت بالا به پایان رساند.',
      finalScore: 19.25
    }
  });

  await prisma.evaluation.create({
    data: {
      internshipId: intern4.id,
      technicalSkill: 20.0,
      responsibility: 20.0,
      discipline: 20.0,
      teamwork: 20.0,
      attendance: 20.0,
      description: 'عملکرد دانشجو مهدی کریمی در شرکت فناوران هوشمند در بالاترین سطح ارزیابی شد و پروژه نهایی با موفقیت کامل تحویل گردید.',
      finalScore: 20.0
    }
  });

  // 9. Create Documents (will receive auto-increment id: 1, 2, 3, 4)
  await prisma.document.create({
    data: {
      internshipId: intern1.id,
      fileName: 'ahmadi_intro_letter.pdf',
      filePath: '/uploads/documents/ahmadi_intro_letter.pdf',
      documentType: DocumentType.INTRODUCTION_LETTER
    }
  });

  await prisma.document.create({
    data: {
      internshipId: intern1.id,
      fileName: 'internship_guideline_1403.pdf',
      filePath: '/uploads/documents/internship_guideline_1403.pdf',
      documentType: DocumentType.OTHER
    }
  });

  await prisma.document.create({
    data: {
      internshipId: intern2.id,
      fileName: 'supervisor_evaluation_template.docx',
      filePath: '/uploads/documents/supervisor_evaluation_template.docx',
      documentType: DocumentType.START_FORM
    }
  });

  await prisma.document.create({
    data: {
      internshipId: intern4.id,
      fileName: 'karimi_internship_certificate.pdf',
      filePath: '/uploads/documents/karimi_internship_certificate.pdf',
      documentType: DocumentType.FINAL_REPORT
    }
  });

  // 10. Create Notifications (will receive auto-increment id: 1 to 5)
  const notificationsData = [
    {
      userId: stu1User.id,
      title: 'تایید گزارش هفتگی شماره ۶',
      message: 'گزارش هفتگی شماره ۶ شما توسط دکتر محمد رضایی بررسی و با نظر مثبت تایید شد.',
      isRead: false
    },
    {
      userId: stu1User.id,
      title: 'ثبت یادآوری: ارسال گزارش شماره ۷',
      message: 'مهلت ارسال گزارش کارآموزی هفته هفتم تا پایان روز جمعه می‌باشد.',
      isRead: true
    },
    {
      userId: prof1User.id,
      title: 'گزارش هفتگی جدید جهت بررسی',
      message: 'دانشجو محمد احمدی گزارش هفتگی شماره ۷ را جهت بازبینی و ثبت بازخورد ارسال نموده است.',
      isRead: false
    },
    {
      userId: prof1User.id,
      title: 'دانشجو در انتظار ارزیابی نهایی',
      message: 'دوره کارآموزی دانشجو علی رضایی تکمیل شده و منتظر تکمیل فرم نمره و ارزیابی استاد است.',
      isRead: false
    },
    {
      userId: adminUser.id,
      title: 'درخواست کارآموزی جدید ثبت شد',
      message: 'درخواست کارآموزی جدید توسط دانشجویان در سامانه به ثبت رسید.',
      isRead: false
    }
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }

  // 11. CRITICAL: Synchronize all PostgreSQL autoincrement sequences
  // This guarantees that any subsequent CREATE API call receives the next integer (MAX(id) + 1)
  // without any primary key conflict or execution failure!
  const tables = [
    'users',
    'students',
    'professors',
    'companies',
    'internship_requests',
    'internships',
    'weekly_reports',
    'evaluations',
    'documents',
    'notifications',
    'activity_logs'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"), true);`
      );
    } catch {
      // Gracefully handled if running against non-PostgreSQL mock
    }
  }

  console.log('✅ Persian Seed with numeric Auto-increment IDs completed successfully!');
  console.log('Sequences synchronized: All CREATE APIs will smoothly increment numeric IDs without conflict.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
