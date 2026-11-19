import {
  DocumentType,
  InternshipStatus,
  ReportStatus,
  RequestStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

type AnyRecord = Record<string, any>;

function clone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => clone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const out: AnyRecord = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = clone(v);
    }
    return out as T;
  }
  return obj;
}

export class InMemoryPrismaService {
  private seq: Record<string, number> = {
    user: 0,
    student: 0,
    professor: 0,
    company: 0,
    internshipRequest: 0,
    internship: 0,
    weeklyReport: 0,
    document: 0,
    evaluation: 0,
    notification: 0,
    activityLog: 0,
    systemSetting: 0,
  };

  private db: Record<string, AnyRecord[]> = {
    user: [],
    student: [],
    professor: [],
    company: [],
    internshipRequest: [],
    internship: [],
    weeklyReport: [],
    document: [],
    evaluation: [],
    notification: [],
    activityLog: [],
    systemSetting: [],
  };

  private nextId(table: string): number {
    this.seq[table] += 1;
    return this.seq[table];
  }

  async onModuleInit() {
    await this.seed();
  }

  async onModuleDestroy() {
    // No external connection to close
  }

  async $connect() {}
  async $disconnect() {}

  async $transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    const snapshotDb = clone(this.db);
    const snapshotSeq = { ...this.seq };
    try {
      return await fn(this);
    } catch (err) {
      this.db = snapshotDb;
      this.seq = snapshotSeq;
      throw err;
    }
  }

  async seed() {
    for (const key of Object.keys(this.db)) {
      this.db[key] = [];
      this.seq[key] = 0;
    }

    const passwordHash = await bcrypt.hash('Password123@', 10);

    const admin = await this.user.create({
      data: {
        firstName: 'علیرضا',
        lastName: 'حسینی',
        email: 'internship_office@semnan.ac.ir',
        nationalCode: '0098765432',
        password: passwordHash,
        phoneNumber: '02331530000',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    const prof1User = await this.user.create({
      data: {
        firstName: 'محمد',
        lastName: 'رضایی',
        email: 'rezaei@semnan.ac.ir',
        nationalCode: '0011223344',
        password: passwordHash,
        phoneNumber: '09127894561',
        role: Role.PROFESSOR,
        isActive: true,
      },
    });
    const prof1 = await this.professor.create({
      data: {
        userId: prof1User.id,
        department: 'مهندسی کامپیوتر',
        academicRank: 'دانشیار',
      },
    });

    const prof2User = await this.user.create({
      data: {
        firstName: 'سارا',
        lastName: 'احمدی',
        email: 'ahmadi_s@semnan.ac.ir',
        nationalCode: '0022334455',
        password: passwordHash,
        phoneNumber: '09128912345',
        role: Role.PROFESSOR,
        isActive: true,
      },
    });
    const prof2 = await this.professor.create({
      data: {
        userId: prof2User.id,
        department: 'مهندسی صنایع',
        academicRank: 'استادیار',
      },
    });

    const stu1User = await this.user.create({
      data: {
        firstName: 'محمد',
        lastName: 'احمدی',
        email: 'm.ahmadi@semnan.ac.ir',
        nationalCode: '0021345678',
        password: passwordHash,
        phoneNumber: '09121234567',
        role: Role.STUDENT,
        isActive: true,
      },
    });
    const stu1 = await this.student.create({
      data: {
        userId: stu1User.id,
        studentNumber: '400105432',
        faculty: 'مهندسی کامپیوتر',
        major: 'مهندسی نرم‌افزار',
        degreeLevel: 'کارشناسی',
      },
    });

    const stu2User = await this.user.create({
      data: {
        firstName: 'علی',
        lastName: 'رضایی',
        email: 'a.rezaei@semnan.ac.ir',
        nationalCode: '0019876543',
        password: passwordHash,
        phoneNumber: '09122345678',
        role: Role.STUDENT,
        isActive: true,
      },
    });
    const stu2 = await this.student.create({
      data: {
        userId: stu2User.id,
        studentNumber: '400108921',
        faculty: 'مهندسی کامپیوتر',
        major: 'هوش مصنوعی و داده',
        degreeLevel: 'کارشناسی',
      },
    });

    const stu3User = await this.user.create({
      data: {
        firstName: 'سارا',
        lastName: 'محمدی',
        email: 's.mohammadi@semnan.ac.ir',
        nationalCode: '0032145698',
        password: passwordHash,
        phoneNumber: '09123456789',
        role: Role.STUDENT,
        isActive: true,
      },
    });
    const stu3 = await this.student.create({
      data: {
        userId: stu3User.id,
        studentNumber: '400201456',
        faculty: 'مهندسی صنایع',
        major: 'تحلیل سیستم‌ها',
        degreeLevel: 'کارشناسی',
      },
    });

    const comp1 = await this.company.create({
      data: {
        name: 'شرکت فناوران هوشمند',
        industry: 'توسعه نرم‌افزارهای ابری و هوش مصنوعی',
        city: 'تهران',
        address: 'تهران، خیابان آزادی',
        phone: '021-66789001',
        supervisorName: 'مهندس آرش طاهری',
        supervisorPhone: '09121112233',
      },
    });

    const comp2 = await this.company.create({
      data: {
        name: 'شرکت فناوری اطلاعات آریا',
        industry: 'امنیت سایبری و زیرساخت شبکه',
        city: 'تهران',
        address: 'تهران، میدان ونک',
        phone: '021-88990011',
        supervisorName: 'دکتر کامران شفیعی',
        supervisorPhone: '09123334455',
      },
    });

    const req1 = await this.internshipRequest.create({
      data: {
        studentId: stu1.id,
        companyId: comp1.id,
        professorId: prof1.id,
        title: 'توسعه بک‌اند و سرویس‌های میکروسرویس',
        description: 'درخواست کارآموزی تابستانه',
        startDate: new Date('2024-06-21T00:00:00.000Z'),
        endDate: new Date('2024-09-21T00:00:00.000Z'),
        totalHours: 240,
        status: RequestStatus.APPROVED,
      },
    });

    const req2 = await this.internshipRequest.create({
      data: {
        studentId: stu3.id,
        companyId: comp2.id,
        professorId: prof2.id,
        title: 'امنیت سایبری و زیرساخت شبکه',
        description: 'درخواست مصوب کارآموزی',
        startDate: new Date('2024-07-05T00:00:00.000Z'),
        endDate: new Date('2024-10-05T00:00:00.000Z'),
        totalHours: 240,
        status: RequestStatus.APPROVED,
      },
    });

    const intern1 = await this.internship.create({
      data: {
        studentId: stu1.id,
        professorId: prof1.id,
        companyId: comp1.id,
        requestId: req1.id,
        startDate: new Date('2024-06-21T00:00:00.000Z'),
        endDate: new Date('2024-09-21T00:00:00.000Z'),
        progressPercentage: 20,
        status: InternshipStatus.ACTIVE,
      },
    });

    const intern2 = await this.internship.create({
      data: {
        studentId: stu3.id,
        professorId: prof2.id,
        companyId: comp2.id,
        requestId: req2.id,
        startDate: new Date('2024-07-05T00:00:00.000Z'),
        endDate: new Date('2024-10-05T00:00:00.000Z'),
        progressPercentage: 50,
        status: InternshipStatus.ACTIVE,
      },
    });

    await this.weeklyReport.create({
      data: {
        internshipId: intern1.id,
        weekNumber: 1,
        startDate: new Date('2024-06-21T00:00:00.000Z'),
        endDate: new Date('2024-06-27T00:00:00.000Z'),
        activities: 'راه‌اندازی محیط توسعه',
        skillsLearned: 'NestJS, Docker',
        challenges: 'تنظیم پروکسی',
        description: 'گزارش هفته اول محمد احمدی',
        status: ReportStatus.SUBMITTED,
      },
    });

    await this.weeklyReport.create({
      data: {
        internshipId: intern2.id,
        weekNumber: 1,
        startDate: new Date('2024-07-05T00:00:00.000Z'),
        endDate: new Date('2024-07-11T00:00:00.000Z'),
        activities: 'تحلیل لاگ‌های امنیتی',
        skillsLearned: 'ELK Stack',
        challenges: 'حجم بالای لاگ',
        description: 'گزارش هفته اول سارا محمدی',
        status: ReportStatus.SUBMITTED,
      },
    });

    await this.notification.create({
      data: {
        userId: stu1User.id,
        title: 'خوش‌آمدگویی',
        message: 'به سامانه کارآموزی خوش آمدید',
        isRead: false,
      },
    });

    await this.notification.create({
      data: {
        userId: stu1User.id,
        title: 'یادآوری گزارش',
        message: 'گزارش هفتگی خود را ارسال نمایید',
        isRead: false,
      },
    });

    await this.document.create({
      data: {
        internshipId: intern1.id,
        fileName: 'intro_letter.pdf',
        filePath: '/uploads/documents/intro_letter.pdf',
        documentType: DocumentType.INTRODUCTION_LETTER,
      },
    });

    await this.systemSetting.create({ data: { key: 'academicTerm', value: '۱۴۰۳-۱۴۰۴ نیمسال اول' } });
    await this.systemSetting.create({ data: { key: 'minHours', value: '240' } });
    await this.systemSetting.create({ data: { key: 'maxWeeklyHours', value: '40' } });
    await this.systemSetting.create({ data: { key: 'autoIssueLetter', value: 'true' } });
    await this.systemSetting.create({ data: { key: 'insuranceEnabled', value: 'true' } });

    void admin;
    void stu2;
  }

  private getRelation(table: string, row: AnyRecord, relName: string): any {
    if (table === 'user') {
      if (relName === 'student') return this.db.student.find((s) => s.userId === row.id) ?? null;
      if (relName === 'professor') return this.db.professor.find((p) => p.userId === row.id) ?? null;
      if (relName === 'notifications') return this.db.notification.filter((n) => n.userId === row.id);
      if (relName === 'activityLogs') return this.db.activityLog.filter((a) => a.userId === row.id);
    }
    if (table === 'student') {
      if (relName === 'user') return this.db.user.find((u) => u.id === row.userId) ?? null;
      if (relName === 'requests') return this.db.internshipRequest.filter((r) => r.studentId === row.id);
      if (relName === 'internships') return this.db.internship.filter((i) => i.studentId === row.id);
    }
    if (table === 'professor') {
      if (relName === 'user') return this.db.user.find((u) => u.id === row.userId) ?? null;
      if (relName === 'requests') return this.db.internshipRequest.filter((r) => r.professorId === row.id);
      if (relName === 'internships') return this.db.internship.filter((i) => i.professorId === row.id);
    }
    if (table === 'company') {
      if (relName === 'requests') return this.db.internshipRequest.filter((r) => r.companyId === row.id);
      if (relName === 'internships') return this.db.internship.filter((i) => i.companyId === row.id);
    }
    if (table === 'internshipRequest') {
      if (relName === 'student') return this.db.student.find((s) => s.id === row.studentId) ?? null;
      if (relName === 'company') return this.db.company.find((c) => c.id === row.companyId) ?? null;
      if (relName === 'professor') return row.professorId ? (this.db.professor.find((p) => p.id === row.professorId) ?? null) : null;
      if (relName === 'internship') return this.db.internship.find((i) => i.requestId === row.id) ?? null;
    }
    if (table === 'internship') {
      if (relName === 'student') return this.db.student.find((s) => s.id === row.studentId) ?? null;
      if (relName === 'professor') return this.db.professor.find((p) => p.id === row.professorId) ?? null;
      if (relName === 'company') return this.db.company.find((c) => c.id === row.companyId) ?? null;
      if (relName === 'request') return this.db.internshipRequest.find((r) => r.id === row.requestId) ?? null;
      if (relName === 'weeklyReports') return this.db.weeklyReport.filter((w) => w.internshipId === row.id);
      if (relName === 'documents') return this.db.document.filter((d) => d.internshipId === row.id);
      if (relName === 'evaluation') return this.db.evaluation.find((e) => e.internshipId === row.id) ?? null;
    }
    if (table === 'weeklyReport' || table === 'document' || table === 'evaluation') {
      if (relName === 'internship') return this.db.internship.find((i) => i.id === row.internshipId) ?? null;
    }
    if (table === 'notification' || table === 'activityLog') {
      if (relName === 'user') return this.db.user.find((u) => u.id === row.userId) ?? null;
    }
    return undefined;
  }

  private relationTargetTable(table: string, relName: string): string {
    const map: Record<string, string> = {
      user: 'user',
      student: 'student',
      professor: 'professor',
      company: 'company',
      request: 'internshipRequest',
      requests: 'internshipRequest',
      internship: 'internship',
      internships: 'internship',
      weeklyReports: 'weeklyReport',
      documents: 'document',
      evaluation: 'evaluation',
      notifications: 'notification',
      activityLogs: 'activityLog',
    };
    return map[relName] || table;
  }

  private matchesWhere(table: string, row: AnyRecord, where?: AnyRecord): boolean {
    if (!where) return true;
    for (const [key, condition] of Object.entries(where)) {
      if (condition === undefined) continue;
      if (key === 'OR' && Array.isArray(condition)) {
        if (!condition.some((sub) => this.matchesWhere(table, row, sub))) return false;
        continue;
      }
      if (key === 'AND' && Array.isArray(condition)) {
        if (!condition.every((sub) => this.matchesWhere(table, row, sub))) return false;
        continue;
      }
      if (key === 'internshipId_weekNumber' && typeof condition === 'object') {
        if (row.internshipId !== condition.internshipId || row.weekNumber !== condition.weekNumber) {
          return false;
        }
        continue;
      }

      if (key in row) {
        const val = row[key];
        if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
          if ('contains' in condition) {
            const needle = String(condition.contains);
            const hay = val == null ? '' : String(val);
            const match =
              condition.mode === 'insensitive'
                ? hay.toLowerCase().includes(needle.toLowerCase())
                : hay.includes(needle);
            if (!match) return false;
          } else if ('equals' in condition) {
            if (val !== condition.equals) return false;
          } else {
            if (val !== condition) return false;
          }
        } else if (val !== condition) {
          return false;
        }
      } else {
        const rel = this.getRelation(table, row, key);
        if (!rel || Array.isArray(rel)) return false;
        const target = this.relationTargetTable(table, key);
        if (!this.matchesWhere(target, rel, condition)) return false;
      }
    }
    return true;
  }

  private applyProjection(table: string, row: AnyRecord | null, args?: AnyRecord): any {
    if (!row) return null;
    const base = clone(row);

    if (args?.select) {
      const out: AnyRecord = {};
      for (const [k, v] of Object.entries(args.select)) {
        if (!v) continue;
        if (k === '_count' && typeof v === 'object') {
          out._count = this.computeCounts(table, row, (v as AnyRecord).select || {});
        } else if (k in base) {
          out[k] = base[k];
        } else {
          const rel = this.getRelation(table, row, k);
          const target = this.relationTargetTable(table, k);
          if (Array.isArray(rel)) {
            out[k] = rel.map((item) => this.applyProjection(target, item, v === true ? undefined : (v as AnyRecord)));
          } else {
            out[k] = this.applyProjection(target, rel, v === true ? undefined : (v as AnyRecord));
          }
        }
      }
      return out;
    }

    if (args?.include) {
      for (const [k, v] of Object.entries(args.include)) {
        if (!v) continue;
        if (k === '_count' && typeof v === 'object') {
          base._count = this.computeCounts(table, row, (v as AnyRecord).select || {});
          continue;
        }
        const rel = this.getRelation(table, row, k);
        const target = this.relationTargetTable(table, k);
        if (Array.isArray(rel)) {
          let list = rel;
          if (typeof v === 'object' && (v as AnyRecord).orderBy) {
            list = this.applySort(list, (v as AnyRecord).orderBy);
          }
          base[k] = list.map((item) => this.applyProjection(target, item, v === true ? undefined : (v as AnyRecord)));
        } else {
          base[k] = this.applyProjection(target, rel, v === true ? undefined : (v as AnyRecord));
        }
      }
    }

    return base;
  }

  private computeCounts(table: string, row: AnyRecord, select: AnyRecord): AnyRecord {
    const counts: AnyRecord = {};
    for (const [k, enabled] of Object.entries(select)) {
      if (!enabled) continue;
      const rel = this.getRelation(table, row, k);
      counts[k] = Array.isArray(rel) ? rel.length : rel ? 1 : 0;
    }
    return counts;
  }

  private applySort(rows: AnyRecord[], orderBy?: AnyRecord): AnyRecord[] {
    if (!orderBy) return [...rows];
    const [field, dir] = Object.entries(orderBy)[0] || [];
    if (!field) return [...rows];
    const factor = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * factor;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }

  private createDelegate(table: string) {
    return {
      findMany: async (args: AnyRecord = {}) => {
        let rows = this.db[table].filter((r) => this.matchesWhere(table, r, args.where));
        if (args.orderBy) rows = this.applySort(rows, args.orderBy);
        const skip = args.skip || 0;
        const take = args.take ?? rows.length;
        rows = rows.slice(skip, skip + take);
        return rows.map((r) => this.applyProjection(table, r, args));
      },
      findUnique: async (args: AnyRecord) => {
        const found = this.db[table].find((r) => this.matchesWhere(table, r, args.where)) ?? null;
        return this.applyProjection(table, found, args);
      },
      findFirst: async (args: AnyRecord = {}) => {
        const found = this.db[table].find((r) => this.matchesWhere(table, r, args.where)) ?? null;
        return this.applyProjection(table, found, args);
      },
      count: async (args: AnyRecord = {}) => {
        return this.db[table].filter((r) => this.matchesWhere(table, r, args.where)).length;
      },
      create: async (args: AnyRecord) => {
        const now = new Date();
        const record: AnyRecord = {
          id: this.nextId(table),
          createdAt: now,
          updatedAt: now,
          ...(table === 'document' ? { uploadedAt: now } : {}),
          ...(table === 'user' ? { isActive: true, refreshToken: null } : {}),
          ...(table === 'internshipRequest' ? { professorId: null, rejectionReason: null, totalHours: 240, status: RequestStatus.PENDING } : {}),
          ...(table === 'internship' ? { progressPercentage: 0, status: InternshipStatus.ACTIVE } : {}),
          ...(table === 'weeklyReport' ? { challenges: null, professorComment: null, status: ReportStatus.DRAFT } : {}),
          ...(table === 'notification' ? { isRead: false } : {}),
          ...clone(args.data),
        };
        this.db[table].push(record);
        return this.applyProjection(table, record, args);
      },
      update: async (args: AnyRecord) => {
        const idx = this.db[table].findIndex((r) => this.matchesWhere(table, r, args.where));
        if (idx === -1) throw new Error(`Record not found in ${table}`);
        const updated = {
          ...this.db[table][idx],
          ...clone(args.data),
          updatedAt: new Date(),
        };
        this.db[table][idx] = updated;
        return this.applyProjection(table, updated, args);
      },
      updateMany: async (args: AnyRecord) => {
        let count = 0;
        for (let i = 0; i < this.db[table].length; i += 1) {
          if (this.matchesWhere(table, this.db[table][i], args.where)) {
            this.db[table][i] = {
              ...this.db[table][i],
              ...clone(args.data),
              updatedAt: new Date(),
            };
            count += 1;
          }
        }
        return { count };
      },
      upsert: async (args: AnyRecord) => {
        const idx = this.db[table].findIndex((r) => this.matchesWhere(table, r, args.where));
        if (idx !== -1) {
          const updated = {
            ...this.db[table][idx],
            ...clone(args.update),
            updatedAt: new Date(),
          };
          this.db[table][idx] = updated;
          return this.applyProjection(table, updated, args);
        }
        return this.createDelegate(table).create({ ...args, data: args.create });
      },
      delete: async (args: AnyRecord) => {
        const idx = this.db[table].findIndex((r) => this.matchesWhere(table, r, args.where));
        if (idx === -1) throw new Error(`Record not found in ${table}`);
        const [removed] = this.db[table].splice(idx, 1);
        return this.applyProjection(table, removed, args);
      },
      deleteMany: async (args: AnyRecord = {}) => {
        const before = this.db[table].length;
        this.db[table] = this.db[table].filter((r) => !this.matchesWhere(table, r, args.where));
        return { count: before - this.db[table].length };
      },
    };
  }

  user = this.createDelegate('user');
  student = this.createDelegate('student');
  professor = this.createDelegate('professor');
  company = this.createDelegate('company');
  internshipRequest = this.createDelegate('internshipRequest');
  internship = this.createDelegate('internship');
  weeklyReport = this.createDelegate('weeklyReport');
  document = this.createDelegate('document');
  evaluation = this.createDelegate('evaluation');
  notification = this.createDelegate('notification');
  activityLog = this.createDelegate('activityLog');
  systemSetting = this.createDelegate('systemSetting');
}
