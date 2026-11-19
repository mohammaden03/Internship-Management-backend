"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function resolveSeedPassword() {
    const fromEnv = process.env.SEED_DEFAULT_PASSWORD?.trim();
    if (fromEnv && fromEnv.length >= 8) {
        return fromEnv;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('SEED_DEFAULT_PASSWORD must be explicitly set (min 8 chars) when running seed in production.');
    }
    // Local development convenience fallback (never logged)
    return 'Password123@';
}
async function main() {
    if (process.env.AUTO_SEED === 'false') {
        console.log('AUTO_SEED=false; skipping database seed.');
        return;
    }
    if (process.env.SEED_IF_EMPTY === 'true') {
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            console.log(`Database already has ${existingUsers} user(s); skipping seed.`);
            return;
        }
    }
    console.log('Running idempotent Persian seed data sync...');
    const defaultPassword = await bcrypt.hash(resolveSeedPassword(), 10);
    const defaultTerm = process.env.DEFAULT_ACADEMIC_TERM || 'تابستان ۱۴۰۳';
    // 1. Seed Users (idempotent upserts by nationalCode)
    const adminUser = await prisma.user.upsert({
        where: { nationalCode: '0098765432' },
        update: {},
        create: {
            firstName: 'علیرضا',
            lastName: 'حسینی',
            email: 'internship_office@semnan.ac.ir',
            nationalCode: '0098765432',
            password: defaultPassword,
            phoneNumber: '02331530000',
            role: client_1.Role.ADMIN,
            isActive: true,
        },
    });
    const prof1User = await prisma.user.upsert({
        where: { nationalCode: '0011223344' },
        update: {},
        create: {
            firstName: 'محمد',
            lastName: 'رضایی',
            email: 'rezaei@semnan.ac.ir',
            nationalCode: '0011223344',
            password: defaultPassword,
            phoneNumber: '09127894561',
            role: client_1.Role.PROFESSOR,
            isActive: true,
        },
    });
    const prof1 = await prisma.professor.upsert({
        where: { userId: prof1User.id },
        update: {},
        create: {
            userId: prof1User.id,
            department: 'مهندسی کامپیوتر',
            academicRank: 'دانشیار',
        },
    });
    const prof2User = await prisma.user.upsert({
        where: { nationalCode: '0022334455' },
        update: {},
        create: {
            firstName: 'سارا',
            lastName: 'احمدی',
            email: 'ahmadi_s@semnan.ac.ir',
            nationalCode: '0022334455',
            password: defaultPassword,
            phoneNumber: '09128912345',
            role: client_1.Role.PROFESSOR,
            isActive: true,
        },
    });
    const prof2 = await prisma.professor.upsert({
        where: { userId: prof2User.id },
        update: {},
        create: {
            userId: prof2User.id,
            department: 'مهندسی صنایع',
            academicRank: 'استادیار',
        },
    });
    const stu1User = await prisma.user.upsert({
        where: { nationalCode: '0021345678' },
        update: {},
        create: {
            firstName: 'محمد',
            lastName: 'احمدی',
            email: 'm.ahmadi@semnan.ac.ir',
            nationalCode: '0021345678',
            password: defaultPassword,
            phoneNumber: '09121234567',
            role: client_1.Role.STUDENT,
            isActive: true,
        },
    });
    const stu1 = await prisma.student.upsert({
        where: { userId: stu1User.id },
        update: {},
        create: {
            userId: stu1User.id,
            studentNumber: '400105432',
            faculty: 'مهندسی کامپیوتر',
            major: 'مهندسی نرم‌افزار',
            degreeLevel: 'کارشناسی',
        },
    });
    const stu2User = await prisma.user.upsert({
        where: { nationalCode: '0019876543' },
        update: {},
        create: {
            firstName: 'علی',
            lastName: 'رضایی',
            email: 'a.rezaei@semnan.ac.ir',
            nationalCode: '0019876543',
            password: defaultPassword,
            phoneNumber: '09122345678',
            role: client_1.Role.STUDENT,
            isActive: true,
        },
    });
    const stu2 = await prisma.student.upsert({
        where: { userId: stu2User.id },
        update: {},
        create: {
            userId: stu2User.id,
            studentNumber: '400108921',
            faculty: 'مهندسی کامپیوتر',
            major: 'هوش مصنوعی و داده',
            degreeLevel: 'کارشناسی',
        },
    });
    const stu3User = await prisma.user.upsert({
        where: { nationalCode: '0032145698' },
        update: {},
        create: {
            firstName: 'سارا',
            lastName: 'محمدی',
            email: 's.mohammadi@semnan.ac.ir',
            nationalCode: '0032145698',
            password: defaultPassword,
            phoneNumber: '09123456789',
            role: client_1.Role.STUDENT,
            isActive: true,
        },
    });
    const stu3 = await prisma.student.upsert({
        where: { userId: stu3User.id },
        update: {},
        create: {
            userId: stu3User.id,
            studentNumber: '400201456',
            faculty: 'مهندسی صنایع',
            major: 'تحلیل سیستم‌ها',
            degreeLevel: 'کارشناسی',
        },
    });
    const stu4User = await prisma.user.upsert({
        where: { nationalCode: '0045678912' },
        update: {},
        create: {
            firstName: 'مهدی',
            lastName: 'کریمی',
            email: 'm.karimi@semnan.ac.ir',
            nationalCode: '0045678912',
            password: defaultPassword,
            phoneNumber: '09124567890',
            role: client_1.Role.STUDENT,
            isActive: true,
        },
    });
    const stu4 = await prisma.student.upsert({
        where: { userId: stu4User.id },
        update: {},
        create: {
            userId: stu4User.id,
            studentNumber: '400305882',
            faculty: 'مهندسی کامپیوتر',
            major: 'فناوری اطلاعات',
            degreeLevel: 'کارشناسی',
        },
    });
    // 2. Seed Companies (idempotent by name)
    async function ensureCompany(data) {
        const existing = await prisma.company.findFirst({ where: { name: data.name } });
        if (existing)
            return existing;
        return prisma.company.create({ data });
    }
    const comp1 = await ensureCompany({
        name: 'شرکت فناوران هوشمند',
        industry: 'توسعه نرم‌افزارهای ابری و هوش مصنوعی',
        city: 'تهران',
        address: 'تهران، خیابان آزادی، ناحیه نوآوری شریف، برج فناوری، طبقه ۵',
        phone: '021-66789001',
        supervisorName: 'مهندس آرش طاهری',
        supervisorPhone: '09121112233',
    });
    const comp2 = await ensureCompany({
        name: 'شرکت توسعه نرم افزار پارس',
        industry: 'سیستم‌های بانکی و پرداخت الکترونیک',
        city: 'تهران',
        address: 'تهران، سعادت آباد، بلوار پاکنژاد، پلاک ۴۲',
        phone: '021-22089450',
        supervisorName: 'مهندس مریم صادقی',
        supervisorPhone: '09122223344',
    });
    const comp3 = await ensureCompany({
        name: 'شرکت فناوری اطلاعات آریا',
        industry: 'امنیت سایبری و زیرساخت شبکه',
        city: 'تهران',
        address: 'تهران، میدان ونک، خیابان ملاصدرا، ساختمان پردیس',
        phone: '021-88990011',
        supervisorName: 'دکتر کامران شفیعی',
        supervisorPhone: '09123334455',
    });
    const comp4 = await ensureCompany({
        name: 'هلدینگ داده‌ورزان نوین',
        industry: 'طراحی داده‌محور و سامانه‌های سازمانی',
        city: 'سمنان',
        address: 'سمنان، پردیس فناوری دانشگاه سمنان، ساختمان نوآوری',
        phone: '023-33445566',
        supervisorName: 'مهندس پویا فرهمند',
        supervisorPhone: '09124445566',
    });
    // 3. Seed Requests & Internships (idempotent by studentId + companyId + title)
    async function ensureRequest(data) {
        const existing = await prisma.internshipRequest.findFirst({
            where: {
                studentId: data.studentId,
                companyId: data.companyId,
                title: data.title,
            },
        });
        if (existing)
            return existing;
        return prisma.internshipRequest.create({ data });
    }
    const req1 = await ensureRequest({
        studentId: stu1.id,
        companyId: comp1.id,
        professorId: prof1.id,
        academicTerm: defaultTerm,
        title: 'توسعه بک‌اند و سرویس‌های میکروسرویس',
        description: 'درخواست رسمی کارآموزی تابستانه جهت گذراندن دوره ۲۴۰ ساعته کارآموزی در شرکت فناوران هوشمند.',
        startDate: new Date('2024-06-21T00:00:00.000Z'),
        endDate: new Date('2024-09-21T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.APPROVED,
    });
    await ensureRequest({
        studentId: stu2.id,
        companyId: comp4.id,
        academicTerm: defaultTerm,
        title: 'طراحی رابط کاربری و تحلیل تجربه کاربری',
        description: 'درخواست کارآموزی در هلدینگ داده‌ورزان نوین.',
        startDate: new Date('2024-09-22T00:00:00.000Z'),
        endDate: new Date('2024-12-20T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.PENDING,
    });
    await ensureRequest({
        studentId: stu3.id,
        companyId: comp2.id,
        academicTerm: defaultTerm,
        title: 'تحلیل داده و کنترل فرآیند تولید',
        description: 'درخواست کارآموزی در شرکت توسعه نرم افزار پارس.',
        startDate: new Date('2024-09-26T00:00:00.000Z'),
        endDate: new Date('2024-12-25T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.PENDING,
    });
    const reqIntern2 = await ensureRequest({
        studentId: stu2.id,
        companyId: comp2.id,
        professorId: prof1.id,
        academicTerm: defaultTerm,
        title: 'سیستم‌های بانکی و پرداخت الکترونیک',
        description: 'درخواست مصوب دوره کارآموزی در شرکت توسعه نرم‌افزار پارس.',
        startDate: new Date('2024-06-30T00:00:00.000Z'),
        endDate: new Date('2024-10-01T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.APPROVED,
    });
    const reqIntern3 = await ensureRequest({
        studentId: stu3.id,
        companyId: comp3.id,
        professorId: prof2.id,
        academicTerm: defaultTerm,
        title: 'امنیت سایبری و زیرساخت شبکه',
        description: 'درخواست مصوب دوره کارآموزی در شرکت فناوری اطلاعات آریا.',
        startDate: new Date('2024-07-05T00:00:00.000Z'),
        endDate: new Date('2024-10-05T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.APPROVED,
    });
    const reqIntern4 = await ensureRequest({
        studentId: stu4.id,
        companyId: comp1.id,
        professorId: prof1.id,
        academicTerm: defaultTerm,
        title: 'توسعه سامانه‌های فناوری اطلاعات و کلود',
        description: 'درخواست مصوب دوره کارآموزی دانشجو مهدی کریمی در شرکت فناوران هوشمند.',
        startDate: new Date('2024-06-04T00:00:00.000Z'),
        endDate: new Date('2024-09-04T00:00:00.000Z'),
        totalHours: 240,
        status: client_1.RequestStatus.APPROVED,
    });
    const intern1 = await prisma.internship.upsert({
        where: { requestId: req1.id },
        update: {},
        create: {
            studentId: stu1.id,
            professorId: prof1.id,
            companyId: comp1.id,
            requestId: req1.id,
            academicTerm: defaultTerm,
            startDate: new Date('2024-06-21T00:00:00.000Z'),
            endDate: new Date('2024-09-21T00:00:00.000Z'),
            progressPercentage: 75,
            status: client_1.InternshipStatus.ACTIVE,
        },
    });
    const intern2 = await prisma.internship.upsert({
        where: { requestId: reqIntern2.id },
        update: {},
        create: {
            studentId: stu2.id,
            professorId: prof1.id,
            companyId: comp2.id,
            requestId: reqIntern2.id,
            academicTerm: defaultTerm,
            startDate: new Date('2024-06-30T00:00:00.000Z'),
            endDate: new Date('2024-10-01T00:00:00.000Z'),
            progressPercentage: 100,
            status: client_1.InternshipStatus.ACTIVE,
        },
    });
    const intern3 = await prisma.internship.upsert({
        where: { requestId: reqIntern3.id },
        update: {},
        create: {
            studentId: stu3.id,
            professorId: prof2.id,
            companyId: comp3.id,
            requestId: reqIntern3.id,
            academicTerm: defaultTerm,
            startDate: new Date('2024-07-05T00:00:00.000Z'),
            endDate: new Date('2024-10-05T00:00:00.000Z'),
            progressPercentage: 50,
            status: client_1.InternshipStatus.ACTIVE,
        },
    });
    const intern4 = await prisma.internship.upsert({
        where: { requestId: reqIntern4.id },
        update: {},
        create: {
            studentId: stu4.id,
            professorId: prof1.id,
            companyId: comp1.id,
            requestId: reqIntern4.id,
            academicTerm: defaultTerm,
            startDate: new Date('2024-06-04T00:00:00.000Z'),
            endDate: new Date('2024-09-04T00:00:00.000Z'),
            progressPercentage: 100,
            status: client_1.InternshipStatus.COMPLETED,
        },
    });
    // 4. Weekly Reports (idempotent upsert by composite unique [internshipId, weekNumber])
    const reportsData = [
        {
            internshipId: intern1.id,
            weekNumber: 1,
            startDate: new Date('2024-06-21T00:00:00.000Z'),
            endDate: new Date('2024-06-27T00:00:00.000Z'),
            activities: 'آشنایی با هم‌تیمی‌ها و راه‌اندازی محیط توسعه با Docker و NestJS.',
            skillsLearned: 'Docker Compose, NestJS',
            challenges: 'تنظیم پروکسی شرکتی',
            description: 'آشنایی با ساختار پروژه و راه‌اندازی محیط توسعه',
            status: client_1.ReportStatus.APPROVED,
            professorComment: 'شروع بسیار خوب و منظمی است.',
        },
        {
            internshipId: intern1.id,
            weekNumber: 2,
            startDate: new Date('2024-06-28T00:00:00.000Z'),
            endDate: new Date('2024-07-04T00:00:00.000Z'),
            activities: 'پیاده‌سازی سرویس احراز هویت JWT و اتصال به PostgreSQL با Prisma ORM.',
            skillsLearned: 'JWT, Prisma ORM',
            challenges: 'مدیریت همزمانی رفرش توکن',
            description: 'پیاده‌سازی سرویس احراز هویت با JWT و رفرش توکن',
            status: client_1.ReportStatus.SUBMITTED,
            professorComment: null,
        },
        {
            internshipId: intern3.id,
            weekNumber: 1,
            startDate: new Date('2024-08-04T00:00:00.000Z'),
            endDate: new Date('2024-08-10T00:00:00.000Z'),
            activities: 'تحلیل داده‌های لاگ امنیتی و داشبورد پایش فایروال.',
            skillsLearned: 'ELK Stack, WAF',
            challenges: 'حجم بالای لاگ‌ها',
            description: 'تحلیل داده‌های لاگ امنیتی و نمودارهای پایش فایروال',
            status: client_1.ReportStatus.SUBMITTED,
            professorComment: null,
        },
    ];
    for (const rep of reportsData) {
        await prisma.weeklyReport.upsert({
            where: {
                internshipId_weekNumber: {
                    internshipId: rep.internshipId,
                    weekNumber: rep.weekNumber,
                },
            },
            update: {},
            create: rep,
        });
    }
    // 5. Evaluations (idempotent upsert by internshipId)
    await prisma.evaluation.upsert({
        where: { internshipId: intern2.id },
        update: {},
        create: {
            internshipId: intern2.id,
            technicalSkill: 19.5,
            responsibility: 19.0,
            discipline: 19.5,
            teamwork: 19.0,
            attendance: 20.0,
            description: 'دانشجو علی رضایی دوره کارآموزی را با موفقیت بالا به پایان رساند.',
            finalScore: 19.43,
        },
    });
    await prisma.evaluation.upsert({
        where: { internshipId: intern4.id },
        update: {},
        create: {
            internshipId: intern4.id,
            technicalSkill: 20.0,
            responsibility: 20.0,
            discipline: 20.0,
            teamwork: 20.0,
            attendance: 20.0,
            description: 'عملکرد دانشجو مهدی کریمی در بالاترین سطح ارزیابی شد.',
            finalScore: 20.0,
        },
    });
    // 6. Seed Default System Settings (idempotent upsert by key)
    const defaultSettings = [
        { key: 'universityName', value: 'دانشگاه سمنان' },
        { key: 'academicTerm', value: defaultTerm },
        { key: 'registrationStart', value: '2024-09-01' },
        { key: 'registrationEnd', value: '2024-10-15' },
        { key: 'letterDeadline', value: '2024-11-01' },
        { key: 'gradingDeadline', value: '2025-01-20' },
        { key: 'minHours', value: '240' },
        { key: 'maxWeeklyHours', value: '40' },
        { key: 'autoIssueLetter', value: 'true' },
        { key: 'insuranceEnabled', value: 'true' },
    ];
    for (const setting of defaultSettings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        });
    }
    // 7. Seed initial notifications if none exist
    const notifCount = await prisma.notification.count();
    if (notifCount === 0) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: stu1User.id,
                    title: 'تایید گزارش هفتگی شماره ۱',
                    message: 'گزارش هفتگی شماره ۱ شما توسط استاد ناظر تایید شد.',
                    isRead: false,
                },
                {
                    userId: prof1User.id,
                    title: 'گزارش هفتگی جدید جهت بررسی',
                    message: 'دانشجو محمد احمدی گزارش هفتگی شماره ۲ را ارسال نموده است.',
                    isRead: false,
                },
                {
                    userId: adminUser.id,
                    title: 'درخواست کارآموزی جدید ثبت شد',
                    message: 'درخواست کارآموزی جدید توسط دانشجویان در سامانه به ثبت رسید.',
                    isRead: false,
                },
            ],
        });
    }
    // 8. Seed initial document metadata if none exist
    const docCount = await prisma.document.count();
    if (docCount === 0) {
        await prisma.document.create({
            data: {
                internshipId: intern1.id,
                fileName: 'ahmadi_intro_letter.pdf',
                originalName: 'ahmadi_intro_letter.pdf',
                filePath: 'ahmadi_intro_letter.pdf',
                storageKey: 'ahmadi_intro_letter.pdf',
                mimeType: 'application/pdf',
                size: 0,
                documentType: client_1.DocumentType.INTRODUCTION_LETTER,
            },
        });
    }
    // 9. Synchronize PostgreSQL autoincrement sequences
    const tables = [
        'users',
        'refresh_tokens',
        'password_reset_tokens',
        'students',
        'professors',
        'companies',
        'internship_requests',
        'internships',
        'weekly_reports',
        'evaluations',
        'documents',
        'notifications',
        'activity_logs',
        'audit_logs',
        'system_settings',
    ];
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"), true);`);
        }
        catch {
            // Ignore on non-PostgreSQL environments
        }
    }
    console.log('Idempotent seed completed. Seeded accounts (passwords omitted):');
    console.table([
        { role: 'ADMIN', identifier: adminUser.nationalCode, email: adminUser.email },
        { role: 'PROFESSOR', identifier: prof1User.nationalCode, email: prof1User.email },
        { role: 'PROFESSOR', identifier: prof2User.nationalCode, email: prof2User.email },
        { role: 'STUDENT', identifier: `${stu1User.nationalCode} / ${stu1.studentNumber}`, email: stu1User.email },
        { role: 'STUDENT', identifier: `${stu2User.nationalCode} / ${stu2.studentNumber}`, email: stu2User.email },
        { role: 'STUDENT', identifier: `${stu3User.nationalCode} / ${stu3.studentNumber}`, email: stu3User.email },
        { role: 'STUDENT', identifier: `${stu4User.nationalCode} / ${stu4.studentNumber}`, email: stu4User.email },
    ]);
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
