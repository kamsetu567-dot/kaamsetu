'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-brand-navy text-white',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev, { id, message, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg) => showToast(msg, 'error', 5000), [showToast]);
  const info = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[320px] w-[calc(100vw-2rem)]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="alert"
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-slide-in ${STYLES[t.type]}`}
            >
              <Icon size={18} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
