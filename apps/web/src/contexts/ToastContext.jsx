import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let toastSequence = 0;

const toneMap = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  error: { icon: AlertTriangle, className: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-900' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4200) => {
    const id = `toast-${toastSequence += 1}`;
    setToasts((current) => [...current, { id, message, type }]);
    globalThis.setTimeout?.(() => dismissToast(id), duration);
    return id;
  }, [dismissToast]);

  const value = useMemo(() => ({
    showToast,
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error', 6000),
    info: (message) => showToast(message, 'info'),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-end gap-3 sm:left-auto sm:w-[390px]" aria-live="polite">
        {toasts.map((toast) => {
          const tone = toneMap[toast.type] || toneMap.info;
          const Icon = tone.icon;
          return (
            <div key={toast.id} className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-xl animate-in slide-in-from-top-2 ${tone.className}`}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{toast.message}</p>
              <button type="button" onClick={() => dismissToast(toast.id)} className="rounded p-1 opacity-60 hover:bg-black/5 hover:opacity-100" aria-label="Cerrar mensaje">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}

ToastProvider.propTypes = { children: PropTypes.node.isRequired };
