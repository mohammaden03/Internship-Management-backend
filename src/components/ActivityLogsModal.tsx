import React from 'react';
import { Activity, X, Shield, Clock } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
            لاگ‌های حسابرسی و امنیتی سیستم (Audit Activity Logs)
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs List */}
        <div className="p-4 max-h-[460px] overflow-y-auto space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-3"
            >
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-right" dir="rtl">
                <div className="text-slate-800 font-sans font-medium">{log.action}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleTimeString('fa-IR')}
                  <span className="mx-1">•</span>
                  شناسه کاربر: {log.userId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
