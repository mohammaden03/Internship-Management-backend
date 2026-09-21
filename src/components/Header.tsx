import React from 'react';
import {
  ShieldCheck,
  Database,
  Bell,
  Activity,
  UserCheck,
  Layers,
  FileCode2,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  activeTab: 'swagger' | 'database' | 'workflow' | 'architecture';
  setActiveTab: (tab: 'swagger' | 'database' | 'workflow' | 'architecture') => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenActivityLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
  unreadCount,
  onOpenNotifications,
  onOpenActivityLogs,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Banner with System Badge & Quick Persona Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                سامانه مدیریت کارآموزی دانشگاه
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                NestJS • Prisma • PostgreSQL
              </span>
            </div>
            <p className="text-xs text-slate-500">
              University Internship Management System Backend API & Architecture
            </p>
          </div>
        </div>

        {/* User Persona & Tools */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher for RBAC simulation */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-600 px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              نقش فعال:
            </span>
            <button
              id="role-admin-btn"
              onClick={() => setActiveRole('ADMIN')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeRole === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              مدیر ارشد (ADMIN)
            </button>
            <button
              id="role-professor-btn"
              onClick={() => setActiveRole('PROFESSOR')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeRole === 'PROFESSOR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              استاد ناظر (PROFESSOR)
            </button>
            <button
              id="role-student-btn"
              onClick={() => setActiveRole('STUDENT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeRole === 'STUDENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              دانشجو (STUDENT)
            </button>
          </div>

          {/* Activity Logs Button */}
          <button
            id="open-activity-logs-btn"
            onClick={onOpenActivityLogs}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="لاگ فعالیت‌ها و حسابرسی سیستم"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Notifications Button */}
          <button
            id="open-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="اعلان‌های سیستم"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-slate-100">
        <button
          id="tab-swagger-btn"
          onClick={() => setActiveTab('swagger')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'swagger'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          مستندات تعاملی Swagger OpenAPI
        </button>

        <button
          id="tab-workflow-btn"
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'workflow'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Workflow className="w-4 h-4" />
          شبیه‌ساز گردش‌کار کارآموزی (Workflow)
        </button>

        <button
          id="tab-database-btn"
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          کاوشگر داده‌های فارسی دیتابیس (Prisma Seed)
        </button>

        <button
          id="tab-architecture-btn"
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          کدهای بک‌اند و معماری ماژولار
        </button>
      </div>
    </header>
  );
};
