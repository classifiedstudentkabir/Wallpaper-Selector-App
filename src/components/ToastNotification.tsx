import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: number;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto p-4 rounded-xl bg-[#1d2028]/95 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-start gap-3 text-white animate-flyout transition-all"
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold">{t.title}</h5>
            <p className="text-[11px] text-gray-400 mt-0.5">{t.description}</p>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
