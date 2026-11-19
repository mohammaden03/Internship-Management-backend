# سامانه جامع مدیریت کارآموزی دانشگاه (University Internship Management System)

بک‌اند کامل و ماژولار سامانه مدیریت کارآموزی دانشگاه، توسعه‌یافته با **NestJS**، **PostgreSQL** و **Prisma ORM** با شناسه‌های تماماً عددی (`Int @default(autoincrement())`).

---

## ویژگی‌های کلیدی (Key Features)

- **معماری ماژولار (15 Modules)**: شامل ماژول‌های `auth`، `users`، `students`، `professors`، `companies`، `internship-requests`، `internships`، `weekly-reports`، `documents`، `evaluations`، `notifications`، `activity-logs`، `health`، `dashboard` و `settings`.
- **احراز هویت JWT و رفرش توکن**:
  - ورود با کد ملی، شماره دانشجویی (برای دانشجویان) یا ایمیل دانشگاهی (`POST /api/auth/login`)
  - ثبت‌نام عمومی منحصراً با نقش `STUDENT` (`POST /api/auth/register`)
  - دریافت پروفایل کاربر جاری همراه با `studentId` و `professorId` (`GET /api/auth/me` و `GET /api/users/profile/me`)
  - بازسازی توکن (`POST /api/auth/refresh` و `POST /api/auth/refresh-token`)
  - بازیابی رمز عبور بدون افشای وجود کاربر (`POST /api/auth/forgot-password` با کد `202`)
- **کنترل دسترسی نقش‌محور و محدودسازی مالکیت (RBAC + Ownership Scoping)**:
  - `ADMIN`: دسترسی کامل مدیریتی، آمار داشبورد (`GET /api/dashboard/stats`) و تنظیمات سامانه (`PATCH /api/settings`)
  - `PROFESSOR`: دسترسی محدود به دانشجویان، کارآموزی‌ها، گزارش‌ها، مدارک و ارزیابی‌های تحت نظارت خود + ثبت ارزیابی نهایی منحصراً توسط استاد ناظر
  - `STUDENT`: ثبت درخواست کارآموزی، ارسال گزارش هفتگی، بارگذاری مدارک و مشاهده وضعیت کارآموزی خود
- **اعتبارسنجی ایمن و شناسه‌های عددی**:
  - کلیه شناسه‌ها (`id`, `userId`, `studentId`, `professorId`, `companyId`, `internshipId`, `requestId`, ...) عدد صحیح (`Int`) هستند.
  - پارامترهای مسیر با `ParseIntPipe` اعتبارسنجی می‌شوند (خطای `400` برای مقادیر نامعتبر).
  - فیلدهای مرتب‌سازی (`sortBy`) بر اساس فهرست مجاز هر ماژول بررسی شده و فیلتر `status` با Enum معتبر کنترل می‌شود.
- **بارگذاری امن فایل‌ها**: تنظیم‌شده از طریق `.env` (`UPLOAD_DESTINATION`، `MAX_FILE_SIZE_MB`، `ALLOWED_MIME_TYPES`) و سرو فایل‌ها روی `/api/uploads/...` و دانلود مستقیم روی `/api/documents/download/:id`.
- **مستندسازی Swagger OpenAPI 3.0**: در دسترس روی `/api/docs`.

---

## نحوه اجرا با داکر (Docker Compose)

```bash
cd backend

# ۱. کپی فایل متغیرهای محیطی و تنظیم مقادیر دلخواه
cp .env.example .env

# ۲. ساخت و اجرای سرویس‌های PostgreSQL و Backend
docker compose up -d --build
```

کانتینر بک‌اند به صورت خودکار هنگام راه‌اندازی:
1. مایگریشن‌های Prisma (`prisma migrate deploy` یا `prisma db push`) را اعمال می‌کند.
2. در صورت خالی بودن دیتابیس و فعال بودن `AUTO_SEED=true` داده‌های اولیه فارسی را بذرپاشی می‌کند.
3. سرور را روی پورت `3000` بالا می‌آورد.

آدرس‌های سرویس:
- **API Base URL**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/api/health`
- **Swagger Docs**: `http://localhost:3000/api/docs`

---

## نحوه اجرای محلی (Local Development)

```bash
cd backend

# ۱. کپی فایل تنظیمات و مقداردهی DATABASE_URL
cp .env.example .env

# ۲. نصب وابستگی‌ها
npm install

# ۳. تولید کلاینت پریزما
npm run prisma:generate

# ۴. اعمال اسکیما یا مایگریشن‌ها روی پایگاه داده PostgreSQL
npm run prisma:deploy
# یا برای همگام‌سازی سریع در محیط توسعه:
# npm run prisma:push

# ۵. بذرپاشی داده‌های اولیه فارسی
npm run prisma:seed

# ۶. اجرا در حالت توسعه (پورت 3000)
npm run start:dev

# بیلد و اجرای نسخه تولیدی
npm run build
npm run start:prod
```

---

## اجرای تست‌ها (Tests)

```bash
cd backend

# اجرای تست‌های End-to-End (سرتاسری)
npm run test:e2e
```

---

## کاربران پیش‌فرض بذرپاشی‌شده (Seed Credentials)

رمز عبور پیش‌فرض تمامی حساب‌های بذرپاشی‌شده: **`Password123@`**

| نقش | نام و نام خانوادگی | ایمیل | کد ملی (`identifier`) | شماره دانشجویی (`identifier`) | رمز عبور |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | علیرضا حسینی | `internship_office@semnan.ac.ir` | `0098765432` | — | `Password123@` |
| **PROFESSOR** | دکتر محمد رضایی | `rezaei@semnan.ac.ir` | `0011223344` | — | `Password123@` |
| **PROFESSOR** | دکتر سارا احمدی | `ahmadi_s@semnan.ac.ir` | `0022334455` | — | `Password123@` |
| **STUDENT** | محمد احمدی | `m.ahmadi@semnan.ac.ir` | `0021345678` | `400105432` | `Password123@` |
| **STUDENT** | علی رضایی | `a.rezaei@semnan.ac.ir` | `0019876543` | `400108921` | `Password123@` |
| **STUDENT** | سارا محمدی | `s.mohammadi@semnan.ac.ir` | `0032145698` | `400201456` | `Password123@` |
| **STUDENT** | مهدی کریمی | `m.karimi@semnan.ac.ir` | `0045678912` | `400305882` | `Password123@` |
