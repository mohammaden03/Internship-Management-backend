# سامانه جامع مدیریت کارآموزی دانشگاه (University Internship Management System)

سیستم یکپارچه و مدرن تحت وب برای دیجیتال‌سازی و خودکارسازی فرآیندهای کارآموزی دانشگاهی، توسعه‌یافته با فریم‌ورک **NestJS** و پایگاه‌داده **PostgreSQL** با استفاده از **Prisma ORM**.

---

## 🌟 ویژگی‌های کلیدی (Key Features)

- **معماری تمیز و ماژولار (Clean Modular Architecture)**: تفکیک منطق به ۱۲ ماژول کاملاً مجزا و قابل نگهداری.
- **احراز هویت دومرحله‌ای با توکن (JWT Authentication & Refresh Token)**: تولید توکن‌های دسترسی و توکن بازسازی با رمزنگاری `bcrypt`.
- **کنترل دسترسی نقش‌محور (Role-Based Access Control - RBAC)**: گاردهای اختصاصی برای ۳ نقش اصلی:
  - `ADMIN` (مدیر کل با دسترسی کامل به تمامی بخش‌ها)
  - `PROFESSOR` (استاد ناظر جهت ارزیابی، نظارت و تأیید گزارش‌های هفتگی و نمره‌دهی)
  - `STUDENT` (دانشجو جهت ثبت درخواست کارآموزی، ارسال گزارش‌های هفتگی و بارگذاری مدارک)
- **مستندسازی جامع سواگر (Swagger OpenAPI 3.0)**: مستندسازی تمامی اندپوینت‌ها همراه با امکان تست تعاملی و دکمه اعتبارسنجی Bearer Token.
- **بارگذاری امن فایل با مولتر (Multer File Upload)**: اعتبارسنجی نوع فایل (PDF, Word, Images)، محدودیت حجم (10MB)، ذخیره‌سازی محلی و تولید لینک دانلود.
- **نوتیفیکیشن‌های خودکار (Automated Notifications)**: ارسال اعلان لحظه‌ای هنگام تأیید/رد درخواست، ارسال گزارش هفتگی، تأیید گزارش و ثبت نمره نهایی.
- **لاگ فعالیت‌ها و ردپای امنیتی (Audit Activity Logs)**: ثبت دقیق کلیه رویدادهای حساس (ورود، ثبت درخواست، بررسی گزارش و ارزیابی).
- **صفحه‌بندی، فیلتر، مرتب‌سازی و جستجو (Pagination, Search, Sorting, Filtering)** روی کلیه منابع.
- **داده‌های اولیه آزمایشی فارسی (Realistic Persian Seed Data)**: شامل ۱۰ دانشجو، ۵ استاد، ۱۰ شرکت مطرح (دیجی‌کالا، اسنپ، کافه‌بازار، مپنا و...)، ۲۰ درخواست کارآموزی، ۱۵ دوره فعال و ۵۰ گزارش هفتگی.

---

## 🗂️ ساختار ماژولار (Module Structure)

```text
backend/
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
├── tsconfig.json
├── package.json
├── prisma/
│   ├── schema.prisma        # اسکیمای کامل دیتابیس پستگرس با انتیتی‌ها و روابط
│   └── seed.ts              # بذرپاشی داده‌های واقع‌گرایانه فارسی
└── src/
    ├── main.ts              # راه‌اندازی اپلیکیشن با سواگر، پایپ‌های اعتبارسنجی و CORS
    ├── app.module.ts        # ماژول ریشه و تجمیع‌کننده ماژول‌های ۱۲ گانه
    ├── common/
    │   ├── decorators/      # دکوراتورهای @Roles, @CurrentUser, @Public
    │   ├── guards/          # JwtAuthGuard و RolesGuard
    │   ├── filters/         # AllExceptionsFilter
    │   ├── interceptors/    # TransformInterceptor و LoggingInterceptor
    │   ├── dto/             # PaginationQueryDto و ApiResponseDto
    │   └── prisma/          # PrismaService و PrismaModule
    └── modules/
        ├── auth/            # لاگین، ثبت نام، رفرش توکن و لاگ‌اوت
        ├── users/           # مدیریت کاربران و پروفایل‌ها
        ├── students/        # پروفایل‌های دانشجویی و کارآموزی
        ├── professors/      # اساتید ناظر و دانشجویان تخصیص‌یافته
        ├── companies/       # شرکت‌های پذیرنده و سرپرستان فنی
        ├── internship-requests/ # گردش کار درخواست‌های کارآموزی
        ├── internships/     # مدیریت دوره‌های کارآموزی فعال
        ├── weekly-reports/  # ارسال، داوری و تأیید گزارش‌های هفتگی
        ├── documents/       # بارگذاری معرفی‌نامه‌ها، قراردادها و گزارش نهایی
        ├── evaluations/     # فرم ارزیابی ۵ معیاره و محاسبه نمره پایانی
        ├── notifications/   # اعلان‌های خودکار سیستم
        └── activity-logs/   # لاگ‌های امنیتی و حسابرسی
```

---

## 🚀 نحوه اجرا با داکر (Docker Run)

برای اجرای کامل سیستم به همراه پایگاه داده PostgreSQL:

```bash
# ۱. کپی کردن متغیرهای محیطی
cp .env.example .env

# ۲. اجرای کانتینرهای بک‌اند و دیتابیس
docker-compose up -d --build

# ۳. اجرای مایگریشن‌ها و بذرپاشی داده‌های اولیه فارسی
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma db seed
```

پس از اجرا:
- **آدرس API**: `http://localhost:3000/api`
- **مستندات سواگر**: `http://localhost:3000/api/docs`

---

## 💻 نحوه اجرای محلی (Local Development)

```bash
# نصب وابستگی‌ها
npm install

# راه‌اندازی کلاینت پریزما
npx prisma generate

# اعمال مایگریشن بر روی دیتابیس محلی
npx prisma migrate dev

# بذرپاشی داده‌های اولیه فارسی
npm run prisma:seed

# اجرای سرویس در حالت توسعه
npm run start:dev
```

---

## 🔑 کاربران پیش‌فرض بذرپاشی‌شده جهت تست

| نقش | ایمیل | کلمه عبور |
| :--- | :--- | :--- |
| **ADMIN** | `admin@university.ac.ir` | `Password123!` |
| **PROFESSOR** | `dr.sadeghi@university.ac.ir` | `Password123!` |
| **PROFESSOR** | `dr.karimi@university.ac.ir` | `Password123!` |
| **STUDENT** | `m.rezaei@student.ac.ir` | `Password123!` |
| **STUDENT** | `s.alavi@student.ac.ir` | `Password123!` |
