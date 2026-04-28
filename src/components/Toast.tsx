'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  const statusColor = isSuccess ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`rf-toast ${isSuccess ? 'rf-toast-success' : 'rf-toast-error'} flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border`}
        style={{
          background: 'var(--color-bg-surface)',
          borderColor: statusColor,
        }}
      >
        <span
          className={`material-symbols-outlined text-lg ${isSuccess ? 'toast-icon-success' : 'toast-icon-error'}`}
          style={{ color: statusColor }}
        >
          {isSuccess ? 'check_circle' : 'error'}
        </span>
        <span className="toast-text text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{message}</span>
        <button onClick={onClose} className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
