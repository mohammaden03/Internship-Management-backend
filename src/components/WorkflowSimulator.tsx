import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  Clock,
  ArrowLeft,
  GraduationCap,
  Building2,
  FileCheck2,
  Award,
  Bell,
  Activity,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types';

interface WorkflowSimulatorProps {
  onNotify: (title: string, message: string) => void;
  onLog: (action: string) => void;
}

export const WorkflowSimulator: React.FC<WorkflowSimulatorProps> = ({ onNotify, onLog }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [reportWeek, setReportWeek] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: '۱. ثبت درخواست کارآموزی توسط دانشجو',
      actor: 'STUDENT',
      desc: 'دانشجو فرم درخواست ۲۴۰ ساعته کارآموزی را در شرکت دیجی‌کالا ثبت می‌کند (وضعیت: PENDING).',
      actionLabel: 'ثبت درخواست توسط دانشجو (Submit Request)',
    },
    {
      id: 2,
      title: '۲. بررسی و تأیید توسط مدیر آموزش (Admin)',
      actor: 'ADMIN',
      desc: 'ادمین درخواست را تأیید کرده، دکتر حمیدرضا صادقی را به عنوان استاد ناظر منصوب نموده و دوره کارآموزی فعال می‌گردد.',
      actionLabel: 'تأیید درخواست و انتصاب استاد ناظر (Approve & Assign)',
    },
    {
      id: 3,
      title: '۳. ارسال گزارش هفتگی توسط دانشجو',
      actor: 'STUDENT',
      desc: 'دانشجو فعالیت‌های انجام شده در حوزه پیاده‌سازی بک‌اند با NestJS را در قالب گزارش هفتگی ثبت می‌کند.',
      actionLabel: 'ارسال گزارش هفتگی (Submit Weekly Report)',
    },
    {
      id: 4,
      title: '۴. داوری و تأیید گزارش توسط استاد ناظر',
      actor: 'PROFESSOR',
      desc: 'استاد ناظر گزارش را مطالعه و تأیید نموده؛ درصد پیشرفت دوره به‌طور خودکار افزایش می‌یابد.',
      actionLabel: 'تأیید گزارش توسط استاد (Approve Report)',
    },
    {
      id: 5,
      title: '۵. ارزیابی نهایی و محاسبه نمره فارغ‌التحصیلی',
      actor: 'PROFESSOR',
      desc: 'استاد ناظر ۵ معیار (مهارت فنی، مسئولیت، انضباط، کار تیمی، حضور) را نمره‌دهی کرده و وضعیت به COMPLETED تغییر می‌یابد.',
      actionLabel: 'ثبت ارزیابی ۵ معیاره و نمره نهایی (Final Evaluation)',
    },
  ];

  const handleNextStep = () => {
    if (currentStep === 1) {
      onLog('دانشجو محمد رضایی درخواست کارآموزی برای شرکت دیجی‌کالا را ثبت نمود.');
      onNotify(
        'ثبت درخواست کارآموزی',
        'درخواست شما برای شرکت دیجی‌کالا در سامانه ثبت شد و در صف بررسی قرار گرفت.',
      );
      setCurrentStep(2);
    } else if (currentStep === 2) {
      onLog('مدیر سیستم درخواست کارآموزی را تأیید و دکتر صادقی را به عنوان استاد ناظر تعیین نمود.');
      onNotify(
        'تأیید درخواست کارآموزی',
        'درخواست کارآموزی شما در شرکت دیجی‌کالا تأیید شد و دکتر صادقی به عنوان استاد ناظر مشخص گردیدند.',
      );
      setProgress(15);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      onLog(`دانشجو گزارش هفتگی شماره ${reportWeek} را ارسال نمود.`);
      onNotify(
        'گزارش هفتگی دریافت شد',
        `گزارش هفتگی شماره ${reportWeek} برای استاد ناظر ارسال گردید.`,
      );
      setCurrentStep(4);
    } else if (currentStep === 4) {
      onLog(`استاد ناظر گزارش هفتگی شماره ${reportWeek} را تأیید نمود.`);
      onNotify(
        'تأیید گزارش هفتگی',
        `گزارش هفتگی شماره ${reportWeek} با نظر مساعد استاد ناظر تأیید شد.`,
      );
      setProgress((prev) => Math.min(90, prev + 25));
      if (reportWeek < 3) {
        setReportWeek((w) => w + 1);
        setCurrentStep(3); // loop for next report or proceed
      } else {
        setCurrentStep(5);
      }
    } else if (currentStep === 5) {
      const finalScore = 19.6;
      setEvaluationScore(finalScore);
      setProgress(100);
      onLog(`ثبت ارزیابی نهایی و نمره ۱۹.۶/۲۰ برای دانشجو محمد رضایی. دوره کارآموزی خاتمه یافت.`);
      onNotify(
        'ثبت نمره نهایی کارآموزی',
        `استاد ناظر نمره نهایی کارآموزی شما را با امتیاز ۱۹.۶ از ۲۰ در سامانه دانشگاه ثبت نمودند. دوره پایان یافت.`,
      );
      setCurrentStep(6);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setReportWeek(1);
    setProgress(0);
    setEvaluationScore(null);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-600" />
            شبیه‌ساز تعاملی چرخه حیات و گردش‌کار کارآموزی (Interactive Lifecycle Simulator)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده گام به گام تعاملات بین نقش‌های دانشجو، ادمین و استاد ناظر به همراه شلیک اعلان‌ها و ثبت لاگ‌های حسابرسی
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          شروع مجدد شبیه‌سازی
        </button>
      </div>

      {/* Progress Metric Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">وضعیت کنونی دوره</div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
            {currentStep === 1 && (
              <span className="text-amber-600">درخواست اولیه (PENDING)</span>
            )}
            {currentStep >= 2 && currentStep <= 5 && (
              <span className="text-emerald-600">دوره فعال (ACTIVE)</span>
            )}
            {currentStep === 6 && (
              <span className="text-purple-600">تکمیل شده (COMPLETED)</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">درصد پیشرفت دوره کارآموزی</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono font-black text-slate-900 text-sm">{progress}٪</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">نمره نهایی ارزیابی</div>
          <div className="text-base font-mono font-bold text-slate-900">
            {evaluationScore !== null ? (
              <span className="text-emerald-600">{evaluationScore} از ۲۰</span>
            ) : (
              <span className="text-slate-400">هنوز ثبت نشده</span>
            )}
          </div>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-4">
          {steps.map((step) => {
            const isDone = currentStep > step.id || (step.id === 4 && reportWeek > 1 && currentStep >= 4);
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-50'
                    : isDone
                    ? 'border-slate-200 bg-slate-50/60 opacity-85'
                    : 'border-slate-100 bg-white opacity-45'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        step.actor === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : step.actor === 'PROFESSOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      نقش مجری: {step.actor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {currentStep <= 5 ? (
              <span>گام {currentStep} از ۵ آماده اجرا می‌باشد.</span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                چرخه حیات کارآموزی با موفقیت به پایان رسید.
              </span>
            )}
          </div>

          {currentStep <= 5 ? (
            <button
              id="simulate-next-step-btn"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              {steps[currentStep - 1]?.actionLabel}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              اجرای مجدد سناریو
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
