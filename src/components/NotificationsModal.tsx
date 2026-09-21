import React from 'react';
import { Bell, X, CheckCheck, Clock } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Bell className="w-4 h-4 text-indigo-600" />
            اعلان‌های خودکار سیستم (Automated Notifications)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              علامت‌گذاری همه به عنوان خوانده شده
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 max-h-[420px] overflow-y-auto space-y-2.5 divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">اعلانی وجود ندارد</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl transition-all ${
                  n.isRead ? 'bg-slate-50/50' : 'bg-indigo-50/40 border border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    هم‌اکنون
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
