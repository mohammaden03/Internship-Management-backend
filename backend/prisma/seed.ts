import { PrismaClient, Role, InternshipStatus, RequestStatus, ReportStatus, DocumentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Persian Seed Data Generation for University Internship System...');

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

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'علی',
      lastName: 'احمدی',
      email: 'admin@university.ac.ir',
      nationalCode: '0012345678',
      password: defaultPassword,
      phoneNumber: '09121112233',
      role: Role.ADMIN,
      isActive: true,
      activityLogs: {
        create: [
          { action: 'ورود به سامانه به عنوان مدیر ارشد سیستم با کد ملی 0012345678' },
          { action: 'راه‌اندازی اولیه سامانه و بررسی تنظیمات دوره کارآموزی' }
        ]
      }
    }
  });

  // 2. Create 5 Professors
  const professorData = [
    {
      first: 'حمیدرضا',
      last: 'صادقی',
      email: 'dr.sadeghi@university.ac.ir',
      nationalCode: '0010000001',
      phone: '09121000001',
      dept: 'مهندسی کامپیوتر و فناوری اطلاعات',
      rank: 'استاد تمام'
    },
    {
      first: 'زهرا',
      last: 'کریمی',
      email: 'dr.karimi@university.ac.ir',
      nationalCode: '0010000002',
      phone: '09121000002',
      dept: 'مهندسی برق و سیستم‌های مخابراتی',
      rank: 'دانشیار'
    },
    {
      first: 'محسن',
      last: 'موسوی',
      email: 'dr.mousavi@university.ac.ir',
      nationalCode: '0010000003',
      phone: '09121000003',
      dept: 'مهندسی صنایع و مدیریت سیستم',
      rank: 'استادیار'
    },
    {
      first: 'مریم',
      last: 'ابراهیمی',
      email: 'dr.ebrahimi@university.ac.ir',
      nationalCode: '0010000004',
      phone: '09121000004',
      dept: 'مهندسی کامپیوتر و هوش مصنوعی',
      rank: 'دانشیار'
    },
    {
      first: 'امیرحسین',
      last: 'حسینی',
      email: 'dr.hosseini@university.ac.ir',
      nationalCode: '0010000005',
      phone: '09121000005',
      dept: 'مهندسی مکانیک و طراحی کاربردی',
      rank: 'استاد تمام'
    }
  ];

  const createdProfessors = [];
  for (const p of professorData) {
    const user = await prisma.user.create({
      data: {
        firstName: p.first,
        lastName: p.last,
        email: p.email,
        nationalCode: p.nationalCode,
        password: defaultPassword,
        phoneNumber: p.phone,
        role: Role.PROFESSOR,
        isActive: true,
        professor: {
          create: {
            department: p.dept,
            academicRank: p.rank
          }
        },
        activityLogs: {
          create: [{ action: `ورود استاد ${p.first} ${p.last} (کد ملی: ${p.nationalCode}) به سامانه نظارت کارآموزی` }]
        }
      },
      include: { professor: true }
    });
    createdProfessors.push(user.professor!);
  }

  // 3. Create 10 Students
  const studentData = [
    { first: 'محمد', last: 'رضایی', email: 'm.rezaei@student.ac.ir', nationalCode: '0020000001', phone: '09351000001', stNo: '99123401', faculty: 'دانشکده مهندسی کامپیوتر', major: 'مهندسی نرم‌افزار', degree: 'کارشناسی' },
    { first: 'سارا', last: 'علوی', email: 's.alavi@student.ac.ir', nationalCode: '0020000002', phone: '09351000002', stNo: '99123402', faculty: 'دانشکده مهندسی کامپیوتر', major: 'فناوری اطلاعات و شبکه', degree: 'کارشناسی' },
    { first: 'پویا', last: 'فرهادی', email: 'p.farhadi@student.ac.ir', nationalCode: '0020000003', phone: '09351000003', stNo: '99123403', faculty: 'دانشکده مهندسی برق', major: 'الکترونیک دیجیتال', degree: 'کارشناسی' },
    { first: 'نیلوفر', last: 'کاظمی', email: 'n.kazemi@student.ac.ir', nationalCode: '0020000004', phone: '09351000004', stNo: '99123404', faculty: 'دانشکده صنایع', major: 'مدیریت زنجیره تأمین', degree: 'کارشناسی' },
    { first: 'امید', last: 'باقری', email: 'o.bagheri@student.ac.ir', nationalCode: '0020000005', phone: '09351000005', stNo: '99123405', faculty: 'دانشکده مهندسی کامپیوتر', major: 'هوش مصنوعی و داده', degree: 'کارشناسی ارشد' },
    { first: 'فاطمه', last: 'نجفی', email: 'f.najafi@student.ac.ir', nationalCode: '0020000006', phone: '09351000006', stNo: '99123406', faculty: 'دانشکده مهندسی مکانیک', major: 'مکانیک جامدات و ساخت', degree: 'کارشناسی' },
    { first: 'آرش', last: 'رستم‌زاده', email: 'a.rostam@student.ac.ir', nationalCode: '0020000007', phone: '09351000007', stNo: '99123407', faculty: 'دانشکده مهندسی کامپیوتر', major: 'امنیت اطلاعات', degree: 'کارشناسی ارشد' },
    { first: 'مهسا', last: 'حیدری', email: 'm.heidari@student.ac.ir', nationalCode: '0020000008', phone: '09351000008', stNo: '99123408', faculty: 'دانشکده مهندسی صنایع', major: 'بهینه‌سازی سیستم‌ها', degree: 'کارشناسی' },
    { first: 'سینا', last: 'مرادی', email: 's.moradi@student.ac.ir', nationalCode: '0020000009', phone: '09351000009', stNo: '99123409', faculty: 'دانشکده مهندسی کامپیوتر', major: 'نرم‌افزار و رایانش ابری', degree: 'کارشناسی' },
    { first: 'یلدا', last: 'پیروزیان', email: 'y.pirouz@student.ac.ir', nationalCode: '0020000010', phone: '09351000010', stNo: '99123410', faculty: 'دانشکده برق', major: 'کنترل و ابزار دقیق', degree: 'کارشناسی' }
  ];

  const createdStudents = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        firstName: s.first,
        lastName: s.last,
        email: s.email,
        nationalCode: s.nationalCode,
        password: defaultPassword,
        phoneNumber: s.phone,
        role: Role.STUDENT,
        isActive: true,
        student: {
          create: {
            studentNumber: s.stNo,
            faculty: s.faculty,
            major: s.major,
            degreeLevel: s.degree
          }
        },
        activityLogs: {
          create: [{ action: `ورود دانشجو ${s.first} ${s.last} (شماره دانشجویی: ${s.stNo} - کد ملی: ${s.nationalCode}) به پرتال دانشجویی کارآموزی` }]
        }
      },
      include: { student: true }
    });
    createdStudents.push(user.student!);
  }

  // 4. Create 10 Companies
  const companyData = [
    { name: 'دیجی‌کالا (گروه فناوری نوآوران)', industry: 'تجارت الکترونیک و رایانش ابری', city: 'تهران', address: 'تهران، خیابان گاندی، خیابان بیست و یکم، پلاک ۲۸', phone: '02161930000', sup: 'مهندس سعید پورعلی', supPhone: '09123456789' },
    { name: 'اسنپ (ایده گزین ارتباطات روماک)', industry: 'حمل و نقل آنلاین و سکوی خدمات مبتنی بر موقعیت', city: 'تهران', address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، برج نگار', phone: '02196642', sup: 'خانم مهندس هدی زارعی', supPhone: '09123456790' },
    { name: 'کافه‌بازار (آوای همراه هوشمند)', industry: 'توزیع برنامه‌های اندروید و خدمات داده ابری', city: 'تهران', address: 'تهران، میدان ونک، خیابان ملاصدرا، خیابان پردیس، پلاک ۳۱', phone: '02188880000', sup: 'مهندس رضا تقوی', supPhone: '09123456791' },
    { name: 'گروه صنعتی مپنا (مدیریت پروژه‌های نیروگاهی ایران)', industry: 'صنایع ریلی، توربین و برق صنعتی', city: 'تهران', address: 'تهران، بلوار میرداماد، نبش خیابان کوده، شماره ۲۳۱', phone: '02122908585', sup: 'دکتر بهمن رادمنش', supPhone: '09123456792' },
    { name: 'فناپ (فناوری اطلاعات و ارتباطات پاسارگاد آریان)', industry: 'فناوری مالی، بانکداری دیجیتال و زیرساخت شبکه', city: 'تهران', address: 'تهران، شهرک غرب، بلوار دادمان، خیابان شفق، پلاک ۱۰', phone: '02189510000', sup: 'مهندس علیرضا کیانی', supPhone: '09123456793' },
    { name: 'دیوار (سامانه نیازمندی‌های آنلاین)', industry: 'بسترهای مقیاس‌پذیر اینترنتی و هوش مصنوعی', city: 'تهران', address: 'تهران، کوی نصر (گیشا)، خیابان شهید علیالی، پلاک ۶۲', phone: '02143000020', sup: 'مهندس نوید صادقیان', supPhone: '09123456794' },
    { name: 'آسان پرداخت پرشین (آپ)', industry: 'سامانه‌های پرداخت الکترونیک و امنیت تراکنش', city: 'تهران', address: 'تهران، خیابان کریمخان زند، خیابان سنایی، پلاک ۷', phone: '02183333', sup: 'خانم مهندس شیما افشار', supPhone: '09123456795' },
    { name: 'شاتل (گروه فناوری ارتباطات و اطلاعات شاتل)', industry: 'ارتباطات ماهواره‌ای، فیبر نوری و دیتاسنتر', city: 'تهران', address: 'تهران، خیابان شریعتی، بالاتر از پل رومی، کوچه سینا، پلاک ۳', phone: '02191000000', sup: 'مهندس مسعود کرمی', supPhone: '09123456796' },
    { name: 'ایرانسل (خدمات ارتباطی ایرانسل)', industry: 'مخابرات سیار، اینترنت اشیاء و شبکه 5G', city: 'تهران', address: 'تهران، میدان هروی، خیابان پناهی‌نیا، خیابان زندی غربی', phone: '021707', sup: 'دکتر فریبرز نیک‌نام', supPhone: '09123456797' },
    { name: 'تپسی (پیشگامان فناوری و دانش آرامیس)', industry: 'سامانه‌های هوشمند تحلیل ترافیک و اعزام سفیران', city: 'تهران', address: 'تهران، سعادت‌آباد، خیابان سرو غربی، خیابان صدف، پلاک ۴', phone: '0211630', sup: 'مهندس کیوان معتمدی', supPhone: '09123456798' }
  ];

  const createdCompanies = [];
  for (const c of companyData) {
    const comp = await prisma.company.create({
      data: {
        name: c.name,
        industry: c.industry,
        city: c.city,
        address: c.address,
        phone: c.phone,
        supervisorName: c.sup,
        supervisorPhone: c.supPhone
      }
    });
    createdCompanies.push(comp);
  }

  // 5. Create 20 Internship Requests
  const requestTitles = [
    'کارآموزی توسعه بک‌اند با NestJS و میکروسرویس‌ها',
    'کارآموزی طراحی سیستم‌های توزیع‌شده و پیام‌رسانی با کافکا',
    'کارآموزی یادگیری ماشین و تحلیل الگوهای سفارش در تجارت الکترونیک',
    'کارآموزی پیاده‌سازی و پایش زیرساخت‌های کلود و کوبرنتیز',
    'کارآموزی بهینه‌سازی الگوریتم‌های هوشمند تخصیص ناوگان',
    'کارآموزی توسعه وب فرانت‌اند مدرن با React و Next.js',
    'کارآموزی ارزیابی و تست نفوذ سامانه‌های تراکنش بانکی',
    'کارآموزی نگهداری و اتوماسیون توربین‌های نیروگاهی',
    'کارآموزی کنترل کیفی و بازرسی خطوط تولید قطعات پیشرفته',
    'کارآموزی بهینه‌سازی زنجیره لجستیک انبارهای مکانیزه',
    'کارآموزی تحلیل داده‌های ترافیکی و سناریوهای مسیریابی بهینه',
    'کارآموزی پیاده‌سازی گیت‌وی پرداخت الکترونیک امن',
    'کارآموزی مهندسی معکوس و پروتکل‌های اینترنت اشیاء صنعتی',
    'کارآموزی طراحی رابط و تجربه کاربری (UI/UX) اپلیکیشن',
    'کارآموزی مانیتورینگ شبکه انتقال و دیتاسنتر فیبر نوری',
    'کارآموزی شبیه‌سازی دینامیک سیالات سیستم‌های هیدرولیکی',
    'کارآموزی هوش تجاری و طراحی داشبوردهای آماری با Power BI',
    'کارآموزی اتوماسیون فرآیندهای اداری و سیستم‌های جامع سازمانی',
    'کارآموزی بینایی ماشین برای تشخیص خودکار نقص در انبار',
    'کارآموزی معماری پایگاه‌داده‌های توزیع‌شده و کشینگ با ردیس'
  ];

  const createdRequests = [];
  for (let i = 0; i < 20; i++) {
    const student = createdStudents[i % createdStudents.length];
    const company = createdCompanies[i % createdCompanies.length];
    const title = requestTitles[i];
    
    // Status distribution: 15 APPROVED, 3 PENDING, 2 REJECTED
    let status: RequestStatus = RequestStatus.APPROVED;
    if (i === 16 || i === 17 || i === 18) status = RequestStatus.PENDING;
    if (i === 19) status = RequestStatus.REJECTED;

    const startDate = new Date(2026, 6, 1 + (i % 5));
    const endDate = new Date(2026, 8, 30);

    const req = await prisma.internshipRequest.create({
      data: {
        studentId: student.id,
        companyId: company.id,
        title,
        description: `درخواست رسمی کارآموزی تابستانه جهت گذراندن دوره ۲۴۰ ساعته کارآموزی در شرکت ${company.name} تحت عنوان تخصصی ${title}.`,
        startDate,
        endDate,
        totalHours: 240,
        status
      }
    });
    createdRequests.push(req);
  }

  // 6. Create 15 Internships (from the 15 APPROVED requests)
  const createdInternships = [];
  for (let i = 0; i < 15; i++) {
    const req = createdRequests[i];
    const professor = createdProfessors[i % createdProfessors.length];
    
    // Status distribution: 10 ACTIVE, 4 COMPLETED, 1 REJECTED/DROPPED
    let status: InternshipStatus = InternshipStatus.ACTIVE;
    let progress = Math.min(100, Math.floor((i + 3) * 7.5));
    if (i >= 10 && i < 14) {
      status = InternshipStatus.COMPLETED;
      progress = 100;
    } else if (i === 14) {
      status = InternshipStatus.PENDING;
      progress = 0;
    }

    const internship = await prisma.internship.create({
      data: {
        studentId: req.studentId,
        professorId: professor.id,
        companyId: req.companyId,
        requestId: req.id,
        startDate: req.startDate,
        endDate: req.endDate,
        progressPercentage: progress,
        status
      }
    });
    createdInternships.push(internship);

    // Add Introduction Letter Document
    await prisma.document.create({
      data: {
        internshipId: internship.id,
        fileName: `معرفی‌نامه_رسمی_دانشگاه_شماره_${i + 101}.pdf`,
        filePath: `/uploads/documents/intro_letter_${internship.id}.pdf`,
        documentType: DocumentType.INTRODUCTION_LETTER
      }
    });
  }

  // 7. Create 50 Weekly Reports
  const reportTopics = [
    { act: 'آشنایی با متدولوژی اجایل اسکرام، تحویل وظایف و بررسی ساختار ریپازیتوری کدهای شرکت', skill: 'Git, Jira, Agile Scrum, Docker' },
    { act: 'راه‌اندازی محیط توسعه محلی با داکر کامپوز و اتصال به سرویس ردیس و دیتابیس پستگرس', skill: 'Docker Compose, PostgreSQL, Redis' },
    { act: 'طراحی ساختار ماژولار انتیتی‌ها و مایگریشن جداول اولیه در ORM', skill: 'Prisma ORM, Relational Schema Design' },
    { act: 'پیاده‌سازی ماژول احراز هویت با JWT، هش‌کردن پسوردها و گارد نقش‌ها (RBAC)', skill: 'JWT Authentication, Guards, Security' },
    { act: 'طراحی و پیاده‌سازی اندپوینت‌های CRUD همراه با اعتبارسنجی ورودی‌ها و مستندسازی سواگر', skill: 'NestJS Controllers, DTOs, Swagger' },
    { act: 'تست‌نویسی جامع واحد (Unit Test) برای سرویس‌های اصلی با Jest', skill: 'TDD, Jest, Unit Testing' },
    { act: 'اتصال سرویس صف پیام با BullMQ برای ارسال ایمیل‌ها و نوتیفیکیشن‌های ناهمگام', skill: 'Message Queues, Background Jobs' },
    { act: 'ارزیابی عملکرد اندپوینت‌ها با ابزار k6 و اعمال کشینگ برای کوئری‌های پرتکرار', skill: 'Performance Benchmarking, Caching' },
    { act: 'ایجاد خط لوله CI/CD با گیت‌لب جهت تست خودکار و دیپلوی در محیط استیجینگ', skill: 'CI/CD Pipelines, DevOps' },
    { act: 'نگارش گزارش نهایی دوره کارآموزی و آماده‌سازی ارائه دفاعیه برای سرپرست شرکت', skill: 'Technical Documentation, Presentation' }
  ];

  let reportCount = 0;
  for (let i = 0; i < createdInternships.length && reportCount < 50; i++) {
    const internship = createdInternships[i];
    // Each internship gets 3-4 weekly reports
    const reportsForThisInternship = Math.min(4, 50 - reportCount);

    for (let w = 1; w <= reportsForThisInternship; w++) {
      reportCount++;
      const topicIndex = (reportCount - 1) % reportTopics.length;
      const topic = reportTopics[topicIndex];
      const weekStart = new Date(internship.startDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      // Status distribution: APPROVED, SUBMITTED, DRAFT
      let status: ReportStatus = ReportStatus.APPROVED;
      let comment: string | null = 'گزارش این هفته بررسی و تأیید گردید. روند پیشرفت کار بسیار منظم و مطلوب است.';
      if (w === 3 && i % 2 === 0) {
        status = ReportStatus.SUBMITTED;
        comment = null;
      } else if (w === 4) {
        status = ReportStatus.DRAFT;
        comment = null;
      }

      await prisma.weeklyReport.create({
        data: {
          internshipId: internship.id,
          weekNumber: w,
          startDate: weekStart,
          endDate: weekEnd,
          activities: topic.act,
          skillsLearned: topic.skill,
          challenges: w % 2 === 0 ? 'چالش سازگاری نسخه‌های کتابخانه‌های جانبی و مدیریت خطاهای شبکه‌ای که با دیباگ حل شد.' : 'عدم دسترسی اولیه به مستندات داخلی سرورها که با راهنمایی منتور شرکت مرتفع شد.',
          description: `شرح عملکرد و فعالیت‌های انجام‌شده توسط دانشجو در هفته ${w} دوره کارآموزی زیر نظر سرپرست واحد فنی.`,
          status,
          professorComment: comment
        }
      });
    }
  }

  // 8. Create Evaluations for COMPLETED Internships (4 completed)
  const completedInternships = createdInternships.filter(ins => ins.status === InternshipStatus.COMPLETED);
  for (let idx = 0; idx < completedInternships.length; idx++) {
    const ins = completedInternships[idx];
    const tech = 18.5 + (idx * 0.4);
    const resp = 19.0 + (idx * 0.2);
    const disc = 19.5;
    const team = 18.0 + (idx * 0.5);
    const att = 20.0;
    const finalScore = parseFloat(((tech + resp + disc + team + att) / 5).toFixed(2));

    await prisma.evaluation.create({
      data: {
        internshipId: ins.id,
        technicalSkill: Math.min(20, tech),
        responsibility: Math.min(20, resp),
        discipline: disc,
        teamwork: Math.min(20, team),
        attendance: att,
        description: 'دانشجو در طول دوره کارآموزی تعهد کاری بسیار بالا، انضباط حرفه‌ای و اشتیاق زیادی به یادگیری تکنولوژی‌های نوین از خود نشان داد.',
        finalScore
      }
    });

    // Add Final Report Document
    await prisma.document.create({
      data: {
        internshipId: ins.id,
        fileName: `گزارش_جامع_پایان_دوره_کارآموزی_${ins.id.slice(0, 6)}.pdf`,
        filePath: `/uploads/documents/final_report_${ins.id}.pdf`,
        documentType: DocumentType.FINAL_REPORT
      }
    });
  }

  // 9. Automated Notifications & Activity Logs
  const sampleNotifications = [
    { title: 'تأیید درخواست کارآموزی', message: 'درخواست کارآموزی شما در شرکت دیجی‌کالا توسط استاد ناظر تأیید و پرونده فعال گردید.' },
    { title: 'تأیید گزارش هفتگی ۳', message: 'گزارش هفتگی شماره ۳ شما توسط استاد ناظر بررسی و تأیید شد.' },
    { title: 'ثبت ارزیابی نهایی', message: 'نمره ارزیابی نهایی و گواهی اتمام دوره کارآموزی شما با موفقیت ثبت شد.' },
    { title: 'یادآوری ارسال گزارش', message: 'مهلت ثبت گزارش هفتگی شماره ۴ تا پایان هفته جاری می‌باشد.' }
  ];

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    const notif = sampleNotifications[i % sampleNotifications.length];
    await prisma.notification.create({
      data: {
        userId: student.userId,
        title: notif.title,
        message: notif.message,
        isRead: i % 2 === 0
      }
    });
  }

  console.log(`✅ Persian Seed completed successfully!`);
  console.log(`- 1 Admin user (admin@university.ac.ir)`);
  console.log(`- ${createdProfessors.length} Professors`);
  console.log(`- ${createdStudents.length} Students`);
  console.log(`- ${createdCompanies.length} Companies`);
  console.log(`- ${createdRequests.length} Internship Requests`);
  console.log(`- ${createdInternships.length} Internships`);
  console.log(`- ${reportCount} Weekly Reports`);
  console.log(`- ${completedInternships.length} Completed Evaluations`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
